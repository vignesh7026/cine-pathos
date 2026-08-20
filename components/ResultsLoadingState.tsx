"use client";

import { useEffect, useState } from "react";
import MagicRings from "@/components/MagicRings";

const LOADING_PHRASES = [
  "reading the room…",
  "interpreting your mood…",
  "scanning curated cinema…",
  "matching Indian & global titles…",
  "polishing the marquee…",
];

export default function ResultsLoadingState() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 2200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center py-12 px-4">
      {/* Centered Three.js MagicRings loading display */}
      <div className="relative flex h-80 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a18]/80 shadow-[0_0_50px_rgba(99,102,241,0.15)] backdrop-blur-xl">
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-90 pointer-events-none">
          <MagicRings
            color="#fc42ff"
            colorTwo="#42fcff"
            ringCount={7}
            speed={1.4}
            baseRadius={0.25}
            radiusStep={0.08}
            scaleRate={0.14}
            lineThickness={2.5}
            opacity={0.95}
            followMouse={true}
            mouseInfluence={0.15}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-400/40 shadow-[0_0_30px_rgba(99,102,241,0.6)]">
            <svg className="h-7 w-7 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h18M3 16h18" />
            </svg>
          </div>

          <h2 className="font-mono text-base tracking-[0.25em] uppercase text-indigo-300 font-bold drop-shadow-[0_0_12px_rgba(129,140,248,0.8)] animate-pulse">
            {LOADING_PHRASES[phraseIndex]}
          </h2>
          <p className="mt-2 text-xs tracking-wider text-white/50 font-mono">
            curating your personalized movie recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
