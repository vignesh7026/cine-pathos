import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import { getProfileById } from "@/lib/profileStore";
import MoodHome from "@/components/MoodHome";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const activeProfileId = cookies().get("activeProfileId")?.value;

  if (!activeProfileId) {
    redirect("/profiles");
  }

  const profile = await getProfileById(activeProfileId);

  if (!profile || profile.userId !== userId) {
    redirect("/profiles");
  }

  return <MoodHome />;
}