import type { MetadataRoute } from "next";
import { locales } from "@/i18n";

const BASE = "https://farboo.ai";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: `${BASE}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: locale === "fa" ? 1 : 0.9,
  }));
}
