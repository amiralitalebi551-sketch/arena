import { stats } from "@/data/content";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";

export function TrustBar() {
  return (
    <section aria-label="نتایج کلیدی" className="relative border-y border-white/[0.06] bg-base-800/40">
      <div className="container-content grid grid-cols-2 gap-x-6 gap-y-8 py-12 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.06} className="text-center md:text-right">
            <div className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              <CountUp value={s.num} decimals={s.num % 1 !== 0 ? 1 : 0} />
              <span className="text-gradient">{s.plus}</span>
            </div>
            <div className="mt-1 text-sm text-ink-soft">{s.label}</div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
