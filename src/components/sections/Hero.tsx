"use client";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";

export function Hero() {
  const { t } = useI18n();

  return (
    <section
      className="relative flex min-h-[92svh] items-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* المان بصری: کره‌ی گرادیانی نرم (CSS، بدون WebGL) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(52,211,153,0.18),transparent_60%)]" />
        <div className="animate-float absolute right-[8%] top-[18%] h-64 w-64 rounded-full bg-[radial-gradient(circle_at_35%_30%,#4ADE9E,#10B981_55%,transparent_75%)] opacity-40 blur-2xl" />
        <div className="grid-bg absolute inset-0" />
      </div>

      <div className="container-content relative z-10 pt-24">
        <div className="max-w-3xl">
          <p className="eyebrow mb-6 animate-fade-up">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t.hero.eyebrow}
          </p>

          <h1
            id="hero-title"
            className="heading-xl mb-6 animate-fade-up"
            style={{ animationDelay: "0.08s" }}
          >
            {t.hero.titleLead.join(" ")}{" "}
            <span className="text-gradient">{t.hero.titleAccent}</span>
          </h1>

          <p
            className="mb-9 max-w-xl text-lg text-ink-soft animate-fade-up"
            style={{ animationDelay: "0.16s" }}
          >
            {t.hero.body}
          </p>

          <div
            className="flex flex-wrap items-center gap-4 animate-fade-up"
            style={{ animationDelay: "0.24s" }}
          >
            <Button href={t.cta.primary.href} variant="primary">
              {t.cta.primary.label}
            </Button>
            <Button href={t.cta.secondary.href} variant="secondary">
              {t.cta.secondary.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
