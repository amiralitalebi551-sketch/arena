import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0A0B14",
          900: "#0A0B14",
          800: "#10121F",
          700: "#171A2B",
          600: "#1F2338",
        },
        primary: {
          DEFAULT: "#6D5EF6",
          400: "#8B7FF9",
          500: "#6D5EF6",
          600: "#5A4CE0",
        },
        accent: {
          DEFAULT: "#22D3EE",
          400: "#4FDDF2",
          500: "#22D3EE",
        },
        warm: "#F5A97F",
        ink: {
          DEFAULT: "#E7E9F2",
          soft: "#9AA0B5",
          faint: "#646A82",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1200px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(109,94,246,0.5)",
        "glow-accent": "0 0 40px -8px rgba(34,211,238,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
