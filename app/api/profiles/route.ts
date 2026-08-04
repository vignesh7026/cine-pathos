import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfilesForUser, createProfile } from "@/lib/profileStore";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const profiles = await getProfilesForUser(userId);
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const avatarColor =
    typeof body?.avatarColor === "string" ? body.avatarColor : "#f2a65a";

  if (!name) {
    return NextResponse.json(
      { error: "Profile name is required." },
      { status: 400 }
    );
  }

  try {
    const profile = await createProfile({ userId, name, avatarColor });
    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Couldn't create profile." },
      { status: 400 }
    );
  }
}
