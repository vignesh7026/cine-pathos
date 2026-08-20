"use client";

import { useEffect, useRef, useState, FormEvent } from "react";

interface MoodInputProps {
  onSubmit: (mood: string) => void;
  isLoading: boolean;
}

const EXAMPLE_MOODS = [
  "feeling low, want something feel-good",
  "rainy Sunday, need a slow burn",
  "just got dumped, comedy only",
  "can't sleep, something weird and hypnotic",
];

interface TimeCopy {
  eyebrow: string;
  headline: string;
}

// Client-local time only — the server has no idea what time it is where
// the user actually is, so this is computed after mount in a useEffect
// rather than during render (avoids an SSR/hydration mismatch that would
// otherwise show one headline briefly, then swap to another on load).
function getTimeCopy(hour: number): TimeCopy {
  if (hour >= 5 && hour < 12) {
    return { eyebrow: "now showing", headline: "What's this morning's mood?" };
  }
  if (hour >= 12 && hour < 17) {
    return {
      eyebrow: "now showing",
      headline: "What's this afternoon's mood?",
    };
  }
  if (hour >= 17 && hour < 21) {
    return { eyebrow: "now showing", headline: "What's tonight's mood?" };
  }
  // 21:00–04:59 — late night / can't-sleep window
  return { eyebrow: "still up?", headline: "What's keeping you awake?" };
}

const DEFAULT_COPY: TimeCopy = {
  eyebrow: "now showing",
  headline: "What's tonight's mood?",
};

// Minimal shape of the Web Speech API we actually use — avoids pulling in
// a full @types/dom-speech-recognition dependency for a handful of fields.
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export default function MoodInput({ onSubmit, isLoading }: MoodInputProps) {
  const [value, setValue] = useState("");
  const [copy, setCopy] = useState<TimeCopy>(DEFAULT_COPY);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseValueRef = useRef(""); // text already in the box before this recording started

  // Spotlight: rAF-throttled, driven through CSS custom props on the
  // section ref — never touches React state, so mousemove can't
  // trigger a re-render of the form/input below it.
  const fieldRef = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    setCopy(getTimeCopy(new Date().getHours()));
  }, []);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--x", `${x}%`);
        el.style.setProperty("--y", `${y}%`);
        frame.current = null;
      });
    };

    const handleLeave = () => {
      el.style.setProperty("--x", `50%`);
      el.style.setProperty("--y", `0%`);
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  // Set up speech recognition once, client-side only. Safari/Chrome expose
  // it as webkitSpeechRecognition; Firefox currently doesn't support it at
  // all, hence the feature check driving whether the mic button renders.
  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setVoiceSupported(false);
      return;
    }
    setVoiceSupported(true);

    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const separator = baseValueRef.current.trim() ? " " : "";
      setValue(baseValueRef.current + separator + transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
    };
  }, []);

  function toggleListening() {
    if (isLoading || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    baseValueRef.current = value;
    setIsListening(true);
    recognitionRef.current.start();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    if (isListening) recognitionRef.current?.stop();
    onSubmit(value.trim());
  }

  return (
    <section
      ref={fieldRef}
      className="spotlight-field animate-spotlightWaver relative overflow-hidden bg-marquee-glow px-6 pb-20 pt-28 sm:pt-36"
    >
      <div className="relative z-[2] mx-auto max-w-2xl text-center">
        <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.25em] text-marquee/70">
          {copy.eyebrow}
        </p>
        <h1 className="animate-flicker font-display text-4xl italic leading-tight tracking-tight text-foam sm:text-5xl">
          {copy.headline}
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted">
          No genres to pick. No dropdowns. Just tell it how you feel — an
          agent works out the rest.
        </p>

        <form onSubmit={handleSubmit} className="mt-12">
          <label htmlFor="mood" className="sr-only">
            Describe your mood
          </label>
          <div className="glass-panel flex flex-col gap-3 rounded-2xl p-2 sm:flex-row">
            <input
              id="mood"
              name="mood"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                isListening
                  ? "Listening…"
                  : "e.g. feeling low, want something feel-good"
              }
              className="w-full flex-1 bg-transparent px-4 py-3 text-base text-foam placeholder:text-muted/50 focus:outline-none"
              disabled={isLoading}
            />

            {voiceSupported && (
              <button
                type="button"
                onClick={toggleListening}
                disabled={isLoading}
                aria-pressed={isListening}
                aria-label={isListening ? "Stop voice input" : "Speak your mood"}
                title={isListening ? "Stop voice input" : "Speak your mood"}
                className={`flex items-center justify-center rounded-xl border px-4 py-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marquee disabled:cursor-not-allowed disabled:opacity-40 ${
                  isListening
                    ? "border-marquee bg-marquee text-void"
                    : "border-raised2 text-muted hover:border-marquee/40 hover:text-foam"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isListening ? "animate-pulse" : ""}
                >
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !value.trim()}
              className="rounded-xl border border-marquee bg-marquee/15 px-6 py-3 font-body text-sm font-semibold text-marquee transition hover:bg-marquee hover:text-void focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marquee disabled:border-raised2 disabled:bg-transparent disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted disabled:cursor-not-allowed"
            >
              {isLoading ? "Thinking…" : "Find a movie"}
            </button>
          </div>
        </form>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {EXAMPLE_MOODS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => !isLoading && onSubmit(example)}
              disabled={isLoading}
              className="rounded-full border border-raised2 px-3.5 py-1.5 text-xs text-muted transition hover:border-marquee/40 hover:text-foam disabled:cursor-not-allowed disabled:opacity-40"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}