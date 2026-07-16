"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * انتقال نرم بین سکشن‌ها: هر سکشن هنگام ورود و خروج از دید، با opacity و
 * جابجایی/مقیاس ظریف و eased حرکت می‌کند تا اسکرول حسی پیوسته و سینمایی
 * داشته باشد. در reduced-motion کاملاً خنثی می‌شود.
 */
export function SectionTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start center", "end center", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.4, 1, 1, 0.4]
  );
  const y = useTransform(scrollYProgress, [0, 0.25], [40, 0]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.98, 1, 1, 0.99]
  );

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div ref={ref} style={{ opacity, y, scale }} className={className}>
      {children}
    </motion.div>
  );
}
