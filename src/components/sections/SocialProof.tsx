"use client";
import { Reveal } from "@/components/ui/Reveal";
import { useI18n } from "@/i18n/I18nProvider";

export function SocialProof() {
  const { t } = useI18n();
  return (
    <section id="work" className="section relative border-y border-white/[0.06] bg-base-800/50">
      <div className="container-content">
        <Reveal className="mb-10 text-center">
          <p className="text-sm text-ink-faint">{t.socialHead}</p>
        </Reveal>

        {/* لوگوها — چیدمان ساده و متقارن */}
        <div className="mb-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-70">
          {t.clients.map((c) => (
            <span key={c} className="font-display text-xl font-semibold text-ink-soft">
              {c}
            </span>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {t.testimonials.map((tm, i) => (
            <Reveal key={tm.name} delay={i * 0.08}>
              <figure className="card flex h-full flex-col">
                <div className="mb-4 text-primary" aria-hidden="true">
                  {"★★★★★"}
                </div>
                <blockquote className="flex-1 text-ink">&ldquo;{tm.quote}&rdquo;</blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-4">
                  <div className="font-medium">{tm.name}</div>
                  <div className="text-sm text-ink-soft">{tm.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
