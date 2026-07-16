"use client";
import { useEffect, useRef, useState } from "react";
import { useHoverSound, toggleSound, isSoundOn } from "@/lib/useHoverSound";

/**
 * لایه‌ی تعامل سراسری (با event delegation روی document):
 * - افکت صوتی ظریف روی hover/کلیک تمام لینک‌ها و دکمه‌ها.
 * - افکت مگنتیک روی عناصر دارای [data-magnetic] — چون از delegation استفاده
 *   می‌کند، برای عناصر داینامیک (مثل منوی موبایل) هم بدون نیاز به query دوباره
 *   کار می‌کند و هیچ listenerی روی تک‌تک عناصر باقی نمی‌ماند (بدون نشتی).
 */
export function InteractionLayer() {
  const play = useHoverSound();
  const [soundOn, setSoundOn] = useState(false);
  // عنصر مگنتیک فعال فعلی، برای بازگرداندن transform هنگام خروج
  const activeMagnet = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setSoundOn(isSoundOn());

    const interactiveOf = (el: EventTarget | null): HTMLElement | null =>
      el instanceof HTMLElement
        ? (el.closest("a, button, [role='button']") as HTMLElement | null)
        : null;

    let lastHover: Element | null = null;
    const onOver = (e: PointerEvent) => {
      const target = interactiveOf(e.target);
      if (target && target !== lastHover) {
        lastHover = target;
        play("hover");
      } else if (!target) {
        lastHover = null;
      }
    };
    const onClick = (e: MouseEvent) => {
      if (interactiveOf(e.target)) play("click");
    };

    // آیا افکت‌های حرکتی مجازند؟ (بار اول محاسبه می‌شود؛ کافی است)
    const motionOff =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const magnetOf = (el: EventTarget | null): HTMLElement | null =>
      el instanceof HTMLElement
        ? (el.closest("[data-magnetic]") as HTMLElement | null)
        : null;

    const onMove = (e: PointerEvent) => {
      if (motionOff) return;
      const el = magnetOf(e.target);
      if (!el) {
        if (activeMagnet.current) {
          activeMagnet.current.style.transform = "translate(0,0)";
          activeMagnet.current = null;
        }
        return;
      }
      if (activeMagnet.current && activeMagnet.current !== el) {
        activeMagnet.current.style.transform = "translate(0,0)";
      }
      activeMagnet.current = el;
      if (!el.style.transition) {
        el.style.transition = "transform 0.3s cubic-bezier(0.22,1,0.36,1)";
      }
      const strength = Number(el.dataset.magnetic) || 0.25;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    };

    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("click", onClick, { passive: true });
    if (!motionOff) {
      document.addEventListener("pointermove", onMove, { passive: true });
    }

    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointermove", onMove);
      if (activeMagnet.current) {
        activeMagnet.current.style.transform = "translate(0,0)";
        activeMagnet.current = null;
      }
    };
  }, [play]);

  return (
    <button
      type="button"
      onClick={() => setSoundOn(toggleSound())}
      aria-pressed={soundOn}
      aria-label={soundOn ? "خاموش کردن افکت صوتی" : "روشن کردن افکت صوتی"}
      className="fixed bottom-5 left-5 z-[80] flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-base-800/70 text-ink-soft backdrop-blur-md transition-colors hover:border-primary/40 hover:text-ink"
    >
      {soundOn ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5Z" />
          <path d="m22 9-6 6M16 9l6 6" />
        </svg>
      )}
    </button>
  );
}
