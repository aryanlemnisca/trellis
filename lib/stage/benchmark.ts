/**
 * The benchmark, in one place.
 *
 * The same three numbers are read twice — as the enlarged figures in the
 * copy column and as the plotted curves on the board — so they live here
 * rather than being typed out in both and drifting apart.
 *
 * `k` is the rate constant of the saturating curve each strategy traces
 * (see `saturating` in `components/stage/curves.ts`): OFAT and DoE climb
 * at roughly the same rate and stop at different ceilings, Trellis
 * climbs faster AND further, which is the whole claim.
 *
 * Ascending on purpose: read bottom-up, the list is the climb.
 */
export const BENCHMARK = [
  { name: "OFAT", value: 50, k: 0.03 },
  { name: "DoE", value: 77, k: 0.032 },
  { name: "Trellis", value: 99, k: 0.046 },
] as const;

/** The strategy the section is about — emphasised in both readings. */
export const BENCHMARK_LEAD = BENCHMARK.length - 1;
