"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Faq — accordion.
 *
 * Managed rather than <details> so the open/close height can transition
 * in both directions (a closed <details> doesn't render its content, so
 * there is nothing to animate).
 *
 * The height is MEASURED, not expressed as `grid-template-rows: 0fr →
 * 1fr`. That trick works in Chrome and silently fails in Safari: the
 * answer's wrapper needs `overflow: hidden` to clip while closed, an
 * overflow-hidden grid item has an automatic minimum size of 0, and with
 * an indefinite container height Safari then resolves `1fr` to 0 — so
 * the row toggled, the panel stayed shut, and it looked like the tap had
 * been ignored. Chrome special-cases it, which is exactly why it was
 * invisible on desktop.
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
  const answerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [heights, setHeights] = useState<number[]>([]);

  // Re-measured rather than measured once: an answer's height changes
  // when the webfont lands and every time the column reflows, and a
  // stale number would clip the last line or leave a gap under it.
  useEffect(() => {
    const measure = () =>
      setHeights(answerRefs.current.map((node) => node?.scrollHeight ?? 0));

    measure();
    const observer = new ResizeObserver(measure);
    for (const node of answerRefs.current) if (node) observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
                    className="faq-row flex w-full items-center justify-between gap-8 py-6 text-left"
                  >
                    <span className="faq-q text-[clamp(1rem,1.5vw,1.1875rem)] font-medium text-ink">
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
                  className="faq-panel"
                  style={{ height: isOpen ? `${heights[i] ?? 0}px` : 0 }}
                >
                  <div
                    ref={(node) => {
                      answerRefs.current[i] = node;
                    }}
                  >
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
