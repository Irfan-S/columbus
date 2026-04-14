import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { images } from "@/db/schema";
import { requireAuth } from "@/lib/auth";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const profile = await requireAuth();
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const diveSiteId = formData.get("diveSiteId") as string | null;
    const similarityId = formData.get("similarityId") as string | null;
    const caption = formData.get("caption") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WebP images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Image must be under 5MB" },
        { status: 400 }
      );
    }

    if (!diveSiteId && !similarityId) {
      return NextResponse.json(
        { error: "Image must be linked to a dive site or comparison" },
        { status: 400 }
      );
    }

    // Generate filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const subdir = diveSiteId ? "sites" : "similarities";
    const filepath = join(UPLOAD_DIR, subdir, filename);

    // Write file
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const url = `/uploads/${subdir}/${filename}`;

    // Save to DB
    const [image] = await db
      .insert(images)
      .values({
        url,
        thumbnailUrl: url, // Same for now; could generate thumbnails later
        uploadedBy: profile.id,
        diveSiteId: diveSiteId || null,
        similarityId: similarityId || null,
        caption: caption || null,
      })
      .returning();

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
