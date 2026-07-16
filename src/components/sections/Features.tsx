"use client";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/ui/Icon";
import { useTilt } from "@/lib/useTilt";
import { useI18n } from "@/i18n/I18nProvider";

function FeatureCard({
  feature,
  index,
}: {
  feature: { title: string; desc: string; icon: string };
  index: number;
}) {
  const { ref, onMove, onLeave } = useTilt(9);
  return (
    <Reveal delay={(index % 3) * 0.08}>
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform: "perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0))",
          transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
          transformStyle: "preserve-3d",
        }}
        className="group card relative h-full overflow-hidden hover:border-primary/30"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(240px circle at var(--mx) var(--my), rgba(31,157,107,0.18), transparent 60%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            padding: "1px",
            background: "linear-gradient(130deg, rgba(31,157,107,0.6), rgba(63,207,142,0.4), transparent)",
            WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div className="relative" style={{ transform: "translateZ(40px)" }}>
          <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-accent transition-colors group-hover:border-primary/40 group-hover:text-primary-400">
            <Icon name={feature.icon} />
          </div>
          <h3 className="mb-2 font-display text-lg font-semibold">{feature.title}</h3>
          <p className="text-sm leading-relaxed text-ink-soft">{feature.desc}</p>
        </div>
      </div>
    </Reveal>
  );
}

export function Features() {
  const { t } = useI18n();
  return (
    <section id="features" className="relative py-section">
      <div className="grid-bg absolute inset-0" aria-hidden="true" />
      <div className="container-content relative">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="eyebrow mb-5">{t.featuresHead.eyebrow}</p>
          <h2 className="heading-lg mb-4">{t.featuresHead.title}</h2>
          {t.featuresHead.body && <p className="text-ink-soft">{t.featuresHead.body}</p>}
        </Reveal>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
