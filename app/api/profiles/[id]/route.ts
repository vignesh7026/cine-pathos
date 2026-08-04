import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteProfile } from "@/lib/profileStore";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  await deleteProfile(params.id, userId);

  const cookieStore = cookies();
  if (cookieStore.get("activeProfileId")?.value === params.id) {
    cookieStore.delete("activeProfileId");
  }

  return NextResponse.json({ success: true });
}