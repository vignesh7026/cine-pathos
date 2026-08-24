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
    <main style={{
      minHeight: "100vh",
      background: "#020512",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(ellipse 90% 60% at 50% -5%, rgba(99,102,241,0.18) 0%, transparent 60%), " +
          "radial-gradient(ellipse 50% 35% at 90% 100%, rgba(139,92,246,0.08) 0%, transparent 55%)",
      }} />

      {/* Animated orb */}
      <div style={{
        position: "absolute", width: 400, height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        top: "50%", left: "50%",
        transform: "translate(-50%, -60%)",
        pointerEvents: "none",
        animation: "loginOrb 6s ease-in-out infinite",
      }} />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 400 }}>
        {/* Logo */}
        <p style={{
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontSize: "1.6rem",
          fontWeight: 700,
          letterSpacing: "0.35em",
          color: "#818cf8",
          marginBottom: 8,
          textShadow: "0 0 30px rgba(99,102,241,0.5)",
        }}>MARQUEE</p>

        <p style={{
          textAlign: "center",
          fontFamily: "monospace",
          fontSize: 11,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(129,140,248,0.6)",
          marginBottom: 8,
        }}>welcome back</p>

        <h1 style={{
          textAlign: "center",
          fontSize: "1.9rem",
          fontWeight: 300,
          color: "#eef2ff",
          marginBottom: 32,
          letterSpacing: "0.01em",
        }}>Sign in</h1>

        {/* Glass card */}
        <div style={{
          background: "rgba(8,13,34,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(99,102,241,0.18)",
          borderRadius: 20,
          padding: "32px 28px",
          boxShadow: "0 0 40px rgba(99,102,241,0.07), 0 16px 48px rgba(0,0,0,0.4)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label htmlFor="email" style={{ display: "block", fontSize: 12, color: "rgba(180,190,240,0.6)", marginBottom: 6, letterSpacing: "0.05em" }}>
                EMAIL
              </label>
              <div className="aura-input-wrap">
                <div className="aura-input-inner">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="aura-input"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" style={{ display: "block", fontSize: 12, color: "rgba(180,190,240,0.6)", marginBottom: 6, letterSpacing: "0.05em" }}>
                PASSWORD
              </label>
              <div className="aura-input-wrap">
                <div className="aura-input-inner">
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="aura-input"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      padding: "0 14px", color: "rgba(150,165,220,0.45)",
                      fontSize: 13, flexShrink: 0, transition: "color 0.2s",
                    }}
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <p style={{
                fontSize: 13, color: "#f87171",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, padding: "8px 12px", margin: 0,
              }} role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="aura-btn aura-btn-primary"
              style={{ width: "100%", marginTop: 4, padding: "13px 24px", borderRadius: 12, fontSize: "0.95rem" }}
            >
              {isLoading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <span style={{
                    width: 14, height: 14,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "loginSpin 0.7s linear infinite",
                  }} />
                  Signing in…
                </span>
              ) : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: "rgba(150,165,220,0.55)" }}>
          New here?{" "}
          <Link href="/signup" style={{ color: "#818cf8", textDecoration: "none", fontWeight: 500 }}
            onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            Create an account
          </Link>
        </p>
      </div>

      <style>{`
        @keyframes loginOrb { 0%,100%{opacity:0.6;transform:translate(-50%,-60%) scale(1)} 50%{opacity:1;transform:translate(-50%,-60%) scale(1.1)} }
        @keyframes loginSpin { to{transform:rotate(360deg)} }
        .aura-input:focus { outline: none; }
      `}</style>
    </main>
  );
}
