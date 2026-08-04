"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setIsLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(
          "Profile created, but sign-in failed — try logging in manually."
        );
        setIsLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again in a moment.");
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-marquee-glow px-6">
      <div className="w-full max-w-sm">
        <p className="mb-2 text-center font-mono text-xs uppercase tracking-[0.3em] text-marquee/80">
          new here
        </p>
        <h1 className="mb-8 text-center font-display text-3xl italic text-foam">
          Create your profile
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-raised2 bg-raised/70 p-6"
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-xs text-muted">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full rounded-xl border border-raised2 bg-void/60 px-4 py-2.5 text-sm text-foam placeholder:text-muted/50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee"
              placeholder="Your name"
            />
          </div>

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
              minLength={8}
              className="w-full rounded-xl border border-raised2 bg-void/60 px-4 py-2.5 text-sm text-foam placeholder:text-muted/50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee"
              placeholder="At least 8 characters"
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
            {isLoading ? "Creating profile…" : "Create profile"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have a profile?{" "}
          <Link
            href="/login"
            className="text-foam underline underline-offset-2 hover:text-marquee"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
