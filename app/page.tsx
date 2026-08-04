"use client";

import { useState } from "react";
import MoodInput from "@/components/MoodInput";
import AuthHeader from "@/components/AuthHeader";

export default function Home() {
  const [isNavigating, setIsNavigating] = useState(false);

  function handleSubmit(message: string) {
    if (!message.trim()) return;
    setIsNavigating(true);
    // Hard navigation instead of router.push — forces a real browser page
    // load to /results instead of a client-side transition. Slightly less
    // smooth (a full reload instead of an instant SPA transition), but it
    // completely bypasses any stale client-side JS/router state, so it's
    // useful as a diagnostic: if this works and router.push didn't, the
    // problem was in client-side routing/caching, not in the app's logic.
    window.location.href = `/results?mood=${encodeURIComponent(message)}`;
  }

  return (
    <main className="min-h-screen bg-void text-foam">
      <AuthHeader />
      <MoodInput onSubmit={handleSubmit} isLoading={isNavigating} />
    </main>
  );
}