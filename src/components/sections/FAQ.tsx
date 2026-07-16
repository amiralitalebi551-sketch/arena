"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useI18n } from "@/i18n/I18nProvider";

export function FAQ() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();

  return (
    <section id="faq" className="relative py-section">
      <div className="container-content max-w-3xl">
        <Reveal className="mb-14 text-center">
          <p className="eyebrow mb-5">{t.faqHead.eyebrow}</p>
          <h2 className="heading-lg">{t.faqHead.title}</h2>
        </Reveal>

        <dl className="divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {t.faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <dt>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    id={`faq-button-${i}`}
                    className="flex w-full items-center justify-between gap-6 py-6 text-start"
                  >
                    <span className="font-display text-lg font-medium">{f.q}</span>
                    <span
                      className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 text-xl transition-transform duration-300 " + (isOpen ? "rotate-45 bg-primary text-white" : "text-ink-soft")}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                </dt>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.dd
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-button-${i}`}
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduced ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-ink-soft" style={{ paddingInlineEnd: "3.5rem" }}>{f.a}</p>
                    </motion.dd>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
