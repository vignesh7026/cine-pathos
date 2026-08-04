"use client";

import { useState, FormEvent } from "react";

interface ClarifyingQuestionProps {
  question: string;
  onAnswer: (answer: string) => void;
  isLoading: boolean;
}

export default function ClarifyingQuestion({
  question,
  onAnswer,
  isLoading,
}: ClarifyingQuestionProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onAnswer(value.trim());
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="rounded-2xl border border-plum/40 bg-raised/60 p-6">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-plum">
          one quick thing
        </p>
        <p className="mt-2 font-display text-xl italic text-foam">
          {question}
        </p>
        <form onSubmit={handleSubmit} className="mt-5 flex gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Your answer…"
            className="w-full flex-1 rounded-xl border border-raised2 bg-void/60 px-4 py-2.5 text-sm text-foam placeholder:text-muted/60 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-marquee"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !value.trim()}
            className="rounded-xl bg-plum px-5 py-2.5 text-sm font-semibold text-foam transition hover:bg-plum/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "…" : "Reply"}
          </button>
        </form>
      </div>
    </div>
  );
}
