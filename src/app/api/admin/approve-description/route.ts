import { NextResponse } from "next/server";
import { db } from "@/db";
import { diveSites, siteDescriptionSuggestions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProfile } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const profile = await getProfile();
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const [suggestion] = await db
      .select()
      .from(siteDescriptionSuggestions)
      .where(eq(siteDescriptionSuggestions.id, id))
      .limit(1);

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Atomically update site description + mark suggestion approved
    await db.transaction(async (tx) => {
      await tx
        .update(diveSites)
        .set({ description: suggestion.suggestedDescription, updatedAt: new Date() })
        .where(eq(diveSites.id, suggestion.siteId));

      await tx
        .update(siteDescriptionSuggestions)
        .set({ status: "approved", reviewedBy: profile.id, reviewedAt: new Date() })
        .where(eq(siteDescriptionSuggestions.id, id));
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
