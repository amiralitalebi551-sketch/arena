"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** تبدیل عدد لاتین به رقم فارسی. */
function toFa(input: string): string {
  const map = "۰۱۲۳۴۵۶۷۸۹";
  return input.replace(/\d/g, (d) => map[Number(d)]);
}

interface Props {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

/** شمارنده‌ای که وقتی وارد دید می‌شود، از صفر تا مقدار هدف با easing می‌شمارد. */
export function CountUp({ value, decimals = 0, duration = 1600, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(value * eased);
            if (t < 1) requestAnimationFrame(tick);
            else setDisplay(value);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, reduced]);

  const text = toFa(display.toFixed(decimals));
  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
