import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // پس‌زمینه‌ها — تیره‌ی مطمئن
        base: {
          DEFAULT: "#0B0F14",
          900: "#0B0F14",
          800: "#111720",
          700: "#182029",
          600: "#222C37",
        },
        // رنگ اصلی برند — سبز زمردی خوانا
        primary: {
          DEFAULT: "#34D399",
          400: "#4ADE9E",
          500: "#34D399",
          600: "#10B981",
        },
        accent: {
          DEFAULT: "#34D399",
          400: "#6EE7B7",
        },
        // متن
        ink: {
          DEFAULT: "#F2F5F7",
          soft: "#9BA7B4",
          faint: "#5B6673",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1160px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        "spin-slow": "spin-slow 40s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
