import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function POST() {
  try {
    const profile = await requireAuth();

    if (profile.role !== "diver") {
      return NextResponse.json(
        { error: "Only divers can request pro status" },
        { status: 400 }
      );
    }

    if (profile.proRequestedAt) {
      return NextResponse.json(
        { error: "You have already submitted a pro request" },
        { status: 400 }
      );
    }

    await db
      .update(profiles)
      .set({ proRequestedAt: new Date() })
      .where(eq(profiles.id, profile.id));

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
