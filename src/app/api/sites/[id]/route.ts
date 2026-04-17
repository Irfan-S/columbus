import { NextResponse } from "next/server";
import { db } from "@/db";
import { diveSites } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getProfile } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const [site] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(site);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [site] = await db.select().from(diveSites).where(eq(diveSites.id, id)).limit(1);
    if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (profile.role !== "admin" && site.createdBy !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(diveSites).where(eq(diveSites.id, id));
    // Cascades handle: similarities → similarity_history + images,
    // site images, site_ratings, site_description_suggestions
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;

  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admins can edit any site; pros can only edit their own
    const [site] = await db
      .select()
      .from(diveSites)
      .where(eq(diveSites.id, id))
      .limit(1);

    if (!site) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (profile.role !== "admin" && site.createdBy !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [updated] = await db
      .update(diveSites)
      .set({
        name,
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
        updatedAt: new Date(),
      })
      .where(eq(diveSites.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
