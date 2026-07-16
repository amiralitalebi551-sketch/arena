"use client";
import { clients, testimonials } from "@/data/content";
import { Reveal } from "@/components/ui/Reveal";
import { Marquee } from "@/components/ui/Marquee";
import { useTilt } from "@/lib/useTilt";

function TestimonialCard({
  t,
  index,
}: {
  t: (typeof testimonials)[number];
  index: number;
}) {
  const { ref, onMove, onLeave } = useTilt(6);
  return (
    <Reveal delay={index * 0.08}>
      <figure
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform:
            "perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0))",
          transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
        }}
        className="group card relative flex h-full flex-col overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              "radial-gradient(240px circle at var(--mx) var(--my), rgba(34,211,238,0.12), transparent 60%)",
          }}
        />
        <div className="relative flex flex-1 flex-col">
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
        </div>
      </figure>
    </Reveal>
  );
}

export function SocialProof() {
  return (
    <section id="work" className="relative border-y border-white/[0.06] bg-base-800/30 py-24 sm:py-32">
      <div className="container-content">
        <Reveal className="mb-12 text-center">
          <p className="text-sm text-ink-faint">
            مورد اعتماد تیم‌های برند و مدیا
          </p>
        </Reveal>

        <ul className="sr-only">
          {clients.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <div className="mb-20">
          <Marquee items={clients} speed={30} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} t={t} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
