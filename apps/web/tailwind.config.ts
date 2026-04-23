import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#ECEDEE",
          dim: "#B4B6BA",
          mute: "#7F8186",
          faint: "#4B4E55",
        },
        surface: {
          deep: "#06070B",
          DEFAULT: "#0A0B10",
          raised: "#10131A",
          elevated: "#161921",
          lift: "#1C2029",
          hi: "#242834",
        },
        rule: {
          subtle: "rgba(255,255,255,0.04)",
          DEFAULT: "rgba(255,255,255,0.07)",
          strong: "rgba(255,255,255,0.12)",
          brand: "rgba(130,89,239,0.28)",
          aqua: "rgba(34,211,238,0.22)",
        },
        brand: {
          DEFAULT: "#8259EF",
          bright: "#B494F7",
          dim: "#5D3FC4",
          glow: "rgba(130,89,239,0.35)",
        },
        aqua: {
          DEFAULT: "#22D3EE",
          bright: "#67E8F9",
          dim: "#0EA5C0",
          glow: "rgba(34,211,238,0.3)",
        },
        good: {
          DEFAULT: "#10B981",
          bright: "#34D399",
          dim: "#047857",
          glow: "rgba(16,185,129,0.3)",
        },
        warn: {
          DEFAULT: "#F59E0B",
          bright: "#FBBF24",
          dim: "#B45309",
          glow: "rgba(245,158,11,0.25)",
        },
        bad: {
          DEFAULT: "#F43F5E",
          bright: "#FB7185",
          dim: "#BE123C",
          glow: "rgba(244,63,94,0.25)",
        },
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 0 0 1px rgba(255,255,255,0.06)",
        elevated:
          "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px -24px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(130,89,239,0.35), 0 0 40px -4px rgba(130,89,239,0.35)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg,#8259EF 0%,#22D3EE 100%)",
        "gradient-fade":
          "linear-gradient(180deg,rgba(10,11,16,0) 0%,rgba(10,11,16,1) 100%)",
        "grid-dot":
          "radial-gradient(rgba(255,255,255,0.045) 1px,transparent 1px)",
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        pulseDot: "pulseDot 2s cubic-bezier(0.4,0,0.6,1) infinite",
        streak: "streak 1.8s linear infinite",
        rowEnter: "rowEnter 0.7s cubic-bezier(0.2,0.7,0.2,1) both",
        draw: "draw 1.1s cubic-bezier(0.2,0.7,0.2,1) both",
        shimmer: "shimmer 3s linear infinite",
        scanline: "scanline 8s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseDot: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(16,185,129,0.6)" },
          "50%": { boxShadow: "0 0 0 6px rgba(16,185,129,0)" },
        },
        streak: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "40%": { opacity: "1" },
          "100%": { transform: "translateX(180%)", opacity: "0" },
        },
        rowEnter: {
          "0%": {
            background: "rgba(34,211,238,0.10)",
            transform: "translateY(-6px)",
            opacity: "0",
          },
          "50%": { background: "rgba(34,211,238,0.08)", opacity: "1" },
          "100%": {
            background: "transparent",
            transform: "translateY(0)",
            opacity: "1",
          },
        },
        draw: {
          "0%": { strokeDashoffset: "var(--dasharray)" },
          "100%": { strokeDashoffset: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-220% 0" },
          "100%": { backgroundPosition: "220% 0" },
        },
        scanline: {
          "0%,100%": { transform: "translateY(0%)" },
          "50%": { transform: "translateY(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
