"use client";
import { cn } from "@/lib/utils";
import { useMagnetic } from "@/lib/useMagnetic";

interface Props {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  loading?: boolean;
  ariaLabel?: string;
  magnetic?: boolean;
}

/** دکمه‌ی تمیز با افکت مغناطیسی اختیاری (نرم و امن). */
export function Button({
  href,
  children,
  variant = "primary",
  className,
  type = "button",
  onClick,
  loading = false,
  ariaLabel,
  magnetic = false,
}: Props) {
  const { ref, onMove, onLeave } = useMagnetic(0.3);

  const cls = cn(
    "btn will-change-transform",
    variant === "primary" ? "btn-primary" : "btn-secondary",
    loading && "pointer-events-none opacity-70",
    className
  );
  const inner = (
    <>
      {loading && (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      )}
      {children}
    </>
  );

  const magProps = magnetic ? { onMouseMove: onMove, onMouseLeave: onLeave } : {};

  if (href) {
    return (
      <a
        ref={magnetic ? (ref as React.RefObject<HTMLAnchorElement>) : undefined}
        href={href}
        className={cls}
        aria-label={ariaLabel}
        {...magProps}
      >
        {inner}
      </a>
    );
  }
  return (
    <button
      ref={magnetic ? (ref as React.RefObject<HTMLButtonElement>) : undefined}
      type={type}
      onClick={onClick}
      className={cls}
      aria-label={ariaLabel}
      aria-busy={loading}
      {...magProps}
    >
      {inner}
    </button>
  );
}
