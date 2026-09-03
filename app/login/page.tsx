"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function ReelIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="5.4" r="1.5" fill="currentColor" />
      <circle cx="12" cy="18.6" r="1.5" fill="currentColor" />
      <circle cx="5.4" cy="12" r="1.5" fill="currentColor" />
      <circle cx="18.6" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Incorrect email or password.");
      setIsLoading(false);
      return;
    }
    router.push("/profiles");
    router.refresh();
  }

  return (
    <main className="auth-stage flex min-h-screen items-center justify-center px-6 py-12">
      {/* Layered ambient background */}
      <div className="auth-blob auth-blob--1" />
      <div className="auth-blob auth-blob--2" />
      <div className="auth-blob auth-blob--3" />
      <div className="auth-grain" />
      <div className="auth-vignette" />

      <div className="relative z-10 w-full" style={{ maxWidth: 400 }}>
        {/* Brand */}
        <div className="auth-rise" style={{ animationDelay: "40ms" }}>
          <div className="mb-3 flex items-center justify-center gap-2.5">
            <span className="brand-reel">
              <ReelIcon size={22} />
            </span>
            <span
              className="brand-wordmark"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "1.55rem",
                fontWeight: 700,
                letterSpacing: "0.34em",
                paddingLeft: "0.34em",
              }}
            >
              MARQUEE
            </span>
          </div>
        </div>

        <p
          className="auth-rise"
          style={{
            animationDelay: "110ms",
            textAlign: "center",
            fontFamily: "monospace",
            fontSize: 11,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(129,140,248,0.65)",
            marginBottom: 6,
          }}
        >
          welcome back
        </p>

        <h1
          className="auth-rise"
          style={{
            animationDelay: "170ms",
            textAlign: "center",
            fontSize: "1.95rem",
            fontWeight: 300,
            color: "#eef2ff",
            marginBottom: 26,
            letterSpacing: "0.01em",
          }}
        >
          Sign in to your seat
        </h1>

        {/* Card */}
        <div className="auth-card auth-card-in" style={{ animationDelay: "220ms" }}>
          {/* Cinema marquee lights */}
          <div className="marquee-bulbs" aria-hidden="true">
            {Array.from({ length: 11 }).map((_, i) => (
              <span key={i} style={{ animationDelay: `${i * 130}ms` }} />
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{ display: "block", fontSize: 12, color: "rgba(180,190,240,0.6)", marginBottom: 6, letterSpacing: "0.05em" }}
              >
                EMAIL
              </label>
              <div className="aura-input-wrap">
                <div className="aura-input-inner">
                  <span className="aura-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="aura-input"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{ display: "block", fontSize: 12, color: "rgba(180,190,240,0.6)", marginBottom: 6, letterSpacing: "0.05em" }}
              >
                PASSWORD
              </label>
              <div className="aura-input-wrap">
                <div className="aura-input-inner">
                  <span className="aura-input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="10" width="16" height="11" rx="2" />
                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="aura-input"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="aura-eye-btn"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.61 6.61A18.5 18.5 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.39-1.61" />
                        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                        <path d="m2 2 20 20" />
                      </svg>
                    ) : (
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p
                style={{
                  fontSize: 13,
                  color: "#f87171",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  margin: 0,
                }}
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="aura-btn aura-btn-primary aura-btn--shine"
              style={{ width: "100%", marginTop: 4, padding: "13px 24px", borderRadius: 12, fontSize: "0.95rem" }}
            >
              {isLoading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "loginSpin 0.7s linear infinite",
                    }}
                  />
                  Signing in…
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p
          className="auth-rise"
          style={{ animationDelay: "300ms", marginTop: 20, textAlign: "center", fontSize: 14, color: "rgba(150,165,220,0.55)" }}
        >
          New here?{" "}
          <Link
            href="/signup"
            style={{ color: "#a5b4fc", textDecoration: "none", fontWeight: 500 }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Create an account →
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        .aura-input:focus { outline: none; }
      `}</style>
    </main>
  );
}
