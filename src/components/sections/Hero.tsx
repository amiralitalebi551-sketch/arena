"use client";
import { motion } from "framer-motion";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { useI18n } from "@/i18n/I18nProvider";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function Hero() {
  const { t, dir } = useI18n();
  const reduced = useReducedMotion();
  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden" aria-labelledby="hero-title">
      <HeroCanvas />

      <div className="animate-aurora pointer-events-none absolute -right-40 top-10 h-[40rem] w-[40rem] rounded-full bg-primary/20 blur-[130px]" aria-hidden="true" />
      <div className="animate-aurora pointer-events-none absolute -left-40 bottom-0 h-[34rem] w-[34rem] rounded-full bg-accent/15 blur-[130px]" style={{ animationDelay: "-6s" }} aria-hidden="true" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base-900/40 via-base-900/10 to-base-900" />
      {/* scrim سمت مخالف متن تا هسته‌ی سه‌بعدی خوانایی را کم نکند */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            dir === "rtl"
              ? "radial-gradient(ellipse 60% 50% at 72% 45%, rgba(12,13,12,0.85), transparent 70%)"
              : "radial-gradient(ellipse 60% 50% at 28% 45%, rgba(12,13,12,0.85), transparent 70%)",
        }}
      />

      <div className="container-content relative z-10 pt-24">
        <div className="max-w-2xl">
          <motion.p {...fade(0)} className="eyebrow mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            {t.hero.eyebrow}
          </motion.p>

          <h1 id="hero-title" className="heading-xl mb-6">
            {t.hero.titleLead.map((w, i) =>
              reduced ? (
                <span key={i}>{w} </span>
              ) : (
                <motion.span
                  key={i}
                  className="inline-block"
                  initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.6, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}&nbsp;
                </motion.span>
              )
            )}
            <br />
            <motion.span
              className="text-gradient-animated inline-block"
              initial={reduced ? undefined : { opacity: 0, y: 30 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {t.hero.titleAccent}
            </motion.span>
          </h1>

          <motion.p {...fade(0.75)} className="mb-9 max-w-xl text-lg text-ink-soft">
            {t.hero.body}
          </motion.p>

          <motion.div {...fade(0.9)} className="flex flex-wrap items-center gap-4">
            <MagneticButton href={t.cta.primary.href} variant="primary" dir={dir}>
              {t.cta.primary.label}
            </MagneticButton>
            <MagneticButton href={t.cta.secondary.href} variant="secondary">
              {t.cta.secondary.label}
            </MagneticButton>
          </motion.div>
        </div>
      </div>

      <motion.div
        className="pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-ink-faint sm:flex"
        initial={reduced ? undefined : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
      >
        <span className="text-xs">{t.hero.scroll}</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-ink-faint to-transparent" />
      </motion.div>
    </section>
  );
}
