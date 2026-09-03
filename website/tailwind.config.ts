import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Primary — Deep Teal */
        primary: {
          DEFAULT: "var(--app-primary)",
          hover: "var(--app-primary-hover)",
          active: "var(--app-primary-active)",
          on: "var(--app-text-on-primary)",
        },
        /* Secondary — Warm Terracotta */
        secondary: {
          DEFAULT: "var(--app-secondary)",
          hover: "var(--app-secondary-hover)",
          on: "var(--app-text-on-secondary)",
        },
        /* Surface system */
        surface: {
          0: "var(--app-surface-0)",
          1: "var(--app-surface-1)",
          2: "var(--app-surface-2)",
          3: "var(--app-surface-3)",
          hover: "var(--app-hover)",
          "hover-strong": "var(--app-hover-strong)",
        },
        /* Text */
        "app-text": {
          DEFAULT: "var(--app-text)",
          secondary: "var(--app-text-secondary)",
          muted: "var(--app-text-muted)",
          disabled: "var(--app-text-disabled)",
        },
        /* Borders */
        border: {
          DEFAULT: "var(--app-border)",
          strong: "var(--app-border-strong)",
          focus: "var(--app-border-focus)",
        },
        /* Status */
        success: {
          bg: "var(--app-success-bg)",
          DEFAULT: "var(--app-success-text)",
          border: "var(--app-success-border)",
        },
        error: {
          bg: "var(--app-error-bg)",
          DEFAULT: "var(--app-error-text)",
          border: "var(--app-error-border)",
        },
        warning: {
          bg: "var(--app-warning-bg)",
          DEFAULT: "var(--app-warning-text)",
          border: "var(--app-warning-border)",
        },
        info: {
          bg: "var(--app-info-bg)",
          DEFAULT: "var(--app-info-text)",
          border: "var(--app-info-border)",
        },
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
