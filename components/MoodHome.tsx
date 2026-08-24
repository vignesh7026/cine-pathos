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
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#020512" }}>
      {/* Navy blue deep background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% -5%, rgba(99,102,241,0.18) 0%, rgba(2,5,18,0) 65%), " +
            "radial-gradient(ellipse 60% 40% at 80% 90%, rgba(139,92,246,0.08) 0%, transparent 55%)",
        }}
      />

      {/* Animated rings — indigo/violet navy */}
      <div className="absolute inset-0">
        <MagicRings
          color="#6366f1"
          colorTwo="#818cf8"
          ringCount={7}
          speed={0.85}
          attenuation={12}
          lineThickness={1.5}
          baseRadius={0.32}
          radiusStep={0.1}
          scaleRate={0.08}
          opacity={0.7}
          blur={0}
          noiseAmount={0.04}
          rotation={0}
          ringGap={1.5}
          fadeIn={0.7}
          fadeOut={0.5}
          followMouse={true}
          mouseInfluence={0.12}
          hoverScale={1.15}
          parallax={0.04}
          clickBurst={true}
        />
      </div>

      <AuthHeader />
      <MoodInput onSubmit={handleSubmit} isLoading={isNavigating} />
    </main>
  );
}