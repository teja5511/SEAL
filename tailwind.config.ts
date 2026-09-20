import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#061018",
        panel: "#0b1520",
        elevated: "#10202c",
        line: "#1a3344",
        teal: "#2ee6c5",
        lagoon: "#7ad4ff",
        amber: "#ffb020",
        danger: "#ff4d62",
        mute: "#8aa0b5",
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
        hud: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
