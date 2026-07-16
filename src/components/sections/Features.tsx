"use client";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { useI18n } from "@/i18n/I18nProvider";

export function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="section relative">
      <div className="container-content">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="eyebrow mb-5">{t.featuresHead.eyebrow}</p>
          <h2 className="heading-lg mb-4">{t.featuresHead.title}</h2>
          {t.featuresHead.body && <p className="text-ink-soft">{t.featuresHead.body}</p>}
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div className="card group h-full">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-primary transition-colors group-hover:border-primary/40 group-hover:bg-primary/10">
                  <Icon name={f.icon} />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
