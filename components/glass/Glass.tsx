import type { CSSProperties, ReactNode } from "react";
import { glassConfig, type GlassOverrides } from "@/lib/glass/spec";

/**
 * Glass — a single refracting panel.
 *
 * MUST be rendered as a direct child of <GlassScene>. Keep the panel's
 * own painted surface transparent: anything with a background or border
 * here is captured as *content* and composited on top of the shader
 * output, which reads as a flat overlay rather than glass.
 *
 * The optical config is GLASS_SPEC, always. Size the panel to suit the
 * spec — the spec's `zRadius: 40` needs room, so panels want to be
 * comfortably over ~120px on their short edge.
 *
 * Note the prop handling: everything except `children`/`className`/
 * `style`/`dynamic` is collected as glass CONFIG, not forwarded to the
 * element. Hyphenated JSX attributes skip excess-property checks, so a
 * stray `data-*` here type-checks, disappears into the config, and never
 * lands in the DOM. Style the panel from an ancestor instead.
 */
export type GlassProps = GlassOverrides & {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Re-capture this panel's content every frame (video, live canvas). */
  dynamic?: boolean;
};

export function Glass({
  children,
  className,
  style,
  dynamic = false,
  ...overrides
}: GlassProps) {
  const config = glassConfig(overrides);

  return (
    <div
      data-glass=""
      data-config={JSON.stringify(config)}
      {...(dynamic ? { "data-dynamic": "" } : {})}
      className={className}
      style={{ borderRadius: `${config.cornerRadius}px`, ...style }}
    >
      {children}
    </div>
  );
}
