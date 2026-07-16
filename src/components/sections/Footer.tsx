"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

const EMAIL = "hello@farboo.ai";

export function Footer() {
  const { t, locale } = useI18n();
  const year = new Date().getFullYear();
  const yearLabel =
    locale === "fa"
      ? (year - 621).toLocaleString("fa-IR", { useGrouping: false })
      : String(year);

  const companyHrefs = ["#work", "#work", "#faq", `mailto:${EMAIL}`];

  return (
    <footer className="relative z-10 border-t border-white/[0.07] bg-base-900">
      <div className="container-content py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link href={`/${locale}`} className="flex items-center gap-2 font-display text-lg font-semibold">
              <span className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent" aria-hidden="true" />
              {t.brand.name}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-soft">{t.footer.blurb}</p>
            <a href={`mailto:${EMAIL}`} className="mt-4 inline-block text-sm text-accent hover:underline" dir="ltr">{EMAIL}</a>
          </div>

          <nav aria-label={t.footer.productHead}>
            <h3 className="mb-4 text-sm font-medium text-ink">{t.footer.productHead}</h3>
            <ul className="space-y-3 text-sm text-ink-soft">
              {t.nav.map((n) => (
                <li key={n.href}><a href={n.href} className="hover:text-ink">{n.label}</a></li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.footer.companyHead}>
            <h3 className="mb-4 text-sm font-medium text-ink">{t.footer.companyHead}</h3>
            <ul className="space-y-3 text-sm text-ink-soft">
              {t.footer.company.map((c, i) => (
                <li key={c}><a href={companyHrefs[i]} className="hover:text-ink">{c}</a></li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.footer.followHead}>
            <h3 className="mb-4 text-sm font-medium text-ink">{t.footer.followHead}</h3>
            <ul className="space-y-3 text-sm text-ink-soft">
              {t.social.map((s) => (
                <li key={s.label}><a href={s.href} className="hover:text-ink" rel="noopener noreferrer" target="_blank">{s.label}</a></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-8 text-sm text-ink-faint sm:flex-row">
          <p>© {yearLabel} {t.brand.name}. {t.footer.rights}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink-soft">{t.footer.privacy}</a>
            <a href="#" className="hover:text-ink-soft">{t.footer.terms}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
