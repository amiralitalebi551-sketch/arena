"use client";
import { motion } from "framer-motion";
import { HeroCanvas } from "@/components/three/HeroCanvas";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { site } from "@/data/site";
import { useReducedMotion } from "@/lib/useReducedMotion";

export function Hero() {
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
    <section
      className="relative flex min-h-[100svh] items-center overflow-hidden"
      aria-labelledby="hero-title"
    >
      <HeroCanvas />

      {/* readability scrim: keeps text legible over the 3D core */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-base-900/40 via-base-900/10 to-base-900" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_28%_45%,rgba(10,11,20,0.85),transparent_70%)]" />

      <div className="container-content relative z-10 pt-24">
        <div className="max-w-2xl">
          <motion.p {...fade(0)} className="eyebrow mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-accent" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Multi-agent studio for media &amp; branding
          </motion.p>

          <motion.h1
            {...fade(0.08)}
            id="hero-title"
            className="heading-xl mb-6"
          >
            A team of <span className="text-gradient">specialist agents</span>,
            working like one studio.
          </motion.h1>

          <motion.p
            {...fade(0.16)}
            className="mb-9 max-w-xl text-lg text-ink-soft"
          >
            FarBoo orchestrates focused AI agents — strategy, copy, art
            direction, motion — grounded in your brand memory. Studio-grade
            craft, shipped at studio speed.
          </motion.p>

          <motion.div {...fade(0.24)} className="flex flex-wrap items-center gap-4">
            <MagneticButton href={site.cta.primary.href} variant="primary">
              {site.cta.primary.label}
            </MagneticButton>
            <MagneticButton href={site.cta.secondary.href} variant="secondary">
              {site.cta.secondary.label}
            </MagneticButton>
          </motion.div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 text-ink-faint sm:flex">
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <span className="h-10 w-px bg-gradient-to-b from-ink-faint to-transparent" />
      </div>
    </section>
  );
}
