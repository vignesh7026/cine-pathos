"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import type { Profile } from "@/types/profile";

interface AuthHeaderProps {
  hideBrand?: boolean; // new prop
}

function ReelMark() {
  return (
    <svg
      className="brand-reel"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="5.6" r="1.4" fill="currentColor" />
      <circle cx="12" cy="18.4" r="1.4" fill="currentColor" />
      <circle cx="5.6" cy="12" r="1.4" fill="currentColor" />
      <circle cx="18.4" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export default function AuthHeader({ hideBrand = false }: AuthHeaderProps) {
  const { data: session, status } = useSession();
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    <header
      className={`glass-chrome sticky top-0 z-50 flex items-center justify-between px-6 ${
        scrolled ? "glass-chrome--scrolled h-12" : "h-14"
      }`}
    >
      {!hideBrand && (
        <Link href="/" className="brand-link group flex items-center gap-2">
          <ReelMark />
          <span
            className="brand-wordmark font-display font-normal"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "1.05rem",
              letterSpacing: "0.22em",
              paddingLeft: "0.22em",
            }}
          >
            MARQUEE
          </span>
        </Link>
      )}
      {/* If hideBrand is true, we render nothing on the left so the header stays balanced */}
      {hideBrand && <div />}

      <div className="flex items-center gap-3 font-mono text-xs">
        {status === "loading" ? null : session?.user ? (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="avatar-ring flex h-8 items-center gap-1.5 rounded-full pl-1 pr-2"
              style={{ fontWeight: 600 }}
              aria-label="Account menu"
              aria-expanded={menuOpen}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[11px]"
                style={{ background: "rgba(99,102,241,0.28)" }}
              >
                {initial}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transition: "transform 0.2s ease",
                  transform: menuOpen ? "rotate(180deg)" : "none",
                  opacity: 0.7,
                }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {menuOpen && (
              <div
                className="menu-in absolute right-0 top-11 w-56 rounded-xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-md"
                style={{ background: "rgba(8,13,34,0.96)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
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
                      className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition"
                      style={{ color: "rgba(180,190,240,0.6)" }}
                      onMouseOver={(e) => (e.currentTarget.style.color = "#eef2ff")}
                      onMouseOut={(e) => (e.currentTarget.style.color = "rgba(180,190,240,0.6)")}
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      switch profile
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm transition"
                    style={{ color: "rgba(180,190,240,0.6)" }}
                    onMouseOver={(e) => (e.currentTarget.style.color = "#eef2ff")}
                    onMouseOut={(e) => (e.currentTarget.style.color = "rgba(180,190,240,0.6)")}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <path d="m16 17 5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
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
              className="aura-btn aura-btn-primary aura-btn--shine"
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
