import { fa } from "./fa";
import { en } from "./en";
import type { Dictionary, Locale } from "./types";

const dictionaries: Record<Locale, Dictionary> = { fa, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export * from "./types";
