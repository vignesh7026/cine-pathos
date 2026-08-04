# Run this from your project root: E:\mood-movies\mood-movies
# Usage:  powershell -ExecutionPolicy Bypass -File wire-profiles.ps1

New-Item -ItemType Directory -Force -Path "app\api\profiles\active" | Out-Null

# ---------- app/login/page.tsx (redirect to /profiles instead of /) ----------
@'
"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect email or password.");
      setIsLoading(false);
      return;
    }

    router.push("/profiles");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-marquee-glow px-6">
      <div className="w-full max-w-sm">
        <p className="mb-2 text-center font-mono text-xs uppercase tracking-[0.3em] text-marquee/80">
          welcome back
        </p>
        <h1 className="mb-8 text-center font-display text-3xl italic text-foam">
          Log in
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-raised2 bg-raised/70 p-6"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-xs text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-raised2 bg-void/60 px-4 py-2.5 text-sm text-foam placeholder:text-muted/50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-xs text-muted"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-raised2 bg-void/60 px-4 py-2.5 text-sm text-foam placeholder:text-muted/50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="text-xs text-marquee2" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 rounded-xl bg-marquee px-4 py-2.5 text-sm font-semibold text-void transition hover:bg-marquee2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link
            href="/signup"
            className="text-foam underline underline-offset-2 hover:text-marquee"
          >
            Create a profile
          </Link>
        </p>
      </div>
    </main>
  );
}
'@ | Set-Content -Path "app\login\page.tsx" -Encoding utf8

# ---------- app/api/profiles/active/route.ts (new — lets client components know the active profile) ----------
@'
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
'@ | Set-Content -Path "app\api\profiles\active\route.ts" -Encoding utf8

# ---------- components/AuthHeader.tsx (adds "switch profile" link + active profile name) ----------
@'
"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import type { Profile } from "@/types/profile";

export default function AuthHeader() {
  const { data: session, status } = useSession();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profiles/active")
      .then((res) => res.json())
      .then((data) => setActiveProfile(data.profile ?? null))
      .catch(() => setActiveProfile(null));
  }, [status]);

  return (
    <div className="flex items-center justify-end gap-3 px-6 pt-6 font-mono text-xs">
      {status === "loading" ? null : session?.user ? (
        <>
          <span className="text-muted">
            hi, <span className="text-foam">{session.user.name}</span>
            {activeProfile && (
              <>
                {" "}
                <span className="text-muted/60">
                  (watching as{" "}
                  <span className="text-foam">{activeProfile.name}</span>)
                </span>
              </>
            )}
          </span>
          {activeProfile && (
            <Link
              href="/profiles"
              className="rounded-full border border-raised2 px-3 py-1 text-muted transition hover:border-marquee/50 hover:text-foam"
            >
              switch profile
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-full border border-raised2 px-3 py-1 text-muted transition hover:border-marquee/50 hover:text-foam"
          >
            log out
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="rounded-full border border-raised2 px-3 py-1 text-muted transition hover:border-marquee/50 hover:text-foam"
          >
            log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-marquee px-3 py-1 font-semibold text-void transition hover:bg-marquee2"
          >
            create profile
          </Link>
        </>
      )}
    </div>
  );
}
'@ | Set-Content -Path "components\AuthHeader.tsx" -Encoding utf8

# ---------- app/api/recommend/route.ts (logs mood to the active profile's history) ----------
@'
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runAgentLoop } from "@/lib/agentLoop";
import { addMoodToHistory } from "@/lib/profileStore";
import type { ConversationTurn } from "@/types/movie";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: unknown = body?.message;
    const conversationHistory: unknown = body?.conversationHistory;

    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "`message` is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    const history: ConversationTurn[] = Array.isArray(conversationHistory)
      ? conversationHistory
      : [];

    // Log this mood submission against the active profile, if any. This is
    // best-effort — a logging failure should never break recommendations.
    const activeProfileId = cookies().get("activeProfileId")?.value;
    if (activeProfileId) {
      addMoodToHistory(activeProfileId, message).catch((err) => {
        console.error("[/api/recommend] failed to log mood history", err);
      });
    }

    const result = await runAgentLoop(message, history);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/recommend]", err);
    return NextResponse.json(
      { error: "Something went wrong generating recommendations." },
      { status: 500 }
    );
  }
}
'@ | Set-Content -Path "app\api\recommend\route.ts" -Encoding utf8

Write-Host "Done. Updated/created:"
Write-Host "  app/login/page.tsx           (redirects to /profiles after login)"
Write-Host "  app/api/profiles/active/route.ts   (new)"
Write-Host "  components/AuthHeader.tsx    (adds switch-profile link)"
Write-Host "  app/api/recommend/route.ts   (logs mood to active profile)"
Write-Host ""
Write-Host "Restart your dev server (Ctrl+C, then npm run dev)."
