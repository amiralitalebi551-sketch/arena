"use client";
import { useEffect } from "react";
import type { Locale } from "@/i18n";

/**
 * صفت‌های lang و dir را روی عنصر <html> با زبان فعلی هماهنگ می‌کند.
 * چون در static export ریشه‌ی <html> مقدار پیش‌فرض دارد، این کامپوننت هنگام
 * دیدن صفحه‌ی /en (LTR) یا /fa (RTL) مقدار درست را ست می‌کند.
 */
export function LocaleHtmlAttrs({
  locale,
  dir,
}: {
  locale: Locale;
  dir: "rtl" | "ltr";
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);
  return null;
}
