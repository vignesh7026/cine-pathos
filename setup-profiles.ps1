# Run this from your project root: E:\mood-movies\mood-movies
# Usage:  powershell -ExecutionPolicy Bypass -File setup-profiles.ps1

New-Item -ItemType Directory -Force -Path "types" | Out-Null
New-Item -ItemType Directory -Force -Path "lib" | Out-Null
New-Item -ItemType Directory -Force -Path "app\api\profiles" | Out-Null
New-Item -ItemType Directory -Force -Path "app\api\profiles\[id]" | Out-Null
New-Item -ItemType Directory -Force -Path "app\api\profiles\select" | Out-Null
New-Item -ItemType Directory -Force -Path "app\profiles" | Out-Null
New-Item -ItemType Directory -Force -Path "components" | Out-Null

# ---------- types/profile.ts ----------
@'
export interface ProfileMoodEntry {
  mood: string;
  timestamp: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatarColor: string;
  createdAt: string;
  moodHistory: ProfileMoodEntry[];
}
'@ | Set-Content -Path "types\profile.ts" -Encoding utf8

# ---------- lib/profileStore.ts ----------
@'
import { promises as fs } from "fs";
import path from "path";
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
    id: crypto.randomUUID(),
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
'@ | Set-Content -Path "lib\profileStore.ts" -Encoding utf8

# ---------- app/api/profiles/route.ts ----------
@'
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
'@ | Set-Content -Path "app\api\profiles\route.ts" -Encoding utf8

# ---------- app/api/profiles/[id]/route.ts ----------
@'
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
'@ | Set-Content -Path "app\api\profiles\[id]\route.ts" -Encoding utf8

# ---------- app/api/profiles/select/route.ts ----------
@'
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
'@ | Set-Content -Path "app\api\profiles\select\route.ts" -Encoding utf8

# ---------- app/profiles/page.tsx ----------
@'
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
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <ProfilePicker initialProfiles={profiles} />
    </main>
  );
}
'@ | Set-Content -Path "app\profiles\page.tsx" -Encoding utf8

# ---------- components/ProfilePicker.tsx ----------
@'
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";

const AVATAR_COLORS = [
  "#f2a65a",
  "#e2725b",
  "#7c9885",
  "#6a8caf",
  "#a685e2",
  "#e2c85a",
  "#5ac8e2",
  "#e25a91",
];

export default function ProfilePicker({
  initialProfiles,
}: {
  initialProfiles: Profile[];
}) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [isManaging, setIsManaging] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectProfile(id: string) {
    if (isManaging) return;
    setPendingId(id);
    setError(null);
    try {
      const res = await fetch("/api/profiles/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: id }),
      });
      if (!res.ok) throw new Error("Couldn't select profile.");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPendingId(null);
    }
  }

  async function addProfile(e: FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), avatarColor: newColor }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create profile.");
      setProfiles((prev) => [...prev, data.profile]);
      setNewName("");
      setNewColor(AVATAR_COLORS[0]);
      setIsAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function removeProfile(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Couldn't delete profile.");
      setProfiles((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="w-full max-w-3xl text-center">
      <h1 className="font-display text-3xl italic text-foam sm:text-4xl">
        Who&apos;s watching?
      </h1>
      <p className="mt-3 text-sm text-muted">
        Each profile keeps its own mood history and recommendations.
      </p>

      <div className="mt-12 flex flex-wrap items-start justify-center gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="flex flex-col items-center gap-2">
            <button
              onClick={() => selectProfile(profile.id)}
              disabled={pendingId !== null}
              className="group relative flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-semibold text-void transition hover:scale-105 hover:ring-2 hover:ring-marquee focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee disabled:opacity-50 sm:h-28 sm:w-28"
              style={{ backgroundColor: profile.avatarColor }}
            >
              {profile.name.trim().charAt(0).toUpperCase()}
              {isManaging && (
                <span
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeProfile(profile.id);
                  }}
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-void text-sm text-foam ring-1 ring-raised2 transition hover:bg-marquee2"
                  aria-label={`Remove ${profile.name}`}
                >
                  X
                </span>
              )}
              {pendingId === profile.id && (
                <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-void/60 text-sm text-foam">
                  ...
                </span>
              )}
            </button>
            <span className="text-sm text-muted">{profile.name}</span>
          </div>
        ))}

        {profiles.length < 5 && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-raised2 text-muted transition hover:border-marquee/50 hover:text-foam sm:h-28 sm:w-28"
          >
            <span className="text-3xl">+</span>
            <span className="text-xs">Add</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={addProfile}
          className="mx-auto mt-10 flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-raised2 bg-raised/60 p-6"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Profile name"
            maxLength={20}
            className="w-full rounded-lg border border-raised2 bg-transparent px-4 py-2 text-center text-foam placeholder:text-muted/60 focus:outline-none"
          />
          <div className="flex flex-wrap justify-center gap-2">
            {AVATAR_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewColor(color)}
                className={`h-8 w-8 rounded-full transition ${
                  newColor === color
                    ? "ring-2 ring-foam ring-offset-2 ring-offset-raised"
                    : ""
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Choose color ${color}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-marquee px-5 py-2 text-sm font-semibold text-void transition hover:bg-marquee2"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg border border-raised2 px-5 py-2 text-sm text-muted transition hover:text-foam"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {profiles.length > 0 && (
        <button
          onClick={() => setIsManaging((v) => !v)}
          className="mt-10 rounded-lg border border-raised2 px-5 py-2 font-mono text-xs uppercase tracking-wider text-muted transition hover:border-marquee/50 hover:text-foam"
        >
          {isManaging ? "Done" : "Manage Profiles"}
        </button>
      )}

      {error && <p className="mt-4 text-sm text-marquee2">{error}</p>}
    </div>
  );
}
'@ | Set-Content -Path "components\ProfilePicker.tsx" -Encoding utf8

# ---------- middleware.ts (project root) ----------
@'
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const PROFILE_GATED_PATHS = ["/", "/results"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isGated = PROFILE_GATED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!isGated) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.next();
  }

  const activeProfileId = req.cookies.get("activeProfileId")?.value;
  if (!activeProfileId) {
    const url = req.nextUrl.clone();
    url.pathname = "/profiles";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/results/:path*"],
};
'@ | Set-Content -Path "middleware.ts" -Encoding utf8

Write-Host "Done. Created:"
Write-Host "  types/profile.ts"
Write-Host "  lib/profileStore.ts"
Write-Host "  app/api/profiles/route.ts"
Write-Host "  app/api/profiles/[id]/route.ts"
Write-Host "  app/api/profiles/select/route.ts"
Write-Host "  app/profiles/page.tsx"
Write-Host "  components/ProfilePicker.tsx"
Write-Host "  middleware.ts"
Write-Host ""
Write-Host "Now restart your dev server (Ctrl+C, then npm run dev)."
