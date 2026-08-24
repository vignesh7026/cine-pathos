import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ultra dark blue near black palette
        void:    "#020512",
        raised:  "#05091a",
        raised2: "#080d24",
        navy:    "#020512",
        "navy-mid": "#05091a",
        "navy-raised": "#080d24",
        // Accent — indigo/violet
        marquee:  "#6366f1",
        marquee2: "#4f46e5",
        "marquee-light": "#818cf8",
        // Legacy warm gold kept for any leftover refs
        amber:   "#c9a15c",
        plum:    "#4a4750",
        // Text
        foam:    "#eef2ff",
        muted:   "#7b8ab8",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body:    ["var(--font-work-sans)", "sans-serif"],
        mono:    ["var(--font-jetbrains)", "monospace"],
      },
      backgroundImage: {
        "marquee-glow":
          "radial-gradient(120% 120% at 50% 0%, rgba(99,102,241,0.08) 0%, rgba(2,5,18,0) 55%)",
        "navy-glow":
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.15) 0%, rgba(2,5,18,0) 60%)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "95%":  { opacity: "1" },
          "96%":  { opacity: "0.88" },
          "97%":  { opacity: "1" },
        },
        spotlightWaver: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.96" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-6px)" },
        },
      },
      animation: {
        flicker:        "flicker 10s ease-in-out infinite",
        spotlightWaver: "spotlightWaver 6s ease-in-out infinite",
        shimmer:        "shimmer 1.5s infinite linear",
        float:          "float 3s ease-in-out infinite",
      },
      boxShadow: {
        "navy-glow": "0 0 24px rgba(99,102,241,0.35), 0 4px 16px rgba(0,0,0,0.4)",
        "navy-glow-lg": "0 0 40px rgba(99,102,241,0.5), 0 8px 24px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};
export default config;