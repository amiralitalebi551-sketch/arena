import { problem, solution } from "@/data/content";
import { Reveal } from "@/components/ui/Reveal";

function Block({
  data,
  tone,
}: {
  data: typeof problem;
  tone: "muted" | "bright";
}) {
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
            <span
              className={
                tone === "bright"
                  ? "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  : "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint"
              }
              aria-hidden="true"
            />
            {p}
          </li>
        ))}
      </ul>
    </Reveal>
  );
}

export function ProblemSolution() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-content">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="eyebrow mb-5">چرا فربو</p>
          <h2 className="heading-lg">
            فاصله‌ی میان یک ایده‌ی درخشان و اجرای درخشان.
          </h2>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          <Block data={problem} tone="muted" />
          <Block data={solution} tone="bright" />
        </div>
      </div>
    </section>
  );
}
