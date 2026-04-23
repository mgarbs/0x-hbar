import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#F4F4F8",
          dim: "#B8B8C7",
          mute: "#7A7A8E",
          faint: "#4A4A5A",
        },
        surface: {
          deep: "#07070B",
          DEFAULT: "#0B0B12",
          raised: "#11111B",
          elevated: "#181824",
          lift: "#20202E",
        },
        rule: {
          subtle: "rgba(255,255,255,0.04)",
          DEFAULT: "rgba(255,255,255,0.07)",
          strong: "rgba(255,255,255,0.14)",
          brand: "rgba(130,89,239,0.28)",
          cyan: "rgba(34,211,238,0.25)",
        },
        brand: {
          DEFAULT: "#8259EF",
          bright: "#A78BF0",
          dim: "#5D3FC4",
          glow: "rgba(130,89,239,0.35)",
          ink: "#2A1B5A",
        },
        aqua: {
          DEFAULT: "#22D3EE",
          bright: "#67E8F9",
          dim: "#0EA5C0",
          glow: "rgba(34,211,238,0.3)",
        },
        good: {
          DEFAULT: "#10D9A3",
          dim: "#0BA884",
          glow: "rgba(16,217,163,0.28)",
        },
        warn: {
          DEFAULT: "#FFC857",
          dim: "#C8993D",
          glow: "rgba(255,200,87,0.25)",
        },
        bad: {
          DEFAULT: "#FF5370",
          dim: "#D23B57",
          glow: "rgba(255,83,112,0.28)",
        },
      },
      letterSpacing: {
        "tightest": "-0.04em",
        "very-wide": "0.2em",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(130,89,239,0.4), 0 12px 40px -8px rgba(130,89,239,0.35)",
        subtle: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.05)",
        lift: "0 1px 0 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.07), 0 24px 48px -24px rgba(0,0,0,0.6)",
      },
      backgroundImage: {
        "grid-dot": `radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)`,
        "brand-gradient":
          "linear-gradient(135deg,#8259EF 0%,#6236E1 50%,#22D3EE 140%)",
        "hero-glow":
          "radial-gradient(ellipse 80% 60% at 50% 0%,rgba(130,89,239,0.25),rgba(34,211,238,0.04) 35%,transparent 70%)",
      },
      animation: {
        pulse: "pulseDot 2.2s cubic-bezier(0.4,0,0.6,1) infinite",
        ticker: "tickerIn 0.9s cubic-bezier(0.2,0.8,0.2,1) both",
        shimmer: "shimmer 2.4s linear infinite",
        sweep: "sweep 3s ease-in-out infinite",
      },
      keyframes: {
        pulseDot: {
          "0%,100%": { transform: "scale(1)", opacity: "0.9" },
          "50%": { transform: "scale(1.35)", opacity: "0.45" },
        },
        tickerIn: {
          "0%": {
            opacity: "0",
            transform: "translateY(-6px)",
            boxShadow: "0 0 0 1px rgba(130,89,239,0.55)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.07)",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        sweep: {
          "0%,100%": { transform: "translateX(-8%)", opacity: "0.5" },
          "50%": { transform: "translateX(8%)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
