"use client";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * نوار حرکت بی‌نهایت (infinite marquee) با CSS، بدون کتابخانه.
 * محتوا دو بار رندر می‌شود تا حلقه‌ی بی‌درز ساخته شود. در reduced-motion
 * به یک ردیف ثابت و wrap-شونده تبدیل می‌شود.
 */
export function Marquee({
  items,
  speed = 32,
}: {
  items: string[];
  speed?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-70">
        {items.map((c) => (
          <span
            key={c}
            className="font-display text-xl font-semibold text-ink-soft"
          >
            {c}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      className="group relative flex overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
      }}
      aria-hidden="true"
    >
      {[0, 1].map((dup) => (
        <div
          key={dup}
          className="flex shrink-0 items-center gap-12 pl-12 marquee-track"
          style={{ animationDuration: `${speed}s` }}
        >
          {items.map((c, i) => (
            <span
              key={`${dup}-${i}`}
              className="whitespace-nowrap font-display text-xl font-semibold text-ink-soft/70 transition-colors group-hover:text-ink-soft"
            >
              {c}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
