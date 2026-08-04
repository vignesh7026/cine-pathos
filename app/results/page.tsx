"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClarifyingQuestion from "@/components/ClarifyingQuestion";
import MovieGrid from "@/components/MovieGrid";
import AuthHeader from "@/components/AuthHeader";
import type { ConversationTurn, Movie, RecommendResponse } from "@/types/movie";

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMood = searchParams.get("mood") ?? "";

  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [results, setResults] = useState<{
    movies: Movie[];
    agentNote: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prevents the initial mood from firing twice — React Strict Mode runs
  // effects twice in dev, and this also guards a back-navigation remount.
  const hasFiredInitial = useRef(false);

  async function sendMessage(message: string, historyOverride?: ConversationTurn[]) {
    setIsLoading(true);
    setError(null);

    const baseHistory = historyOverride ?? history;
    const nextHistory: ConversationTurn[] = [
      ...baseHistory,
      { role: "user", content: message },
    ];

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationHistory: baseHistory,
        }),
      });

      if (!res.ok) {
        throw new Error("Recommendation request failed.");
      }

      const data: RecommendResponse = await res.json();

      if (data.type === "clarifying_question") {
        setPendingQuestion(data.question);
        setResults(null);
        setHistory([
          ...nextHistory,
          { role: "assistant", content: data.question },
        ]);
      } else {
        setPendingQuestion(null);
        setResults({ movies: data.movies, agentNote: data.agentNote });
        setHistory([
          ...nextHistory,
          { role: "assistant", content: data.agentNote },
        ]);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!initialMood || hasFiredInitial.current) return;
    hasFiredInitial.current = true;
    sendMessage(initialMood, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMood]);

  if (!initialMood) {
    return (
      <main className="min-h-screen">
        <AuthHeader />
        <p className="mx-auto max-w-xl px-6 py-24 text-center text-sm text-muted">
          No mood provided.{" "}
          <button
            onClick={() => router.push("/")}
            className="text-marquee underline underline-offset-2"
          >
            Go back and describe how you&apos;re feeling.
          </button>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <AuthHeader />

      <div className="mx-auto max-w-2xl px-6 pt-10 text-center">
        <button
          onClick={() => router.push("/")}
          className="font-mono text-xs text-muted transition hover:text-foam"
        >
          ← try a different mood
        </button>
      </div>

      <div className="sprocket-divider" />

      {isLoading && !pendingQuestion && !results && (
        <p className="mx-auto max-w-xl px-6 py-16 text-center text-sm text-muted">
          reading the room…
        </p>
      )}

      {pendingQuestion && (
        <ClarifyingQuestion
          question={pendingQuestion}
          onAnswer={(answer) => sendMessage(answer)}
          isLoading={isLoading}
        />
      )}

      {results && (
        <MovieGrid movies={results.movies} agentNote={results.agentNote} />
      )}

      {error && (
        <p className="mx-auto max-w-xl px-6 pb-12 text-center text-sm text-marquee2">
          {error}
        </p>
      )}
    </main>
  );
}

// useSearchParams requires a Suspense boundary in the app router.
export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
} 