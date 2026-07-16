"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { site } from "@/data/site";

/**
 * پری‌لودر سینمایی: یک صفحه‌ی ورودی کوتاه با لوگوی برند و نوار پیشرفت.
 * فقط یک‌بار در هر session نمایش داده می‌شود و به reduced-motion احترام می‌گذارد.
 * روی محتوای اصلی تأثیر LCP ندارد چون overlay است و سریع کنار می‌رود.
 */
export function Preloader() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    // اگر قبلاً در این session دیده شده، رد شو
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("farboo_preloaded")
    ) {
      setMounted(false);
      return;
    }

    // قفل اسکرول در حین نمایش
    document.body.style.overflow = "hidden";

    if (reduced) {
      const t = setTimeout(finish, 400);
      return () => clearTimeout(t);
    }

    let raf = 0;
    const start = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      // اطمینان از بازگشت اسکرول حتی اگر کامپوننت زودتر unmount شود
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  const finish = () => {
    setDone(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("farboo_preloaded", "1");
    }
    document.body.style.overflow = "";
  };

  if (!mounted) return null;

  return (
    <AnimatePresence onExitComplete={() => setMounted(false)}>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-base-900"
          exit={{
            opacity: 0,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          }}
        >
          {/* هاله‌ی پس‌زمینه */}
          <div
            className="pointer-events-none absolute h-72 w-72 rounded-full bg-primary/20 blur-[100px]"
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center gap-6"
          >
            {/* هسته‌ی مینیمال چرخان */}
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent blur-[2px]" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/20 border-t-accent"
                animate={reduced ? undefined : { rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-3 rounded-full bg-base-900" />
              <div className="absolute inset-5 rounded-full bg-gradient-to-br from-primary-400 to-accent" />
            </div>

            <div className="text-center">
              <div className="font-display text-2xl font-bold text-ink">
                {site.name}
              </div>
              <div className="mt-1 text-xs text-ink-soft">{site.tagline}</div>
            </div>

            {/* نوار پیشرفت */}
            <div className="h-[3px] w-40 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-l from-primary via-accent to-warm"
                style={{ width: `${reduced ? 100 : progress}%` }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
