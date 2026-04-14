import { NextResponse } from "next/server";
import { db } from "@/db";
import { diveSites } from "@/db/schema";
import { requirePro } from "@/lib/auth";
import { slugify } from "@/lib/slugify";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const profile = await requirePro();
    const body = await request.json();

    const {
      name,
      description,
      latitude,
      longitude,
      country,
      region,
      difficulty,
      accessType,
      maxDepthM,
      typicalVisibilityM,
      siteTypes,
    } = body;

    if (!name || !description || latitude == null || longitude == null || !country || !region) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate unique slug
    let slug = slugify(name);
    const existing = await db
      .select({ slug: diveSites.slug })
      .from(diveSites)
      .where(eq(diveSites.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const [site] = await db
      .insert(diveSites)
      .values({
        name,
        slug,
        description,
        latitude,
        longitude,
        country,
        region,
        difficulty: difficulty || null,
        accessType: accessType || null,
        maxDepthM: maxDepthM || null,
        typicalVisibilityM: typicalVisibilityM || null,
        siteTypes: siteTypes?.length ? siteTypes : null,
        createdBy: profile.id,
      })
      .returning();

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Pro access required") {
      return NextResponse.json(
        { error: "Pro access required" },
        { status: 403 }
      );
    }
    console.error("Create site error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const sites = await db.select().from(diveSites);
    return NextResponse.json(sites);
  } catch (error) {
    console.error("Fetch sites error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
