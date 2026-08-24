"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";

const AVATAR_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#10b981", // emerald
  "#3b82f6", // blue
  "#ef4444", // red
];

// Rich avatar emoji sets for a real Netflix-style profile feel
const AVATAR_SETS = [
  { emoji: "🎬", label: "Director" },
  { emoji: "🍿", label: "Popcorn" },
  { emoji: "🎭", label: "Drama" },
  { emoji: "🌟", label: "Star" },
  { emoji: "🎪", label: "Circus" },
  { emoji: "🦁", label: "Lion" },
  { emoji: "🐉", label: "Dragon" },
  { emoji: "🦋", label: "Butterfly" },
  { emoji: "🌊", label: "Wave" },
  { emoji: "🔮", label: "Crystal" },
  { emoji: "⚡", label: "Lightning" },
  { emoji: "🌙", label: "Moon" },
];

export default function ProfilePicker({ initialProfiles }: { initialProfiles: Profile[] }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [isManaging, setIsManaging] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const [newAvatarIdx, setNewAvatarIdx] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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
        body: JSON.stringify({
          name: newName.trim(),
          avatarColor: newColor,
          avatarEmoji: AVATAR_SETS[newAvatarIdx].emoji,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create profile.");
      setProfiles((prev) => [...prev, data.profile]);
      setNewName("");
      setNewColor(AVATAR_COLORS[0]);
      setNewAvatarIdx(0);
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
    <div className="pp-wrap">
      {/* Layered navy background */}
      <div className="pp-bg" />
      <div className="pp-bg-rings" />

      <div className="pp-content">
        {/* Logo */}
        <div className="pp-logo">MARQUEE</div>

        <h1 className="pp-title">Who's watching?</h1>
        <p className="pp-subtitle">
          Each profile keeps its own mood history and recommendations.
        </p>

        {/* Profile grid */}
        <div className="pp-grid">
          {profiles.map((profile, i) => {
            const avatarSet = AVATAR_SETS[i % AVATAR_SETS.length];
            const color = profile.avatarColor || AVATAR_COLORS[i % AVATAR_COLORS.length];
            const isHovered = hoveredId === profile.id;
            const isPending = pendingId === profile.id;

            return (
              <div
                key={profile.id}
                className="pp-item"
                onMouseEnter={() => setHoveredId(profile.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => selectProfile(profile.id)}
                  disabled={pendingId !== null}
                  className={`pp-avatar ${isHovered && !isManaging ? "pp-avatar--hovered" : ""} ${isPending ? "pp-avatar--loading" : ""}`}
                  style={{
                    "--avatar-color": color,
                  } as React.CSSProperties}
                >
                  {/* Gradient ring on hover */}
                  <div className="pp-avatar-ring" />

                  {/* Avatar face */}
                  <div className="pp-avatar-face">
                    <span className="pp-avatar-emoji">{avatarSet.emoji}</span>
                    <span className="pp-avatar-letter">
                      {profile.name.trim().charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Remove X in manage mode */}
                  {isManaging && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); removeProfile(profile.id); }}
                      className="pp-remove"
                      aria-label={`Remove ${profile.name}`}
                    >
                      ✕
                    </span>
                  )}

                  {/* Loading spinner */}
                  {isPending && (
                    <div className="pp-spinner-overlay">
                      <div className="pp-spinner" />
                    </div>
                  )}
                </button>

                <span className={`pp-name ${isHovered ? "pp-name--active" : ""}`}>
                  {profile.name}
                </span>
              </div>
            );
          })}

          {/* Add profile button */}
          {profiles.length < 5 && !isAdding && (
            <div className="pp-item">
              <button
                onClick={() => setIsAdding(true)}
                className="pp-add-btn"
              >
                <span className="pp-add-icon">+</span>
              </button>
              <span className="pp-name">Add Profile</span>
            </div>
          )}
        </div>

        {/* Add profile form */}
        {isAdding && (
          <form onSubmit={addProfile} className="pp-form">
            <h3 className="pp-form-title">Create Profile</h3>

            {/* Avatar emoji picker */}
            <div className="pp-emoji-grid">
              {AVATAR_SETS.map((av, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNewAvatarIdx(idx)}
                  className={`pp-emoji-btn ${newAvatarIdx === idx ? "pp-emoji-btn--active" : ""}`}
                  title={av.label}
                >
                  {av.emoji}
                </button>
              ))}
            </div>

            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Profile name"
              maxLength={20}
              className="pp-input aura-input"
              style={{
                background: "rgba(8,13,34,0.8)",
                border: "1px solid rgba(99,102,241,0.25)",
                borderRadius: 10,
                padding: "12px 16px",
                color: "#eef2ff",
                fontSize: "1rem",
                textAlign: "center",
                width: "100%",
                outline: "none",
                transition: "border-color 0.2s",
              }}
            />

            {/* Color picker */}
            <div className="pp-colors">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`pp-color-dot ${newColor === color ? "pp-color-dot--active" : ""}`}
                  style={{ background: color }}
                />
              ))}
            </div>

            <div className="pp-form-actions">
              <button type="submit" className="aura-btn aura-btn-primary" style={{ padding: "10px 28px" }}>
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="aura-btn"
                style={{ padding: "10px 28px" }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <button
          onClick={() => setIsManaging((v) => !v)}
          className="pp-manage-btn"
        >
          {isManaging ? "Done" : "Manage Profiles"}
        </button>

        {error && <p className="pp-error">{error}</p>}
      </div>

      <style>{`
        .pp-wrap {
          min-height: 100vh;
          width: 100%;
          background: #020512;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .pp-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 90% 60% at 50% -10%, rgba(99,102,241,0.2) 0%, transparent 60%),
            radial-gradient(ellipse 55% 40% at 85% 95%, rgba(139,92,246,0.1) 0%, transparent 50%),
            radial-gradient(ellipse 45% 30% at 15% 85%, rgba(59,130,246,0.07) 0%, transparent 50%);
          pointer-events: none;
        }

        /* Subtle animated background rings */
        .pp-bg-rings {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle 600px at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 70%);
          pointer-events: none;
          animation: ppPulse 4s ease-in-out infinite;
        }

        @keyframes ppPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.04); }
        }

        .pp-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          padding: 40px 20px;
          width: 100%;
          max-width: 900px;
        }

        .pp-logo {
          font-family: Georgia, serif;
          font-size: 1.8rem;
          font-weight: 700;
          letter-spacing: 0.35em;
          color: #818cf8;
          margin-bottom: 52px;
          text-shadow: 0 0 30px rgba(99,102,241,0.5);
        }

        .pp-title {
          font-size: clamp(2rem, 5vw, 3.2rem);
          font-weight: 300;
          color: #eef2ff;
          text-align: center;
          margin: 0 0 12px 0;
          letter-spacing: 0.01em;
        }

        .pp-subtitle {
          font-size: 0.92rem;
          color: rgba(180,190,240,0.55);
          text-align: center;
          margin: 0 0 52px 0;
        }

        .pp-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 28px;
          margin-bottom: 44px;
        }

        .pp-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          cursor: pointer;
        }

        /* Avatar button */
        .pp-avatar {
          position: relative;
          width: 118px;
          height: 118px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(99,102,241,0.15);
          background: linear-gradient(
            145deg,
            color-mix(in srgb, var(--avatar-color, #6366f1) 30%, #05091a),
            color-mix(in srgb, var(--avatar-color, #6366f1) 15%, #080d22)
          );
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
          overflow: visible;
        }

        .pp-avatar:disabled { cursor: not-allowed; opacity: 0.6; }

        /* Glowing ring that appears on hover */
        .pp-avatar-ring {
          position: absolute;
          inset: -3px;
          border-radius: 18px;
          background: linear-gradient(135deg, var(--avatar-color, #6366f1), #818cf8, #a78bfa);
          opacity: 0;
          z-index: -1;
          transition: opacity 0.25s ease;
          filter: blur(1px);
        }

        .pp-avatar--hovered {
          transform: scale(1.1) translateY(-3px);
          border-color: transparent;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5), 0 0 24px var(--avatar-color, rgba(99,102,241,0.4));
        }

        .pp-avatar--hovered .pp-avatar-ring { opacity: 1; }

        /* Avatar inner content */
        .pp-avatar-face {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .pp-avatar-emoji {
          font-size: 2.4rem;
          line-height: 1;
          opacity: 0.85;
          transition: transform 0.25s ease;
        }

        .pp-avatar--hovered .pp-avatar-emoji {
          transform: scale(1.1) translateY(-2px);
        }

        .pp-avatar-letter {
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        /* Remove button */
        .pp-remove {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 26px;
          height: 26px;
          background: #1a1a3a;
          color: #f5f5ff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          z-index: 10;
          border: 1px solid rgba(99,102,241,0.3);
          transition: background 0.15s;
          cursor: pointer;
        }
        .pp-remove:hover { background: #ef4444; border-color: #ef4444; }

        /* Loading */
        .pp-spinner-overlay {
          position: absolute;
          inset: 0;
          background: rgba(5,9,26,0.6);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pp-spinner {
          width: 26px; height: 26px;
          border: 2.5px solid rgba(129,140,248,0.3);
          border-top-color: #818cf8;
          border-radius: 50%;
          animation: ppSpin 0.7s linear infinite;
        }
        @keyframes ppSpin { to { transform: rotate(360deg); } }

        /* Profile name */
        .pp-name {
          font-size: 0.88rem;
          color: rgba(180,190,240,0.55);
          text-align: center;
          transition: color 0.2s, transform 0.2s;
          font-weight: 400;
          letter-spacing: 0.02em;
        }
        .pp-name--active {
          color: #eef2ff;
          transform: translateY(-1px);
        }

        /* Add button */
        .pp-add-btn {
          width: 118px;
          height: 118px;
          border-radius: 16px;
          border: 2px dashed rgba(99,102,241,0.22);
          background: rgba(99,102,241,0.04);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .pp-add-btn:hover {
          border-color: rgba(129,140,248,0.55);
          background: rgba(99,102,241,0.1);
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(99,102,241,0.15);
        }
        .pp-add-icon {
          font-size: 2.6rem;
          color: rgba(129,140,248,0.45);
          line-height: 1;
          transition: color 0.2s;
        }
        .pp-add-btn:hover .pp-add-icon { color: rgba(129,140,248,0.8); }

        /* Add profile form */
        .pp-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          background: rgba(8,13,34,0.9);
          border: 1px solid rgba(99,102,241,0.2);
          border-radius: 20px;
          padding: 28px 32px;
          backdrop-filter: blur(20px);
          margin-bottom: 28px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 0 40px rgba(99,102,241,0.08);
        }
        .pp-form-title {
          font-size: 1.15rem;
          color: #eef2ff;
          margin: 0;
          font-weight: 600;
        }

        /* Emoji picker */
        .pp-emoji-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
        }
        .pp-emoji-btn {
          width: 44px; height: 44px;
          border-radius: 10px;
          border: 1.5px solid rgba(99,102,241,0.15);
          background: rgba(99,102,241,0.06);
          font-size: 1.3rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pp-emoji-btn:hover {
          border-color: rgba(129,140,248,0.45);
          background: rgba(99,102,241,0.15);
          transform: scale(1.12);
        }
        .pp-emoji-btn--active {
          border-color: #818cf8;
          background: rgba(99,102,241,0.25);
          box-shadow: 0 0 12px rgba(99,102,241,0.3);
          transform: scale(1.1);
        }

        /* Color dots */
        .pp-colors {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }
        .pp-color-dot {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }
        .pp-color-dot:hover { transform: scale(1.15); }
        .pp-color-dot--active {
          border-color: #eef2ff;
          transform: scale(1.2);
          box-shadow: 0 0 10px rgba(255,255,255,0.3);
        }

        .pp-form-actions {
          display: flex;
          gap: 12px;
        }

        /* Manage button */
        .pp-manage-btn {
          padding: 9px 26px;
          border: 1px solid rgba(99,102,241,0.2);
          color: rgba(180,190,240,0.5);
          border-radius: 8px;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s;
          background: transparent;
          cursor: pointer;
        }
        .pp-manage-btn:hover {
          border-color: rgba(129,140,248,0.5);
          color: #eef2ff;
          background: rgba(99,102,241,0.08);
        }

        .pp-error {
          margin-top: 14px;
          color: #f87171;
          font-size: 0.88rem;
        }
      `}</style>
    </div>
  );
}
