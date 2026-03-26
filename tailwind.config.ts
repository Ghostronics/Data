import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#080c14",
          secondary: "#0d1220",
          card: "#111827",
          border: "#1e2a3e",
        },
        gex: {
          positive: "#00d68f",
          negative: "#ff4757",
          neutral: "#ffd32a",
        },
        accent: {
          blue: "#4fc3f7",
          purple: "#a78bfa",
          orange: "#fb923c",
        },
        text: {
          primary: "#e8f0fe",
          secondary: "#8fa3c4",
          muted: "#4a5a74",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
