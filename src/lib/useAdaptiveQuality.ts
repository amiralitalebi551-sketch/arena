"use client";
import { useEffect, useState } from "react";
import {
  detectInitialTier,
  downgrade,
  getSettings,
  QualitySettings,
} from "./quality";

/**
 * Picks an initial quality tier from device signals and downgrades it
 * automatically if the frame rate stays low for a sustained window.
 */
export function useAdaptiveQuality(): QualitySettings {
  const [tier, setTier] = useState(() => detectInitialTier());

  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    let lowStreak = 0;
    let stopped = false;

    const loop = (now: number) => {
      if (stopped) return;
      frames++;
      const elapsed = now - last;
      if (elapsed >= 1000) {
        const fps = (frames * 1000) / elapsed;
        frames = 0;
        last = now;
        if (fps < 45) {
          lowStreak++;
          if (lowStreak >= 3) {
            setTier((t) => {
              const next = downgrade(t);
              return next === t ? t : next;
            });
            lowStreak = 0;
          }
        } else {
          lowStreak = 0;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return getSettings(tier);
}
