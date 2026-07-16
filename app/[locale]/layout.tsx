import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, isLocale, locales, dirOf, type Locale } from "@/i18n";
import { I18nProvider } from "@/i18n/I18nProvider";
import { LocaleHtmlAttrs } from "@/components/ui/LocaleHtmlAttrs";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const t = getDictionary(params.locale);
  const base = "https://farboo.ai";
  return {
    title: { default: t.meta.title, template: `%s · ${t.brand.name}` },
    description: t.meta.description,
    keywords: t.meta.keywords,
    alternates: {
      canonical: `${base}/${params.locale}`,
      languages: { fa: `${base}/fa`, en: `${base}/en` },
    },
    openGraph: {
      type: "website",
      url: `${base}/${params.locale}`,
      title: t.meta.ogTitle,
      description: t.meta.description,
      siteName: t.brand.name,
      locale: params.locale === "fa" ? "fa_IR" : "en_US",
      images: [{ url: "/og.svg", width: 1200, height: 630, alt: t.brand.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: t.meta.ogTitle,
      description: t.meta.description,
      images: ["/og.svg"],
    },
  };
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(params.locale)) notFound();
  const locale: Locale = params.locale;
  const dir = dirOf(locale);
  const t = getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t.brand.name,
    alternateName: t.brand.nameLatin,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: t.meta.description,
    url: `https://farboo.ai/${locale}`,
    offers: { "@type": "Offer", price: "49", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: t.brand.name, url: "https://farboo.ai" },
  };

  return (
    <I18nProvider locale={locale} dir={dir} dict={t}>
      {/*
        اسکریپت inline که پیش از paint، lang/dir را روی <html> ست می‌کند.
        چون در static export ریشه‌ی <html> مقدار پیش‌فرض (fa/rtl) دارد، این
        اسکریپت برای /en بلافاصله dir=ltr را اعمال می‌کند (بدون FOUC).
        LocaleHtmlAttrs هم برای ناوبری client-side بین زبان‌ها sync می‌ماند.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(
            locale
          )};document.documentElement.dir=${JSON.stringify(dir)};`,
        }}
      />
      <LocaleHtmlAttrs locale={locale} dir={dir} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-base-900"
        style={dir === "rtl" ? { right: "1rem" } : { left: "1rem" }}
      >
        {t.ui.skip}
      </a>
      {children}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd)
            .replace(/</g, "\\u003c")
            .replace(/>/g, "\\u003e")
            .replace(/&/g, "\\u0026"),
        }}
      />
    </I18nProvider>
  );
}
