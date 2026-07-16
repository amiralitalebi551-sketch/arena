"use client";
import { features } from "@/data/content";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { useRef } from "react";

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <Reveal delay={(index % 3) * 0.08}>
      <div
        ref={ref}
        onMouseMove={onMove}
        className="group card relative h-full overflow-hidden hover:border-primary/30"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(220px circle at var(--mx) var(--my), rgba(109,94,246,0.14), transparent 65%)",
          }}
        />
        <div className="relative">
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-accent transition-colors group-hover:border-primary/40 group-hover:text-primary-400">
            <Icon name={feature.icon} />
          </div>
          <h3 className="mb-2 font-display text-lg font-semibold">
            {feature.title}
          </h3>
          <p className="text-sm leading-relaxed text-ink-soft">{feature.desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="grid-bg absolute inset-0" aria-hidden="true" />
      <div className="container-content relative">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="eyebrow mb-5">The roster</p>
          <h2 className="heading-lg mb-4">Specialists, not a single generalist.</h2>
          <p className="text-ink-soft">
            Each agent masters one craft and shares the same brand memory — so
            the work is deep, consistent, and unmistakably yours.
          </p>
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
