"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { useTilt } from "@/lib/useTilt";
import { useI18n } from "@/i18n/I18nProvider";
import { computeMasonry, columnsForWidth } from "@/lib/masonry";

const PREF_KEY = "farboo_work_interest";

/** خواندن امتیاز علاقه‌ی کاربر (personalization) از localStorage. */
function readInterest(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
  } catch {
    return {};
  }
}
function bumpInterest(key: string) {
  try {
    const cur = readInterest();
    cur[key] = (cur[key] || 0) + 1;
    localStorage.setItem(PREF_KEY, JSON.stringify(cur));
  } catch {
    /* storage مسدود: personalization بی‌صدا غیرفعال می‌شود */
  }
}

function WorkCard({
  item,
  onEngage,
}: {
  item: { title: string; category: string; span: number };
  onEngage: () => void;
}) {
  const { ref, onMove, onLeave } = useTilt(5);
  return (
    <a
      href="#final-cta"
      ref={ref as unknown as React.RefObject<HTMLAnchorElement>}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onEngage}
      onMouseEnter={onEngage}
      className="group card relative block overflow-hidden"
      style={{
        // ارتفاع نسبی از span (masonry واقعی با ارتفاع‌های متفاوت)
        height: `${item.span * 0.6 + 8}rem`,
        transform: "perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0))",
        transition: "transform var(--dur-base) var(--ease-out)",
      }}
    >
      {/* پس‌زمینه‌ی procedural هر کارت (بدون فایل تصویر) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(120% 90% at 30% 0%, rgba(31,157,107,0.28), transparent 55%), linear-gradient(160deg, #131513, #0c0d0c)`,
        }}
      />
      <div className="relative flex h-full flex-col justify-end p-5">
        <span className="text-xs text-accent">{item.category}</span>
        <h3 className="mt-1 font-display text-lg font-semibold text-ink">{item.title}</h3>
      </div>
    </a>
  );
}

export function WorkGallery() {
  const { t } = useI18n();
  const [columns, setColumns] = useState(3);
  const [interest, setInterest] = useState<Record<string, number>>({});
  const wrapRef = useRef<HTMLDivElement>(null);

  // تعداد ستون ریسپانسیو (با throttle از طریق rAF)
  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setColumns(columnsForWidth(window.innerWidth)));
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => setInterest(readInterest()), []);

  // Personalization: آیتم‌هایی که کاربر بیشتر با آن‌ها تعامل داشته، جلوتر
  // چیده می‌شوند (مرتب‌سازی پایدار بر اساس امتیاز علاقه).
  const ordered = useMemo(() => {
    return t.work
      .map((w, i) => ({ w, i }))
      .sort((a, b) => (interest[b.w.title] || 0) - (interest[a.w.title] || 0) || a.i - b.i)
      .map((x) => x.w);
  }, [t.work, interest]);

  // اجرای الگوریتم masonry سفارشی: هر آیتم به کوتاه‌ترین ستون
  const assignment = useMemo(
    () => computeMasonry(ordered.map((w) => w.span), columns),
    [ordered, columns]
  );

  const columnItems = useMemo(() => {
    const cols: (typeof ordered)[] = Array.from({ length: columns }, () => []);
    ordered.forEach((item, i) => cols[assignment[i]].push(item));
    return cols;
  }, [ordered, assignment, columns]);

  return (
    <section id="work" className="relative py-section">
      <div className="container-content">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="eyebrow mb-5">{t.workHead.eyebrow}</p>
          <h2 className="heading-lg mb-4">{t.workHead.title}</h2>
          {t.workHead.body && <p className="text-ink-soft">{t.workHead.body}</p>}
        </Reveal>

        <div ref={wrapRef} className="flex gap-6">
          {columnItems.map((col, ci) => (
            <div key={ci} className="flex flex-1 flex-col gap-6">
              {col.map((item) => (
                <Reveal key={item.title}>
                  <WorkCard
                    item={item}
                    onEngage={() => {
                      bumpInterest(item.title);
                      setInterest(readInterest());
                    }}
                  />
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
