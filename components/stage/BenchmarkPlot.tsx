import { BENCHMARK, BENCHMARK_LEAD } from "@/lib/stage/benchmark";
import { BENCHMARK_BANDS, BENCHMARK_CURVES } from "@/lib/stage/benchmark-curves";
import { linePath } from "./curves";

/** Upper edge left-to-right, lower edge back right-to-left, closed — the band as one filled shape. */
function bandPath(upper: Array<[number, number]>, lower: Array<[number, number]>): string {
  const top = upper.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  const bottom = [...lower].reverse().map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`);
  return [...top, ...bottom, "Z"].join(" ");
}

/**
 * BenchmarkPlot — the convergence chart, plotted on the board.
 *
 * Inline SVG rather than build output, for the same two reasons as the
 * loop diagram: the labels have to render in Inter (an SVG loaded
 * through <img> cannot fetch a webfont), and the curves draw themselves
 * against scroll, which a static file can't do.
 *
 * The curves themselves are real data, not a fitted approximation —
 * see `lib/stage/benchmark-curves.ts`. Real data doesn't land exactly on
 * the rounded headline figure, so labels are positioned off the curve's
 * own endpoint rather than off `BENCHMARK.value`, or they'd float just
 * off the line they're meant to be labelling.
 *
 * Every reveal is CSS reading `--p`. Each curve is a path with
 * `pathLength="1"`, so its dash offset IS its progress — the three climb
 * together, staggered slightly, and the plot reads as a race rather than
 * three separate facts. No React per frame, and it reverses on the way
 * back up.
 *
 * The numbers themselves are in `lib/stage/benchmark.ts`, shared with
 * the enlarged figures in the copy column.
 */

const W = 1000;
const H = 760;
const PAD = { l: 96, r: 210, t: 74, b: 96 };

const x0 = PAD.l;
const x1 = W - PAD.r;
const yTop = PAD.t;
const yBase = H - PAD.b;

/** Domain is 0–100 "experiments"; range is 0–100% of the known optimum. */
const sx = (t: number) => x0 + (t / 100) * (x1 - x0);
const sy = (v: number) => yBase - (v / 100) * (yBase - yTop);

const TICKS = [0, 50, 100];
const X_TICKS = [0, 20, 40, 60, 80];

/**
 * Draw windows, as shares of `--p`. Everything has landed by 0.64 so the
 * finished plot holds for the rest of the chapter — same principle as
 * the loop: the reader has to get to see the thing that was drawn.
 */
const CURVE_FROM = 0.12;
const CURVE_STAGGER = 0.04;
const CURVE_DUR = 0.34;

export function BenchmarkPlot({ className }: { className?: string }) {
  return (
    <div className={`benchmark-plot ${className ?? ""}`}>
      <svg viewBox={`0 0 ${W} ${H}`} fill="none" role="img" aria-label={
        `Convergence to the known optimum titre: ${BENCHMARK.map((b) => `${b.name} ${b.value} percent`).join(", ")}`
      }>
        {/* The ceiling everything is measured against. */}
        <line
          className="plot-optimum"
          x1={x0}
          y1={sy(100)}
          x2={x1}
          y2={sy(100)}
          pathLength={1}
          style={{ "--from": 0.04, "--dur": 0.12 } as React.CSSProperties}
        />
        <text className="plot-optimum-label" x={x0 + 14} y={sy(100) - 16}>
          KNOWN OPTIMUM
        </text>

        <g className="plot-axis">
          <line x1={x0} y1={yTop} x2={x0} y2={yBase} />
          <line x1={x0} y1={yBase} x2={x1} y2={yBase} />
          {TICKS.map((t) => (
            <text key={t} className="plot-tick" x={x0 - 16} y={sy(t) + 5} textAnchor="end">
              {t}
            </text>
          ))}
          {X_TICKS.map((t) => (
            <text key={t} className="plot-tick" x={sx(t)} y={yBase + 28} textAnchor="middle">
              {t}
            </text>
          ))}
        </g>

        <text className="plot-axis-label" x={x0} y={yBase + 62}>
          EXPERIMENTS RUN
        </text>
        <text
          className="plot-axis-label"
          transform={`rotate(-90 ${x0 - 58} ${(yTop + yBase) / 2})`}
          x={x0 - 58}
          y={(yTop + yBase) / 2}
          textAnchor="middle"
        >
          % OF KNOWN OPTIMUM TITRE
        </text>

        {BENCHMARK.map((series, i) => {
          const curve = BENCHMARK_CURVES[series.name];
          const points = curve.map(([t, v]) => [sx(t), sy(v)] as [number, number]);
          const endValue = curve[curve.length - 1][1];
          const band = BENCHMARK_BANDS[series.name];
          const bandD = bandPath(
            band.upper.map(([t, v]) => [sx(t), sy(v)] as [number, number]),
            band.lower.map(([t, v]) => [sx(t), sy(v)] as [number, number]),
          );
          const from = CURVE_FROM + i * CURVE_STAGGER;
          const timing = { "--from": from, "--dur": CURVE_DUR } as React.CSSProperties;
          const isLead = i === BENCHMARK_LEAD;
          // The lead's value is set larger (see [data-lead] in globals.css),
          // so it needs more clearance below the name or the two collide —
          // a fixed gap tuned for the smaller non-lead size isn't enough.
          const nameY = sy(endValue) - (isLead ? 8 : 4);
          const valueY = sy(endValue) + (isLead ? 36 : 26);
          return (
            <g key={series.name} data-lead={isLead}>
              {/* The real spread each strategy actually ran inside — wipes
                  in with the same clock as its own line, not a separate one. */}
              <path className="plot-band" d={bandD} style={timing} />
              <path
                className="plot-curve"
                d={linePath(points)}
                pathLength={1}
                style={timing}
              />
              {/* Lands as its own curve finishes, not on a shared timer. */}
              <g
                className="plot-label"
                style={
                  { "--from": from + CURVE_DUR - 0.06, "--dur": 0.08 } as React.CSSProperties
                }
              >
                <text className="plot-label-name" x={x1 + 26} y={nameY}>
                  {series.name.toUpperCase()}
                </text>
                <text className="plot-label-value" x={x1 + 26} y={valueY}>
                  {series.value}%
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
