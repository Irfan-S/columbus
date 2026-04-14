import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName, certAgency, certNumber, certLevel } =
      body;

    if (
      !email ||
      !password ||
      !displayName ||
      !certAgency ||
      !certNumber ||
      !certLevel
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingEmail] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Check if cert number already taken for this agency
    const [existingCert] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(
        and(
          eq(profiles.certAgency, certAgency),
          eq(profiles.certNumber, certNumber)
        )
      )
      .limit(1);

    if (existingCert) {
      return NextResponse.json(
        { error: "This certification number is already registered with " + certAgency },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(profiles)
      .values({
        email,
        passwordHash,
        displayName,
        certAgency,
        certNumber,
        certLevel,
      })
      .returning({ id: profiles.id });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
