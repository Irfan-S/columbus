/**
 * seed-divevibe.ts
 * Imports dive sites from the Dive Vibe Community open-source dataset.
 * Repo: https://github.com/jbunderwater/dive-vibe-community
 *
 * Run: npm run seed:divevibe
 *
 * The dataset is already sourced from OSM (each site has osm_id + osm_type),
 * so externalId = '{osm_type}/{osm_id}' — sites already imported via seed-osm
 * are automatically skipped. Run this script BEFORE or AFTER seed-osm; both
 * orderings are safe.
 *
 * Country is determined by geocoding one representative site per destination
 * file (~100 Nominatim calls total, respecting 1 req/sec).
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
  normaliseName,
} from "./seed-common";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = "crysis1300@gmail.com";
const REPO = "jbunderwater/dive-vibe-community";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? "";
const DATA_DIR = "data/osm_clean";

// ---------------------------------------------------------------------------
// GitHub helpers
// ---------------------------------------------------------------------------

async function githubFetch(url: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (GITHUB_TOKEN) headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
  return fetch(url, { headers });
}

interface TreeBlob {
  path: string;
  type: string;
}

async function getDataFiles(): Promise<string[]> {
  const url = `https://api.github.com/repos/${REPO}/git/trees/HEAD?recursive=1`;
  const res = await githubFetch(url);
  if (!res.ok) throw new Error(`GitHub tree fetch failed: ${res.status}`);
  const tree = (await res.json()) as { tree: TreeBlob[] };
  return tree.tree
    .filter(
      (b) =>
        b.type === "blob" &&
        b.path.startsWith(`${DATA_DIR}/`) &&
        b.path.endsWith(".json") &&
        !b.path.includes("_removed")
    )
    .map((b) => b.path);
}

async function fetchRawFile(path: string): Promise<unknown> {
  const url = `https://raw.githubusercontent.com/${REPO}/main/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Raw fetch failed for ${path}: ${res.status}`);
  return res.json();
}

// ---------------------------------------------------------------------------
// Dive Vibe site shape
// ---------------------------------------------------------------------------

interface DiveVibeSite {
  name: string;
  lat: number;
  lon: number;
  osm_id?: number;
  osm_type?: string;
  depth?: number;
  site_type?: string;
  entry_type?: string;
  difficulty?: string;
  validated?: boolean;
  tags?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Field mapping helpers
// ---------------------------------------------------------------------------

function destinationToRegion(filename: string): string {
  // "alor-archipelago" → "Alor Archipelago"
  return filename
    .replace(/\.json$/, "")
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseDifficulty(
  s: string | undefined
): "beginner" | "intermediate" | "advanced" | null {
  if (!s) return null;
  const t = normaliseName(s);
  if (t.includes("beginner") || t === "easy" || t === "1") return "beginner";
  if (t.includes("intermediate") || t === "moderate" || t === "2") return "intermediate";
  if (t.includes("advanced") || t.includes("difficult") || t === "3") return "advanced";
  return null;
}

function parseAccessType(
  s: string | undefined
): "shore" | "boat" | "both" | null {
  if (!s) return null;
  const t = s.toLowerCase().trim();
  if (t === "shore") return "shore";
  if (t === "boat") return "boat";
  if (t === "both" || t === "shore_or_boat") return "both";
  return null;
}

function parseSiteTypes(siteType: string | undefined, tags?: Record<string, string>): string[] {
  const types: string[] = [];
  const t = (siteType ?? "").toLowerCase();

  if (t === "wreck" || tags?.["seamark:type"] === "wreck") types.push("wreck");
  if (t === "reef") types.push("reef");
  if (t === "wall") types.push("wall");
  if (t === "cave") types.push("cave");
  if (t === "pinnacle" || t === "rock") types.push("pinnacle");
  if (t === "drift") types.push("drift");
  if (t === "muck") types.push("muck");
  if (t === "shore") types.push("shore");

  return types.length > 0 ? types : ["reef"];
}

function buildDescription(
  types: string[],
  region: string,
  country: string,
  tags?: Record<string, string>
): string {
  if (tags?.["description"]) return tags["description"];
  const typesStr = types.join(", ");
  const loc = [region, country].filter(Boolean).join(", ");
  return `${typesStr.charAt(0).toUpperCase() + typesStr.slice(1)} dive site${loc ? ` in ${loc}` : ""}.`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("🌊 Columbus Dive Vibe Seeder");
  console.log("=".repeat(50));
  if (!GITHUB_TOKEN) {
    console.log(
      "ℹ  No GITHUB_TOKEN set — unauthenticated rate limit (60 req/hr) applies."
    );
    console.log("   Set GITHUB_TOKEN to raise this to 5000 req/hr.\n");
  }

  // 1. Admin user
  const adminId = await getAdminUserId(ADMIN_EMAIL);
  console.log(`✓ Admin user: ${ADMIN_EMAIL} (${adminId})`);

  // 2. Load existing sites for dedup
  const existing = await loadExistingSites();
  const externalIdSet = buildExternalIdSet(existing);
  console.log(`✓ Loaded ${existing.length} existing sites`);

  // 3. Get file list from GitHub
  console.log("\n⬇  Fetching Dive Vibe repo file tree…");
  const files = await getDataFiles();
  console.log(`✓ Found ${files.length} destination files`);

  // 4. Per-destination country cache (geocode one site per file)
  const countryCache = new Map<string, { country: string; region: string }>();

  const counter = makeCounter();
  let fileIdx = 0;

  for (const filePath of files) {
    fileIdx++;
    const filename = filePath.split("/").pop()!;
    const region = destinationToRegion(filename);
    process.stdout.write(`\n[${fileIdx}/${files.length}] ${region}… `);

    let sites: DiveVibeSite[];
    try {
      const raw = await fetchRawFile(filePath);
      if (!Array.isArray(raw)) {
        process.stdout.write("(not an array, skipping)\n");
        continue;
      }
      sites = raw as DiveVibeSite[];
    } catch (err) {
      process.stdout.write(`(fetch error: ${err})\n`);
      continue;
    }

    if (sites.length === 0) {
      process.stdout.write("(empty)\n");
      continue;
    }

    // Geocode the first valid site to get country for this destination
    if (!countryCache.has(filename)) {
      const sample = sites.find((s) => s.lat && s.lon);
      if (sample) {
        await sleep(1000); // Nominatim rate limit
        const geo = await reverseGeocode(sample.lat, sample.lon);
        countryCache.set(filename, {
          country: geo?.country ?? region,
          region: geo?.region ?? region,
        });
      } else {
        countryCache.set(filename, { country: region, region });
      }
    }

    const { country } = countryCache.get(filename)!;
    let fileInserted = 0;

    for (const site of sites) {
      if (!site.name || !site.lat || !site.lon) {
        counter.skipped++;
        continue;
      }

      const name = site.name.trim();
      const externalId =
        site.osm_type && site.osm_id
          ? `${site.osm_type}/${site.osm_id}`
          : null;

      // Already imported (by this script or seed-osm)?
      if (externalId && externalIdSet.has(externalId)) {
        counter.skipped++;
        continue;
      }

      // Geo dedup
      const dup = findNearbyDuplicate(site.lat, site.lon, name, existing);
      if (dup) {
        counter.skipped++;
        continue;
      }

      const types = parseSiteTypes(site.site_type, site.tags);
      const description = buildDescription(types, region, country, site.tags);
      const slug = await generateUniqueSlug(name);

      const ok = await insertSite({
        name,
        slug,
        description,
        latitude: site.lat,
        longitude: site.lon,
        country,
        region,
        difficulty: parseDifficulty(site.difficulty),
        accessType: parseAccessType(site.entry_type),
        maxDepthM: site.depth ?? null,
        siteTypes: types,
        dataSource: "divevibe",
        externalId: externalId ?? undefined,
        createdBy: adminId,
      });

      if (ok) {
        existing.push({
          id: "pending",
          name,
          latitude: site.lat,
          longitude: site.lon,
          externalId: externalId ?? null,
        });
        if (externalId) externalIdSet.add(externalId);
        counter.inserted++;
        fileInserted++;
      } else {
        counter.skipped++;
      }
    }

    process.stdout.write(`${fileInserted} inserted\n`);

    // Small pause between files to be polite to GitHub raw CDN
    await sleep(200);
  }

  // 5. Summary
  console.log("\n" + "=".repeat(50));
  console.log(`✅ Done`);
  console.log(`   Inserted : ${counter.inserted}`);
  console.log(`   Skipped  : ${counter.skipped} (duplicates / already imported / no coords)`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
