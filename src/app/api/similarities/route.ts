import { NextResponse } from "next/server";
import { db } from "@/db";
import { similarities, diveSites } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, or } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const body = await request.json();

    const {
      siteAId,
      siteBId,
      pelagicRating,
      macroRating,
      landscapeRating,
      currentsRating,
      visibilityRating,
      note,
    } = body;

    if (!siteAId || !siteBId) {
      return NextResponse.json(
        { error: "Both sites are required" },
        { status: 400 }
      );
    }

    if (siteAId === siteBId) {
      return NextResponse.json(
        { error: "Cannot compare a site to itself" },
        { status: 400 }
      );
    }

    // At least one rating required
    const hasRating =
      pelagicRating || macroRating || landscapeRating || currentsRating || visibilityRating;
    if (!hasRating) {
      return NextResponse.json(
        { error: "At least one rating axis is required" },
        { status: 400 }
      );
    }

    // Validate word count if a note was provided
    if (note && note.trim().length > 0) {
      const wordCount = note.trim().split(/\s+/).length;
      if (wordCount > 100) {
        return NextResponse.json(
          { error: "Note must be 100 words or fewer" },
          { status: 400 }
        );
      }
    }

    // Prevent duplicate comparisons from the same user
    const [existing] = await db
      .select({ id: similarities.id })
      .from(similarities)
      .where(
        and(
          eq(similarities.createdBy, profile.id),
          or(
            and(eq(similarities.siteAId, siteAId), eq(similarities.siteBId, siteBId)),
            and(eq(similarities.siteAId, siteBId), eq(similarities.siteBId, siteAId))
          )
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "You have already compared these two sites" },
        { status: 409 }
      );
    }

    // Validate both sites exist
    const [siteA] = await db
      .select({ id: diveSites.id })
      .from(diveSites)
      .where(eq(diveSites.id, siteAId))
      .limit(1);
    const [siteB] = await db
      .select({ id: diveSites.id })
      .from(diveSites)
      .where(eq(diveSites.id, siteBId))
      .limit(1);

    if (!siteA || !siteB) {
      return NextResponse.json(
        { error: "One or both sites not found" },
        { status: 404 }
      );
    }

    // Validate ratings are 1-5 if provided
    for (const [name, val] of Object.entries({
      pelagicRating,
      macroRating,
      landscapeRating,
      currentsRating,
      visibilityRating,
    })) {
      if (val !== null && val !== undefined && (val < 1 || val > 5)) {
        return NextResponse.json(
          { error: `${name} must be between 1 and 5` },
          { status: 400 }
        );
      }
    }

    const [similarity] = await db
      .insert(similarities)
      .values({
        siteAId,
        siteBId,
        createdBy: profile.id,
        pelagicRating: pelagicRating || null,
        macroRating: macroRating || null,
        landscapeRating: landscapeRating || null,
        currentsRating: currentsRating || null,
        visibilityRating: visibilityRating || null,
        note: note?.trim() || null,
      })
      .returning();

    return NextResponse.json(similarity, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Create similarity error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
