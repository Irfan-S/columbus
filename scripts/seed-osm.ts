/**
 * seed-osm.ts
 * Imports dive sites from OpenStreetMap via the Overpass API.
 *
 * Run: npm run seed:osm
 *
 * Safely re-runnable: externalId = 'node/{id}' / 'way/{id}' prevents duplicates.
 * Country/region lookup via Nominatim (1 req/sec — allow ~2 hrs for a full run).
 */

import {
  db,
  getAdminUserId,
  generateUniqueSlug,
  loadExistingSites,
  findNearbyDuplicate,
  buildExternalIdSet,
  insertSite,
  reverseGeocode,
  sleep,
  makeCounter,
} from "./seed-common";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "crysis1300@gmail.com";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const OVERPASS_QUERY = `
[out:json][timeout:90];
(
  node["sport"="scuba_diving"];
  way["sport"="scuba_diving"];
  node["seamark:type"="wreck"];
  node["natural"="reef"];
);
out body;
`;

// ---------------------------------------------------------------------------
// OSM types
// ---------------------------------------------------------------------------

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OsmElement[];
}

// ---------------------------------------------------------------------------
// Field mapping helpers
// ---------------------------------------------------------------------------

function parseDifficulty(
  tag: string | undefined
): "beginner" | "intermediate" | "advanced" | null {
  if (!tag) return null;
  const t = tag.toLowerCase();
  if (t === "1" || t === "easy" || t === "beginner") return "beginner";
  if (t === "2" || t === "moderate" || t === "intermediate") return "intermediate";
  if (t === "3" || t === "difficult" || t === "hard" || t === "advanced") return "advanced";
  return null;
}

function parseSiteTypes(tags: Record<string, string>): string[] {
  const types: string[] = [];
  if (tags["seamark:type"] === "wreck" || tags["historic"] === "wreck") types.push("wreck");
  if (tags["natural"] === "reef") types.push("reef");
  if (tags["cave"] === "yes" || tags["natural"] === "cave_entrance") types.push("cave");
  if (tags["seamark:type"] === "rock" || tags["natural"] === "rock") types.push("pinnacle");
  if (tags["underwater"] === "drift" || (tags["description"] ?? "").toLowerCase().includes("drift"))
    types.push("drift");
  if (tags["underwater"] === "wall" || (tags["name"] ?? "").toLowerCase().includes("wall"))
    types.push("wall");
  // Default fallback so we always return something
  if (types.length === 0) types.push("reef");
  return types;
}

function buildDescription(
  tags: Record<string, string>,
  types: string[],
  region: string,
  country: string
): string {
  if (tags["description"]) return tags["description"];
  const typesStr = types.join(", ");
  const loc = [region, country].filter(Boolean).join(", ");
  return `${typesStr.charAt(0).toUpperCase() + typesStr.slice(1)} dive site${loc ? ` in ${loc}` : ""}.`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌊 Columbus OSM Seeder");
  console.log("=".repeat(50));

  // 1. Admin user
  const adminId = await getAdminUserId(ADMIN_EMAIL);
  console.log(`✓ Admin user: ${ADMIN_EMAIL} (${adminId})`);

  // 2. Load existing sites for dedup
  const existing = await loadExistingSites();
  const externalIdSet = buildExternalIdSet(existing);
  console.log(`✓ Loaded ${existing.length} existing sites`);

  // 3. Fetch Overpass
  console.log("\n⬇  Fetching from Overpass API…");
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });
  if (!res.ok) throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as OverpassResponse;
  console.log(`✓ Received ${data.elements.length} OSM elements`);

  // 4. Process
  const counter = makeCounter();
  let geocodeCount = 0;

  for (const el of data.elements) {
    const tags = el.tags ?? {};

    // Extract coordinates
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (!lat || !lon) {
      counter.skipped++;
      continue;
    }

    // Skip dive shops and unnamed
    if (!tags["name"] || tags["shop"]) {
      counter.skipped++;
      continue;
    }

    const name = tags["name"].trim();
    const externalId = `${el.type}/${el.id}`;

    // Already imported?
    if (externalIdSet.has(externalId)) {
      counter.skipped++;
      continue;
    }

    // Geo dedup against existing
    const dup = findNearbyDuplicate(lat, lon, name, existing);
    if (dup) {
      counter.skipped++;
      continue;
    }

    // Country + region from OSM tags or Nominatim
    let country = tags["addr:country"] ?? tags["is_in:country"] ?? "";
    let region =
      tags["addr:state"] ??
      tags["addr:province"] ??
      tags["is_in:state"] ??
      tags["is_in:region"] ??
      "";

    if (!country) {
      if (geocodeCount > 0 && geocodeCount % 100 === 0) {
        console.log(`  … geocoded ${geocodeCount} sites so far (${counter.inserted} inserted)`);
      }
      await sleep(1000); // Nominatim rate limit
      geocodeCount++;
      const geo = await reverseGeocode(lat, lon);
      if (!geo) {
        counter.geocodeErrors++;
        // Use "Unknown" rather than skip — better to have the site with partial data
        country = "Unknown";
        region = "";
      } else {
        country = geo.country;
        region = geo.region;
      }
    }

    // Build site record
    const types = parseSiteTypes(tags);
    const description = buildDescription(tags, types, region, country);
    const difficulty = parseDifficulty(
      tags["scuba_diving:difficulty"] ?? tags["diving:difficulty"]
    );
    const maxDepthM = tags["scuba_diving:depth"]
      ? parseFloat(tags["scuba_diving:depth"])
      : null;
    const slug = await generateUniqueSlug(name);

    const ok = await insertSite({
      name,
      slug,
      description,
      latitude: lat,
      longitude: lon,
      country,
      region: region || country,
      difficulty,
      maxDepthM: maxDepthM && !isNaN(maxDepthM) ? maxDepthM : null,
      siteTypes: types,
      dataSource: "osm",
      externalId,
      createdBy: adminId,
    });

    if (ok) {
      // Add to in-memory list so subsequent elements can dedup against it
      existing.push({ id: "pending", name, latitude: lat, longitude: lon, externalId });
      externalIdSet.add(externalId);
      counter.inserted++;
    } else {
      counter.skipped++;
    }
  }

  // 5. Summary
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Done`);
  console.log(`   Inserted : ${counter.inserted}`);
  console.log(`   Skipped  : ${counter.skipped} (duplicates / filtered / unnamed)`);
  console.log(`   Geocoded : ${geocodeCount} (${counter.geocodeErrors} errors)`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
