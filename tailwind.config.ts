import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0C",      // near-black, cooler-neutral than warm — Netflix/Apple TV base
        raised: "#151517",    // card surfaces
        raised2: "#1F1F23",   // borders, chips
        marquee: "#C9A15C",   // single accent — champagne gold, used sparingly
        marquee2: "#A87F3E",  // hover/active state
        plum: "#4A4750",      // desaturated, near-neutral now
        foam: "#F2F2F0",      // primary text — soft white, not warm ivory
        muted: "#8A8A8F",     // secondary text — neutral gray, not purple-tinted
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-work-sans)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "marquee-glow":
          "radial-gradient(120% 120% at 50% 0%, rgba(201,161,92,0.06) 0%, rgba(10,10,12,0) 55%)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "95%": { opacity: "1" },
          "96%": { opacity: "0.85" }, // barely perceptible — a whisper, not a flicker
          "97%": { opacity: "1" },
        },
        spotlightWaver: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.96" },
        },
      },
      animation: {
        flicker: "flicker 10s ease-in-out infinite",
        spotlightWaver: "spotlightWaver 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;