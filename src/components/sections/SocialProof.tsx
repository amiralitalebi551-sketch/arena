import { clients, testimonials } from "@/data/content";
import { Reveal } from "@/components/ui/Reveal";

export function SocialProof() {
  return (
    <section id="work" className="relative border-y border-white/[0.06] bg-base-800/30 py-24 sm:py-32">
      <div className="container-content">
        <Reveal className="mb-12 text-center">
          <p className="text-sm text-ink-faint">
            مورد اعتماد تیم‌های برند و مدیا
          </p>
        </Reveal>

        <div className="mb-20 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
          {clients.map((c) => (
            <span
              key={c}
              className="font-display text-xl font-semibold tracking-tight text-ink-soft"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="card flex h-full flex-col">
                <div className="mb-4 text-accent" aria-hidden="true">
                  {"★★★★★"}
                </div>
                <blockquote className="flex-1 text-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 border-t border-white/10 pt-4">
                  <div className="font-medium">{t.name}</div>
                  <div className="text-sm text-ink-soft">{t.role}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
