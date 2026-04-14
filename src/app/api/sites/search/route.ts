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
    const pattern = `%${q}%`;
    const results = await db
      .select()
      .from(diveSites)
      .where(
        or(
          ilike(diveSites.name, pattern),
          ilike(diveSites.country, pattern),
          ilike(diveSites.region, pattern)
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
