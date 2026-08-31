/**
 * Straight segments through densely sampled points.
 *
 * For an analytic curve this beats any smoothing: at ~120 samples the
 * segments are a few pixels each and read as perfectly smooth, whereas
 * `smoothPath`'s horizontal tangents put a visible ripple at every
 * sample when the points are close together.
 */
export function linePath(points: Array<[number, number]>): string {
  if (points.length < 2) return "";
  return points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
}

/** Smooth path through points, with a light horizontal-tangent easing. */
export function smoothPath(points: Array<[number, number]>): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const mx = (x0 + x1) / 2;
    d += ` C ${mx.toFixed(2)} ${y0.toFixed(2)}, ${mx.toFixed(2)} ${y1.toFixed(2)}, ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  }
  return d;
}
