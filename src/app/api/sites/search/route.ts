import { NextResponse } from "next/server";
import { db } from "@/db";
import { diveSites } from "@/db/schema";
import { ilike, or, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // Normalise both query and DB columns: strip punctuation so "jacksons bar"
    // matches "Jackson's Bar", "st johns" matches "St. John's", etc.
    const normalized = q.replace(/[^a-z0-9 ]/gi, "").replace(/\s+/g, " ").trim();
    const pattern = `%${normalized}%`;
    const results = await db
      .select()
      .from(diveSites)
      .where(
        or(
          sql`regexp_replace(lower(${diveSites.name}), '[^a-z0-9 ]', '', 'g') ilike ${pattern}`,
          sql`regexp_replace(lower(${diveSites.country}), '[^a-z0-9 ]', '', 'g') ilike ${pattern}`,
          sql`regexp_replace(lower(${diveSites.region}), '[^a-z0-9 ]', '', 'g') ilike ${pattern}`
        )
      )
      .limit(10);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
