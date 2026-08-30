import {
  LOOP_BOXES,
  LOOP_CLOSED_AT,
  LOOP_LINKS,
  LOOP_TIMELINE,
  LOOP_VIEW,
} from "@/lib/stage/loop-diagram";
import type { Stage as LoopStage } from "./content";
import { LOOP_ICONS } from "./LoopIcons";

/**
 * LoopDiagram — the six stages as a wired loop, drawn on the board.
 *
 * DOM and inline SVG rather than artwork: the labels have to render in
 * Inter (an SVG loaded through <img> cannot fetch a webfont), and the
 * trail has to reveal against scroll, which build output can't do.
 *
 * The whole reveal is CSS reading `--p` — the chapter's scroll progress,
 * published on `.stage` — so walking the loop costs no React renders and
 * reverses exactly when the reader scrolls back up. Each connector is a
 * path with `pathLength="1"`, so its dash offset IS its progress, and
 * each box crosses its own threshold from `LOOP_TIMELINE`.
 *
 * The highlight is CSS too, off the same `--p`: a box is lit from the
 * frame its line TOUCHES it until the next box's line lands. It used to
 * be a React state change plus a 420ms transition, which is a timer
 * racing a scroll — at any real scrolling speed the lit box was visibly
 * behind the trail. The caption's text is picked by `activeLoopStep`
 * upstream, from those same arrival times.
 * Not glass, and the beat carries no glass panel on the board either:
 * the renderer doesn't observe attribute changes on non-glass
 * descendants, so a panel here would sample a stale capture of it.
 */
export function LoopDiagram({
  stages,
  className,
}: {
  stages: LoopStage[];
  className?: string;
}) {
  return (
    <div
      className={`loop-diagram ${className ?? ""}`}
      style={{ "--closed-at": LOOP_CLOSED_AT } as React.CSSProperties}
    >
      <svg
        className="loop-wires"
        viewBox={`0 0 ${LOOP_VIEW.w} ${LOOP_VIEW.h}`}
        fill="none"
        aria-hidden
      >
        {LOOP_LINKS.map((d, i) => (
          <g key={i}>
            {/* The track the trail runs along, so the loop reads as a
                closed circuit even where it hasn't been walked yet. */}
            <path className="loop-track" d={d} />
            <path
              className="loop-trail"
              d={d}
              pathLength={1}
              style={
                {
                  "--from": LOOP_TIMELINE.links[i].from,
                  "--dur": LOOP_TIMELINE.links[i].dur,
                } as React.CSSProperties
              }
            />
          </g>
        ))}
      </svg>

      <ol className="loop-steps">
        {stages.map((stage, i) => (
          <li
            key={stage.name}
            className="loop-box loop-lit"
            style={
              {
                "--from": LOOP_TIMELINE.boxes[i].from,
                "--dur": LOOP_TIMELINE.boxes[i].dur,
                "--lit-from": LOOP_TIMELINE.lit[i].from,
                "--lit-to": LOOP_TIMELINE.lit[i].to,
                left: `${(LOOP_BOXES[i].x / LOOP_VIEW.w) * 100}%`,
                top: `${(LOOP_BOXES[i].y / LOOP_VIEW.h) * 100}%`,
                width: `${(LOOP_BOXES[i].w / LOOP_VIEW.w) * 100}%`,
                height: `${(LOOP_BOXES[i].h / LOOP_VIEW.h) * 100}%`,
              } as React.CSSProperties
            }
          >
            <span className="loop-box-icon" aria-hidden>
              {LOOP_ICONS[stage.name]?.()}
            </span>
            <span className="loop-box-text">
              <span className="loop-box-n">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="loop-box-name">{stage.name}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * LoopCaption — the step descriptions, on the same clock as the boxes.
 *
 * All six are mounted and stacked in one grid cell; each carries the
 * `--lit` window of the box it belongs to, so the text crosses over on
 * exactly the frame its box lights and fades at exactly the same rate.
 *
 * It used to be one <p> whose text came from React state. Even reading
 * the right step, that is a hard cut against a ramp — the words changed
 * before the box had visibly lit. Same class of mistake as the
 * highlight's old 420ms transition: two clocks for one motion.
 */
export function LoopCaption({
  stages,
  className,
}: {
  stages: LoopStage[];
  className?: string;
}) {
  return (
    <div className={`loop-caption ${className ?? ""}`}>
      {stages.map((stage, i) => (
        <p
          key={stage.name}
          className="loop-lit"
          style={
            {
              "--lit-from": LOOP_TIMELINE.lit[i].from,
              "--lit-to": LOOP_TIMELINE.lit[i].to,
            } as React.CSSProperties
          }
        >
          {stage.body}
        </p>
      ))}
    </div>
  );
}
