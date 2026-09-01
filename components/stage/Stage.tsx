"use client";

import { useEffect, useRef, useState } from "react";
import posthog from "posthog-js";
import { Glass, GlassButton, GlassPulse, GlassScene } from "@/components/glass";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { BenchmarkPlot } from "./BenchmarkPlot";
import { LoopCaption, LoopDiagram } from "./LoopDiagram";
import { LOOP_CLOSED_AT } from "@/lib/stage/loop-diagram";
import {
  BEATS,
  CHAPTERS,
  CLOSING_STEPS,
  HERO_NOTES,
  LOOP_STAGES,
  PROBLEM_CARDS,
  type Card,
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
 * Which card sits in which slot on the board.
 *
 * A plain vertical stack, top to bottom in card order — no overlap, so
 * paint order doesn't matter the way it did for the old corner cascade.
 * The geometry (fixed height per card, so absolutely-positioned siblings
 * can stack without knowing each other's real content height) lives in
 * globals.css.
 */
const CARD_SLOTS = [
  { slot: "stage-card-1", card: 0 },
  { slot: "stage-card-2", card: 1 },
  { slot: "stage-card-3", card: 2 },
];

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

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const smoothstep = (n: number) => n * n * (3 - 2 * n);

/**
 * "See how it works" has to land past the point the loop closes, not on
 * the chapter's own top edge — a plain `#how-it-works` anchor jumps to
 * p2≈0, where only the first box or two have arrived, since the loop
 * reveals against scroll (see lib/stage/loop-diagram.ts). This solves
 * the SAME formula the scroll writer uses for `--p2` for the scroll
 * offset that lands just past `LOOP_CLOSED_AT`, so the reader arrives on
 * the finished, closed loop instead of having to scroll it open by hand.
 *
 * Below `lg` there is no scroll-jacked reveal — `LoopStill` is always
 * fully drawn — so a plain scroll to the chapter's top is enough there.
 */
function scrollToLoopChapter() {
  const el = document.getElementById("how-it-works");
  if (!el) return;
  if (!window.matchMedia("(min-width: 1024px)").matches) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const rect = el.getBoundingClientRect();
  const elTop = window.scrollY + rect.top;
  const targetProgress = LOOP_CLOSED_AT + 0.1;
  const target = elTop - window.innerHeight * 0.55 + targetProgress * rect.height;
  window.scrollTo({ top: target, behavior: "smooth" });
}

export function Stage() {
  const sectionRef = useRef<HTMLElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const [beat, setBeat] = useState(0);
  const beatRef = useRef(0);
  // The hero drawing leaves on scroll, but it has to *unmount* once it
  // is out: a mounted layer is sampled by the glass at full strength
  // however faint it is, and the card cluster arrives right behind it.
  const [heroDrawing, setHeroDrawing] = useState(true);
  const heroDrawingRef = useRef(true);
  // The entrance wipe is a one-shot, and it has to be dropped once it
  // has played: the drawing unmounts when it scrolls away and mounts
  // again on the way back, and a mounted animation with a delay and a
  // `backwards` fill would replay from its hidden first frame — leaving
  // the drawing blank for the length of the delay every time the reader
  // scrolled back up to the hero.
  const [heroIntro, setHeroIntro] = useState(true);
  // One-shot: true once the entrance has finished, and never false again.
  const [notesReady, setNotesReady] = useState(false);
  // Which board drawing is mounted. See the mount windows in the scroll
  // writer: these overlap through the cross-fade at each hand-over.
  const [showLoop, setShowLoop] = useState(false);
  const loopRef = useRef(false);
  const [showChart, setShowChart] = useState(false);
  const chartRef = useRef(false);

  // Mirrored into a ref so the scroll writer, whose closure is built once,
  // can read the current beat without being torn down on every change.
  useEffect(() => {
    beatRef.current = beat;
  }, [beat]);

  // Cleared after the entrance has finished playing, so removing the
  // class is invisible: delay + duration of `hero-art-in`.
  useEffect(() => {
    const done = setTimeout(() => setHeroIntro(false), 2800);
    return () => clearTimeout(done);
  }, []);

  // The panel settles at 1750ms and the drawing has finished wiping on at
  // 2750ms — see `stage-panel-settle` and `hero-art-in`.
  useEffect(() => {
    const ready = setTimeout(() => setNotesReady(true), 2900);
    return () => clearTimeout(ready);
  }, []);

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

      // Flipped at the START of the closing content's fade, not the end.
      // At 0.9 the panel was invisible for 92% of its own fade and then
      // appeared at nine-tenths opacity — a pop, not an entrance. All
      // this gate is for is keeping the links out of the tab order while
      // there is nothing to see; that job is done the moment it fades in.
      const expanded = e > 0.5 ? "true" : "false";
      if (section.dataset.expanded !== expanded) {
        section.dataset.expanded = expanded;
      }

      // Discrete so the ink layer can be display:none until it is wanted.
      const opening = e > 0.02 ? "true" : "false";
      if (section.dataset.opening !== opening) {
        section.dataset.opening = opening;
      }

      // EVERY chapter publishes its own progress — `--p1`, `--p2`, `--p3`
      // — always, whatever the active beat is. Content on the board reads
      // the one it belongs to, and that is what lets an outgoing layer
      // hold its finished state while the incoming one fades in over it:
      // a single "active chapter" value snaps to the new chapter at the
      // hand-over, which would yank the outgoing layer back to its start
      // in the same frame it began fading.
      const progress = chapterRefs.current.map((el) => {
        if (!el) return 0;
        const r = el.getBoundingClientRect();
        return clamp01((window.innerHeight * 0.55 - r.top) / r.height);
      });
      progress.forEach((value, i) => {
        section.style.setProperty(`--p${i + 1}`, value.toFixed(4));
      });

      const [p1 = 0, p2 = 0, p3 = 0] = progress;

      // Discrete, and hysteresis-free on purpose: the drawing is fully
      // wiped by p1 0.18 (see `.stage-art-hero`), so unmounting a
      // little past that is invisible either way, in both directions.
      const showDrawing = p1 < 0.26;
      if (heroDrawingRef.current !== showDrawing) {
        heroDrawingRef.current = showDrawing;
        setHeroDrawing(showDrawing);
      }

      // Mount windows for the two board drawings. They have to UNMOUNT
      // rather than just fade: an opacity-0 layer is still sampled at
      // full strength by any glass panel over it, and the problem beat
      // parks its cards right where these sit. Each is mounted from the
      // start of its own chapter through the cross-fade at the far end.
      const showLoop = p2 > 0 && p3 < 0.24;
      if (loopRef.current !== showLoop) {
        loopRef.current = showLoop;
        setShowLoop(showLoop);
      }

      const showChart = p3 > 0;
      if (chartRef.current !== showChart) {
        chartRef.current = showChart;
        setShowChart(showChart);
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
    const section = sectionRef.current;
    if (!section) return;

    // Scoped to the section's own descendants, and guarded. The section
    // ITSELF carries data-beat — the beat's *id*, which the CSS keys off
    // — so a document-wide query observed it too and fed Number("hero")
    // → NaN into setBeat. That normally survived, because a chapter
    // entry in the same callback overwrote it inside one React batch;
    // but a callback carrying only the section (scrolling back up into
    // the section from the FAQ) rendered BEATS[NaN] and tore the whole
    // tree down — which is what left the pinned panel frozen mid-scroll.
    const nodes = Array.from(
      section.querySelectorAll<HTMLElement>("[data-beat]"),
    );
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-beat"));
          if (!Number.isInteger(index) || !BEATS[index]) continue;
          setBeat((current) => (current === index ? current : index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      data-beat={BEATS[beat].id}
      className="stage relative bg-paper"
    >
      {/* Copy column — normal flow, and what gives the section height. */}
      <div className="stage-copy relative z-10 lg:w-[48vw]">
        <HeroCopy />
        {CHAPTERS.map((chapter, i) => (
          <article
            key={chapter.kicker}
            id={chapter.id}
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
            <Eyebrow>{chapter.kicker}</Eyebrow>
            <h2 className="max-w-[19ch] font-serif text-[clamp(1.875rem,3.4vw,2.875rem)] font-bold leading-[1.08] tracking-[-0.01em] text-ink">
              {chapter.heading}
            </h2>
            {chapter.body.map((paragraph, p) => (
              <p
                key={p}
                className="max-w-[48ch] font-serif text-[0.9375rem] leading-relaxed text-ink-500"
              >
                {paragraph}
              </p>
            ))}
            {chapter.aside}
            {BEATS[i + 1].stages ? (
              <LoopStill stages={BEATS[i + 1].stages!} />
            ) : BEATS[i + 1].chart ? (
              <ChartStill />
            ) : BEATS[i + 1].cards ? (
              <ProblemStill cards={BEATS[i + 1].cards!} />
            ) : null}
            </div>
          </article>
        ))}

        {/* The one anchor for `#start`. It sits here rather than on either
            copy of the closing panel, because there are two of those — one
            per breakpoint — and two elements cannot share an id: the hero
            CTA was jumping to whichever came first in the DOM, which is
            the one that is `display: none` at that width. From here it
            lands on the stacked closing box below `lg`, and on the frame
            the box starts opening above it. */}
        <div id="start" aria-hidden className="h-0" />

        {/* Below `lg` there is no pinned panel to open, so the closing
            gets the boxed canvas as a static container: the same rounded
            `ink-100` box with a hairline and the line art behind it that
            the panel shifts into above `lg`. Start here is only ever
            shown inside that box, at either width. */}
        <div className="px-6 pb-20 sm:px-10 lg:hidden">
          <div className="stage-closing-box relative overflow-hidden p-8 sm:p-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustration/path-light.png"
              alt={HERO_ALT}
              className="stage-closing-mark pointer-events-none absolute inset-x-0 bottom-0 w-full"
            />
            <div className="relative">
              <Closing />
            </div>
          </div>
        </div>

        {/* The expansion's runway, plus a viewport of headroom.
            `travel` is the section's height MINUS one viewport — the last
            screenful can never scroll past — so a bare EXPAND_VH spacer
            leaves only EXPAND_VH − 100vh of runway after the chapters and
            steals the rest from the one before it. That is what had the
            evidence chapter fading to a fifth of its opacity while it was
            still being read. */}
        <div
          aria-hidden
          className="hidden lg:block"
          style={{ height: `${EXPAND_VH + 100}vh` }}
        />
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

            {/* Every drawing on the board leaves on the scroll rather
                than on the beat change. A beat change is one discrete
                event on a timer, so it cut wherever the reader happened
                to be; against its own chapter's progress each layer
                hands over exactly where it should, and runs backwards
                for free. */}
            {heroDrawing ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/illustration/path-light.png"
                alt={HERO_ALT}
                className={`stage-art stage-art-hero${
                  heroIntro ? " stage-art-hero-intro" : ""
                }`}
              />
            ) : null}

            {/* Rides the drawing's own mount window, and its own fade —
                these annotate it, so they leave exactly when it does.
                Held back until the panel has slid into place and the
                drawing has wiped on, so the loop starts on a settled
                stage rather than over the top of the entrance. Gated on
                MOUNT rather than an animation-delay: a delay would replay
                every time the reader scrolled back up to the hero and
                leave the board blank for three seconds. */}
            {heroDrawing && notesReady ? <HeroNotes /> : null}

            {/* The hero drawing returns for the closing box, sliding in
                with the shift. The LIGHT plate, because the field it
                lands on is still the board — that is what the
                light/ink pair is for. Mounted only once the box starts
                opening: a mounted layer is a sampled layer. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/illustration/path-light.png"
              alt={HERO_ALT}
              className="stage-art stage-art-close"
            />

            {showLoop ? (
              <>
                <LoopDiagram
                  stages={LOOP_STAGES}
                  className="stage-loop absolute"
                />
                <LoopCaption
                  stages={LOOP_STAGES}
                  className="stage-loop-caption absolute"
                />
              </>
            ) : null}

            {showChart ? <BenchmarkPlot className="stage-plot absolute" /> : null}

            {/* Card panels are permanently mounted, and moved off the
                board rather than unmounted — see CARDS. */}
            {CARD_SLOTS.map(({ slot, card }) => (
              <Glass
                key={CARDS[card].kicker}
                className={`stage-card ${slot} absolute flex flex-col px-9 py-8`}
              >
                <span className="card-kicker">{CARDS[card].kicker}</span>
                <div className="mb-4">{CARDS[card].figure}</div>
                <p className="font-serif text-[0.875rem] leading-relaxed text-paper/90">
                  {CARDS[card].body}
                </p>
              </Glass>
            ))}

            <div className="stage-closing absolute inset-0 p-12 xl:p-16">
              <Closing />
            </div>

            {/* Long enough to cover the overlay wipe: the shader only
                redraws while something marks it dirty, so a pump that
                ends before the transition does freezes the glass on a
                half-wiped frame until the next scroll event. */}
            <GlassPulse pulseKey={beat} durationMs={1900} />
          </GlassScene>
        </div>
      </div>
    </section>
  );
}

function HeroCopy() {
  return (
    <div
      data-beat={0}
      className="stage-hero relative flex min-h-dvh flex-col justify-center gap-5 px-6 pb-12 pt-8 sm:gap-6 sm:px-10 lg:pt-0 lg:pb-0 lg:px-14 xl:px-20"
    >
      {/* The wordmark. Below `lg` it opens the stack in normal flow —
          mark, then illustration, then the heading — rather than sitting
          in the reading column. From `lg` it detaches into the hero's
          top-left corner, a fixed masthead independent of the centred
          copy's own vertical position.

          The lockup is the product name at size with "by / Lemnisca"
          stacked small beside it, both blocks sharing a bottom edge:
          neither word carries a descender, so `items-end` lands the two
          baselines together without a nudge. */}
      <a
        href="https://lemnisca.bio"
        style={{ "--i": 0 } as React.CSSProperties}
        className="hero-rise flex items-end gap-2.5 lg:absolute lg:left-14 lg:top-10 xl:left-20"
      >
        <span className="font-serif text-[2rem] font-bold leading-none tracking-[-0.02em] text-ink">
          Trellis
        </span>
        <span className="flex flex-col items-start gap-0.5">
          <span className="text-[0.6875rem] font-medium leading-[1.25] tracking-[0.01em] text-accent">
            by
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/lemnisca-wordmark.svg" alt="Lemnisca" className="h-[13px] w-auto" />
        </span>
      </a>

      {/* The hero illustration, stacked here below `lg` only — above the
          heading, between the wordmark and the copy. */}
      <div
        style={{ "--i": 0 } as React.CSSProperties}
        className="stage-hero-panel hero-rise relative -mx-6 h-[30vh] overflow-hidden bg-board sm:-mx-10 lg:hidden"
      >
        <div aria-hidden className="stage-grid absolute inset-0" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/illustration/path-light.png"
          alt={HERO_ALT}
          className="absolute inset-0 h-full w-full object-contain p-5"
        />
      </div>

      <h1
        style={{ "--i": 0 } as React.CSSProperties}
        className="hero-rise max-w-[16ch] font-serif text-[clamp(2.25rem,5.2vw,4.25rem)] font-bold leading-[1.02] tracking-[-0.01em] text-ink"
      >
        The shortest path for your bioprocess
      </h1>
      <p
        style={{ "--i": 1 } as React.CSSProperties}
        className="hero-rise font-serif text-[clamp(1rem,1.35vw,1.1875rem)] font-bold italic text-accent"
      >
        from plate to pilot to production
      </p>
      <p
        style={{ "--i": 2 } as React.CSSProperties}
        className="hero-rise max-w-[46ch] font-serif text-[0.9375rem] leading-relaxed text-ink-500"
      >
        Every bioprocess is a large, partially observed system. Trellis builds
        one evolving model of yours, so each experiment adds the evidence your
        next decision actually needs.
      </p>
      <div
        style={{ "--i": 3 } as React.CSSProperties}
        className="hero-rise flex flex-wrap items-center gap-3 pt-2"
      >
        <GlassButton
          href="https://calendar.app.google/S4eAAiz6Nn8kGZpJ9"
          target="_blank"
          rel="noopener noreferrer"
          variant="dark"
          backdropClassName="rounded-full glass-button-slab-accent"
          delayMs={1950}
          onClick={() => posthog.capture("book_call_clicked", { location: "hero" })}
        >
          Book a call
        </GlassButton>
        <GlassButton
          onClick={scrollToLoopChapter}
          variant="frosted"
          backdropClassName="rounded-full glass-button-slab-light"
          labelClassName="text-accent"
          delayMs={1950}
        >
          See how it works
        </GlassButton>
      </div>

    </div>
  );
}

/**
 * HeroNotes — the hero drawing's annotation loop.
 *
 * Three notes, one on screen at a time, cycling forever, each tied to
 * the vessel it names by a leader line that draws itself on and ends in
 * a ring on the vessel.
 *
 * The whole layer takes the ARTWORK's box, not the panel's — the drawing
 * is sized in `vw` and the panel in `vw` × `vh`, so anchoring to the
 * panel would slide the leaders off their vessels the moment the window
 * changed shape. Inside that box the notes are placed in per-cent and
 * the leaders share the drawing's own 1663×870 viewBox, so both register
 * with it exactly.
 *
 * One shared keyframe with a per-note delay of a third of the cycle, so
 * the sequence is a single expression rather than three animations kept
 * in step by hand.
 *
 * Frosted in CSS rather than real <Glass> panels, and not by preference:
 * the renderer only redraws a panel's shader on a DOM mutation, so an
 * infinitely animating glass panel would either sample a stale frame or
 * need `markChanged` pumped every frame forever. An animation's fill
 * would also override the opacity the panel declares — the one thing the
 * glass rules forbid outright.
 *
 * The loop lives on the notes; the scroll fade lives on the wrapper.
 * Two elements, because an animation's opacity would win over a declared
 * one and the drawing could scroll away with its labels still lit.
 */
function HeroNotes() {
  const { w, h } = { w: 1663, h: 870 };
  return (
    <div aria-hidden className="stage-notes absolute">
      <svg className="stage-leaders" viewBox={`0 0 ${w} ${h}`} fill="none">
        {HERO_NOTES.map((note, i) => (
          <g
            key={note.kicker}
            className="stage-leader"
            style={{ "--i": i } as React.CSSProperties}
          >
            <line
              className="stage-leader-line"
              x1={note.from[0] * w}
              y1={note.from[1] * h}
              x2={note.to[0] * w}
              y2={note.to[1] * h}
              pathLength={1}
            />
            <circle
              className="stage-leader-dot"
              cx={note.to[0] * w}
              cy={note.to[1] * h}
              r={12}
            />
          </g>
        ))}
      </svg>

      {HERO_NOTES.map((note, i) => (
        <div
          key={note.kicker}
          style={{ "--i": i, ...note.place } as React.CSSProperties}
          className="stage-note"
        >
          <span className="stage-note-kicker">{note.kicker}</span>
          <p className="stage-note-body">{note.body}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * The problem cards for the stacked layout.
 *
 * Below `lg` there is no board to arrange a cluster on, so the three
 * become a plain column — each on its own patch of board, in reading
 * order rather than the paint order the desktop cascade needs. They are
 * not glass either: the renderer is desktop-only.
 */
function ProblemStill({ cards }: { cards: Card[] }) {
  return (
    <div className="mt-4 flex flex-col gap-3 lg:hidden">
      {cards.map((card) => (
        <div
          key={card.kicker}
          className="relative overflow-hidden rounded-[16px] bg-board p-6 ring-1 ring-inset ring-paper/12"
        >
          <div aria-hidden className="stage-grid absolute inset-0 opacity-70" />
          <div className="relative flex flex-col">
            <span className="card-kicker">{card.kicker}</span>
            <div className="mb-4">{card.figure}</div>
            <p className="font-serif text-[0.875rem] leading-relaxed text-paper/90">
              {card.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The loop diagram for the stacked layout: the same drawing, fully
 * walked. `--p: 1` resolves every reveal clamp to its end state — there
 * is no pinned panel to scrub it against below `lg`, and no highlight
 * either, since nothing is "current" when the whole loop is shown at
 * once.
 */
function LoopStill({ stages }: { stages: LoopStage[] }) {
  return (
    <div
      style={{ "--t": 1 } as React.CSSProperties}
      className="relative mt-4 overflow-hidden rounded-[28px] bg-board p-5 lg:hidden"
    >
      <div aria-hidden className="stage-grid absolute inset-0" />
      <LoopDiagram stages={stages} className="relative mx-auto w-full max-w-[22rem]" />
    </div>
  );
}

/** The plot for the stacked layout: the same chart, fully drawn. */
function ChartStill() {
  return (
    <div
      style={{ "--t": 1 } as React.CSSProperties}
      className="relative -mx-6 mt-4 overflow-hidden bg-board p-5 sm:-mx-10 lg:hidden"
    >
      <div aria-hidden className="stage-grid absolute inset-0" />
      <BenchmarkPlot className="relative" />
    </div>
  );
}

function Closing() {
  return (
    <div className="grid h-full grid-cols-1 items-center gap-10 xl:grid-cols-[1fr_minmax(0,24rem)]">
      <div className="flex flex-col gap-6">
        <Eyebrow onBoard>Start here</Eyebrow>
        <h2 className="max-w-[15ch] font-serif text-[clamp(1.75rem,3.4vw,3rem)] font-bold leading-[1.04] tracking-[-0.01em] text-paper">
          Bring us the development decision you&apos;re still uncertain about.
        </h2>
        <p className="max-w-[42ch] font-serif text-[0.9375rem] leading-relaxed text-paper/65">
          Start with one real decision, not a platform migration. We configure
          Trellis around it and you keep every assumption in view.
        </p>
      </div>

      {/* Not a glass panel, though it is a box on the board: a panel has
          to be a DIRECT child of the scene root, and this one is three
          wrappers deep inside the closing grid. An accent hairline over
          the field is the honest substitute. */}
      <div className="stage-closing-card rounded-[28px] border border-accent-100/25 bg-accent/[0.12] p-8">
        <ol className="flex flex-col gap-6">
          {CLOSING_STEPS.map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="pt-0.5 text-xs font-semibold tabular-nums text-accent-100/50">
                {step.n}
              </span>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-sm font-bold italic text-accent-100">
                  {step.title}
                </span>
                <span className="font-serif text-[0.8125rem] leading-relaxed text-paper/60">
                  {step.body}
                </span>
              </div>
            </li>
          ))}
        </ol>
        {/* Plain CSS, not <GlassButton>: nested this deep inside the
            closing panel — which itself keeps resizing as `--e` opens
            it — the button's own WebGL scene measures itself against a
            moving target and never settles into a crisp render, dark or
            frosted alike. A solid fill sidesteps that entirely and reads
            with more contrast against the card than a translucent pane
            would anyway. */}
        <a
          href="https://calendar.app.google/S4eAAiz6Nn8kGZpJ9"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => posthog.capture("book_call_clicked", { location: "closing" })}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 font-serif text-sm font-bold text-paper transition-colors duration-150 ease-in hover:bg-accent-700"
        >
          Book a call
        </a>
      </div>
    </div>
  );
}
