import { NextResponse } from "next/server";
import { db } from "@/db";
import { diveSites, siteDescriptionSuggestions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    const { suggestedDescription } = await request.json();

    if (!suggestedDescription?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    const words = suggestedDescription.trim().split(/\s+/).length;
    if (words > 500) {
      return NextResponse.json({ error: "Description must be 500 words or fewer" }, { status: 400 });
    }

    const [site] = await db.select().from(diveSites).where(eq(diveSites.id, id)).limit(1);
    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    if (suggestedDescription.trim() === site.description.trim()) {
      return NextResponse.json({ error: "No changes from current description" }, { status: 400 });
    }

    // Check for an existing pending suggestion from this user for this site
    const [existing] = await db
      .select({ id: siteDescriptionSuggestions.id })
      .from(siteDescriptionSuggestions)
      .where(
        and(
          eq(siteDescriptionSuggestions.siteId, id),
          eq(siteDescriptionSuggestions.suggestedBy, profile.id),
          eq(siteDescriptionSuggestions.status, "pending")
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending suggestion for this site" },
        { status: 409 }
      );
    }

    const [suggestion] = await db
      .insert(siteDescriptionSuggestions)
      .values({
        siteId: id,
        suggestedBy: profile.id,
        currentDescription: site.description,
        suggestedDescription: suggestedDescription.trim(),
      })
      .returning();

    return NextResponse.json(suggestion, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Suggest description error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
