"use client";
import { useCallback, useRef } from "react";

/**
 * افکت مغناطیسی ساده و امن: المان با حرکت موس کمی به سمتش کشیده می‌شود و
 * هنگام خروج نرم برمی‌گردد. transform مستقیم روی DOM نوشته می‌شود (بدون
 * re-render، GPU-accelerated). روی لمسی/reduced-motion غیرفعال است.
 */
export function useMagnetic(strength = 0.3) {
  const ref = useRef<HTMLElement | null>(null);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0px, 0px)";
  }, []);

  return { ref, onMove, onLeave };
}
