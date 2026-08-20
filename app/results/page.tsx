"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClarifyingQuestion from "@/components/ClarifyingQuestion";
import MovieGrid from "@/components/MovieGrid";
import AuthHeader from "@/components/AuthHeader";
import ResultsLoadingState from "@/components/ResultsLoadingState";
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
  const [mounted, setMounted] = useState(false);
  const hasFiredInitial = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const saveToCache = (resVal: typeof results, histVal: ConversationTurn[], qVal: string | null) => {
    if (typeof window === "undefined" || !initialMood) return;
    try {
      sessionStorage.setItem(
        `mood_results_${initialMood}`,
        JSON.stringify({
          results: resVal,
          history: histVal,
          pendingQuestion: qVal,
        })
      );
    } catch (e) {
      console.error("Failed to write to sessionStorage", e);
    }
  };

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
        const newHist: ConversationTurn[] = [
          ...nextHistory,
          { role: "assistant", content: data.question },
        ];
        setHistory(newHist);
        saveToCache(null, newHist, data.question);
      } else {
        setPendingQuestion(null);
        const newRes = { movies: data.movies, agentNote: data.agentNote };
        setResults(newRes);
        const newHist: ConversationTurn[] = [
          ...nextHistory,
          { role: "assistant", content: data.agentNote },
        ];
        setHistory(newHist);
        saveToCache(newRes, newHist, null);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!mounted || !initialMood || hasFiredInitial.current) return;
    hasFiredInitial.current = true;

    try {
      const cached = sessionStorage.getItem(`mood_results_${initialMood}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        setResults(parsed.results);
        setHistory(parsed.history);
        setPendingQuestion(parsed.pendingQuestion);
        return;
      }
    } catch (e) {
      console.error("Failed to read from sessionStorage cache", e);
    }

    sendMessage(initialMood, []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, initialMood]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#050510]">
        <AuthHeader />
        <div className="flex min-h-screen items-center justify-center px-4">
          <p className="text-sm text-offwhite/60">Loading…</p>
        </div>
      </main>
    );
  }

  if (!initialMood) {
    return (
      <main className="min-h-screen bg-[#050510]">
        <AuthHeader />
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-xl text-center">
            <p className="text-sm text-offwhite/80">
              No mood provided.{" "}
              <button
                onClick={() => router.push("/")}
                className="text-marquee underline underline-offset-2 hover:text-marquee-light"
              >
                Go back and describe how you&apos;re feeling.
              </button>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050510] pt-14">
      <AuthHeader />

      <div className="relative z-10 w-full px-0 py-0">
        <div className="mt-4 flex items-center px-10">
          <button
            onClick={() => router.push("/")}
            className="font-mono text-xs text-offwhite/60 transition hover:text-offwhite"
          >
            ← try a different mood
          </button>
        </div>

        <div className="sprocket-divider my-4 mx-10" />

        {isLoading && !pendingQuestion && !results && (
          <ResultsLoadingState />
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
          <p className="mx-auto max-w-xl pb-4 text-center text-sm text-rose-400">
            {error}
          </p>
        )}
      </div>

      <style>{`
        .text-offwhite {
          color: #f5f0f0;
        }
        .text-offwhite\\/60 {
          color: rgba(245, 240, 240, 0.6);
        }
        .text-offwhite\\/80 {
          color: rgba(245, 240, 240, 0.8);
        }
        .text-marquee {
          color: #818cf8;
        }
        .text-marquee-light {
          color: #a5b4fc;
        }
      `}</style>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
}