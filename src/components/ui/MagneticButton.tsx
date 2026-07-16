"use client";
import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/useReducedMotion";

interface Props {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  onClick?: () => void;
  loading?: boolean;
  ariaLabel?: string;
  type?: "button" | "submit";
}

export function MagneticButton({
  href,
  children,
  variant = "primary",
  className,
  onClick,
  loading = false,
  ariaLabel,
  type = "button",
}: Props) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  const handleMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setPos({ x: x * 0.25, y: y * 0.25 });
  };
  const reset = () => setPos({ x: 0, y: 0 });

  const styles = cn(
    "group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium tracking-wide transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-base-900",
    variant === "primary"
      ? "bg-primary text-white shadow-glow hover:bg-primary-400 focus-visible:ring-primary-400"
      : "border border-white/15 bg-white/[0.03] text-ink hover:border-white/30 hover:bg-white/[0.06] focus-visible:ring-accent-400",
    loading && "pointer-events-none opacity-70",
    className
  );

  const inner = (
    <>
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
      {variant === "primary" && !loading && (
        <span
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:-translate-x-1"
        >
          ←
        </span>
      )}
    </>
  );

  const motionProps = {
    animate: { x: pos.x, y: pos.y },
    transition: { type: "spring" as const, stiffness: 200, damping: 15, mass: 0.4 },
    onMouseMove: handleMove,
    onMouseLeave: reset,
    "aria-busy": loading,
    "aria-label": ariaLabel,
  };

  if (href) {
    return (
      <motion.a
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={styles}
        {...motionProps}
      >
        {inner}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      onClick={onClick}
      className={styles}
      {...motionProps}
    >
      {inner}
    </motion.button>
  );
}
