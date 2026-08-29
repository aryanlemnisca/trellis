"use client";

import { useEffect, useRef } from "react";
import { useGlassScene } from "./GlassScene";

/**
 * GlassPulse — keeps the renderer honest while the scene behind the
 * glass moves.
 *
 * The library re-runs a panel's shader only when something marks it
 * dirty. It observes DOM mutations, but a CSS transform or transition on
 * a sibling isn't a mutation, so a panel sitting over a panning image
 * would sample a stale frame. This pumps `markChanged()` for as long as
 * things are actually moving — while the page is scrolling, and for one
 * transition after `pulseKey` changes.
 *
 * Cheap by design: `markChanged` dirties the WebGL pass only. The
 * expensive html-to-image capture is untouched, and the moving artwork
 * is an <img>, which the library composites through `drawImage`.
 */
export function GlassPulse({
  pulseKey,
  durationMs = 1000,
}: {
  pulseKey: unknown;
  durationMs?: number;
}) {
  const { markChanged } = useGlassScene();
  const markRef = useRef(markChanged);

  useEffect(() => {
    markRef.current = markChanged;
  }, [markChanged]);

  // Pump for one transition whenever the camera target changes.
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      markRef.current();
      if (now - start < durationMs) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [pulseKey, durationMs]);

  // Pump while scrolling — the expansion is scroll-driven, not timed.
  useEffect(() => {
    let frame = 0;
    let until = 0;
    const tick = () => {
      markRef.current();
      frame = performance.now() < until ? requestAnimationFrame(tick) : 0;
    };
    const onScroll = () => {
      until = performance.now() + 150;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
