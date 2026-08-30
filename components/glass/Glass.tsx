import type { CSSProperties, ReactNode } from "react";
import {
  glassConfig,
  type GlassOverrides,
  type GlassVariant,
} from "@/lib/glass/spec";

/**
 * Glass — a single refracting panel.
 *
 * MUST be rendered as a direct child of <GlassScene>. Keep the panel's
 * own painted surface transparent: anything with a background or border
 * here is captured as *content* and composited on top of the shader
 * output, which reads as a flat overlay rather than glass.
 *
 * The optical config comes from a named variant in `lib/glass/spec.ts`
 * — `panel` (the default) for board surfaces, `regular` / `frosted` /
 * `dark` for controls. Size the element to suit the variant: `panel`'s
 * `zRadius: 100` wants a short edge over ~250px, the button recipes'
 * `zRadius: 20` wants a ~48px pill. For a button anywhere on the page,
 * reach for <GlassButton>, which brings its own scene.
 *
 * Note the prop handling: everything except the listed props is
 * collected as glass CONFIG, not forwarded to the element. Hyphenated
 * JSX attributes skip excess-property checks, so a stray `data-*` here
 * type-checks, disappears into the config, and never lands in the DOM.
 * Style the panel from an ancestor instead. `data-variant` IS written
 * out, because the CSS fallback needs to know which recipe it is
 * standing in for.
 */
export type GlassProps = GlassOverrides & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Which recipe from `GLASS_VARIANTS`. Defaults to the board panel. */
  variant?: GlassVariant;
  /** Re-capture this panel's content every frame (video, live canvas). */
  dynamic?: boolean;
};

export function Glass({
  children,
  className,
  style,
  variant = "panel",
  dynamic = false,
  ...overrides
}: GlassProps) {
  const config = glassConfig(variant, overrides);

  return (
    <div
      data-glass=""
      data-variant={variant}
      data-config={JSON.stringify(config)}
      {...(dynamic ? { "data-dynamic": "" } : {})}
      className={className}
      style={{ borderRadius: `${config.cornerRadius}px`, ...style }}
    >
      {children}
    </div>
  );
}
