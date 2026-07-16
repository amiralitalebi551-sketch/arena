"use client";
import { useEffect, useState } from "react";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-base-900/70 backdrop-blur-md"
          : "border-b border-transparent"
      )}
    >
      <nav
        className="container-content flex h-16 items-center justify-between"
        aria-label="Main"
      >
        <a href="#main" className="flex items-center gap-2 font-display text-lg font-semibold">
          <span
            className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent shadow-glow"
            aria-hidden="true"
          />
          {site.name}
        </a>

        <ul className="hidden items-center gap-8 md:flex">
          {site.nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="text-sm text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={site.cta.secondary.href}
            className="text-sm text-ink-soft transition-colors hover:text-ink"
          >
            {site.cta.secondary.label}
          </a>
          <a
            href={site.cta.primary.href}
            className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-400"
          >
            {site.cta.primary.label}
          </a>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span
              className={cn(
                "block h-0.5 w-5 bg-ink transition-transform",
                open && "translate-y-2 rotate-45"
              )}
            />
            <span className={cn("block h-0.5 w-5 bg-ink transition-opacity", open && "opacity-0")} />
            <span
              className={cn(
                "block h-0.5 w-5 bg-ink transition-transform",
                open && "-translate-y-2 -rotate-45"
              )}
            />
          </div>
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-white/10 bg-base-900/95 backdrop-blur-md md:hidden">
          <ul className="container-content flex flex-col gap-1 py-4">
            {site.nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-3 text-ink-soft hover:bg-white/5 hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="mt-2">
              <a
                href={site.cta.primary.href}
                onClick={() => setOpen(false)}
                className="block rounded-full bg-primary px-5 py-3 text-center font-medium text-white"
              >
                {site.cta.primary.label}
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
