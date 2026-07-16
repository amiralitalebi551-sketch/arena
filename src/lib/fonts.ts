import localFont from "next/font/local";

// فونت‌های self-hosted (WOFF2 subset). فایل‌ها در /public/fonts هستند و همه
// تحت مجوز SIL Open Font License 1.1 — به لیست asset در README مراجعه کنید.

// Fraunces — سِریف مدرن و باشخصیت برای تیترهای انگلیسی (حس editorial/آژانس خلاق).
export const display = localFont({
  src: [
    { path: "../../public/fonts/fraunces-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/fraunces-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/fraunces-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/fraunces-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

// Plus Jakarta Sans — sans تمیز و امروزی برای متن انگلیسی (ضدکلیشه‌ی Inter).
export const body = localFont({
  src: [
    { path: "../../public/fonts/plus-jakarta-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/plus-jakarta-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/plus-jakarta-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../public/fonts/plus-jakarta-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

// Vazirmatn — فونت اصلی فارسی برای کل رابط کاربری (RTL).
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
