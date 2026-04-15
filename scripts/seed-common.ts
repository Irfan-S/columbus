/**
 * Shared utilities for Columbus database seeding scripts.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { like, eq } from "drizzle-orm";
import { diveSites, profiles } from "../src/db/schema";

// ---------------------------------------------------------------------------
// DB client (standalone — not the Next.js singleton)
// ---------------------------------------------------------------------------

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.local values to .env or set DATABASE_URL.");
}

const client = postgres(process.env.DATABASE_URL, { max: 5 });
export const db = drizzle(client);

// ---------------------------------------------------------------------------
// Admin user
// ---------------------------------------------------------------------------

export async function getAdminUserId(email: string): Promise<string> {
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.email, email))
    .limit(1);
  if (!row) throw new Error(`Admin user not found: ${email}`);
  return row.id;
}

// ---------------------------------------------------------------------------
// Slug generation (mirrors /src/app/api/sites/route.ts pattern)
// ---------------------------------------------------------------------------

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function generateUniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  if (!base) return `site-${Date.now().toString(36)}`;

  const taken = await db
    .select({ slug: diveSites.slug })
    .from(diveSites)
    .where(like(diveSites.slug, `${base}%`));

  if (taken.length === 0) return base;

  const suffixes = taken.map((r) => {
    const rest = r.slug.slice(base.length).replace(/^-/, "");
    return rest === "" ? 0 : Number(rest);
  });
  const maxN = Math.max(...suffixes.filter((n) => !isNaN(n)));
  return `${base}-${maxN + 1}`;
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Name normalisation + overlap check
// ---------------------------------------------------------------------------

export function normaliseName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordSetOverlap(a: string, b: string): number {
  const setA = new Set(a.split(" ").filter(Boolean));
  const setB = new Set(b.split(" ").filter(Boolean));
  let common = 0;
  for (const w of setA) if (setB.has(w)) common++;
  const maxSize = Math.max(setA.size, setB.size);
  return maxSize === 0 ? 0 : common / maxSize;
}

// ---------------------------------------------------------------------------
// Existing site record (held in memory for dedup)
// ---------------------------------------------------------------------------

export interface ExistingSite {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  externalId: string | null;
}

export async function loadExistingSites(): Promise<ExistingSite[]> {
  return db
    .select({
      id: diveSites.id,
      name: diveSites.name,
      latitude: diveSites.latitude,
      longitude: diveSites.longitude,
      externalId: diveSites.externalId,
    })
    .from(diveSites);
}

/**
 * Returns the matching ExistingSite if this candidate is a duplicate, else null.
 * Duplicate = within 0.5 km AND (name word-set overlap ≥ 0.6 OR distance < 0.1 km)
 */
export function findNearbyDuplicate(
  lat: number,
  lon: number,
  name: string,
  existing: ExistingSite[]
): ExistingSite | null {
  const normName = normaliseName(name);

  // Fast bounding-box pre-filter (±0.5° ≈ 55 km — generous, Haversine confirms)
  const candidates = existing.filter(
    (s) => Math.abs(s.latitude - lat) < 0.5 && Math.abs(s.longitude - lon) < 0.5
  );

  for (const s of candidates) {
    const dist = haversineKm(lat, lon, s.latitude, s.longitude);
    if (dist >= 0.5) continue;
    if (dist < 0.1) return s; // essentially same coordinates
    const overlap = wordSetOverlap(normName, normaliseName(s.name));
    if (overlap >= 0.6) return s;
  }
  return null;
}

// ---------------------------------------------------------------------------
// externalId duplicate guard (fast O(1) check)
// ---------------------------------------------------------------------------

export function buildExternalIdSet(existing: ExistingSite[]): Set<string> {
  const s = new Set<string>();
  for (const e of existing) if (e.externalId) s.add(e.externalId);
  return s;
}

// ---------------------------------------------------------------------------
// Site insert
// ---------------------------------------------------------------------------

export type NewSite = typeof diveSites.$inferInsert;

export async function insertSite(site: NewSite): Promise<boolean> {
  try {
    await db.insert(diveSites).values(site);
    return true;
  } catch (err: unknown) {
    // Unique slug collision — shouldn't happen with generateUniqueSlug, but guard
    if (err instanceof Error && err.message.includes("unique")) {
      console.warn(`  ⚠ Slug collision for "${site.name}", skipping`);
    } else {
      console.warn(`  ⚠ Insert failed for "${site.name}":`, err);
    }
    return false;
  }
}

// ---------------------------------------------------------------------------
// Nominatim reverse geocode
// ---------------------------------------------------------------------------

export interface GeoLocation {
  country: string;
  region: string;
}

export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<GeoLocation | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${lat}&lon=${lon}&format=json&zoom=10`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Columbus/1.0 (columbus-app)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      address?: {
        country?: string;
        state?: string;
        region?: string;
        province?: string;
        county?: string;
        suburb?: string;
      };
    };
    const addr = data.address;
    if (!addr?.country) return null;
    const region =
      addr.state ?? addr.region ?? addr.province ?? addr.county ?? addr.suburb ?? "";
    return { country: addr.country, region };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sleep helper
// ---------------------------------------------------------------------------

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Counter helpers
// ---------------------------------------------------------------------------

export function makeCounter() {
  const c = { inserted: 0, skipped: 0, geocodeErrors: 0 };
  return c;
}
