import { site } from "@/data/site";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/[0.07] bg-base-900">
      <div className="container-content py-16">
        <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <a href="#main" className="flex items-center gap-2 font-display text-lg font-semibold">
              <span
                className="inline-block h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent"
                aria-hidden="true"
              />
              {site.name}
            </a>
            <p className="mt-4 max-w-xs text-sm text-ink-soft">
              Specialized AI agent teams for media &amp; branding. Intelligence,
              orchestrated.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-4 inline-block text-sm text-accent hover:underline"
            >
              {site.email}
            </a>
          </div>

          <nav aria-label="Product">
            <h3 className="mb-4 text-sm font-medium text-ink">Product</h3>
            <ul className="space-y-3 text-sm text-ink-soft">
              {site.nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="hover:text-ink">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="mb-4 text-sm font-medium text-ink">Company</h3>
            <ul className="space-y-3 text-sm text-ink-soft">
              <li><a href="#work" className="hover:text-ink">About</a></li>
              <li><a href="#work" className="hover:text-ink">Portfolio</a></li>
              <li><a href="#faq" className="hover:text-ink">Careers</a></li>
              <li><a href={`mailto:${site.email}`} className="hover:text-ink">Contact</a></li>
            </ul>
          </nav>

          <nav aria-label="Social">
            <h3 className="mb-4 text-sm font-medium text-ink">Follow</h3>
            <ul className="space-y-3 text-sm text-ink-soft">
              {site.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="hover:text-ink"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.07] pt-8 text-sm text-ink-faint sm:flex-row">
          <p>© {year} {site.name}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink-soft">Privacy</a>
            <a href="#" className="hover:text-ink-soft">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
