import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06090d",
        panel: "#0c1218",
        elevated: "#121a22",
        line: "#1c2c36",
        teal: "#2ee6c5",
        lagoon: "#7ae2cf",
        amber: "#ffb020",
        danger: "#ff5c6a",
        mute: "#8b97a8",
        paper: "#e8eef6",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-syne)", "ui-sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace"],
      },
      boxShadow: {
        glow: "0 0 40px rgba(46, 230, 197, 0.16)",
        hud: "0 18px 50px rgba(0, 0, 0, 0.45)",
      },
      borderRadius: {
        hud: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
