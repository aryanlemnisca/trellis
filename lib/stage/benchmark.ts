/**
 * The benchmark, in one place.
 *
 * The same three numbers are read twice — as the enlarged figures in the
 * copy column and as the plotted curves on the board — so they live here
 * rather than being typed out in both and drifting apart. `value` is the
 * rounded headline figure; the curves themselves are real data, in
 * `lib/stage/benchmark-curves.ts`, and land close to but not exactly on
 * these numbers.
 *
 * Ascending on purpose: read bottom-up, the list is the climb.
 */
export const BENCHMARK = [
  { name: "OFAT", value: 50 },
  { name: "DoE", value: 77 },
  { name: "Trellis", value: 99 },
] as const;

/** The strategy the section is about — emphasised in both readings. */
export const BENCHMARK_LEAD = BENCHMARK.length - 1;
