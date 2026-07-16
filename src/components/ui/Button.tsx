import { cn } from "@/lib/utils";

interface Props {
  href?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  loading?: boolean;
  ariaLabel?: string;
}

/** دکمه‌ی ساده و مطمئن — بدون افکت پیچیده، فقط hover/focus تمیز. */
export function Button({
  href,
  children,
  variant = "primary",
  className,
  type = "button",
  onClick,
  loading = false,
  ariaLabel,
}: Props) {
  const cls = cn(
    "btn",
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

  if (href) {
    return (
      <a href={href} className={cls} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls} aria-label={ariaLabel} aria-busy={loading}>
      {inner}
    </button>
  );
}
