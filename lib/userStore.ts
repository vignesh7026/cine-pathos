import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

let resolvedUsersPath: string | null = null;

async function getWritableUsersFilePath(): Promise<string> {
  if (resolvedUsersPath) return resolvedUsersPath;

  const localDataDir = path.join(process.cwd(), "data");
  const localFile = path.join(localDataDir, "users.json");

  try {
    await fs.mkdir(localDataDir, { recursive: true });
    // Verify write permissions
    const testFile = path.join(localDataDir, ".test_users_write");
    await fs.writeFile(testFile, "1");
    await fs.unlink(testFile);
    resolvedUsersPath = localFile;
    return localFile;
  } catch {
    // Fallback to /tmp in read-only serverless environments (e.g. Vercel)
    const tmpDir = path.join(os.tmpdir(), "mood-movies-data");
    await fs.mkdir(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, "users.json");

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

    resolvedUsersPath = tmpFile;
    return tmpFile;
  }
}

async function ensureStore(): Promise<string> {
  const filePath = await getWritableUsersFilePath();
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, "[]", "utf-8");
  }
  return filePath;
}

async function readUsers(): Promise<StoredUser[]> {
  const filePath = await ensureStore();
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [];
  }
}

async function writeUsers(users: StoredUser[]): Promise<void> {
  const filePath = await ensureStore();
  await fs.writeFile(filePath, JSON.stringify(users, null, 2), "utf-8");
}

export async function findUserByEmail(
  email: string
): Promise<StoredUser | undefined> {
  const users = await readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalizedEmail);
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const users = await readUsers();

  const newUser: StoredUser = {
    id: randomUUID(),
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeUsers(users);
  return newUser;
}
