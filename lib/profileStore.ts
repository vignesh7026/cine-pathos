import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Profile } from "@/types/profile";

const DATA_DIR = path.join(process.cwd(), "data");
const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");

const MAX_PROFILES_PER_USER = 5;

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PROFILES_FILE);
  } catch {
    await fs.writeFile(PROFILES_FILE, "[]", "utf-8");
  }
}

async function readProfiles(): Promise<Profile[]> {
  await ensureStore();
  const raw = await fs.readFile(PROFILES_FILE, "utf-8");
  try {
    return JSON.parse(raw) as Profile[];
  } catch {
    return [];
  }
}

async function writeProfiles(profiles: Profile[]): Promise<void> {
  await ensureStore();
  await fs.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf-8");
}

export async function getProfilesForUser(userId: string): Promise<Profile[]> {
  const profiles = await readProfiles();
  return profiles.filter((p) => p.userId === userId);
}

export async function getProfileById(id: string): Promise<Profile | undefined> {
  const profiles = await readProfiles();
  return profiles.find((p) => p.id === id);
}

export async function createProfile(input: {
  userId: string;
  name: string;
  avatarColor: string;
}): Promise<Profile> {
  const profiles = await readProfiles();

  const existingForUser = profiles.filter((p) => p.userId === input.userId);
  if (existingForUser.length >= MAX_PROFILES_PER_USER) {
    throw new Error(`You can only have up to ${MAX_PROFILES_PER_USER} profiles.`);
  }

  const newProfile: Profile = {
    id: randomUUID(),
    userId: input.userId,
    name: input.name,
    avatarColor: input.avatarColor,
    createdAt: new Date().toISOString(),
    moodHistory: [],
  };

  profiles.push(newProfile);
  await writeProfiles(profiles);
  return newProfile;
}

export async function deleteProfile(id: string, userId: string): Promise<void> {
  const profiles = await readProfiles();
  const filtered = profiles.filter((p) => !(p.id === id && p.userId === userId));
  await writeProfiles(filtered);
}

export async function addMoodToHistory(
  profileId: string,
  mood: string
): Promise<void> {
  const profiles = await readProfiles();
  const profile = profiles.find((p) => p.id === profileId);
  if (!profile) return;

  profile.moodHistory = [
    { mood, timestamp: new Date().toISOString() },
    ...profile.moodHistory,
  ].slice(0, 50);

  await writeProfiles(profiles);
}
