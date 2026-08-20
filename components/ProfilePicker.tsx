"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/profile";

const AVATAR_COLORS = [
  "#f2a65a","#e2725b","#7c9885","#6a8caf",
  "#a685e2","#e2c85a","#5ac8e2","#e25a91",
];

const AVATAR_ICONS = ["🎬","🍿","🎭","🎪","🌟","🎥","🎞️","🎦"];

export default function ProfilePicker({ initialProfiles }: { initialProfiles: Profile[] }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [isManaging, setIsManaging] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
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
    <div className="profiles-wrapper">
      {/* Animated background */}
      <div className="profiles-bg" />

      <div className="profiles-content">
        {/* Logo */}
        <div className="profiles-logo">MARQUEE</div>

        <h1 className="profiles-title">Who&apos;s watching?</h1>
        <p className="profiles-subtitle">
          Each profile keeps its own mood history and recommendations.
        </p>

        <div className="profiles-grid">
          {profiles.map((profile, i) => (
            <div
              key={profile.id}
              className="profile-item"
              onMouseEnter={() => setHoveredId(profile.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => selectProfile(profile.id)}
                disabled={pendingId !== null}
                className={`profile-avatar-btn ${hoveredId === profile.id && !isManaging ? "profile-hovered" : ""} ${pendingId === profile.id ? "profile-loading" : ""}`}
                style={{ backgroundColor: profile.avatarColor }}
              >
                <span className="profile-avatar-icon">
                  {AVATAR_ICONS[i % AVATAR_ICONS.length]}
                </span>
                <span className="profile-avatar-initial">
                  {profile.name.trim().charAt(0).toUpperCase()}
                </span>

                {isManaging && (
                  <span
                    role="button"
                    onClick={(e) => { e.stopPropagation(); removeProfile(profile.id); }}
                    className="profile-remove-btn"
                    aria-label={`Remove ${profile.name}`}
                  >✕</span>
                )}
                {pendingId === profile.id && (
                  <span className="profile-loading-overlay">
                    <span className="profile-spinner" />
                  </span>
                )}
              </button>
              <span className={`profile-name ${hoveredId === profile.id ? "profile-name-active" : ""}`}>
                {profile.name}
              </span>
            </div>
          ))}

          {profiles.length < 5 && !isAdding && (
            <div className="profile-item">
              <button
                onClick={() => setIsAdding(true)}
                className="profile-add-btn"
              >
                <span className="profile-add-icon">+</span>
              </button>
              <span className="profile-name">Add Profile</span>
            </div>
          )}
        </div>

        {isAdding && (
          <form onSubmit={addProfile} className="profile-form">
            <h3 className="profile-form-title">Create Profile</h3>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Profile name"
              maxLength={20}
              className="profile-form-input"
            />
            <div className="profile-color-grid">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`profile-color-swatch ${newColor === color ? "profile-color-active" : ""}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="profile-form-actions">
              <button type="submit" className="profile-btn-primary">Create</button>
              <button type="button" onClick={() => setIsAdding(false)} className="profile-btn-secondary">Cancel</button>
            </div>
          </form>
        )}

        <button
          onClick={() => setIsManaging((v) => !v)}
          className="profiles-manage-btn"
        >
          {isManaging ? "Done" : "Manage Profiles"}
        </button>

        {error && <p className="profiles-error">{error}</p>}
      </div>

      <style>{`
        .profiles-wrapper {
          min-height: 100vh;
          width: 100%;
          background: #050510;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .profiles-bg {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(129,140,248,0.15) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 100%, rgba(167,139,250,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 50% 30% at 20% 80%, rgba(99,102,241,0.06) 0%, transparent 50%);
          pointer-events: none;
        }

        .profiles-content {
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

        .profiles-logo {
          font-family: 'Georgia', serif;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: 0.3em;
          color: #818cf8;
          margin-bottom: 48px;
          text-shadow: 0 0 30px rgba(129,140,248,0.4);
        }

        .profiles-title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 300;
          color: #f5f0f0;
          text-align: center;
          margin: 0 0 12px 0;
          letter-spacing: 0.02em;
        }

        .profiles-subtitle {
          font-size: 0.95rem;
          color: rgba(245,240,240,0.5);
          text-align: center;
          margin: 0 0 56px 0;
        }

        .profiles-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 32px;
          margin-bottom: 48px;
        }

        .profile-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          cursor: pointer;
        }

        .profile-avatar-btn {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid transparent;
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
          cursor: pointer;
          overflow: hidden;
        }

        .profile-avatar-btn:disabled { cursor: not-allowed; opacity: 0.7; }

        .profile-hovered {
          transform: scale(1.08);
          border-color: #f5f0f0 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }

        .profile-avatar-icon {
          font-size: 2.8rem;
          position: absolute;
          opacity: 0.3;
        }

        .profile-avatar-initial {
          font-size: 3rem;
          font-weight: 700;
          color: rgba(0,0,0,0.7);
          position: relative;
          z-index: 1;
        }

        .profile-remove-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          width: 28px;
          height: 28px;
          background: #1a1a2e;
          color: #f5f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          z-index: 10;
          border: 1px solid rgba(255,255,255,0.2);
          transition: background 0.15s;
        }

        .profile-remove-btn:hover { background: #e50914; }

        .profile-loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.5);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .profile-name {
          font-size: 0.9rem;
          color: rgba(245,240,240,0.6);
          text-align: center;
          transition: color 0.2s;
          font-weight: 400;
          letter-spacing: 0.02em;
        }

        .profile-name-active { color: #f5f0f0; }

        .profile-add-btn {
          width: 120px;
          height: 120px;
          border-radius: 12px;
          border: 3px dashed rgba(245,240,240,0.2);
          background: rgba(245,240,240,0.03);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .profile-add-btn:hover {
          border-color: rgba(245,240,240,0.5);
          background: rgba(245,240,240,0.07);
          transform: scale(1.05);
        }

        .profile-add-icon {
          font-size: 3rem;
          color: rgba(245,240,240,0.4);
          line-height: 1;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          background: rgba(26,26,46,0.9);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 32px;
          backdrop-filter: blur(20px);
          margin-bottom: 32px;
          width: 100%;
          max-width: 400px;
        }

        .profile-form-title {
          font-size: 1.2rem;
          color: #f5f0f0;
          margin: 0;
          font-weight: 600;
        }

        .profile-form-input {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: #f5f0f0;
          font-size: 1rem;
          text-align: center;
          outline: none;
          transition: border-color 0.2s;
        }

        .profile-form-input:focus { border-color: rgba(129,140,248,0.6); }
        .profile-form-input::placeholder { color: rgba(245,240,240,0.4); }

        .profile-color-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }

        .profile-color-swatch {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 3px solid transparent;
          cursor: pointer;
          transition: all 0.15s;
        }

        .profile-color-active {
          border-color: #f5f0f0;
          transform: scale(1.15);
        }

        .profile-form-actions {
          display: flex;
          gap: 12px;
        }

        .profile-btn-primary {
          padding: 10px 28px;
          background: #818cf8;
          color: #050510;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          transition: background 0.2s, transform 0.15s;
        }

        .profile-btn-primary:hover { background: #a5b4fc; transform: scale(1.03); }

        .profile-btn-secondary {
          padding: 10px 28px;
          background: transparent;
          color: rgba(245,240,240,0.7);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .profile-btn-secondary:hover { background: rgba(255,255,255,0.07); color: #f5f0f0; }

        .profiles-manage-btn {
          padding: 10px 28px;
          border: 1px solid rgba(245,240,240,0.2);
          color: rgba(245,240,240,0.5);
          border-radius: 6px;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.2s;
        }

        .profiles-manage-btn:hover { border-color: rgba(245,240,240,0.5); color: #f5f0f0; }

        .profiles-error {
          margin-top: 16px;
          color: #f87171;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
