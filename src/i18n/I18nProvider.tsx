"use client";
import { createContext, useContext } from "react";
import type { Dictionary, Locale } from "./types";

interface I18nValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dictionary;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  dir,
  dict,
  children,
}: {
  locale: Locale;
  dir: "rtl" | "ltr";
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, dir, t: dict }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
