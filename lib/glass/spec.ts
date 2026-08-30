import type { GlassConfig } from "@ybouane/liquidglass";

/**
 * The house glass recipes.
 *
 * `panel` is the tuned Interactive Playground state from
 * https://liquid-glass.ybouane.com/, 1:1 — every large surface on the
 * board renders it verbatim. The three button recipes are the demo's
 * own button variants, sized for a control rather than a panel.
 *
 * Pick a variant. Don't invent numbers: a one-off tweak stops looking
 * like the tuned reference, and the optical values are not overridable
 * per element on purpose (see `GlassOverrides` below).
 */

/**
 * Shared by every recipe. The optical character of the glass lives in
 * the per-variant blocks; this is the part that never varies.
 */
const BASE = {
  distortion: 0,
  opacity: 1,
  floating: false,
  bevelMode: 0,
} as const;

/**
 * The panel recipe — large surfaces on the board.
 *
 * `zRadius: 100` needs room: a panel under roughly 250px on its short
 * edge has its whole surface swallowed by the bevel and reads as a flat
 * frosted box rather than glass. Size the panel to the spec.
 */
export const GLASS_SPEC: GlassConfig = {
  ...BASE,
  shadowOffsetY: 0,
  blurAmount: 0.66,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1,
  cornerRadius: 100,
  zRadius: 100,
  saturation: 0,
  tintStrength: 0,
  brightness: 0,
  shadowOpacity: 0.3,
  shadowSpread: 10,
  button: false,
};

/**
 * Button recipes — the demo's own three variants.
 *
 * These are the library DEFAULTS with the one or two values the
 * playground actually changes, and nothing else. Every earlier attempt
 * to "improve" them is what made the button read as grey plastic:
 * `specular` above 0 lays bright streaks across the face, and
 * `tintStrength` / `saturation` turn the surface milky. Leave them at 0.
 *
 * `cornerRadius: 50` / `zRadius: 40` are the demo's numbers, not a
 * scaled-down version of them — on a ~52px pill the bevel covers nearly
 * the whole face, and that deep lens IS the look. Shrinking the bevel to
 * "fit" the button flattens it. `.glass-button` holds the matching
 * min-height; border-radius clamps itself to half the height on its own.
 *
 * `shadowOffsetY: 1` is the library default and right for a control —
 * unlike the panel recipe, which pins it to 0.
 */
const BUTTON_BASE = {
  ...BASE,
  button: true,
  blurAmount: 0,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1,
  cornerRadius: 50,
  zRadius: 40,
  saturation: 0,
  tintStrength: 0,
  brightness: 0,
  shadowOpacity: 0.3,
  shadowSpread: 10,
  shadowOffsetY: 1,
} as const;

/** Clear glass: the defaults, untouched. Bends whatever is behind it. */
const REGULAR: GlassConfig = { ...BUTTON_BASE };

/** Frosted: the same glass, blurred, lifted a touch. */
const FROSTED: GlassConfig = {
  ...BUTTON_BASE,
  blurAmount: 0.7,
  brightness: 0.08,
};

/** Dark: smoked glass. The playground's config, verbatim. */
const DARK: GlassConfig = {
  ...BUTTON_BASE,
  blurAmount: 0.25,
  brightness: -0.3,
};

export const GLASS_VARIANTS = {
  panel: GLASS_SPEC,
  regular: REGULAR,
  frosted: FROSTED,
  dark: DARK,
} satisfies Record<string, GlassConfig>;

export type GlassVariant = keyof typeof GLASS_VARIANTS;

/**
 * Only *behaviour* may vary per element, never the optics. Pick a
 * variant instead: a panel that deviates from its recipe stops looking
 * like the tuned reference, and the failure is quiet — drop
 * `cornerRadius` below ~2× `zRadius` and the bevel swallows the surface,
 * which reads as a flat frosted box rather than glass.
 */
export type GlassOverrides = Partial<Pick<GlassConfig, "floating" | "button">>;

export function glassConfig(
  variant: GlassVariant = "panel",
  overrides?: GlassOverrides,
): GlassConfig {
  return { ...GLASS_VARIANTS[variant], ...overrides };
}
