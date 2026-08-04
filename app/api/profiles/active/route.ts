import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getProfileById } from "@/lib/profileStore";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ profile: null });
  }

  const activeProfileId = cookies().get("activeProfileId")?.value;
  if (!activeProfileId) {
    return NextResponse.json({ profile: null });
  }

  const profile = await getProfileById(activeProfileId);
  if (!profile || profile.userId !== userId) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({ profile });
}
