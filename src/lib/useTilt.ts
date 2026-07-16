"use client";
import { useCallback, useRef } from "react";

/**
 * افکت کج‌شدن سه‌بعدی (3D tilt) کارت با حرکت موس + نور دنبال‌کننده (spotlight).
 * از CSS custom properties استفاده می‌کند تا رندر روان و بدون re-render باشد.
 * روی دستگاه‌های لمسی یا reduced-motion غیرفعال می‌ماند.
 */
export function useTilt(max = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const enabled = useRef(true);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (
        window.matchMedia("(pointer: coarse)").matches ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        enabled.current = false;
        return;
      }
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      const rx = (0.5 - py) * max * 2;
      const ry = (px - 0.5) * max * 2;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--mx", `${(e.clientX - rect.left).toFixed(0)}px`);
      el.style.setProperty("--my", `${(e.clientY - rect.top).toFixed(0)}px`);
    },
    [max]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  return { ref, onMove, onLeave };
}
