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

/** y = ceiling · (1 − e^(−k·x)) — the shape of a converging search. */
export function saturating(
  ceiling: number,
  k: number,
  steps = 40,
  domain = 100,
): Array<[number, number]> {
  return Array.from({ length: steps + 1 }, (_, n) => {
    const x = (n / steps) * domain;
    return [x, ceiling * (1 - Math.exp(-k * x))] as [number, number];
  });
}
