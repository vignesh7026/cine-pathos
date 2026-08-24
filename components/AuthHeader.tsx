"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import type { Profile } from "@/types/profile";

interface AuthHeaderProps {
  hideBrand?: boolean; // new prop
}

export default function AuthHeader({ hideBrand = false }: AuthHeaderProps) {
  const { data: session, status } = useSession();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/profiles/active")
      .then((res) => res.json())
      .then((data) => setActiveProfile(data.profile ?? null))
      .catch(() => setActiveProfile(null));
  }, [status]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showProfileClause =
    activeProfile &&
    activeProfile.name.trim().toLowerCase() !==
      (session?.user?.name ?? "").trim().toLowerCase();

  const initial = (activeProfile?.name ?? session?.user?.name ?? "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <header className="glass-chrome sticky top-0 z-50 flex h-14 items-center justify-between px-6">
      {!hideBrand && (
        <Link
          href="/"
          className="font-display text-lg font-normal tracking-[0.08em]"
          style={{ color: "#818cf8", letterSpacing: "0.2em", fontFamily: "Georgia, serif", fontSize: "1.1rem", textShadow: "0 0 20px rgba(99,102,241,0.4)" }}
        >
          MARQUEE
        </Link>
      )}
      {/* If hideBrand is true, we render nothing on the left so the header stays balanced */}
      {hideBrand && <div />}

      <div className="flex items-center gap-3 font-mono text-xs">
        {status === "loading" ? null : session?.user ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full border transition"
              style={{ background: "rgba(99,102,241,0.15)", borderColor: "rgba(99,102,241,0.35)", color: "#c7d2fe", fontWeight: 600 }}
              aria-label="Account menu"
            >
              {initial}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-10 w-56 rounded-xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md" style={{ background: "rgba(8,13,34,0.95)", border: "1px solid rgba(99,102,241,0.2)" }}>
                <p className="px-1 pb-2 text-muted">
                  hi, <span className="text-foam">{session.user.name}</span>
                  {showProfileClause && (
                    <span className="text-muted/70">
                      {" "}
                      (watching as{" "}
                      <span className="text-foam">{activeProfile!.name}</span>)
                    </span>
                  )}
                </p>
                <div className="h-px bg-raised2" />
                <div className="flex flex-col pt-2">
                  {activeProfile && (
                    <Link
                      href="/profiles"
                      className="rounded-md px-2 py-2 text-left text-sm transition"
                      style={{ color: "rgba(180,190,240,0.6)" }}
                      onMouseOver={e => (e.currentTarget.style.color = "#eef2ff")}
                      onMouseOut={e => (e.currentTarget.style.color = "rgba(180,190,240,0.6)")}
                      onClick={() => setMenuOpen(false)}
                    >
                      switch profile
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="rounded-md px-2 py-2 text-left text-sm transition"
                    style={{ color: "rgba(180,190,240,0.6)" }}
                    onMouseOver={e => (e.currentTarget.style.color = "#eef2ff")}
                    onMouseOut={e => (e.currentTarget.style.color = "rgba(180,190,240,0.6)")}
                  >
                    log out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="aura-btn"
              style={{ padding: "6px 16px", borderRadius: 999, fontSize: 12 }}
            >
              log in
            </Link>
            <Link
              href="/signup"
              className="aura-btn aura-btn-primary"
              style={{ padding: "6px 16px", borderRadius: 999, fontSize: 12 }}
            >
              sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}