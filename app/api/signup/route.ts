import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/userStore";
import { createProfile } from "@/lib/profileStore";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name: unknown = body?.name;
    const email: unknown = body?.email;
    const password: unknown = body?.password;

    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
    });

    // Create an initial default profile for the user
    const defaultProfile = await createProfile({
      userId: user.id,
      name: user.name,
      avatarColor: "#6366f1",
    });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
      profile: defaultProfile,
    });

    // Set active profile cookie so user can immediately use the site
    res.cookies.set("activeProfileId", defaultProfile.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (err) {
    console.error("[/api/signup]", err);
    return NextResponse.json(
      { error: "Something went wrong creating your profile." },
      { status: 500 }
    );
  }
}
