/**
 * The loop diagram's geometry and reveal timeline, in one place.
 *
 * Six boxes wired into a loop: a serpentine down the panel, then a
 * return run up the left edge back into the first box. The connectors
 * are an inline <svg> and the boxes are DOM (their labels have to
 * render in Inter), so both read their coordinates from here — the same
 * numbers, or the lines would not meet the boxes.
 *
 * Everything below is in viewBox units. The diagram's container is
 * given LOOP_VIEW's exact aspect ratio, so the SVG fills it edge to edge
 * and a box placed at `x / LOOP_VIEW.w` percent lands precisely where
 * the path expects it.
 *
 * This is NOT build output — unlike the artwork in `public/illustration`,
 * nothing here comes from `scripts/build-scenes.py`. It is a live DOM
 * drawing, because the trail has to reveal against scroll.
 */

export const LOOP_VIEW = { w: 1000, h: 1150 };

const BOX_W = 340;
const BOX_H = 128;
/** The two columns the serpentine alternates between. */
const COL_A = 130;
const COL_B = 530;
/** Row tops. Five rows for six boxes — the first row holds two. */
const ROWS = [70, 280, 490, 700, 910];
/** The return run's channel, outside both columns. */
const RETURN_X = 60;

export type LoopBox = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Handy edges, so the link geometry below reads as geometry. */
  cx: number;
  cy: number;
  right: number;
  bottom: number;
};

const box = (x: number, row: number): LoopBox => ({
  x,
  y: ROWS[row],
  w: BOX_W,
  h: BOX_H,
  cx: x + BOX_W / 2,
  cy: ROWS[row] + BOX_H / 2,
  right: x + BOX_W,
  bottom: ROWS[row] + BOX_H,
});

/** In loop order: 1 and 2 share the top row, then it zig-zags down. */
export const LOOP_BOXES: LoopBox[] = [
  box(COL_A, 0),
  box(COL_B, 0),
  box(COL_B, 1),
  box(COL_A, 2),
  box(COL_B, 3),
  box(COL_A, 4),
];

const [B1, B2, B3, B4, B5, B6] = LOOP_BOXES;

/**
 * One polyline per hop, each leaving an edge of the box it starts from
 * and arriving at an edge of the next. Right angles throughout: the
 * diagram is a circuit, not a flow chart.
 */
const LINK_POINTS: Array<Array<[number, number]>> = [
  // 1 → 2, straight across the top row.
  [
    [B1.right, B1.cy],
    [B2.x, B2.cy],
  ],
  // 2 → 3, straight down the right column.
  [
    [B2.cx, B2.bottom],
    [B3.cx, B3.y],
  ],
  // 3 → 4, back across to the left column and down.
  [
    [B3.x, B3.cy],
    [B4.cx, B3.cy],
    [B4.cx, B4.y],
  ],
  // 4 → 5, across to the right column and down.
  [
    [B4.right, B4.cy],
    [B5.cx, B4.cy],
    [B5.cx, B5.y],
  ],
  // 5 → 6, back across to the left column and down.
  [
    [B5.x, B5.cy],
    [B6.cx, B5.cy],
    [B6.cx, B6.y],
  ],
  // 6 → 1, the return: out to the channel, all the way up, back in.
  [
    [B6.x, B6.cy],
    [RETURN_X, B6.cy],
    [RETURN_X, B1.cy],
    [B1.x, B1.cy],
  ],
];

/**
 * A polyline with rounded corners: run to just short of each corner,
 * turn through a quadratic, carry on. Square elbows read as a diagram
 * of a circuit; rounded ones read as something a signal travels along,
 * which is the point of the trail.
 */
function elbowPath(points: Array<[number, number]>, r = 22): string {
  if (points.length < 2) return "";
  const n = (a: number, b: number) => (a === b ? 0 : a < b ? 1 : -1);
  let d = `M ${points[0][0]} ${points[0][1]}`;

  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i - 1];
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    // Never round more than half of either leg, or short segments
    // would overshoot their own corner.
    const back = Math.min(r, Math.hypot(x - px, y - py) / 2);
    const fwd = Math.min(r, Math.hypot(nx - x, ny - y) / 2);
    d += ` L ${x - n(px, x) * back} ${y - n(py, y) * back}`;
    d += ` Q ${x} ${y} ${x + n(x, nx) * fwd} ${y + n(y, ny) * fwd}`;
  }

  const last = points[points.length - 1];
  return `${d} L ${last[0]} ${last[1]}`;
}

export const LOOP_LINKS = LINK_POINTS.map(elbowPath);

/**
 * When each piece arrives, as a share of `--p` (progress through the
 * chapter). Every hop gets the same slice of the scroll rather than a
 * slice proportional to its length — the return run is sixteen times
 * the length of the hop from 1 to 2, and pacing the trail by distance
 * would stall on it for a third of the section.
 *
 * A box starts arriving just before its incoming line lands, so the
 * trail reads as reaching for something already there.
 */
const INTRO = 0.04;
const SPAN = 0.11;
const LEAD = 0.045;
const BOX_DUR = 0.06;

/**
 * Where the return run lands back on box 01 and the loop is closed.
 * Deliberately well short of the end of the chapter: the loop closing
 * is the point of the whole drawing, so it wants room to be *seen*
 * before the section hands over. The rest of the chapter's scroll holds
 * the closed loop and then moves on.
 */
export const LOOP_CLOSED_AT = INTRO + LOOP_BOXES.length * SPAN;

/** When box `i`'s incoming line lands on it. Box 01 starts the walk. */
const arrival = (i: number) => (i === 0 ? 0 : INTRO + i * SPAN);

export const LOOP_TIMELINE = {
  /**
   * The fade-in. Runs slightly AHEAD of the line's arrival, so the trail
   * reads as reaching for something already there rather than
   * conjuring it.
   */
  boxes: LOOP_BOXES.map((_, i) => ({
    from: i === 0 ? 0 : arrival(i) - LEAD,
    dur: BOX_DUR,
  })),
  links: LOOP_BOXES.map((_, i) => ({ from: INTRO + i * SPAN, dur: SPAN })),
  /**
   * The highlight — a box is lit from the moment its line TOUCHES it
   * until the next box's line lands, and the last one stays lit until
   * the loop closes.
   *
   * Deliberately not the fade-in window: that one leads by `LEAD`, so
   * hanging the highlight off it lit each box while its line was still
   * travelling. Anticipating in opacity is right; anticipating in the
   * highlight is just wrong.
   */
  lit: LOOP_BOXES.map((_, i) => ({
    from: arrival(i),
    // The last step holds to the end rather than going dark when the
    // loop closes: the return run drawing back into 01 IS "identify the
    // next best experiment to run", so Learn stays current while it
    // happens, and box 01's ring says the loop came round.
    to: i === LOOP_BOXES.length - 1 ? 1 : arrival(i + 1),
  })),
};


