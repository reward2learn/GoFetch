import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e8f1ed",
          100: "#d1e3db",
          200: "#a3c7b7",
          300: "#2A5A4A",
          400: "#234d3f",
          500: "#1c4034",
          600: "#153329",
          primary: "#2A5A4A",
        },
        secondary: {
          300: "#C97A5E",
          400: "#b56a4e",
          500: "#a15a3e",
        },
        surface: {
          0: "#FCFBFA",
          1: "#FFFFFF",
          2: "#F8F7F5",
          tertiary: "#F2F0ED",
        },
        border: "#E5E3DF",
        muted: "#6B7280",
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', "sans-serif"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
        "3xl": "48px",
      },
      borderRadius: {
        sm: "6px",
        md: "12px",
        lg: "20px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
} satisfies Config;
