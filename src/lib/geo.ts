import { sql, and, ne } from "drizzle-orm";
import { db } from "@/db";
import { diveSites } from "@/db/schema";

export const VICINITY_RADIUS_KM = 2;

/**
 * Returns dive sites within VICINITY_RADIUS_KM of the given coordinates,
 * excluding the site with the given id. Distance is computed with the
 * Haversine formula entirely in PostgreSQL — no PostGIS required.
 */
export async function getNearbySites(
  siteId: string,
  latitude: number,
  longitude: number
): Promise<{ site: typeof diveSites.$inferSelect; distanceM: number }[]> {
  const rows = await db
    .select({
      site: diveSites,
      distanceKm: sql<number>`
        6371 * acos(
          LEAST(1,
            cos(radians(${latitude})) * cos(radians(${diveSites.latitude})) *
            cos(radians(${diveSites.longitude}) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(${diveSites.latitude}))
          )
        )
      `.as("distance_km"),
    })
    .from(diveSites)
    .where(
      and(
        ne(diveSites.id, siteId),
        sql`6371 * acos(
          LEAST(1,
            cos(radians(${latitude})) * cos(radians(${diveSites.latitude})) *
            cos(radians(${diveSites.longitude}) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(${diveSites.latitude}))
          )
        ) < ${VICINITY_RADIUS_KM}`
      )
    )
    .orderBy(
      sql`6371 * acos(
        LEAST(1,
          cos(radians(${latitude})) * cos(radians(${diveSites.latitude})) *
          cos(radians(${diveSites.longitude}) - radians(${longitude})) +
          sin(radians(${latitude})) * sin(radians(${diveSites.latitude}))
        )
      )`
    );

  return rows.map((r) => ({
    site: r.site,
    distanceM: Math.round(r.distanceKm * 1000),
  }));
}

export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) return `${distanceM}m away`;
  return `${(distanceM / 1000).toFixed(1)}km away`;
}
