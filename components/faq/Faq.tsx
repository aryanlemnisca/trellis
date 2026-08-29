"use client";

import { useState } from "react";

/**
 * Faq — accordion.
 * Managed rather than <details> so the open/close height can transition
 * in both directions (a closed <details> doesn't render its content, so
 * there is nothing to animate).
 */

const ITEMS = [
  {
    q: "We only have a handful of runs. Is that enough to start?",
    a: "That is the case Trellis is built for. It combines whatever experimental evidence you already have with published process knowledge, so the first model is grounded even when the run count is small — and every run after that sharpens it.",
  },
  {
    q: "How is this different from DoE?",
    a: "DoE fixes the whole experimental programme up front and spreads runs evenly across the design space. Trellis chooses each round from what the current model knows, balancing exploration of uncertain regions against exploitation of promising ones. On the same benchmark process that difference was roughly 77% versus effectively the full optimum.",
  },
  {
    q: "Does Trellis decide what we run?",
    a: "No. It recommends. The scientist defines the objective, factors and constraints, reviews what the model has learned, and decides whether the model needs refining before the next experiment runs. Assumptions, choices, uncertainty and recommendations all stay visible and reviewable.",
  },
  {
    q: "What happens when we move from plate to pilot?",
    a: "Nothing resets. The same model carries forward, now also accounting for scale-dependent behaviour. That is the whole point of the approach: the stage where experiments get most expensive is the stage that inherits the most understanding.",
  },
  {
    q: "Which processes does this apply to?",
    a: "The published benchmark is a 12-factor CHO fed-batch process, but the method is not specific to CHO. If your process has parameters that interact, responses you care about, and fewer experiments than questions, it applies.",
  },
  {
    q: "What does a focused pilot actually involve?",
    a: "One live process with an unresolved question, an agreed objective and success measure, and a short round of experiments. You review what the model learned and decide the next step from there.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative px-6 pb-28 pt-24 sm:px-10 lg:px-14 xl:px-20">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="mb-12 text-[clamp(1.75rem,3vw,2.5rem)] font-semibold tracking-[-0.03em] text-ink">
          Questions we get asked
        </h2>

        <div className="border-t border-ink-300">
          {ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className="border-b border-ink-300">
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-8 py-6 text-left"
                  >
                    <span className="text-[clamp(1rem,1.5vw,1.1875rem)] font-medium text-ink">
                      {item.q}
                    </span>
                    <span
                      aria-hidden
                      data-open={isOpen}
                      className="faq-plus relative h-4 w-4 shrink-0 text-ink-500"
                    />
                  </button>
                </h3>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  data-open={isOpen}
                  className="faq-panel"
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[68ch] pb-7 text-[0.9375rem] leading-relaxed text-ink-500">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
