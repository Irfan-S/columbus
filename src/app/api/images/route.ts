import { NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { db } from "@/db";
import { images } from "@/db/schema";
import { requireAuth } from "@/lib/auth";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const THUMB_WIDTH = 400; // px, height auto-scaled

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

    // Generate filenames
    const id = randomUUID();
    const subdir = diveSiteId ? "sites" : "similarities";
    const filename = `${id}.webp`;
    const thumbFilename = `${id}_thumb.webp`;
    const filepath = join(UPLOAD_DIR, subdir, filename);
    const thumbPath = join(UPLOAD_DIR, subdir, thumbFilename);

    // Process with sharp: save full (capped at 2000px wide) + thumbnail
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await Promise.all([
      sharp(buffer).resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 85 }).toFile(filepath),
      sharp(buffer).resize({ width: THUMB_WIDTH }).webp({ quality: 80 }).toFile(thumbPath),
    ]);

    const url = `/uploads/${subdir}/${filename}`;
    const thumbnailUrl = `/uploads/${subdir}/${thumbFilename}`;

    // Save to DB
    const [image] = await db
      .insert(images)
      .values({
        url,
        thumbnailUrl,
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
