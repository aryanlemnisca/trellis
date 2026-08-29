import type { GlassConfig } from "@ybouane/liquidglass";

/**
 * The house glass recipe.
 *
 * Values 1:1 with the tuned Interactive Playground state on
 * https://liquid-glass.ybouane.com/ — do not "improve" these numbers,
 * and do not override them per panel. Every panel on the site renders
 * this exact recipe; only behaviour (`floating`, `button`) may vary.
 */
export const GLASS_SPEC: GlassConfig = {
  blurAmount: 0.66,
  refraction: 0.69,
  chromAberration: 0.05,
  edgeHighlight: 0.05,
  specular: 0,
  fresnel: 1,
  distortion: 0,
  cornerRadius: 100,
  zRadius: 100,
  opacity: 1,
  saturation: 0,
  brightness: 0,
  shadowOpacity: 0.3,
  shadowSpread: 10,
  bevelMode: 0,

  // Not surfaced by the playground panel; pinned so the library's own
  // defaults can never drift into the look.
  tintStrength: 0,
  shadowOffsetY: 0,
  floating: false,
  button: false,
};

/**
 * Only behaviour may vary per panel. The optical values — cornerRadius
 * and zRadius included — are the spec, and a panel that deviates stops
 * looking like the tuned reference: drop cornerRadius below ~2×zRadius
 * and the bevel swallows the panel, which reads as a flat frosted box
 * rather than glass. Size panels to the spec instead of retuning it.
 */
export type GlassOverrides = Partial<Pick<GlassConfig, "floating" | "button">>;

export function glassConfig(overrides?: GlassOverrides): GlassConfig {
  return { ...GLASS_SPEC, ...overrides };
}
