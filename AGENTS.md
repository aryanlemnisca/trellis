<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Trellis landing page

Next.js 16 (App Router, Turbopack) + Tailwind v4 + `@ybouane/liquidglass`.

## Non-negotiables

- **Type:** Inter only, self-hosted from `app/fonts.css` (`/public/fonts/*.woff2`).
  Do **not** reintroduce `next/font` — see the comment at the top of `app/fonts.css`
  for why the liquid-glass font prefetch breaks with it.
- **Palette:** black and white, plus one surface colour — `board`, the dark
  field the stage panel draws on. Tokens in `app/globals.css`: `ink`, `paper`,
  the `ink-900/700/500/300/100` ramp, and `board`. No other hues, no accent
  colour. Type on the board is `paper` at an opacity step.
  `BOARD` in `scripts/build-scenes.py` must match `--color-board` by hand — the
  loop overlay knocks the mesh out behind its nodes by painting that colour,
  and the SVGs are build output.
- **Every box on the board is a glass panel** rendering GLASS_SPEC. Boxes on
  the white sections stay plain — glass over white reads as nothing.
- **Glass spec:** `lib/glass/spec.ts` mirrors the tuned playground state 1:1
  and every panel renders it verbatim. `GlassOverrides` is narrowed to
  `floating` / `button` so the optical values can't be overridden at all.
  **Size panels to the spec, don't retune the spec to the panel** — `zRadius: 40`
  needs room, so a panel under ~120px on its short edge has its whole surface
  swallowed by the bevel and reads as a flat frosted box rather than glass.

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

Fallback: no WebGL, `prefers-reduced-transparency`, or a failed init leaves the
root at `data-glass-mode="css"`, which styles panels with `backdrop-filter`.

## Page structure

`Stage → Faq → Footer`. Everything is white except one surface: the board
panel, which is also the only place liquid glass can work (glass needs
contrast behind it — on the white sections it reads as nothing).

**Stage** (`components/stage/`) is the hero and the scroll narrative as one
object. The board panel is pinned from the first frame: it plays the hero
entrance, holds through the three chapters, then expands into the closing box
and cross-fades from board to paper (the line art swaps polarity with it).

Flow: `hero → 01 the problem → 02 how it works → 03 the evidence → start here`.

Three drivers, kept separate on purpose:

| what | how | cost |
| --- | --- | --- |
| active beat | IntersectionObserver | one React state change per beat |
| readout visibility | `.stage[data-readout]` + an opacity **transition** | see below |
| within-chapter reveal | rAF scroll read → `--p` on the section | no React per frame |
| expansion | rAF scroll read → `--e` on the section | no React per frame |
| lens | `--lx/--ly`, transitioned on `.stage` | inherited into one offset |

**The chapters are one object being reinterpreted, not several pictures.**
The panel opens blank (grid only), the response surface arrives with chapter
01 and then *never changes* for the rest of the scroll; each beat lays a thin
overlay on it. The hero drawing returns at the end, sliding in as the box
opens. That continuity is what makes the beat change a **wipe** rather than a
crossfade — a ~300ms crossfade of two similar wireframes reads as a flicker,
not a change of subject. Timings: overlay wipes in left-to-right over 1000ms
(plate end first, production end last — the direction every scene reads),
opacity in over 420ms, outgoing out over 320ms so the incoming layer leads.

Artwork comes from `scripts/build-scenes.py` and is **build output, not
hand-edited** — re-run it to change anything. Everything shares the hero
drawing's 1663×870 box and projection, so the layers register exactly and drop
into one slot, published by `.stage` as `--art-w/--art-h/--art-left`.

**Only the incoming and outgoing overlay may be mounted at once.** The glass
renderer draws direct-child media through `drawImage`, which ignores CSS
opacity — so every mounted layer is sampled at full strength and a full stack
would show every overlay at once inside the glass. Hence the two-slot wipe
in `Stage.tsx`, and why the ink reprise is `display: none` until
`data-opening` flips.

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
the board when their beat isn't active. `translate` for parking, `transform`
for the reveal: two properties, so neither has to know about the other.

**A chapter can run long and pin its own copy.** The loop beat is `LOOP_VH`
tall and its copy column is `sticky` inside it, so the copy holds while `--p`
walks the six stages. Because chapters are no longer all one viewport tall,
the expansion's share of the scroll is **measured in px from the real travel**
rather than derived from per-chapter constants — don't reintroduce a fixed
`EXPAND_SHARE` fraction.

**Ring geometry has one source.** `scripts/build-scenes.py` draws the loop and
emits `lib/stage/loop-geometry.json`; `LoopNodes` positions the DOM nodes from
that same file. The nodes have to be DOM rather than part of the SVG because
their labels must render in Inter, and an SVG loaded through `<img>` cannot
fetch a webfont. They are not glass: at ~48px on the short edge the spec's
`zRadius` would swallow the panel and read as a flat chip. The beat carries no
glass readout either, which is what lets the highlight change freely — the
renderer doesn't observe attribute changes on non-glass descendants, so a
glass panel here would sample a stale capture of the nodes.

**`--p` is progress through the active chapter**, written by the same rAF
scroll read as `--e`. Content inside the panel reveals against it — each card
crosses its own threshold — so a stack arrives as the section is read and
holds wherever the reader stops, instead of firing on a timer whether or not
they are still moving.

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

Below `lg` none of the pinning applies and there is no glass: the panel sits
above the copy, chapters stack with cropped stills, and the closing panel is a
plain box.

## Notes

- `reference/` holds the source Trellis collateral (product copy, benchmark
  charts, the process loop) — content reference, not site assets.
- `patch-package` is a devDependency purely so `@ybouane/liquidglass`'s
  `postinstall` doesn't fail a clean `npm install` (and Vercel builds).
