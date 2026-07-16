"use client";
import { useEffect, useRef } from "react";

/**
 * الگوریتم سفارشی خواندن سرعت و جهت اسکرول.
 *
 * چرا؟ انیمیشن‌های معمولِ «با ورود به viewport اجرا شو» ثابت‌اند و به رفتار
 * کاربر بی‌اعتنا. اینجا سرعت لحظه‌ای اسکرول را (px بر ثانیه) با میرایی نمایی
 * صاف می‌کنیم و به‌صورت CSS variable سراسری (--scroll-vel) منتشر می‌کنیم.
 * کامپوننت‌ها می‌توانند بر اساس آن، شدت skew/parallax/opacity را تطبیق دهند —
 * حسِ momentum فیزیکی که تأخیر ادراکی را کم می‌کند.
 *
 * بهینه: از rAF و مقدار نرمال‌شده استفاده می‌کند؛ نوشتن CSS var روی
 * documentElement ارزان است و re-render React ایجاد نمی‌کند.
 */
export function useScrollVelocity() {
  const raf = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const smoothVel = useRef(0);
  const running = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    lastY.current = window.scrollY;
    lastT.current = performance.now();

    const decay = () => {
      const now = performance.now();
      const dt = (now - lastT.current) / 1000 || 0.016;
      lastT.current = now;

      const y = window.scrollY;
      const instantVel = (y - lastY.current) / dt; // px/s
      lastY.current = y;

      // میرایی نمایی: سرعت خام نویزی است؛ این آن را نرم می‌کند (low-pass filter)
      smoothVel.current += (instantVel - smoothVel.current) * 0.15;

      // نرمال‌سازی به بازه‌ی تقریبی [-1, 1] (۲۵۰۰px/s ≈ سقف عملی)
      const normalized = Math.max(-1, Math.min(1, smoothVel.current / 2500));
      document.documentElement.style.setProperty(
        "--scroll-vel",
        normalized.toFixed(4)
      );

      // تا وقتی حرکت محسوس است ادامه بده، بعد متوقف شو (صرفه‌جویی CPU)
      if (Math.abs(smoothVel.current) > 2) {
        raf.current = requestAnimationFrame(decay);
      } else {
        document.documentElement.style.setProperty("--scroll-vel", "0");
        running.current = false;
      }
    };

    const onScroll = () => {
      if (!running.current) {
        running.current = true;
        lastT.current = performance.now();
        raf.current = requestAnimationFrame(decay);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf.current);
      document.documentElement.style.setProperty("--scroll-vel", "0");
    };
  }, []);
}
