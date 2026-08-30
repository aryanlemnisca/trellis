<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Trellis landing page

Next.js 16 (App Router, Turbopack) + Tailwind v4 + `@ybouane/liquidglass`.

## Non-negotiables

- **Type:** Inter for body copy and UI, self-hosted from `app/fonts.css`
  (`/public/fonts/*.woff2`). Do **not** reintroduce `next/font` for Inter — see
  the comment at the top of `app/fonts.css` for why the liquid-glass font
  prefetch breaks with it. **PT Serif** is the second, permanent typeface —
  headlines, chapter/hero headings, eyebrow labels, card kickers, box/step
  names, and the wordmark, generally set bold, with italic for emphasis spans
  and named labels (`<em>` fragments, `.loop-box-name`, `.stage-note-kicker`,
  `by Lemnisca`). It's linked via Google Fonts in `app/layout.tsx`, not a local
  `@font-face` — liquidglass prefetches every `@font-face` in the document, so
  a linked stylesheet keeps it out of that scan entirely (safe either way,
  since Google's CSS uses absolute URLs, unlike `next/font`'s broken relative
  ones — see the `app/layout.tsx` comment). Body paragraphs stay Inter.
- **Palette:** black, white, `board` (the dark field the stage panel draws
  on), plus **one accent colour** — `--color-accent` / `-700` / `-100`, a navy
  borrowed from the Trellis poster/brochure, at the user's explicit request to
  depart from the original black/white/board-only rule. Tokens in
  `app/globals.css`: `ink`, `paper`, the `ink-900/700/500/300/100` ramp,
  `board`, and the `accent` set. The accent carries emphasis (headline `<em>`
  spans, primary buttons, links, the lead series in a comparison) and washes
  backgrounds/dividers on white sections (eyebrow pill, FAQ hairlines) and on
  the board (eyebrow-board, loop box fill/ring, the closing step card). Body
  text and non-lead data stay ink/paper — the accent marks "the thing to
  remember," not everything.
  `BOARD` in `scripts/build-scenes.py` must match `--color-board` by hand — the
  loop overlay knocks the mesh out behind its nodes by painting that colour,
  and the SVGs are build output.
- **Every box on the board is a glass panel** rendering GLASS_SPEC — except
  where the renderer forbids it: a panel must be a DIRECT child of the scene
  root, so the closing panel's step card (three wrappers deep inside the closing
  grid) is a paper hairline over the field instead. Boxes on
  the white sections stay plain — glass over white reads as nothing. The one
  frosted thing off the board is the **eyebrow pill** (`.eyebrow`,
  `components/ui/Eyebrow.tsx`), which carries every section label and is
  plain CSS for exactly that reason: the shader has nothing to bend on white,
  and at ~33px tall the spec's `zRadius` would swallow the panel whole.
  Section eyebrows carry the **name only** — no step numbers.
- **Glass spec:** `lib/glass/spec.ts` holds named recipes — `panel` (the tuned
  playground state, 1:1, for every board surface) and the three button variants
  `regular` / `frosted` / `dark`. **Pick a variant; don't invent numbers.**
  `GlassOverrides` stays narrowed to `floating` / `button`, so optics are never
  overridden per element.
  The button recipes are the library DEFAULTS plus the one or two values the
  playground actually changes (`dark` is `blurAmount: 0.25, brightness: -0.3`
  and nothing else). Adding to them is what makes a button read as grey
  plastic: `specular` above 0 lays streaks across the face, `tintStrength` /
  `saturation` turn it milky.
  **Size the element to the variant, don't retune the variant to the element** —
  `panel`'s `zRadius: 100` wants a short edge over ~250px or the bevel swallows
  the whole surface and it reads as a flat frosted box. The buttons go the
  other way: `cornerRadius: 50` / `zRadius: 40` on a 52px pill puts nearly the
  whole face inside the bevel, and that deep lens IS the look — scaling the
  bevel down to "fit" the button flattens it. `.glass-button` holds the
  matching min-height.

## Working with the glass renderer

`<GlassScene>` (client) wraps content; `<Glass>` is one refracting panel.

```tsx
<GlassScene className="min-h-screen" backdropClassName="bg-ink">
  <div className="absolute inset-0">…content the glass refracts…</div>
  <Glass className="relative z-10 h-40 w-96" cornerRadius={100}>…</Glass>
</GlassScene>
```

Constraints the library imposes — violating these silently degrades the effect:

1. **Panels must be direct children of the scene root.** Nested ones are dropped
   with a console warning.
2. **The scene is rasterised from the root's non-glass direct children onto a
   canvas pre-filled with white.** The root's own background is never sampled,
   so the base colour lives on the `backdropClassName` layer. A scene with
   nothing behind a panel renders a solid white pill.
3. **Keep those non-glass children shallow.** Each is captured through
   `html-to-image` every time it changes.
4. **A panel paints nothing itself.** Its own background/border is captured as
   *content* and composited over the shader, which reads as a flat overlay.
   Style the panel's children, not the panel.
5. **The library forces `overflow: visible`** on panels and promotes `static`
   panels to `relative`. Don't add a `position` rule targeting `[data-glass]` —
   it out-specifies Tailwind's positioning utilities.
6. **Panels mounted after init** aren't in the renderer's glass set; `GlassScene`
   watches for that and re-inits. Content changing *inside* a panel is observed
   automatically. For things the library can't see (canvas pixels, swapped
   `<img>` src), call `useGlassScene().markChanged(el)` or pass `dynamic`.

**A button anywhere gets `<GlassButton>`, which brings its own scene.** The
renderer only ever samples a root's own children, so a control nested inside a
section can't join the board's scene — which is why buttons couldn't be glass
at all. The library's own answer is a scene per control, and that is what
`GlassButton` is: a backdrop layer plus one panel, droppable anywhere. Two
things follow. Each scene is **its own WebGL context** (browsers cap these
around 16 system-wide — a handful of buttons, not a list of forty). And the
button refracts **its own backdrop, not the real page** — which is what decides
whether it looks like glass at all. The demo's `dark` button sits over a
photograph: `brightness: -0.3` darkens real mid-tones and the bevel bends real
detail. Over flat white there is nothing to darken and nothing to bend, and the
identical config renders a grey lozenge. So a button brings its own surface:
`.glass-button-slab` is the house one, a lit top-left falling to near-black.
Keep `rounded-full` on the backdrop layer or its square corners show past the
pill.

Fallback: no WebGL, `prefers-reduced-transparency`, or a failed init leaves the
root at `data-glass-mode="css"`, which styles panels with `backdrop-filter`.
The fallback is keyed on `data-variant`, the one prop `<Glass>` writes to the
DOM rather than swallowing into the config — without it a `dark` button would
fall back to a light frost, its own opposite.

## Page structure

`Stage → Faq → Footer`. Everything is white except one surface: the board
panel, which is also the only place liquid glass can work (glass needs
contrast behind it — on the white sections it reads as nothing).

**Stage** (`components/stage/`) is the hero and the scroll narrative as one
object. The board panel is pinned from the first frame: it plays the hero
entrance, holds through the three chapters, then **shifts into a rounded box
container** for the close — leaving the viewport edge for an inset, taking a
40px radius and a lift off the page. Both are one expression of `--e`, so the
change arrives as a single move.

**The field does not change colour. It is the board the whole way through**,
grid and all: the close is a change of shape, not of surface, and everything
that sits on it — heading, steps, CTA, eyebrow — is set in the board palette to
match. Do not reintroduce a board→paper cross-fade. It needs no hairline
either: a black box on a white page draws its own edge. The line art returns as
a **watermark** behind it, the LIGHT plate, since the ground it lands on is
still dark — that is what the light/ink pair is for.

Flow: `hero → 01 the problem → 02 how it works → 03 the evidence → start here`.

Three drivers, kept separate on purpose:

| what | how | cost |
| --- | --- | --- |
| active beat | IntersectionObserver | one React state change per beat |
| chapter progress | rAF scroll read → `--p1/--p2/--p3` on the section | no React per frame |
| what is mounted | thresholds on those same values | one state change per hand-over |
| expansion | rAF scroll read → `--e` on the section | no React per frame |

**Every chapter publishes its own progress, and every drawing on the board
reads the one it belongs to.** `--p1`, `--p2`, `--p3` are written each frame
whatever the active beat is; a layer takes its own into `--t` and everything
inside it — trail, highlight, curve, caption — hangs off that. There is no
single "active chapter" value, on purpose: one would snap to the incoming
chapter at a hand-over and yank the outgoing drawing back to its start in the
same frame it began fading. Each chapter's value clamps to 1 above and 0
below, so an outgoing layer simply holds its finished state.

**Hand-overs between board drawings are a scroll-driven cross-fade**, both
ends timed off the SAME clock — the incoming chapter's progress — so they
genuinely overlap instead of cutting. Loop out by `--p3` 0.16, plot in by 0.20,
crossing between 0.04 and 0.16. Because it is scroll-driven and not a
transition, scrubbing the boundary dissolves back and forth rather than
flickering. Don't reintroduce a timed crossfade on the beat change: a beat
change is one discrete event, so it fires wherever the reader happens to be.

**A layer has to UNMOUNT, not just fade.** The glass renderer samples content
at full strength regardless of CSS opacity, so an opacity-0 drawing still
ghosts inside any glass panel over it — and the problem beat parks its cards
exactly where these sit. Hence the mount windows in the scroll writer: each
drawing is mounted from the start of its own chapter through the cross-fade at
the far end, and nothing is mounted over the cards. Same reason the ink reprise
is `display: none` until `data-opening` flips.

Artwork in `public/illustration` comes from `scripts/build-scenes.py` and is
**build output, not hand-edited**. Only the hero drawing is still used —
`surface.svg` and the overlays are unreferenced now that every chapter draws
its own thing in DOM and inline SVG.

**Illustration** — `public/illustration/path-{light,ink}.png`, extracted from
`HeroImgSection.svg` (which is a raster pair, not vector: artwork plus a
feathered silhouette mask). Alpha is the artwork's ink density bounded by that
mask, so the same geometry works white-on-board and ink-on-paper. Regenerate
both together if the source changes.

The two `<img>`s must stay **direct children** of the glass root: the library
composites direct-child media through `drawImage`, while anything nested goes
through `html-to-image` — which would rasterise the artwork on every pan.

**Non-glass panel content is mounted per beat; glass panels are parked
instead.** Anything inside the panel is composited into every glass panel's
scene at full strength regardless of its opacity, so hiding it with `opacity`
ghosts it inside the readout. For plain content (the landscape, the overlays)
the fix is mounting per beat. For *glass* content it can't be — changing the
panel set re-initialises the whole scene, which re-captures every panel and
stalls the scroll — so the cards stay mounted and `translate` parks them off
the board.

**The card cluster is one object on one clock.** Card 03 is centred on the
canvas and the other two are attached to its corners — 02 at the top right, 01
at the bottom left. `CARD_SLOTS` in `Stage.tsx` is listed in PAINT order, not
card order, so which card sits in which slot can change without disturbing the
layering. The cards carry a kicker, a figure and a sentence — no heading and no
number — which means the copy runs to the bottom edge, so `--dy` is sized to
land the lap inside the bottom padding. Padding buys nothing there: it grows
the cards as fast as it grows the clearance. The geometry is anchored to the
centre card (`--cw`,
`--sw`, `--tuck`, `--dy` on `.stage-card`), not to shares of the panel, because
the cards hit a rem cap and stop scaling with a wide panel — percentage
positions would drift and the corners would come apart. The two edge insets
fall out symmetrical on their own: the same tuck measured from opposite edges
of a centred box. The three hold fixed positions relative to each other and the
whole
group slides on and off the board rigidly. Parking and reveal are the *same*
`translate`, computed straight from `--p1` with **no transition at all**:
scroll is the only clock, so reversing the scroll reverses the motion exactly.
Don't reintroduce a second one. The previous arrangement ran a 520ms parking
transition fired by the beat change against per-card `--p` thresholds for the
fade, which is why the group arrived broken up and why cards stayed stranded
on the board when the reader scrolled back up.

**The hero drawing carries an annotation loop.** `HERO_NOTES` in
`content.tsx` is three notes — plate, bench→pilot, production — one on screen
at a time, cycling forever, each tied to the vessel it names by a leader line
that draws itself on (`pathLength: 1`, so the dash offset IS the progress) and
ends in a ring on the vessel. One shared keyframe with a per-note delay of a
third of the 12s cycle, so the sequence is a single expression rather than
three animations kept in step by hand. The delay is **positive**: a negative
one would put note 01 last on the first pass.

**Each card is pinned by the edge its leader leaves from.** A card's height
is set by its text, in px, so its top and bottom cannot both be known as a
share of the art box — pin the one the line touches and the join is exact at
every viewport, whatever the copy wraps to: `bottom` for the plate note, which
drops onto its vessel; `top` for the bench note, which sits BELOW its vessel
and reaches up; `left` plus the fixed width for the production note, which
reaches across. The bench card hangs past the art box onto the bare board,
which is fine — the panel is the canvas — but the art box is width-bound, so a
short window closes in on it; at 90% it still clears a 620px-tall viewport
before the panel's `overflow: hidden` starts clipping. The loop keyframes animate
`transform`, never `translate`, because the production card uses `translate` to
centre itself on its own leader.

**The loop is gated on MOUNT, not an animation-delay.** It starts once the
panel has settled and the drawing has wiped on (`notesReady`, a one-shot that
never resets). A delay would replay on every remount and leave the board blank
for three seconds each time the reader scrolled back up to the hero.

**The layer takes the ARTWORK's box, not the panel's.** Every coordinate in
`HERO_NOTES` is a fraction of the art box, and the leaders' `<svg>` shares the
drawing's own 1663×870 viewBox. The drawing is sized in `vw` and the panel in
`vw` × `vh`, so anything anchored to the panel slides off its vessel the moment
the window changes shape — verified holding at both 1470×702 and 1920×760. The
`to` points were measured off `path-light.png` (the alpha centroid of each
vessel), not guessed.

They are frosted in CSS, not `<Glass>`, and not by preference — the renderer
redraws a panel's shader only on a DOM mutation, so an infinitely animating
glass panel samples a stale frame unless `markChanged` is pumped every frame
forever, and an animation's fill would override the opacity the panel declares.
The loop sits on the notes and the scroll fade on their WRAPPER, for the same
reason: an animated opacity beats a declared one, so a single element would
scroll away with its labels still lit.

**The hero drawing leaves on the scroll, not on the beat.** It is mounted by
`Stage.tsx` directly rather than through a beat's overlay slot, and wipes out
against `--p1` — complete at `0.18`, the frame the leading card reaches the
board, so one goes as the other comes and the whole thing runs backwards for
free. It used to hang off the beat change, which fired a 320ms fade wherever
the reader happened to be, so it vanished early, or late, or twice if they
scrubbed the boundary. It still has to **unmount** once
it is out (a mounted layer is sampled at full strength however faint), which is
why its entrance animation is carried on a separate class that is dropped once
it has played — a delayed entrance replaying on every remount blanked the
drawing for the length of the delay each time the reader came back up.

**A chapter can run long and pin its own copy.** The loop beat is `LOOP_VH`
tall and its copy column is `sticky` inside it, so the copy holds while `--p`
walks the six stages. Because chapters are no longer all one viewport tall,
the expansion's share of the scroll is **measured in px from the real travel**
rather than derived from per-chapter constants — don't reintroduce a fixed
`EXPAND_SHARE` fraction.

**The loop beat carries no artwork at all.** `overlay: null` on that beat is
what keeps both the loop overlay and the shared response surface from
mounting; the board is bare grid and `LoopDiagram` draws on it — six boxes
wired into a circuit, revealed as a trail that walks the loop while the copy
stays pinned beside it.

It is **DOM plus inline SVG, not build output**. It has to be: the box labels
must render in Inter (an SVG loaded through `<img>` cannot fetch a webfont),
and the trail reveals against scroll, which a static file cannot do. Its
geometry and reveal timeline live in `lib/stage/loop-diagram.ts` — one source
for the connector paths, the box positions and the thresholds, or the lines
would not meet the boxes. The container is given the viewBox's exact aspect
ratio so the SVG fills it edge to edge and a box placed at `x / view.w` percent
lands on the end of its line.

The whole reveal is CSS against `--p`: each connector is a path with
`pathLength="1"`, so its dash offset IS its progress, and each box crosses its
own threshold. No React per frame, and it reverses exactly on the way back up.
The step's description sits **above** the drawing — it belongs to the step the
trail has just reached, and reading it before the eye drops into the loop is
the right order.

**The trail closes well short of the end of the chapter** (`LOOP_CLOSED_AT`,
currently 0.7). The return run landing back on box 01 is the point of the whole
drawing, so it needs room to be seen: the rest of the chapter's scroll holds the
closed loop — box 01 picks up a ring to say so — and then hands over. Don't
retime it so the loop closes at 1.0; the reader never sees it.
Every hop gets an **equal slice of the scroll** rather than a slice
proportional to its length — the return run is sixteen times the hop from 1 to
2, and pacing by distance would stall on it for a third of the section. The
`active` index comes from those same thresholds, so the highlight can never
disagree with what is drawn.

Boxes are painted `board`, not transparent: the trail runs behind them and that
is what hides it inside them. They are not glass, and the beat carries no glass
panel on the board either — the renderer doesn't observe attribute changes on
non-glass descendants, so a panel here would sample a stale capture.

`overlay-loop.svg` and `lib/stage/loop-geometry.json` are still emitted by
`scripts/build-scenes.py` but nothing reads them any more.

**`--p` is progress through the active chapter**, written by the same rAF
scroll read as `--e`. Content inside the panel reveals against it, so it
arrives as the section is read and holds wherever the reader stops, instead of
firing on a timer whether or not they are still moving. **`--p1` is chapter
01's own progress**, published every frame *whatever the active beat is* —
the card cluster needs to keep tracking after the beat has moved on, and while
the reader is scrolling back up into it. Both are seeded to `0` on `.stage`:
a `calc()` reading an undefined custom property is invalid at computed-value
time, which would drop `translate` and put the cards on the board unstyled
before hydration.

**The beat observer must be scoped to the section's descendants.** The section
itself also carries `data-beat` — the beat's *id*, which the CSS keys off — so
a document-wide `[data-beat]` query observed it too and fed `Number("hero")` →
`NaN` into `setBeat`. A chapter entry in the same callback usually overwrote it
inside one React batch, which is what hid the bug; a callback carrying only the
section rendered `BEATS[NaN]` and tore the whole tree down mid-scroll.

**The FAQ's height is measured in JS, not `grid-template-rows: 0fr → 1fr`.**
That trick works in Chrome and silently fails in Safari: the answer needs
`overflow: hidden` to clip while closed, an overflow-hidden grid item has an
automatic minimum size of 0, and with an indefinite container height Safari
then resolves `1fr` to 0. The row toggled, the panel stayed shut, and it read
as the tap being ignored — invisible on desktop because Chrome special-cases
it. `Faq.tsx` measures each answer with a ResizeObserver (re-measured, since
the height moves when the webfont lands) and animates `height`.

**Never hand-write a vendor prefix in `globals.css`.** Lightning CSS prefixes
from the project's browser targets; writing `backdrop-filter` AND
`-webkit-backdrop-filter` made it emit only the `-webkit-` form and drop the
standard property, so the blur silently did nothing in Chrome. Write the
standard property alone and let the build do it.

**`backdrop-filter` only samples back to its nearest BACKDROP ROOT**, and a
`transform` creates one even when it resolves to zero translation. That is why
`.stage-closing` carries no transform: the eyebrow pill and the step card
inside it were blurring an empty backdrop. Anything that needs to frost what is
behind it cannot sit under an ancestor with a transform, a filter, or an
opacity below 1.

**Never give a glass panel an entrance `animation`.** An animation's fill
overrides the `opacity` declared in CSS, so a delayed entrance on the readout
made the empty panel fade itself in over the bare hero and snap away again.
Use a transition, and hide it from an ancestor selector — `<Glass>` swallows
`data-*` props into the glass config rather than forwarding them to the DOM.

**GlassPulse** marks the glass dirty while the scene behind it moves. The
library only re-renders a panel's shader on a DOM mutation, and a CSS
transform on a sibling isn't one, so without it the glass samples a stale
frame during pans and the expansion.

**`delayMs` on GlassScene** holds init until the hero entrance has settled —
the library sizes each panel's canvas from its measured rect, so initialising
mid-transform makes it re-measure and reallocate every frame.

**"Start here" only ever appears inside the boxed canvas.** Above `lg` that is
the pinned panel once it has finished shifting; below `lg`, where nothing pins
and nothing opens, the closing gets the same box as a static container —
`.stage-closing-box`, matching the panel's end state: board surface, radius,
lift and watermark. Two copies exist in the DOM, one per breakpoint, and
exactly one is ever rendered.

Which is why **`#start` is its own marker element**, not an id on either copy:
two elements cannot share an id, and the hero CTA was jumping to whichever came
first in the DOM — the one that is `display: none` at that width. The marker
sits in the copy column at the point the chapters end, so it lands on the
stacked box below `lg` and on the frame the panel finishes opening above it.

Below `lg` none of the pinning applies and there is no glass: the panel sits
above the copy, and **every chapter stacks its own drawing** — the problem
cards as a plain column (`ProblemStill`, in reading order rather than the
desktop cascade's paint order), the loop diagram fully walked, the plot fully
drawn. Nothing below `lg` may fall back to a beat's `overlay`: those are all
`null` now, and the old surface still rendered `surface.svg` — a landscape
nothing else on the site draws any more. `surface.svg` and the three overlays
are unreferenced; `scripts/build-scenes.py` still emits them.

## Notes

- **App icons are build output.** `scripts/build-icons.mjs` emits all three
  from one definition — `app/icon.svg` (rounded, modern browsers),
  `app/favicon.ico` (16/32/48 PNG-in-ICO, older browsers and Windows) and
  `app/apple-icon.png` (180, **square** — iOS masks its own corners, so a
  pre-rounded source would be clipped twice). Change `MARK` in the script and
  re-run `node scripts/build-icons.mjs`; don't hand-edit the files. The mark is
  geometry, not a `<text>` element: an icon renders outside the page, so it
  cannot fetch Inter. `sharp` comes in transitively with next.
- `reference/` holds the source Trellis collateral (product copy, benchmark
  charts, the process loop) — content reference, not site assets.
- `patch-package` is a devDependency purely so `@ybouane/liquidglass`'s
  `postinstall` doesn't fail a clean `npm install` (and Vercel builds).
