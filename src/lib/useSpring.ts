"use client";
import { useCallback, useEffect, useRef } from "react";
import {
  createSpring,
  stepSpring,
  SpringConfig,
  SpringState,
} from "./spring";

/**
 * هوک اسپرینگ دومحوری (x, y) روی موتور فیزیک سفارشی.
 * به‌جای re-render شدن React در هر فریم، مقدار را مستقیم روی یک المان DOM
 * (از طریق transform) می‌نویسد تا صفر re-render و GPU-accelerated بماند.
 *
 * فقط وقتی حرکتی هست RAF می‌چرخد؛ به سکون که رسید، حلقه متوقف می‌شود
 * (بدون مصرف بیهوده‌ی CPU).
 */
export function useSpring2D(cfg: SpringConfig) {
  const elRef = useRef<HTMLElement | null>(null);
  const sx = useRef<SpringState>(createSpring(0));
  const sy = useRef<SpringState>(createSpring(0));
  const raf = useRef(0);
  const last = useRef(0);
  const running = useRef(false);

  const loop = useCallback(
    (now: number) => {
      const dt = (now - last.current) / 1000 || 0;
      last.current = now;

      const movingX = stepSpring(sx.current, dt, cfg);
      const movingY = stepSpring(sy.current, dt, cfg);

      const el = elRef.current;
      if (el) {
        el.style.transform = `translate3d(${sx.current.value.toFixed(
          2
        )}px, ${sy.current.value.toFixed(2)}px, 0)`;
      }

      if (movingX || movingY) {
        raf.current = requestAnimationFrame(loop);
      } else {
        running.current = false;
      }
    },
    [cfg]
  );

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    last.current = performance.now();
    raf.current = requestAnimationFrame(loop);
  }, [loop]);

  /** هدف جدید برای اسپرینگ ست می‌کند و در صورت نیاز حلقه را روشن می‌کند. */
  const setTarget = useCallback(
    (x: number, y: number) => {
      sx.current.target = x;
      sy.current.target = y;
      start();
    },
    [start]
  );

  useEffect(() => {
    return () => cancelAnimationFrame(raf.current);
  }, []);

  /** المان هدف را برای نوشتن transform تنظیم می‌کند. */
  const setEl = useCallback((node: HTMLElement | null) => {
    elRef.current = node;
  }, []);

  return { setEl, setTarget };
}
