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

function getTimeCopy(hour: number): TimeCopy {
  if (hour >= 5 && hour < 12)
    return { eyebrow: "now showing", headline: "What's this morning's mood?" };
  if (hour >= 12 && hour < 17)
    return { eyebrow: "now showing", headline: "What's this afternoon's mood?" };
  if (hour >= 17 && hour < 21)
    return { eyebrow: "now showing", headline: "What's tonight's mood?" };
  return { eyebrow: "still up?", headline: "What's keeping you awake?" };
}

const DEFAULT_COPY: TimeCopy = {
  eyebrow: "now showing",
  headline: "What's tonight's mood?",
};

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
  const [isFocused, setIsFocused] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const baseValueRef = useRef("");
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

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) { setVoiceSupported(false); return; }
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
      const sep = baseValueRef.current.trim() ? " " : "";
      setValue(baseValueRef.current + sep + transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
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
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); return; }
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
      ref={fieldRef as any}
      className="spotlight-field animate-spotlightWaver relative overflow-hidden bg-marquee-glow px-6 pb-20 pt-28 sm:pt-36"
    >
      <div className="relative z-[2] mx-auto max-w-2xl text-center">
        {/* Eyebrow */}
        <p className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.28em]"
           style={{ color: "rgba(129,140,248,0.7)" }}>
          {copy.eyebrow}
        </p>

        {/* Headline */}
        <h1 className="animate-flicker font-display text-4xl italic leading-tight tracking-tight sm:text-5xl"
            style={{ color: "#eef2ff" }}>
          {copy.headline}
        </h1>

        {/* Subtext */}
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed"
           style={{ color: "rgba(180,190,240,0.65)" }}>
          No genres to pick. No dropdowns. Just tell it how you feel — an
          agent works out the rest.
        </p>

        {/* Aura-style search form */}
        <form onSubmit={handleSubmit} className="mt-10">
          <label htmlFor="mood" className="sr-only">Describe your mood</label>

          {/* Gradient-border input wrapper */}
          <div className={`aura-input-wrap transition-all duration-300 ${isFocused ? "scale-[1.01]" : ""}`}>
            <div className="aura-input-inner">
              {/* Text input */}
              <input
                id="mood"
                name="mood"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isListening ? "Listening…" : "e.g. feeling low, want something feel-good"}
                className="aura-input"
                disabled={isLoading}
                autoComplete="off"
              />

              {/* Mic button */}
              {voiceSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading}
                  aria-pressed={isListening}
                  aria-label={isListening ? "Stop voice input" : "Speak your mood"}
                  style={{
                    padding: "10px 14px",
                    background: isListening
                      ? "rgba(99,102,241,0.3)"
                      : "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "10px",
                    margin: "4px",
                    transition: "all 0.2s ease",
                    color: isListening ? "#818cf8" : "rgba(150,165,220,0.5)",
                    flexShrink: 0,
                  }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                       className={isListening ? "animate-pulse" : ""}>
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8"  y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              )}

              {/* Aura primary submit button */}
              <button
                type="submit"
                disabled={isLoading || !value.trim()}
                className="aura-btn aura-btn-primary"
                style={{ margin: "5px", borderRadius: "10px", padding: "10px 20px", flexShrink: 0 }}
              >
                {isLoading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      width: 14, height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      animation: "spin 0.7s linear infinite",
                    }} />
                    Thinking…
                  </span>
                ) : "Find a movie"}
              </button>
            </div>
          </div>
        </form>

        {/* Example mood pills */}
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {EXAMPLE_MOODS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => !isLoading && onSubmit(example)}
              disabled={isLoading}
              className="aura-btn"
              style={{
                padding: "6px 14px",
                fontSize: "0.78rem",
                borderRadius: "999px",
                fontWeight: 400,
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </section>
  );
}