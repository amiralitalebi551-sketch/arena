"use client";
import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { site } from "@/data/site";

type Status = "idle" | "loading" | "success" | "error";

export function FinalCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const validate = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(email)) {
      setError("لطفاً یک ایمیل معتبر وارد کنید.");
      setStatus("error");
      return;
    }
    setError("");
    setStatus("loading");
    try {
      // ارسال شبیه‌سازی‌شده — در نسخه‌ی واقعی به CRM / روت API خودت وصلش کن.
      // ساختار try/catch/finally عمداً اینجاست تا هنگام اتصال fetch واقعی،
      // خطاها به‌درستی مدیریت شوند و وضعیت روی "loading" گیر نکند.
      await new Promise((resolve) => setTimeout(resolve, 1100));
      setStatus("success");
    } catch {
      setError("ارسال ناموفق بود. لطفاً دوباره تلاش کنید.");
      setStatus("error");
    }
  };

  return (
    <section id="final-cta" className="relative py-24 sm:py-32">
      <div className="container-content">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-base-800 to-base-900 px-6 py-16 text-center sm:px-16">
            <div
              className="animate-aurora pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-[100px]"
              aria-hidden="true"
            />
            <div
              className="animate-aurora pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-primary/25 blur-[100px]"
              style={{ animationDelay: "-7s" }}
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="heading-lg mb-4">
                همین امروز تیم ایجنت‌هایت را فعال کن.
              </h2>
              <p className="mb-8 text-ink-soft">
                به برندت یک استودیو بده که هرگز نمی‌خوابد. رایگان با پلن فردی
                شروع کن، یا یک دموی کامل از مجموعه‌ی ایجنت‌ها رزرو کن.
              </p>

              {status === "success" ? (
                <div
                  role="status"
                  className="mx-auto max-w-md rounded-2xl border border-accent/40 bg-accent/10 px-6 py-5 text-accent"
                >
                  ثبت شد! به‌زودی از طریق{" "}
                  <span className="font-medium" dir="ltr">
                    {email}
                  </span>{" "}
                  با شما تماس می‌گیریم.
                </div>
              ) : (
                <form
                  onSubmit={onSubmit}
                  noValidate
                  className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
                >
                  <div className="flex-1 text-right">
                    <label htmlFor="cta-email" className="sr-only">
                      ایمیل کاری
                    </label>
                    <input
                      id="cta-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      dir="ltr"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status === "error") setStatus("idle");
                      }}
                      aria-invalid={status === "error"}
                      aria-describedby={status === "error" ? "cta-error" : undefined}
                      className="w-full rounded-full border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm text-ink placeholder:text-ink-faint focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    {status === "error" && (
                      <p id="cta-error" className="mt-2 pr-4 text-sm text-warm">
                        {error}
                      </p>
                    )}
                  </div>
                  <MagneticButton
                    variant="primary"
                    type="submit"
                    loading={status === "loading"}
                    ariaLabel={site.cta.primary.label}
                  >
                    {site.cta.primary.label}
                  </MagneticButton>
                </form>
              )}
              <p className="mt-4 text-xs text-ink-faint">
                بدون نیاز به کارت بانکی · لغو در هر زمان
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
