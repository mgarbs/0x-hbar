import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "hsl(222 27% 7%)",
        panel: "hsl(222 20% 10%)",
        panel2: "hsl(222 18% 13%)",
        border: "hsl(222 12% 22%)",
        text: "hsl(210 20% 94%)",
        muted: "hsl(215 15% 60%)",
        brand: "hsl(262 83% 62%)",
        brand2: "hsl(189 90% 55%)",
        success: "hsl(142 70% 45%)",
        warning: "hsl(38 92% 55%)",
        danger: "hsl(0 82% 62%)",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px hsl(262 83% 62% / 0.35), 0 8px 30px -10px hsl(262 83% 62% / 0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
