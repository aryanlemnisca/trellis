"use client";

import { useEffect, useRef, useState } from "react";
import { Glass, GlassPulse, GlassScene } from "@/components/glass";
import LOOP_GEOMETRY from "@/lib/stage/loop-geometry.json";
import {
  BEATS,
  CHAPTERS,
  CLOSING_STEPS,
  PROBLEM_CARDS,
  type Stage as LoopStage,
} from "./content";

/**
 * Every card on the board is a glass panel, so it must be a DIRECT child
 * of the scene root — a nested one is dropped with a console warning —
 * and it must paint nothing itself: a background or border on a panel is
 * captured as content and composited over the shader, which reads as a
 * flat overlay rather than glass. The edge highlight in GLASS_SPEC is
 * what draws the box.
 *
 * They are also mounted permanently and moved off the board when their
 * beat isn't active, rather than being mounted per beat. Two reasons:
 * GlassScene re-initialises whenever the panel set changes, which would
 * stall the scroll on every entry and exit; and a glass panel is
 * composited into the scene of every panel after it in the DOM
 * regardless of its opacity, so fading them out would ghost them inside
 * the readout.
 */
const CARDS = PROBLEM_CARDS;

/**
 * Stage — hero and scroll narrative as one object.
 *
 * The board panel is pinned from the very first frame: it plays the
 * hero entrance, holds through every chapter while the camera pans
 * across the illustration, then expands into the closing box and turns
 * white. The chapters scroll past on the left and give the section its
 * height.
 *
 * Three drivers, deliberately separate:
 *   - which beat is showing → IntersectionObserver, one React state
 *     change per beat
 *   - the expansion → rAF scroll read writing a single `--e` custom
 *     property; every dependent value is derived from it in CSS
 *   - which overlay is on screen → a two-slot wipe. The landscape
 *     underneath never changes, so only the thin overlay transitions —
 *     which is what keeps the four chapters reading as one object being
 *     reinterpreted rather than four separate pictures. Two slots and
 *     not more because the glass renderer draws direct-child media
 *     through drawImage and ignores CSS opacity: every mounted layer is
 *     sampled at full strength, so a full stack would show all four
 *     overlays at once inside the glass.
 *
 * Below `lg` none of it applies: the panel sits above the copy, the
 * chapters stack with cropped stills, and there is no glass.
 */

/** Scroll runway the closing box takes to open, in viewport heights. */
const EXPAND_VH = 120;
/** Runway the loop beat takes to walk its six stages, in viewport heights. */
const LOOP_VH = 300;

const HERO_ALT =
  "Plate to pilot to production: a route climbing a response surface";
const SURFACE_ALT =
  "A response surface of rolling ridges, drawn as a wireframe landscape";

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const smoothstep = (n: number) => n * n * (3 - 2 * n);

export function Stage() {
  const sectionRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const [beat, setBeat] = useState(0);
  const beatRef = useRef(0);
  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);

  // Mirrored into a ref so the scroll writer, whose closure is built once,
  // can read the current beat without being torn down on every change.
  useEffect(() => {
    beatRef.current = beat;
  }, [beat]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let frame = 0;
    const write = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) return;
      // Measured rather than derived from per-chapter constants: the
      // chapters are no longer all one viewport tall, so the share of the
      // travel the expansion occupies isn't a fixed fraction.
      const expandPx = window.innerHeight * (EXPAND_VH / 100);
      const scrolled = Math.min(Math.max(-rect.top, 0), travel);
      const e = clamp01((scrolled - (travel - expandPx)) / expandPx);
      section.style.setProperty("--e", smoothstep(e).toFixed(4));

      const expanded = e > 0.9 ? "true" : "false";
      if (section.dataset.expanded !== expanded) {
        section.dataset.expanded = expanded;
      }

      // Discrete so the ink layer can be display:none until it is wanted.
      const opening = e > 0.02 ? "true" : "false";
      if (section.dataset.opening !== opening) {
        section.dataset.opening = opening;
      }

      // How far through the active chapter we are, so content inside the
      // panel can be revealed by scroll position rather than by a timer
      // that fires whether or not the reader is still moving.
      const chapter = chapterRefs.current[beatRef.current - 1];
      if (!chapter) return;
      const c = chapter.getBoundingClientRect();
      const p = clamp01((window.innerHeight * 0.55 - c.top) / c.height);
      section.style.setProperty("--p", p.toFixed(4));

      // Discrete, so it can drive a React render: at most one change per
      // stage, not one per frame.
      const stages = BEATS[beatRef.current]?.stages;
      if (stages) {
        const next = Math.min(Math.floor(p * (stages.length + 0.3)), stages.length - 1);
        if (next !== stageRef.current) {
          stageRef.current = next;
          setStage(next);
        }
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-beat]"),
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-beat"));
          setBeat((current) => (current === index ? current : index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  // Incoming and outgoing artwork. See the note above: mounted layers
  // are what the glass samples, so the set is kept to exactly two during
  // a transition and one at rest.
  const [layers, setLayers] = useState<[number, number | null]>([0, null]);
  const [shown, setShown] = useState(0);

  // Derived during render rather than in an effect: the outgoing layer
  // has to be in the very first commit that shows the new one, or the
  // panel blinks empty for a frame.
  if (shown !== beat) {
    setShown(beat);
    setLayers([beat, shown]);
  }

  useEffect(() => {
    if (layers[1] === null) return;
    const done = setTimeout(() => setLayers([layers[0], null]), 640);
    return () => clearTimeout(done);
  }, [layers]);

  return (
    <section
      ref={sectionRef}
      data-beat={BEATS[beat].id}
      data-readout={BEATS[beat].readout !== null}
      className="stage relative bg-paper"
    >
      {/* Copy column — normal flow, and what gives the section height. */}
      <div className="stage-copy relative z-10 lg:w-[48vw]">
        <HeroCopy />
        {CHAPTERS.map((chapter, i) => (
          <article
            key={chapter.step}
            ref={(node) => {
              chapterRefs.current[i] = node;
            }}
            data-beat={i + 1}
            style={
              BEATS[i + 1].stages
                ? ({ "--runway": `${LOOP_VH}vh` } as React.CSSProperties)
                : undefined
            }
            className={
              BEATS[i + 1].stages
                ? "lg:min-h-[var(--runway)]"
                : "flex min-h-[78vh] flex-col justify-center gap-6 px-6 py-16 sm:px-10 lg:min-h-screen lg:px-14 lg:py-0 xl:px-20"
            }
          >
            <div
              className={
                BEATS[i + 1].stages
                  ? "flex min-h-[78vh] flex-col justify-center gap-6 px-6 py-16 sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:min-h-0 lg:px-14 lg:py-0 xl:px-20"
                  : "contents"
              }
            >
            <div className="flex items-baseline gap-4">
              <span className="text-xs font-semibold tabular-nums text-ink-300">
                {chapter.step}
              </span>
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-ink-500">
                {chapter.kicker}
              </span>
            </div>
            <h2 className="max-w-[19ch] text-[clamp(1.875rem,3.4vw,2.875rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink">
              {chapter.heading}
            </h2>
            {chapter.body.map((paragraph, p) => (
              <p
                key={p}
                className="max-w-[48ch] text-[0.9375rem] leading-relaxed text-ink-500"
              >
                {paragraph}
              </p>
            ))}
            <Still overlay={BEATS[i + 1].overlay} className="mt-4" />
            </div>
          </article>
        ))}

        {/* Stacked layout gets the closing panel as a plain box. */}
        <div className="px-6 pb-20 sm:px-10 lg:hidden">
          <div className="relative overflow-hidden rounded-[32px] border border-ink-300/60 bg-ink-100/50 p-8 sm:p-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustration/path-ink.png"
              alt={HERO_ALT}
              className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-25"
            />
            <div className="relative">
              <Closing />
            </div>
          </div>
        </div>

        <div aria-hidden className="hidden lg:block" style={{ height: `${EXPAND_VH}vh` }} />
      </div>

      {/* Pinned panel — desktop only. */}
      <div className="stage-pin pointer-events-none absolute inset-0 z-20 hidden lg:block">
        <div className="sticky top-0 h-screen">
          <GlassScene
            className="stage-panel pointer-events-auto absolute overflow-hidden"
            backdropClassName="stage-backdrop"
            delayMs={1850}
          >
            <div aria-hidden className="stage-grid absolute inset-0" />

            {/* The landscape: one element, never swapped while it is on
                screen. Mounted only for beats that put something on it —
                a beat with no overlay is a bare field. */}
            {BEATS[beat].overlay === null ? null : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/illustration/surface.svg"
                alt={SURFACE_ALT}
                className="stage-art stage-surface"
              />
            )}

            {/* Overlays: only the incoming and outgoing are mounted, and
                a mounted layer is a sampled layer. */}
            {layers.map((index, slot) => {
              const overlay = BEATS[index ?? 0].overlay;
              if (index === null || overlay === null) return null;
              return (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={BEATS[index].id}
                  src={overlay}
                  alt=""
                  aria-hidden
                  data-active={slot === 0}
                  className="stage-art stage-overlay"
                />
              );
            })}

            {/* The hero drawing returns for the closing box, sliding in
                with the expansion. Mounted only once the box starts
                opening — a mounted layer is a sampled layer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustration/path-ink.png"
              alt={HERO_ALT}
              className="stage-art stage-art-ink"
            />

            <Glass className="stage-readout absolute flex w-[21.5rem] flex-col justify-center px-10 py-9">
              {BEATS[beat].readout}
            </Glass>

            {BEATS[beat].stages ? (
              <LoopNodes stages={BEATS[beat].stages!} active={stage} />
            ) : null}

            {/* Card panels are permanently mounted, and moved off the
                board rather than unmounted — see CARDS. */}
            {CARDS.map((card, i) => (
              <Glass
                key={card.n}
                style={{ "--i": i } as React.CSSProperties}
                className={`stage-card absolute flex w-[min(80%,25rem)] flex-col px-9 py-8 ${
                  i === 1 ? "right-[2.5vw]" : "left-[2.5vw]"
                }`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-[0.625rem] font-semibold tabular-nums text-paper/50">
                    {card.n}
                  </span>
                  <span className="text-[0.625rem] font-medium uppercase tracking-[0.26em] text-paper/50">
                    {card.kicker}
                  </span>
                </div>
                <div className="mb-4">{card.figure}</div>
                <h3 className="mb-2 text-[1.0625rem] font-semibold leading-snug tracking-[-0.01em] text-paper">
                  {card.heading}
                </h3>
                <p className="text-[0.8125rem] leading-relaxed text-paper/65">
                  {card.body}
                </p>
              </Glass>
            ))}

            <div className="stage-closing absolute inset-0 p-12 xl:p-16">
              <Closing />
            </div>

            <GlassPulse pulseKey={beat} />
          </GlassScene>
        </div>
      </div>
    </section>
  );
}

/**
 * The six stages, as DOM nodes on the ring the loop artwork draws.
 *
 * HTML rather than part of the SVG because the labels have to render in
 * Inter, and an SVG loaded through <img> cannot fetch a webfont. They are
 * positioned from `lib/stage/loop-geometry.json`, which the artwork
 * generator emits — the same numbers that drew the ring, so the two can't
 * drift apart.
 *
 * Not glass: at the size the ring allows (~48px on the short edge) the
 * spec's zRadius would swallow the whole panel and read as a flat frosted
 * chip. The beat carries no glass readout either, which is what lets the
 * highlight change freely — a glass panel here would sample a stale
 * capture of these nodes, since the renderer doesn't observe attribute
 * changes on non-glass descendants.
 */
function LoopNodes({
  stages,
  active,
}: {
  stages: LoopStage[];
  active: number;
}) {
  const { cx, cy, rx, ry, w, h } = LOOP_GEOMETRY;
  return (
    <div className="stage-loop absolute" aria-hidden={false}>
      {stages.map((item, i) => {
        const angle = (-90 + i * 60) * (Math.PI / 180);
        return (
          <div
            key={item.name}
            data-active={i === active}
            className="stage-node absolute"
            style={{
              left: `${((cx + rx * Math.cos(angle)) / w) * 100}%`,
              top: `${((cy + ry * Math.sin(angle)) / h) * 100}%`,
            }}
          >
            <span className="stage-node-ring" />
            <span className="stage-node-label">{item.name}</span>
          </div>
        );
      })}

      {/* Counter in the hub, description below the ring — the drawn hub
          is only wide enough for one short line. */}
      <div
        className="stage-hub absolute"
        style={{ left: `${(cx / w) * 100}%`, top: `${(cy / h) * 100}%` }}
      >
        <span className="text-[0.6875rem] font-semibold tabular-nums tracking-[0.18em] text-paper">
          {String(active + 1).padStart(2, "0")}
        </span>
        <span className="text-[0.5625rem] font-medium uppercase tracking-[0.24em] text-paper/45">
          of {String(stages.length).padStart(2, "0")}
        </span>
      </div>

      <p
        className="stage-caption absolute"
        style={{
          left: `${(cx / w) * 100}%`,
          top: `${((cy + ry) / h) * 100}%`,
        }}
      >
        {stages[active].body}
      </p>
    </div>
  );
}

function HeroCopy() {
  return (
    <div
      data-beat={0}
      className="stage-hero relative flex min-h-dvh flex-col justify-center gap-5 px-6 pb-12 pt-[calc(34dvh+2.5rem)] sm:gap-6 sm:px-10 lg:pt-0 lg:pb-0 lg:px-14 xl:px-20"
    >
      <h1
        style={{ "--i": 0 } as React.CSSProperties}
        className="hero-rise max-w-[16ch] text-[clamp(2.25rem,5.2vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-ink"
      >
        The shortest path for your bioprocess
      </h1>
      <p
        style={{ "--i": 1 } as React.CSSProperties}
        className="hero-rise text-[clamp(1rem,1.35vw,1.1875rem)] font-medium text-ink-700"
      >
        from plate to pilot to production
      </p>
      <p
        style={{ "--i": 2 } as React.CSSProperties}
        className="hero-rise max-w-[46ch] text-[0.9375rem] leading-relaxed text-ink-500"
      >
        Every bioprocess is a large, partially observed system. Trellis builds
        one evolving model of yours, so each experiment adds the evidence your
        next decision actually needs.
      </p>
      <div
        style={{ "--i": 3 } as React.CSSProperties}
        className="hero-rise flex flex-wrap items-center gap-3 pt-2"
      >
        <a
          href="#start"
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-150 ease-in hover:bg-ink-700"
        >
          Start with one decision
        </a>
        <a
          href="#faq"
          className="rounded-full px-6 py-3 text-sm font-medium text-ink-700 ring-1 ring-ink-300 transition-colors duration-150 ease-in hover:bg-ink-100"
        >
          Questions we get asked
        </a>
      </div>

      {/* Stacked hero panel. */}
      <div
        aria-hidden
        className="stage-hero-panel absolute inset-x-0 top-0 h-[34dvh] overflow-hidden rounded-b-[36px] bg-board lg:hidden"
      >
        <div className="stage-grid absolute inset-0" />
      </div>
    </div>
  );
}

/** Surface plus the beat's overlay, for the stacked layout. */
function Still({
  overlay,
  className,
}: {
  overlay: string | null;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-[28px] bg-board lg:hidden ${className ?? ""}`}
    >
      <div aria-hidden className="stage-grid absolute inset-0" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustration/surface.svg"
        alt={SURFACE_ALT}
        className="absolute inset-0 h-full w-full object-contain p-4"
      />
      {overlay ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={overlay}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain p-4"
        />
      ) : null}
    </div>
  );
}

function Closing() {
  return (
    <div
      id="start"
      className="grid h-full grid-cols-1 items-center gap-10 xl:grid-cols-[1fr_minmax(0,24rem)]"
    >
      <div className="flex flex-col gap-6">
        <span className="text-[0.6875rem] font-medium uppercase tracking-[0.3em] text-ink-500">
          Start here
        </span>
        <h2 className="max-w-[15ch] text-[clamp(1.75rem,3.4vw,3rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-ink">
          Bring us the development decision you&apos;re still uncertain about.
        </h2>
        <p className="max-w-[42ch] text-[0.9375rem] leading-relaxed text-ink-500">
          Start with one real decision, not a platform migration. We configure
          Trellis around it and you keep every assumption in view.
        </p>
      </div>

      <div className="rounded-[28px] border border-ink-300/60 bg-paper p-8">
        <ol className="flex flex-col gap-6">
          {CLOSING_STEPS.map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="pt-0.5 text-xs font-semibold tabular-nums text-ink-300">
                {step.n}
              </span>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-ink">
                  {step.title}
                </span>
                <span className="text-[0.8125rem] leading-relaxed text-ink-500">
                  {step.body}
                </span>
              </div>
            </li>
          ))}
        </ol>
        <a
          href="mailto:shilpa@lemnisca.bio?subject=Trellis%20—%20a%20development%20decision"
          className="mt-8 inline-flex rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors duration-150 ease-in hover:bg-ink-700"
        >
          Start with one decision
        </a>
      </div>
    </div>
  );
}
