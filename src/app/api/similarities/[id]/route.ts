import { NextResponse } from "next/server";
import { db } from "@/db";
import { similarities, similarityHistory } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireAuth();
    const { id } = await params;

    const [current] = await db
      .select()
      .from(similarities)
      .where(eq(similarities.id, id))
      .limit(1);

    if (!current) {
      return NextResponse.json({ error: "Comparison not found" }, { status: 404 });
    }

    if (current.createdBy !== profile.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { pelagicRating, macroRating, landscapeRating, currentsRating, visibilityRating, note } =
      await request.json();

    const hasRating =
      pelagicRating || macroRating || landscapeRating || currentsRating || visibilityRating;
    if (!hasRating) {
      return NextResponse.json({ error: "At least one rating axis is required" }, { status: 400 });
    }

    if (note && note.trim().length > 0) {
      const wordCount = note.trim().split(/\s+/).length;
      if (wordCount > 100) {
        return NextResponse.json({ error: "Note must be 100 words or fewer" }, { status: 400 });
      }
    }

    for (const [name, val] of Object.entries({
      pelagicRating, macroRating, landscapeRating, currentsRating, visibilityRating,
    })) {
      if (val !== null && val !== undefined && (val < 1 || val > 5)) {
        return NextResponse.json({ error: `${name} must be between 1 and 5` }, { status: 400 });
      }
    }

    await db.transaction(async (tx) => {
      // Save pre-edit state to history
      await tx.insert(similarityHistory).values({
        similarityId: id,
        editedBy: profile.id,
        pelagicRating: current.pelagicRating,
        macroRating: current.macroRating,
        landscapeRating: current.landscapeRating,
        currentsRating: current.currentsRating,
        visibilityRating: current.visibilityRating,
        note: current.note,
      });

      // Apply the edit
      await tx
        .update(similarities)
        .set({
          pelagicRating: pelagicRating ?? null,
          macroRating: macroRating ?? null,
          landscapeRating: landscapeRating ?? null,
          currentsRating: currentsRating ?? null,
          visibilityRating: visibilityRating ?? null,
          note: note?.trim() || null,
        })
        .where(eq(similarities.id, id));
    });

    const [updated] = await db.select().from(similarities).where(eq(similarities.id, id)).limit(1);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Edit similarity error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
