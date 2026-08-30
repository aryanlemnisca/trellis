/**
 * The loop diagram's geometry and reveal timeline, in one place.
 *
 * Six boxes wired into a loop: one centered at the top, one centered at
 * the bottom, and two down each side column in between — Frame and
 * Model read as the loop's start and pivot, Design/Integrate and
 * Learn/Optimize as the two arms either side of the scientist's board.
 * The side columns run straight down; Frame and Model each meet their
 * column with a single right-angle bend out of their own LEFT/RIGHT
 * edge, so the loop reads as a crossbar at each one's own height rather
 * than a stem hanging off its top or bottom. The connectors are an
 * inline <svg> and the boxes are DOM (their labels have to render in
 * Inter), so both read their coordinates from here — the same numbers,
 * or the lines would not meet the boxes.
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
/** The two side columns, and the centre column the top/bottom boxes share. */
const COL_A = 40;
const COL_B = 620;
const COL_C = (COL_A + COL_B) / 2;
/** Row tops — four rows, symmetric top and bottom margins. */
const ROWS = [80, 367, 655, 942];

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

/**
 * In loop order: Frame sits alone at the top, Design and Integrate run
 * down the right column, Model sits alone at the bottom, Optimize and
 * Learn run back up the left column.
 */
export const LOOP_BOXES: LoopBox[] = [
  box(COL_C, 0), // 1 Frame
  box(COL_B, 1), // 2 Design
  box(COL_B, 2), // 3 Integrate
  box(COL_C, 3), // 4 Model
  box(COL_A, 2), // 5 Optimize
  box(COL_A, 1), // 6 Learn
];

const [B1, B2, B3, B4, B5, B6] = LOOP_BOXES;

/**
 * One polyline per hop. Frame and Model — the two centred boxes — leave
 * and arrive from their own LEFT/RIGHT edge rather than top/bottom, so
 * the loop reads as a crossbar at each one's own height, not a stem
 * hanging off its underside. The side columns still meet the row boxes
 * at their top/bottom edge and run straight down between them.
 */
const LINK_POINTS: Array<Array<[number, number]>> = [
  // 1 → 2, out of Frame's right edge, down into Design's top.
  [
    [B1.right, B1.cy],
    [B2.cx, B1.cy],
    [B2.cx, B2.y],
  ],
  // 2 → 3, straight down the right column.
  [
    [B2.cx, B2.bottom],
    [B3.cx, B3.y],
  ],
  // 3 → 4, out of Integrate's bottom, in through Model's right edge.
  [
    [B3.cx, B3.bottom],
    [B3.cx, B4.cy],
    [B4.right, B4.cy],
  ],
  // 4 → 5, out of Model's left edge, up into Optimize's bottom.
  [
    [B4.x, B4.cy],
    [B5.cx, B4.cy],
    [B5.cx, B5.bottom],
  ],
  // 5 → 6, straight up the left column.
  [
    [B5.cx, B5.y],
    [B6.cx, B6.bottom],
  ],
  // 6 → 1, out of Learn's top, in through Frame's left edge, closing the loop.
  [
    [B6.cx, B6.y],
    [B6.cx, B1.cy],
    [B1.x, B1.cy],
  ],
];

/**
 * A polyline with rounded corners: run to just short of each corner,
 * turn through a quadratic, carry on. Square elbows read as a diagram
 * of a circuit; rounded ones read as something a signal travels along,
 * which is the point of the trail. A 2-point entry (the straight column
 * hops) has no corner to round and passes through untouched.
 */
function elbowPath(points: Array<[number, number]>, r = 22): string {
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

export const LOOP_LINKS = LINK_POINTS.map((points) => elbowPath(points));

/**
 * When each piece arrives, as a share of `--p` (progress through the
 * chapter). Every hop gets the same slice of the scroll regardless of
 * its length, so the trail can't stall on a longer leg.
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


