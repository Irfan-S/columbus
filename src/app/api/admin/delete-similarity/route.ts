import { NextResponse } from "next/server";
import { db } from "@/db";
import { similarities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getProfile } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const profile = await getProfile();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    await db.delete(similarities).where(eq(similarities.id, id));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
