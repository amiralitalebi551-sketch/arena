"use client";

/**
 * Lightweight, dependency-free 2D fallback for the hero visual.
 * Rendered when WebGL is unavailable. Pure CSS gradients + SVG — no canvas.
 */
export function StaticFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_35%_30%,#6D5EF6_0%,#5A4CE0_35%,#22D3EE_75%,transparent_100%)] opacity-60 blur-[2px]" />
      <div className="absolute left-1/2 top-1/2 h-[62vmin] w-[62vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" />
      <div className="absolute left-1/2 top-1/2 h-[74vmin] w-[74vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/15" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_30%,#0A0B14_75%)]" />
    </div>
  );
}
