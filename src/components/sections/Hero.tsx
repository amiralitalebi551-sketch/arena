"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/I18nProvider";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function Hero() {
  const { t } = useI18n();
  const reduced = useReducedMotion();

  const words = t.hero.titleLead;

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
  };
  const word = {
    hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
    },
  };
  const fade = (d: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay: d, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section
      className="relative flex min-h-[92svh] items-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* پس‌زمینه‌ی سینمایی — گرادیان‌های نرمِ شناور (CSS، بدون WebGL) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="animate-float absolute -top-24 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(52,211,153,0.16),transparent_62%)]" />
        <div
          className="animate-float absolute right-[6%] top-[22%] h-72 w-72 rounded-full bg-[radial-gradient(circle_at_35%_30%,#4ADE9E,#10B981_55%,transparent_75%)] opacity-30 blur-3xl"
          style={{ animationDelay: "-3s" }}
        />
        <div className="grid-bg absolute inset-0" />
      </div>

      <div className="container-content relative z-10 pt-24">
        <div className="max-w-3xl">
          <motion.p {...fade(0)} className="eyebrow mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            {t.hero.eyebrow}
          </motion.p>

          {/* تیتر با ورود کلمه‌به‌کلمه (سینمایی) */}
          {reduced ? (
            <h1 id="hero-title" className="heading-xl mb-6">
              {words.join(" ")} <span className="text-gradient">{t.hero.titleAccent}</span>
            </h1>
          ) : (
            <motion.h1
              id="hero-title"
              className="heading-xl mb-6"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {words.map((w, i) => (
                <motion.span key={i} variants={word} className="inline-block">
                  {w}&nbsp;
                </motion.span>
              ))}
              <motion.span variants={word} className="text-gradient inline-block">
                {t.hero.titleAccent}
              </motion.span>
            </motion.h1>
          )}

          <motion.p {...fade(0.7)} className="mb-9 max-w-xl text-lg text-ink-soft">
            {t.hero.body}
          </motion.p>

          <motion.div {...fade(0.85)} className="flex flex-wrap items-center gap-4">
            <Button href={t.cta.primary.href} variant="primary" magnetic>
              {t.cta.primary.label}
            </Button>
            <Button href={t.cta.secondary.href} variant="secondary">
              {t.cta.secondary.label}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* نشانگر اسکرول */}
      <motion.div
        className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-ink-faint sm:flex"
        initial={reduced ? undefined : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        transition={{ delay: 1.3, duration: 1 }}
        aria-hidden="true"
      >
        <span className="text-xs">{t.hero.scroll}</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-ink-faint to-transparent" />
      </motion.div>
    </section>
  );
}
