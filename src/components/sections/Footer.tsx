import { site } from "@/data/site";

export function Footer() {
  const year = new Date().getFullYear();
  // سال شمسی تقریبی برای نمایش فارسی
  const yearFa = (year - 621).toLocaleString("fa-IR", { useGrouping: false });

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
              تیم‌های تخصصی مولتی‌ایجنت برای مدیا و برندینگ. هوش، هماهنگ‌شده.
            </p>
            <a
              href={`mailto:${site.email}`}
              className="mt-4 inline-block text-sm text-accent hover:underline"
              dir="ltr"
            >
              {site.email}
            </a>
          </div>

          <nav aria-label="محصول">
            <h3 className="mb-4 text-sm font-medium text-ink">محصول</h3>
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

          <nav aria-label="شرکت">
            <h3 className="mb-4 text-sm font-medium text-ink">شرکت</h3>
            <ul className="space-y-3 text-sm text-ink-soft">
              <li><a href="#work" className="hover:text-ink">درباره ما</a></li>
              <li><a href="#work" className="hover:text-ink">نمونه‌کارها</a></li>
              <li><a href="#faq" className="hover:text-ink">فرصت‌های شغلی</a></li>
              <li><a href={`mailto:${site.email}`} className="hover:text-ink">تماس با ما</a></li>
            </ul>
          </nav>

          <nav aria-label="شبکه‌های اجتماعی">
            <h3 className="mb-4 text-sm font-medium text-ink">دنبال کنید</h3>
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
          <p>© {yearFa} {site.name}. تمام حقوق محفوظ است.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-ink-soft">حریم خصوصی</a>
            <a href="#" className="hover:text-ink-soft">قوانین</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
