"use client";
import { Reveal } from "@/components/ui/Reveal";
import { useI18n } from "@/i18n/I18nProvider";

interface SectionData {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
}

function Block({ data, tone }: { data: SectionData; tone: "muted" | "bright" }) {
  return (
    <Reveal className={tone === "bright" ? "card border-primary/20 bg-primary/[0.04]" : "card"}>
      <p className={tone === "bright" ? "eyebrow mb-5" : "mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-ink-soft"}>
        {data.eyebrow}
      </p>
      <h3 className="heading-lg mb-4 text-2xl sm:text-3xl">{data.title}</h3>
      <p className="mb-6 text-ink-soft">{data.body}</p>
      <ul className="space-y-3">
        {data.points.map((p) => (
          <li key={p} className="flex gap-3 text-sm text-ink-soft">
            <span className={tone === "bright" ? "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" : "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint"} aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export function ProblemSolution() {
  const { t } = useI18n();
  return (
    <section className="relative py-section">
      <div className="container-content">
        <div className="grid gap-6 md:grid-cols-2">
          <Block data={t.problem} tone="muted" />
          <Block data={t.solution} tone="bright" />
        </div>
      </div>
    </section>
  );
}
