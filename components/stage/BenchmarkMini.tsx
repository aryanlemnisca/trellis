import { saturating, smoothPath } from "./curves";

/**
 * Compact convergence chart for the readout card.
 * Static — it lives inside a glass panel, whose content is rasterised
 * once per change, so nothing here animates.
 */

const W = 200;
const H = 88;
const sx = (x: number) => (x / 100) * W;
const sy = (y: number) => H - (y / 100) * H;
const project = (pts: Array<[number, number]>) =>
  pts.map(([x, y]) => [sx(x), sy(y)] as [number, number]);

const CURVES = [
  { d: smoothPath(project(saturating(50.5, 0.03))), o: 0.4, w: 1.4 },
  { d: smoothPath(project(saturating(79, 0.032))), o: 0.6, w: 1.6 },
  { d: smoothPath(project(saturating(100, 0.046))), o: 1, w: 2.2 },
];

export function BenchmarkMini() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Convergence to optimum titre: Trellis 99 percent, DoE 77, OFAT 50"
    >
      <line
        x1={0}
        y1={sy(100)}
        x2={W}
        y2={sy(100)}
        stroke="white"
        strokeOpacity={0.3}
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {CURVES.map((c, i) => (
        <path
          key={i}
          d={c.d}
          fill="none"
          stroke="white"
          strokeOpacity={c.o}
          strokeWidth={c.w}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
