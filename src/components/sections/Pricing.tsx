"use client";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useI18n } from "@/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function Pricing() {
  const { t, locale } = useI18n();
  const popular = locale === "fa" ? "محبوب‌ترین" : "Most popular";
  return (
    <section id="pricing" className="relative py-24 sm:py-32">
      <div className="container-content">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="eyebrow mb-5">{t.pricingHead.eyebrow}</p>
          <h2 className="heading-lg mb-4">{t.pricingHead.title}</h2>
          {t.pricingHead.body && <p className="text-ink-soft">{t.pricingHead.body}</p>}
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-3">
          {t.pricing.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <div
                className={cn(
                  "relative flex h-full flex-col rounded-2xl border p-8",
                  p.highlight ? "border-primary/50 bg-primary/[0.06] shadow-glow" : "border-white/[0.07] bg-white/[0.02]"
                )}
              >
                {p.highlight && (
                  <span className="absolute -top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white" style={{ insetInlineStart: "2rem" }}>
                    {popular}
                  </span>
                )}
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{p.tagline}</p>
                <div className="mt-6 flex items-end gap-1">
                  <span className="font-display text-4xl font-semibold">{p.price}</span>
                  <span className="mb-1 text-ink-soft">{p.period}</span>
                </div>
                <ul className="mt-6 flex-1 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm text-ink-soft">
                      <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path d="m5 10 3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <MagneticButton href="#final-cta" variant={p.highlight ? "primary" : "secondary"} className="w-full" ariaLabel={`${p.cta} — ${p.name}`}>
                    {p.cta}
                  </MagneticButton>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
