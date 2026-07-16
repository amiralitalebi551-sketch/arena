"use client";
import { useEffect, useRef } from "react";

/**
 * دنباله‌ی نورانی موس (Cursor Trail) روی یک canvas تمام‌صفحه.
 * - یک هاله‌ی اصلی که نرم دنبال موس می‌آید (spring/lerp)
 * - یک دم ذره‌ای که با محو شدن تدریجی، مسیر حرکت را نشان می‌دهد
 * روی دستگاه‌های لمسی و حالت reduced-motion غیرفعال می‌شود و کاملاً
 * pointer-events-none است تا با کلیک‌ها تداخل نکند.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
}

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduced || coarse) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // موقعیت هدف (موس) و موقعیت نرم‌شده‌ی هاله
    const target = { x: width / 2, y: height / 2 };
    const halo = { x: width / 2, y: height / 2 };
    let hasMoved = false;
    let hover = false;
    let down = false;

    const particles: Particle[] = [];
    let hue = 250; // بنفش تا فیروزه‌ای

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      hasMoved = true;
      const el = e.target as HTMLElement | null;
      hover = !!el?.closest("a, button, [role='button'], input");
    };
    const onDown = () => (down = true);
    const onUp = () => (down = false);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });

    let raf = 0;
    let running = true;
    const onVisibility = () => {
      running = !document.hidden;
      if (running) loop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const spawn = (x: number, y: number, speed: number) => {
      const count = Math.min(3, 1 + Math.floor(speed / 6));
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          life: 1,
          size: 2 + Math.random() * 3,
          hue: hue + (Math.random() - 0.5) * 40,
        });
      }
      if (particles.length > 240) particles.splice(0, particles.length - 240);
    };

    const loop = () => {
      if (!running) return;
      raf = requestAnimationFrame(loop);

      // پاک کردن با کمی محو شدن برای دنباله‌ی نرم
      ctx.clearRect(0, 0, width, height);

      if (!hasMoved) return;

      hue = (hue + 0.6) % 360;

      // هاله دنبال موس با lerp نرم
      const prevX = halo.x;
      const prevY = halo.y;
      halo.x += (target.x - halo.x) * 0.18;
      halo.y += (target.y - halo.y) * 0.18;
      const speed = Math.hypot(halo.x - prevX, halo.y - prevY);

      spawn(halo.x, halo.y, speed);

      // رسم ذرات دم
      ctx.globalCompositeOperation = "lighter";
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.life -= 0.02;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        const alpha = p.life * 0.5;
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${alpha})`;
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }

      // هاله‌ی اصلی — بزرگ‌تر و روشن‌تر روی عناصر قابل‌کلیک
      const radius = (hover ? 26 : 16) * (down ? 0.7 : 1);
      const grad = ctx.createRadialGradient(
        halo.x,
        halo.y,
        0,
        halo.x,
        halo.y,
        radius * 2.4
      );
      grad.addColorStop(0, `hsla(${hue}, 95%, 70%, 0.55)`);
      grad.addColorStop(0.4, `hsla(${(hue + 40) % 360}, 90%, 60%, 0.28)`);
      grad.addColorStop(1, "hsla(0, 0%, 0%, 0)");
      ctx.beginPath();
      ctx.fillStyle = grad;
      ctx.arc(halo.x, halo.y, radius * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // نقطه‌ی مرکزی تیز
      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue}, 100%, 85%, 0.9)`;
      ctx.arc(halo.x, halo.y, hover ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalCompositeOperation = "source-over";
    };
    loop();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90] hidden md:block"
    />
  );
}
