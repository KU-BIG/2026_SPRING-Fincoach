import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Pretendard Variable", "Pretendard", "Inter", "system-ui", "sans-serif"],
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
        xs: "6px",
        sm: "8px",
        md: "10px",
        lg: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,20,25,0.04), 0 1px 3px rgba(15,20,25,0.06)",
        hover: "0 2px 4px rgba(15,20,25,0.06), 0 6px 18px rgba(15,20,25,0.08)",
        modal: "0 12px 32px rgba(15,20,25,0.18)",
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
