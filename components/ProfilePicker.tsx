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
