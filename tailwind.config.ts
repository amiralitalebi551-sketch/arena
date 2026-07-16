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
          DEFAULT: "#0C0D0C",
          900: "#0C0D0C",
          800: "#131513",
          700: "#1B1E1B",
          600: "#252925",
        },
        primary: {
          DEFAULT: "#1F9D6B",
          400: "#3FCF8E",
          500: "#1F9D6B",
          600: "#178055",
        },
        accent: {
          DEFAULT: "#3FCF8E",
          400: "#5CE0A5",
          500: "#3FCF8E",
        },
        warm: "#C9A96A",
        ink: {
          DEFAULT: "#EDE6D6",
          soft: "#A7A99C",
          faint: "#6E7268",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1200px",
      },
      // مقیاس فاصله‌ی هدفمند بر پایه‌ی ریتم ۴px و پرش‌های هارمونیک.
      // چرا؟ مقیاس منظم (نه اعداد دلخواه) به اصل Gestalt/Proximity کمک می‌کند:
      // چشم گروه‌بندی عناصر مرتبط را راحت‌تر تشخیص می‌دهد.
      spacing: {
        "section": "clamp(5rem, 10vw, 8rem)", // فاصله‌ی عمودی سکشن‌ها (ریتم واحد)
        "gutter": "clamp(1.25rem, 4vw, 2rem)", // حاشیه‌ی افقی صفحه
      },
      borderRadius: {
        card: "1rem",
        pill: "9999px",
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
        glow: "0 0 40px -8px rgba(31,157,107,0.45)",
        "glow-accent": "0 0 40px -8px rgba(63,207,142,0.4)",
      },
    },
  },
  plugins: [],
};
export default config;
