"use client";
import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { validateEmail } from "@/lib/validation";
import { useI18n } from "@/i18n/I18nProvider";

type Status = "idle" | "loading" | "success" | "error";

export function FinalCTA() {
  const { t, dir } = useI18n();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateEmail(email);
    if (!result.valid) {
      setError(t.finalCta.errorInvalid);
      setStatus("error");
      return;
    }
    setEmail(result.value);
    setError("");
    setStatus("loading");
    try {
      // ارسال شبیه‌سازی‌شده — در نسخه‌ی واقعی به CRM/روت API وصل شود.
      await new Promise((resolve) => setTimeout(resolve, 1100));
      setStatus("success");
    } catch {
      setError(t.finalCta.errorFailed);
      setStatus("error");
    }
  };

  const successMsg = t.finalCta.success.split("{email}");

  return (
    <section id="final-cta" className="relative py-section">
      <div className="container-content">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-base-800 to-base-900 px-6 py-16 text-center sm:px-16">
            <div className="animate-aurora pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" aria-hidden="true" />
            <div className="animate-aurora pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-primary/25 blur-[100px]" style={{ animationDelay: "-7s" }} aria-hidden="true" />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="heading-lg mb-4">{t.finalCta.title}</h2>
              <p className="mb-8 text-ink-soft">{t.finalCta.body}</p>

              {status === "success" ? (
                <div role="status" className="mx-auto max-w-md rounded-2xl border border-accent/40 bg-accent/10 px-6 py-5 text-accent">
                  {successMsg[0]}
                  <span className="font-medium" dir="ltr">{email}</span>
                  {successMsg[1]}
                </div>
              ) : (
                <form onSubmit={onSubmit} noValidate className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
                  <div className="flex-1 text-start">
                    <label htmlFor="cta-email" className="sr-only">{t.finalCta.emailLabel}</label>
                    <input
                      id="cta-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={254}
                      required
                      dir="ltr"
                      placeholder={t.finalCta.placeholder}
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
                      <p id="cta-error" className="mt-2 text-sm text-warm" style={{ paddingInlineStart: "1rem" }}>{error}</p>
                    )}
                  </div>
                  <MagneticButton variant="primary" type="submit" dir={dir} loading={status === "loading"} ariaLabel={t.finalCta.submitLabel}>
                    {t.finalCta.submitLabel}
                  </MagneticButton>
                </form>
              )}
              <p className="mt-4 text-xs text-ink-faint">{t.finalCta.fineprint}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
