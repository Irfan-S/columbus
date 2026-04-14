import { NextResponse } from "next/server";
import { db } from "@/db";
import { diveSites, siteRatings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireAuth();
    const { id } = await params;
    const { wouldDiveAgain } = await request.json();

    if (typeof wouldDiveAgain !== "boolean") {
      return NextResponse.json({ error: "wouldDiveAgain must be a boolean" }, { status: 400 });
    }

    const [site] = await db.select({ id: diveSites.id }).from(diveSites).where(eq(diveSites.id, id)).limit(1);
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    await db
      .insert(siteRatings)
      .values({ siteId: id, ratedBy: profile.id, wouldDiveAgain })
      .onConflictDoUpdate({
        target: [siteRatings.siteId, siteRatings.ratedBy],
        set: { wouldDiveAgain },
      });

    // Return updated counts
    const all = await db
      .select({ wouldDiveAgain: siteRatings.wouldDiveAgain })
      .from(siteRatings)
      .where(eq(siteRatings.siteId, id));

    const yes = all.filter((r) => r.wouldDiveAgain).length;
    const no = all.filter((r) => !r.wouldDiveAgain).length;

    return NextResponse.json({ yes, no });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Rate site error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
