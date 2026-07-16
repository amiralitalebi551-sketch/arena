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
      setError("Please enter a valid email address.");
      setStatus("error");
      return;
    }
    setError("");
    setStatus("loading");
    // Simulated submission — wire to your CRM / API route in production.
    await new Promise((r) => setTimeout(r, 1100));
    setStatus("success");
  };

  return (
    <section id="final-cta" className="relative py-24 sm:py-32">
      <div className="container-content">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-primary/15 via-base-800 to-base-900 px-6 py-16 text-center sm:px-16">
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/20 blur-[100px]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-primary/25 blur-[100px]"
              aria-hidden="true"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="heading-lg mb-4">
                Deploy your agent team today.
              </h2>
              <p className="mb-8 text-ink-soft">
                Give your brand a studio that never sleeps. Start free on Solo,
                or book a walkthrough of the full roster.
              </p>

              {status === "success" ? (
                <div
                  role="status"
                  className="mx-auto max-w-md rounded-2xl border border-accent/40 bg-accent/10 px-6 py-5 text-accent"
                >
                  You&apos;re on the list. We&apos;ll reach out at{" "}
                  <span className="font-medium">{email}</span> shortly.
                </div>
              ) : (
                <form
                  onSubmit={onSubmit}
                  noValidate
                  className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
                >
                  <div className="flex-1 text-left">
                    <label htmlFor="cta-email" className="sr-only">
                      Work email
                    </label>
                    <input
                      id="cta-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
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
                      <p id="cta-error" className="mt-2 pl-4 text-sm text-warm">
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
                No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
