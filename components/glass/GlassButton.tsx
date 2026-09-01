"use client";

import type { ReactNode } from "react";
import { Glass } from "./Glass";
import { GlassScene } from "./GlassScene";
import type { GlassVariant } from "@/lib/glass/spec";

/**
 * GlassButton — a refracting control that works ANYWHERE on the page.
 *
 * The renderer can only sample a scene it owns: glass elements have to
 * be direct children of a root, and the shader reads that root's own
 * non-glass children, never the page behind it. A button buried three
 * wrappers deep in a section therefore cannot join the board's scene —
 * which is why buttons couldn't be glass before this.
 *
 * The library's answer, and this component, is a scene per control:
 * "if you need glass inside a wrapper, give the wrapper its own
 * LiquidGlass.init() call". Each button is a self-contained root — a
 * backdrop layer plus one panel — so it can be dropped in anywhere,
 * inside any layout, with no relationship to the rest of the page.
 *
 * Two consequences worth knowing before scattering these around:
 *
 *   1. **Each scene is its own WebGL context**, and browsers cap
 *      concurrent contexts at around 16 system-wide. A handful of
 *      buttons is fine; a list of forty is not.
 *   2. **The button refracts its own backdrop, not the real page.**
 *      `backdropClassName` is that backdrop — pass whatever sits behind
 *      the button so the surface has something to bend. Over a flat
 *      colour there is nothing to refract, so `regular` and `frosted`
 *      all but vanish on a white section and `dark` is the variant that
 *      still reads. Over the board, or over artwork, all three work.
 *
 * The shader's drop shadow overflows the element's box, so don't put
 * one of these inside an `overflow: hidden` ancestor that crops tightly.
 */
export type GlassButtonProps = {
  children: ReactNode;
  /** Which glass recipe. `dark` is the one that reads on white. */
  variant?: Exclude<GlassVariant, "panel">;
  /** Renders an <a> when set, a <button> otherwise. */
  href?: string;
  /** For an external `href` — e.g. `"_blank"` with `rel="noopener noreferrer"`. */
  target?: string;
  rel?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  /** Classes for the scene wrapper — margins and layout live here. */
  className?: string;
  /** Classes for the label inside the panel — colour and type. */
  labelClassName?: string;
  /**
   * What the glass has behind it to bend. This is a real layer inside
   * the button's own scene, not a description of the page: the shader
   * never sees the section underneath.
   */
  backdropClassName?: string;
  /**
   * Extra non-glass layers inside the scene, drawn behind the panel —
   * a grid, a fragment of artwork, anything with detail for the bevel
   * to refract. Keep it shallow: each one is rasterised through
   * html-to-image whenever it changes.
   */
  backdrop?: ReactNode;
  /**
   * Hold init until an entrance animation on an ancestor has settled —
   * the library sizes the panel's canvas from its measured rect.
   */
  delayMs?: number;
  "aria-label"?: string;
};

export function GlassButton({
  children,
  variant = "dark",
  href,
  target,
  rel,
  onClick,
  type = "button",
  className,
  labelClassName,
  backdropClassName = "rounded-full glass-button-slab",
  backdrop,
  delayMs,
  "aria-label": ariaLabel,
}: GlassButtonProps) {
  // The panel paints nothing itself — its background would be captured
  // as content and composited over the shader. The label carries the
  // padding, so the panel is sized by its own content.
  const label = (
    <span
      className={`glass-button-label relative block px-7 py-3.5 text-sm font-medium ${
        labelClassName ?? "text-paper"
      }`}
    >
      {children}
    </span>
  );

  return (
    <GlassScene
      className={`glass-button-scene relative inline-flex ${className ?? ""}`}
      backdropClassName={backdropClassName}
      delayMs={delayMs}
    >
      {backdrop}
      <Glass variant={variant} className="glass-button relative">
        {href ? (
          <a
            href={href}
            target={target}
            rel={rel}
            onClick={onClick}
            aria-label={ariaLabel}
            className="block"
          >
            {label}
          </a>
        ) : (
          <button
            type={type}
            onClick={onClick}
            aria-label={ariaLabel}
            className="block w-full"
          >
            {label}
          </button>
        )}
      </Glass>
    </GlassScene>
  );
}
