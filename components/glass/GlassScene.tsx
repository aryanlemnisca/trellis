"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LiquidGlass } from "@ybouane/liquidglass";
import { GLASS_SPEC } from "@/lib/glass/spec";

/**
 * GlassScene — the root the liquid-glass renderer draws into.
 *
 * Constraints imposed by @ybouane/liquidglass that this component owns:
 *   1. glass panels must be DIRECT children of the root
 *   2. the root must be positioned (`relative`)
 *   3. webfonts must be loaded before init(), or the DOM capture
 *      rasterises fallback metrics
 *   4. the scene the shader samples is built by rasterising the root's
 *      non-glass DIRECT children onto a canvas pre-filled with WHITE.
 *      The root's own background is never sampled — so the scene's base
 *      colour has to live on a child. `backdropClassName` renders that
 *      child for you; put the section background there, not on the root.
 *   5. keep those non-glass children shallow: each one is rasterised
 *      through html-to-image whenever it changes.
 */

type GlassSceneContextValue = {
  /** Tell the renderer an element changed in a way it cannot observe. */
  markChanged: (element?: HTMLElement) => void;
  mode: GlassMode;
};

type GlassMode = "css" | "webgl";

const GlassSceneContext = createContext<GlassSceneContextValue>({
  markChanged: () => {},
  mode: "css",
});

export function useGlassScene() {
  return useContext(GlassSceneContext);
}

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

function prefersReducedTransparency(): boolean {
  return (
    window.matchMedia?.("(prefers-reduced-transparency: reduce)").matches ?? false
  );
}

export type GlassSceneProps = {
  children: ReactNode;
  className?: string;
  /** Extra scene-wide overrides layered on top of GLASS_SPEC. */
  defaults?: Partial<typeof GLASS_SPEC>;
  /** Render the CSS fallback and skip WebGL entirely. */
  disabled?: boolean;
  /**
   * Hold initialisation for this long. The library sizes each panel's
   * canvas from its measured rect, so initialising while an entrance
   * animation is still transforming the scene makes it re-measure and
   * reallocate every frame. Wait for the scene to settle instead.
   */
  delayMs?: number;
  /**
   * Classes for the full-bleed backdrop layer rendered as the scene's
   * first child. This is what the shader samples as the base of the
   * scene — set the section background here. Pass `false` if you are
   * supplying your own full-bleed non-glass child.
   */
  backdropClassName?: string | false;
};

export function GlassScene({
  children,
  className,
  defaults,
  disabled = false,
  delayMs = 0,
  backdropClassName = "bg-paper",
}: GlassSceneProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<LiquidGlass | null>(null);
  const [mode, setMode] = useState<GlassMode>("css");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || disabled) return;
    if (!supportsWebGL() || prefersReducedTransparency()) return;

    if (getComputedStyle(root).position === "static") {
      root.style.position = "relative";
    }

    let cancelled = false;
    let observer: MutationObserver | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | undefined;

    const settled =
      delayMs > 0 &&
      !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? new Promise<void>((resolve) => {
            holdTimer = setTimeout(resolve, delayMs);
          })
        : Promise.resolve();

    const glassPanels = () =>
      Array.from(root.querySelectorAll<HTMLElement>(":scope > [data-glass]"));

    const teardown = () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };

    const boot = async () => {
      const panels = glassPanels();
      if (panels.length === 0) return;

      // Claim WebGL before init() so the DOM capture never sees the
      // CSS-fallback styling baked into a panel.
      root.dataset.glassMode = "webgl";

      try {
        if (document.fonts?.ready) await document.fonts.ready;
        await settled;
        if (cancelled) return;

        const { LiquidGlass } = await import("@ybouane/liquidglass");
        if (cancelled) return;

        const instance = await LiquidGlass.init({
          root,
          glassElements: panels,
          defaults: { ...GLASS_SPEC, ...defaults },
        });

        if (cancelled) {
          instance.destroy();
          return;
        }

        instanceRef.current = instance;
        setMode("webgl");
      } catch (error) {
        console.error("[GlassScene] falling back to CSS glass", error);
        root.dataset.glassMode = "css";
        setMode("css");
      }
    };

    void boot();

    // Panels mounted or unmounted after init are not in the renderer's
    // glassSet, so the instance has to be rebuilt around the new set.
    // Compared by identity rather than count: a swap that happens to keep
    // the count the same would otherwise leave the renderer holding
    // detached nodes. Re-init is expensive — it re-captures every panel —
    // so prefer parking panels off-screen to mounting them per state.
    let known = glassPanels();
    const sameSet = (next: HTMLElement[]) =>
      next.length === known.length && next.every((el, i) => el === known[i]);

    observer = new MutationObserver(() => {
      const next = glassPanels();
      if (sameSet(next)) return;
      known = next;
      teardown();
      void boot();
    });
    observer.observe(root, { childList: true });

    return () => {
      cancelled = true;
      clearTimeout(holdTimer);
      observer?.disconnect();
      teardown();
      delete root.dataset.glassMode;
    };
  }, [defaults, disabled, delayMs]);

  const markChanged = (element?: HTMLElement) =>
    instanceRef.current?.markChanged(element);

  return (
    <GlassSceneContext.Provider value={{ markChanged, mode }}>
      <div
        ref={rootRef}
        data-glass-root=""
        data-glass-mode="css"
        className={className}
      >
        {backdropClassName !== false && (
          <div
            aria-hidden
            data-glass-backdrop=""
            className={`absolute inset-0 ${backdropClassName}`}
          />
        )}
        {children}
      </div>
    </GlassSceneContext.Provider>
  );
}
