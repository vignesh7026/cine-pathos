import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getProfilesForUser } from "@/lib/profileStore";
import ProfilePicker from "@/components/ProfilePicker";

export default async function ProfilesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    redirect("/login");
  }

  const profiles = await getProfilesForUser(userId!);

  return (
    <main style={{ margin: 0, padding: 0 }}>
      <ProfilePicker initialProfiles={profiles} />
    </main>
  );
}