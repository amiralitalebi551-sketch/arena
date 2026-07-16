"use client";
import { useEffect, useState } from "react";
import { useHoverSound, toggleSound, isSoundOn } from "@/lib/useHoverSound";

/**
 * لایه‌ی تعامل سراسری:
 * - افکت صوتی ظریف روی hover/کلیک تمام لینک‌ها و دکمه‌ها (با delegation، بدون
 *   نیاز به تغییر هر کامپوننت) — فقط وقتی کاربر صدا را روشن کرده باشد.
 * - دکمه‌ی شناور روشن/خاموش کردن صدا.
 * افکت مگنتیک عمومی هم در همین‌جا روی عناصر دارای [data-magnetic] اعمال می‌شود.
 */
export function InteractionLayer() {
  const play = useHoverSound();
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    setSoundOn(isSoundOn());

    const isInteractive = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      el.closest("a, button, [role='button']");

    let lastHover: Element | null = null;
    const onOver = (e: PointerEvent) => {
      const target = isInteractive(e.target);
      if (target && target !== lastHover) {
        lastHover = target;
        play("hover");
      } else if (!target) {
        lastHover = null;
      }
    };
    const onClick = (e: MouseEvent) => {
      if (isInteractive(e.target)) play("click");
    };

    // افکت مگنتیک سبک روی عناصر نشان‌دار
    const magnets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-magnetic]")
    );
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const magnetHandlers: Array<() => void> = [];
    if (!coarse && !reduced) {
      magnets.forEach((el) => {
        const strength = Number(el.dataset.magnetic) || 0.25;
        const move = (ev: MouseEvent) => {
          const r = el.getBoundingClientRect();
          const x = (ev.clientX - (r.left + r.width / 2)) * strength;
          const y = (ev.clientY - (r.top + r.height / 2)) * strength;
          el.style.transform = `translate(${x}px, ${y}px)`;
        };
        const leave = () => {
          el.style.transform = "translate(0,0)";
        };
        el.style.transition = "transform 0.3s cubic-bezier(0.22,1,0.36,1)";
        el.addEventListener("mousemove", move);
        el.addEventListener("mouseleave", leave);
        magnetHandlers.push(() => {
          el.removeEventListener("mousemove", move);
          el.removeEventListener("mouseleave", leave);
        });
      });
    }

    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("click", onClick, { passive: true });
    return () => {
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("click", onClick);
      magnetHandlers.forEach((fn) => fn());
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
