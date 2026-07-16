"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/i18n/I18nProvider";

export function ScrollStory() {
  const { t } = useI18n();
  const beats = t.story.beats;
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Parallax depth layers driven by scroll.
  const bg = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const mid = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1.05, 0.9]);
  const hue = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const filter = useTransform(hue, (h) => `hue-rotate(${h}deg)`);

  return (
    <section
      id="how"
      ref={ref}
      className="relative"
      style={{ height: reduced ? "auto" : "320vh" }}
      aria-label={t.story.ariaLabel}
    >
      <div
        className={
          reduced
            ? "relative py-24"
            : "sticky top-0 flex h-screen items-center overflow-hidden"
        }
      >
        {/* Parallax depth layers */}
        {!reduced && (
          <>
            <motion.div
              style={{ y: bg }}
              className="pointer-events-none absolute -left-32 top-1/4 h-[36rem] w-[36rem] rounded-full bg-primary/20 blur-[120px]"
              aria-hidden="true"
            />
            <motion.div
              style={{ y: mid }}
              className="pointer-events-none absolute -right-24 bottom-0 h-[30rem] w-[30rem] rounded-full bg-accent/15 blur-[120px]"
              aria-hidden="true"
            />
          </>
        )}

        <div className="container-content relative grid w-full items-center gap-12 lg:grid-cols-2">
          {/* Visual: a morphing conic core, animated purely with CSS/transform */}
          <div className="relative order-2 flex items-center justify-center lg:order-1">
            <motion.div
              style={reduced ? undefined : { rotate, scale, filter }}
              className="relative h-64 w-64 sm:h-80 sm:w-80"
            >
              <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#1F9D6B,#3FCF8E,#C9A96A,#1F9D6B)] opacity-80 blur-[1px]" />
              <div className="absolute inset-6 rounded-full bg-base-900" />
              <div className="absolute inset-10 rounded-full bg-[radial-gradient(circle_at_35%_30%,#5CE0A5,#178055_60%,#3FCF8E)]" />
              <div className="absolute inset-0 rounded-full border border-white/10" />
            </motion.div>
          </div>

          {/* Text beats */}
          <div className="order-1 space-y-8 lg:order-2">
            <Reveal>
              <p className="eyebrow mb-4">{t.story.eyebrow}</p>
              <h2 className="heading-lg">{t.story.title}</h2>
            </Reveal>
            <ol className="space-y-6">
              {beats.map((b, i) => (
                <StoryBeat
                  key={b.title}
                  beat={b}
                  index={i}
                  total={beats.length}
                  progress={scrollYProgress}
                  reduced={reduced}
                />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryBeat({
  beat,
  index,
  total,
  progress,
  reduced,
}: {
  beat: { title: string; body: string };
  index: number;
  total: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduced: boolean;
}) {
  const start = index / total;
  const end = (index + 1) / total;
  const opacity = useTransform(
    progress,
    [start - 0.12, start, end - 0.05, end + 0.08],
    [0.3, 1, 1, 0.3]
  );
  const x = useTransform(progress, [start - 0.1, start], [12, 0]);

  return (
    <motion.li
      style={reduced ? undefined : { opacity, x }}
      className="flex gap-4"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-display text-sm font-semibold text-primary-400">
        {index + 1}
      </span>
      <div>
        <h3 className="font-display text-lg font-semibold">{beat.title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{beat.body}</p>
      </div>
    </motion.li>
  );
}
