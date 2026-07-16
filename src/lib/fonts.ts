import localFont from "next/font/local";

// Self-hosted fonts (WOFF2 subset). Files live in /public/fonts and are
// licensed under the SIL Open Font License 1.1 — see README asset list.

// Space Grotesk — used for Latin display accents.
export const display = localFont({
  src: [
    { path: "../../public/fonts/space-grotesk-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/space-grotesk-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/space-grotesk-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// Inter — Latin body fallback.
export const body = localFont({
  src: [
    { path: "../../public/fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// Vazirmatn — primary Persian/Farsi typeface for the whole (RTL) UI.
export const farsi = localFont({
  src: [
    { path: "../../public/fonts/vazirmatn-arabic-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/vazirmatn-arabic-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/vazirmatn-arabic-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/vazirmatn-arabic-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-farsi",
  display: "swap",
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});
