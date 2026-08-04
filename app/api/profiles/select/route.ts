import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfileById } from "@/lib/profileStore";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const profileId = typeof body?.profileId === "string" ? body.profileId : "";

  const profile = await getProfileById(profileId);
  if (!profile || profile.userId !== userId) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  cookies().set("activeProfileId", profile.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return NextResponse.json({ success: true });
}
