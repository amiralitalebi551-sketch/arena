"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useSpring2D } from "@/lib/useSpring";
import { SPRINGS } from "@/lib/spring";

interface Props {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit";
  dir?: "rtl" | "ltr";
}

/**
 * دکمه‌ی مغناطیسی روی موتور اسپرینگ فیزیک سفارشی (نه Framer Motion).
 *
 * روان‌شناسی: بر اساس Fitts's Law، جذب دکمه به سمت اشاره‌گر «هدف مؤثر» را
 * بزرگ‌تر و رسیدن به آن را آسان‌تر می‌کند. حرکت با فنر واقعی (نه easing ثابت)
 * حس ارگانیک می‌دهد. Feedback بلافاصله (<16ms) شروع می‌شود.
 *
 * فنی: transform مستقیم روی DOM با useSpring2D نوشته می‌شود → صفر re-render،
 * GPU-accelerated (translate3d).
 */
export function MagneticButton({
  href,
  children,
  variant = "primary",
  className,
  onClick,
  loading = false,
  ariaLabel,
  type = "button",
  dir = "rtl",
}: Props) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  const reduced = useReducedMotion();
  const { setEl, setTarget } = useSpring2D(SPRINGS.magnetic);

  // ref را هم برای اندازه‌گیری نگه دار و هم به اسپرینگ وصل کن
  const attach = (node: HTMLAnchorElement | HTMLButtonElement | null) => {
    ref.current = node;
    setEl(node);
  };

  const handleMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // ضریب ۰.۳ = میزان جذب؛ فراتر از این حرکت غیرطبیعی و مزاحم می‌شود
    const x = (e.clientX - (rect.left + rect.width / 2)) * 0.3;
    const y = (e.clientY - (rect.top + rect.height / 2)) * 0.3;
    setTarget(x, y);
  };
  const reset = () => setTarget(0, 0);

  const styles = cn(
    "group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium tracking-wide transition-colors duration-300 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900",
    variant === "primary"
      ? "bg-primary text-white shadow-glow hover:bg-primary-400 focus-visible:ring-primary-400"
      : "border border-white/15 bg-white/[0.03] text-ink hover:border-white/30 hover:bg-white/[0.06] focus-visible:ring-accent-400",
    loading && "pointer-events-none opacity-70",
    className
  );

  const inner = (
    <>
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
      )}
      <span>{children}</span>
      {variant === "primary" && !loading && (
        <span
          aria-hidden="true"
          className={
            dir === "rtl"
              ? "transition-transform duration-300 group-hover:-translate-x-1"
              : "transition-transform duration-300 group-hover:translate-x-1"
          }
        >
          {dir === "rtl" ? "←" : "→"}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        ref={attach as (n: HTMLAnchorElement | null) => void}
        href={href}
        className={styles}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        aria-label={ariaLabel}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      ref={attach as (n: HTMLButtonElement | null) => void}
      type={type}
      onClick={onClick}
      className={styles}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      aria-busy={loading}
      aria-label={ariaLabel}
    >
      {inner}
    </button>
  );
}
