import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "Inter", "system-ui", "sans-serif"],
        serif: ["\"Noto Serif KR\"", "Source Serif Pro", "Georgia", "serif"],
        num: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          muted: "var(--bg-muted)",
        },
        fg: {
          primary: "var(--fg-primary)",
          secondary: "var(--fg-secondary)",
          muted: "var(--fg-muted)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          fg: "var(--accent-fg)",
        },
        positive: "var(--positive)",
        negative: "var(--negative)",
        warn: "var(--warn)",
        info: "var(--info)",
      },
      borderRadius: {
        xs: "2px",
        sm: "3px",
        md: "4px",
        lg: "6px",
      },
      boxShadow: {
        card: "none",
        hover: "0 1px 2px rgba(31,22,18,0.06)",
        modal: "0 8px 24px rgba(31,22,18,0.18)",
      },
      transitionTimingFunction: {
        fc: "cubic-bezier(0.2, 0, 0.1, 1)",
      },
      transitionDuration: {
        DEFAULT: "180ms",
      },
    },
  },
  plugins: [],
} satisfies Config;
