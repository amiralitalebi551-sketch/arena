import { stats } from "@/data/content";
import { Reveal } from "@/components/ui/Reveal";

export function TrustBar() {
  return (
    <section aria-label="Key results" className="relative border-y border-white/[0.06] bg-base-800/40">
      <div className="container-content grid grid-cols-2 gap-x-6 gap-y-8 py-12 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06} className="text-center md:text-left">
            <div className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {s.value}
              <span className="text-gradient">{s.suffix}</span>
            </div>
            <div className="mt-1 text-sm text-ink-soft">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
