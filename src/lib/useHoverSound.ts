"use client";
import { useCallback, useEffect, useRef } from "react";

/**
 * افکت صوتی ظریف روی hover با Web Audio API — بدون هیچ فایل صوتی.
 * یک «تیک» بسیار کوتاه و ملایم تولید می‌کند. با اولین تعامل کاربر فعال
 * می‌شود (سیاست autoplay مرورگرها) و به‌صورت پیش‌فرض خاموش است تا مزاحم
 * نباشد؛ کاربر می‌تواند از طریق دکمه‌ی صدا روشنش کند.
 */

let sharedCtx: AudioContext | null = null;

export function useHoverSound() {
  const enabledRef = useRef(false);

  useEffect(() => {
    // خواندن ترجیح ذخیره‌شده (isSoundOn خودش در برابر خطای storage گارد دارد)
    enabledRef.current = isSoundOn();
    const onChange = () => {
      enabledRef.current = isSoundOn();
    };
    window.addEventListener("farboo-sound-change", onChange);
    return () => window.removeEventListener("farboo-sound-change", onChange);
  }, []);

  const play = useCallback((type: "hover" | "click" = "hover") => {
    if (!enabledRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (!sharedCtx) {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        sharedCtx = new Ctor();
      }
      const ctx = sharedCtx;
      if (ctx.state === "suspended") void ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      const freq = type === "click" ? 520 : 880;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.06);

      const peak = type === "click" ? 0.06 : 0.03;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain).connect(ctx.destination);
      // پاک‌سازی صریح node ها پس از پایان صدا تا از انباشت جلوگیری شود
      osc.onended = () => {
        try {
          osc.disconnect();
          gain.disconnect();
        } catch {
          /* noop */
        }
      };
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      /* بی‌صدا شکست می‌خورد */
    }
  }, []);

  return play;
}

export function toggleSound(): boolean {
  try {
    const current = localStorage.getItem("farboo_sound") === "on";
    const next = !current;
    localStorage.setItem("farboo_sound", next ? "on" : "off");
    window.dispatchEvent(new Event("farboo-sound-change"));
    return next;
  } catch {
    // storage مسدود (مثل حالت private در Safari): همان مقدار قبلی را برگردان
    return isSoundOn();
  }
}

export function isSoundOn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("farboo_sound") === "on";
  } catch {
    return false;
  }
}
