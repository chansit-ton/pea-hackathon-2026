/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Kanit", "Noto Sans Thai", "Inter", "Tahoma", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        // Neutral ramp re-tinted to the violet design's purple-grays.
        // Existing `slate-*` classes app-wide pick this up automatically.
        slate: {
          50: "#FAF9FD",
          100: "#F4F2FA",
          200: "#E7E2F1",
          300: "#CFC8E0",
          400: "#9B95B0",
          500: "#7B7591",
          600: "#5A5470",
          700: "#3F3A57",
          800: "#2A2540",
          900: "#1C1830",
          950: "#13101D",
        },
        // Brand primary remapped from blue → violet (violet-700 = #6D28D9,
        // the design's primary). Every existing `blue-*` becomes on-brand violet.
        blue: {
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(28, 23, 48, 0.04), 0 14px 30px -22px rgba(28, 23, 48, 0.28)",
        "soft-lg": "0 2px 4px rgba(28, 23, 48, 0.05), 0 24px 48px -28px rgba(28, 23, 48, 0.32)",
      },
      backgroundImage: {
        "sidebar-violet": "linear-gradient(168deg, #4A148C 0%, #330C66 52%, #2A0A52 100%)",
        "brand-violet": "linear-gradient(140deg, #8B2FE6 0%, #B51C9E 52%, #E84AA0 100%)",
        "kpi-violet": "linear-gradient(140deg, #5B21B6 0%, #A41CA8 100%)",
      },
    },
  },
  plugins: [],
};
