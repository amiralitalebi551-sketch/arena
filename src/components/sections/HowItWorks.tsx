"use client";
import { Reveal } from "@/components/ui/Reveal";
import { useI18n } from "@/i18n/I18nProvider";

export function HowItWorks() {
  const { t } = useI18n();
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-content">
        <Reveal className="mb-16 max-w-2xl">
          <p className="eyebrow mb-5">{t.stepsHead.eyebrow}</p>
          <h2 className="heading-lg">{t.stepsHead.title}</h2>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.08}>
              <div className="card h-full">
                <span className="font-display text-4xl font-semibold text-white/10">{s.n}</span>
                <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
