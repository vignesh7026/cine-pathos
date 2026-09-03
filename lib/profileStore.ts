import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
import type { Profile } from "@/types/profile";

const MAX_PROFILES_PER_USER = 5;

let resolvedProfilesPath: string | null = null;

async function getWritableProfilesFilePath(): Promise<string> {
  if (resolvedProfilesPath) return resolvedProfilesPath;

  const localDataDir = path.join(process.cwd(), "data");
  const localFile = path.join(localDataDir, "profiles.json");

  try {
    await fs.mkdir(localDataDir, { recursive: true });
    const testFile = path.join(localDataDir, ".test_profiles_write");
    await fs.writeFile(testFile, "1");
    await fs.unlink(testFile);
    resolvedProfilesPath = localFile;
    return localFile;
  } catch {
    // Fallback to /tmp in read-only serverless environments (e.g. Vercel)
    const tmpDir = path.join(os.tmpdir(), "mood-movies-data");
    await fs.mkdir(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, "profiles.json");

    try {
      await fs.access(tmpFile);
    } catch {
      try {
        const seedData = await fs.readFile(localFile, "utf-8");
        await fs.writeFile(tmpFile, seedData, "utf-8");
      } catch {
        await fs.writeFile(tmpFile, "[]", "utf-8");
      }
    }

    resolvedProfilesPath = tmpFile;
    return tmpFile;
  }
}

async function ensureStore(): Promise<string> {
  const filePath = await getWritableProfilesFilePath();
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf-8");
  }
  return filePath;
}

async function readProfiles(): Promise<Profile[]> {
  const filePath = await ensureStore();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as Profile[];
  } catch {
    return [];
  }
}

async function writeProfiles(profiles: Profile[]): Promise<void> {
  const filePath = await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(profiles, null, 2), "utf-8");
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
