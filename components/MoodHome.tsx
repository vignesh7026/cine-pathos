"use client";

import { useState } from "react";
import MoodInput from "@/components/MoodInput";
import AuthHeader from "@/components/AuthHeader";
import MagicRings from "@/components/MagicRings";

export default function MoodHome() {
  const [isNavigating, setIsNavigating] = useState(false);

  function handleSubmit(message: string) {
    if (!message.trim()) return;
    setIsNavigating(true);
    window.location.href = `/results?mood=${encodeURIComponent(message)}`;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* MagicRings background – light purple */}
      <div className="absolute inset-0">
        <MagicRings
          color="#C084FC"          // light purple
          colorTwo="#A78BFA"       // soft violet
          ringCount={7}
          speed={1}
          attenuation={10}
          lineThickness={2}
          baseRadius={0.35}
          radiusStep={0.1}
          scaleRate={0.1}
          opacity={0.95}
          blur={0}
          noiseAmount={0.05}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={true}
          mouseInfluence={0.15}
          hoverScale={1.2}
          parallax={0.05}
          clickBurst={true}
        />
      </div>

      {/* Your existing components – unchanged */}
      <AuthHeader />
      <MoodInput onSubmit={handleSubmit} isLoading={isNavigating} />

      {/* Text contrast – off‑white colour, no layout changes */}
      <style>{`
        /* All text inside main (except the background canvas) – off‑white */
        main > *:not(.absolute) {
          color: #f5f0f0 !important;
          text-shadow: 0 0 20px rgba(0,0,0,0.6);
        }
        main input {
          color: #f5f0f0 !important;
        }
        main input::placeholder {
          color: rgba(245, 240, 240, 0.6) !important;
        }
        main button {
          color: #f5f0f0 !important;
        }
        main h1, main h2, main h3, main p, main span, main label {
          color: #f5f0f0 !important;
        }
        /* optional: keep font weights as desired */
        main h1, main h2, main h3 {
          font-weight: 700 !important;
        }
        main p, main span, main label {
          font-weight: 500 !important;
        }
      `}</style>
    </main>
  );
} 