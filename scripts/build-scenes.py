"""
Builds the stage artwork.

The panel is pinned and never leaves the screen, so the four chapters are
NOT four pictures. They are one object being reinterpreted: a single
response surface is drawn once, stays put for all four beats, and each
beat adds an overlay on top of it. That is what makes the sequence read
as one model growing rather than four separate marketing claims — and it
is why the transitions can be a wipe rather than a crossfade between
unrelated images.

Output:
  surface.svg           the shared landscape — drawn once, never swapped
  overlay-problem.svg   01  a best-observed point that isn't the optimum
  overlay-loop.svg      02  that route curled into a scientist-gated loop
  overlay-evidence.svg  03  three strategies over the same landscape

Every file shares the hero drawing's 1663×870 box and the same projection,
so they register exactly and can be stacked as plain <img> layers. They
are wordless on purpose: the copy column and the glass readout carry the
words, and a wordless <img> is what lets the glass renderer composite
them through drawImage instead of html-to-image.
"""
import json
import math
import os

W, H = 1663, 870
OUT = "public/illustration"

# Must match --color-board in globals.css: the loop overlay knocks the
# mesh out behind its nodes by painting the board colour over it.
BOARD = "#000000"

BUMPS = [
    (0.20, 0.42, 0.11, 0.17, 0.44),
    (0.47, 0.56, 0.12, 0.19, 0.66),
    (0.74, 0.44, 0.11, 0.17, 0.86),
    (0.90, 0.64, 0.09, 0.15, 0.52),
]


def height(u, v):
    z = 0.04 + 0.22 * u
    for u0, v0, su, sv, amp in BUMPS:
        z += amp * math.exp(
            -(((u - u0) ** 2) / (2 * su * su) + ((v - v0) ** 2) / (2 * sv * sv))
        )
    return z


def project(u, v, z):
    return 130 + u * 1330 + v * 170, 762 - u * 26 - v * 250 - z * 330


def P(u, v):
    return project(u, v, height(u, v))


def base(u, v):
    return project(u, v, 0.0)


def pts(points):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in points)


def line(points, o, w=1.1, dash=None, cap="round"):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (
        f'<polyline points="{pts(points)}" fill="none" stroke="#fff" '
        f'stroke-opacity="{o:.3f}" stroke-width="{w}" stroke-linecap="{cap}" '
        f'stroke-linejoin="round"{d}/>'
    )


def ring(x, y, r, w=3.2, o=0.95):
    return (
        f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="none" stroke="#fff" '
        f'stroke-opacity="{o}" stroke-width="{w}"/>'
    )


def dot(x, y, r=5.5, o=0.8):
    return f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="#fff" fill-opacity="{o:.3f}"/>'


def arrow(points, o=0.95, w=4.2, size=26):
    ex, ey = points[-1]
    px, py = points[-6]
    dx, dy = ex - px, ey - py
    dl = math.hypot(dx, dy) or 1
    dx, dy = dx / dl, dy / dl
    return (
        f'<polyline points="{ex - dx * size - dy * size * 0.5:.1f},'
        f'{ey - dy * size + dx * size * 0.5:.1f} {ex:.1f},{ey:.1f} '
        f'{ex - dx * size + dy * size * 0.5:.1f},{ey - dy * size - dx * size * 0.5:.1f}" '
        f'fill="none" stroke="#fff" stroke-opacity="{o}" stroke-width="{w}" '
        f'stroke-linecap="round" stroke-linejoin="round"/>'
    )


def crest(u):
    """The v that maximises height at this u."""
    best, bz = 0.5, -1e9
    for n in range(81):
        v = n / 80
        z = height(u, v)
        if z > bz:
            best, bz = v, z
    return best


_ROUTE = None


def route_v(u):
    """Smoothed crest line — the way through the landscape."""
    global _ROUTE
    if _ROUTE is None:
        raw = [(n / 120, crest(n / 120)) for n in range(121)]
        _ROUTE = []
        for i, (uu, _) in enumerate(raw):
            lo, hi = max(0, i - 9), min(len(raw), i + 10)
            _ROUTE.append((uu, sum(w for _, w in raw[lo:hi]) / (hi - lo)))
    i = min(range(len(_ROUTE)), key=lambda k: abs(_ROUTE[k][0] - u))
    return _ROUTE[i][1]


def route(u0=0.05, u1=0.86, n=110):
    return [P(u0 + (u1 - u0) * i / n, route_v(u0 + (u1 - u0) * i / n)) for i in range(n + 1)]


def svg(body, name):
    doc = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}" fill="none">' + "".join(body) + "</svg>"
    )
    os.makedirs(OUT, exist_ok=True)
    with open(f"{OUT}/{name}.svg", "w") as fh:
        fh.write(doc)
    print(f"  {name}.svg  {len(doc) / 1024:.0f} KB")


# ── The shared landscape ─────────────────────────────────────────────

def build_surface():
    body = []
    samples = 84
    for i in range(9):
        v = i / 8
        body.append(line([P(n / samples, v) for n in range(samples + 1)], 0.17, 1.05))
    for i in range(13):
        u = i / 12
        body.append(line([P(u, n / samples) for n in range(samples + 1)], 0.17, 1.05))
    # front and back sills, so the surface reads as an object with edges
    body.append(line([P(n / samples, 0.0) for n in range(samples + 1)], 0.3, 1.4))
    body.append(line([P(n / samples, 1.0) for n in range(samples + 1)], 0.22, 1.2))
    svg(body, "surface")


# ── 01 · False summit ────────────────────────────────────────────────

SAMPLES = [
    (0.08, 0.24), (0.16, 0.68), (0.25, 0.38), (0.33, 0.76), (0.40, 0.22),
    (0.55, 0.74), (0.62, 0.30), (0.70, 0.72), (0.81, 0.22), (0.93, 0.58),
]
BEST = (0.468, 0.556)      # a real local high — just not the one that matters
TRUE = (0.740, 0.442)      # taller ridge, never sampled


def build_problem():
    body = []
    for b in (
        [(0.10, 0.20), (0.44, 0.34)],
        [(0.30, 0.82), (0.66, 0.68)],
    ):
        (u0, v0), (u1, v1) = b
        path = []
        for n in range(41):
            t = n / 40
            path.append(P(u0 + (u1 - u0) * t, v0 + (v1 - v0) * t + 0.09 * math.sin(math.pi * t)))
        body.append(line(path, 0.17, 1.4, dash="7 9"))

    for u, v in SAMPLES:
        x, y = P(u, v)
        bx, by = base(u, v)
        body.append(line([(x, y), (bx, by)], 0.09, 1.0, dash="3 7"))
        body.append(dot(x, y, 5.5, 0.72))

    # what you tested and liked
    bx, by = P(*BEST)
    body.append(dot(bx, by, 6.5, 1.0))
    body.append(ring(bx, by, 20, 2.6, 0.9))
    body.append(ring(bx, by, 34, 1.2, 0.35))

    # what is actually there, and was never visited
    tx, ty = P(*TRUE)
    fx, fy = base(*TRUE)
    body.append(line([(tx, ty), (fx, fy)], 0.22, 1.2, dash="4 7"))
    for i, r in enumerate((40, 78, 118, 160)):
        body.append(
            f'<ellipse cx="{tx:.1f}" cy="{ty:.1f}" rx="{r * 1.5:.0f}" '
            f'ry="{r * 0.56:.0f}" fill="none" stroke="#fff" '
            f'stroke-opacity="{0.30 - i * 0.055:.2f}" stroke-width="1.3" '
            f'stroke-dasharray="5 8"/>'
        )
    body.append(ring(tx, ty, 13, 2.0, 0.6))
    # the gap between the two, stated plainly
    body.append(line([(bx, by), (tx, ty)], 0.24, 1.3, dash="2 8"))
    svg(body, "overlay-problem")


# ── Vessel vocabulary ────────────────────────────────────────────────
# The three stages of the process, in the hero drawing's register. Kept
# available for whichever overlay needs them.

def plate_glyph(x, y, s=1.0):
    """96-well plate, isometric."""
    w, d = 74 * s, 30 * s
    quad = [(x - w / 2, y), (x - w / 2 + d, y - d * 0.62),
            (x + w / 2, y - d * 0.62), (x + w / 2 - d, y)]
    out = [line(quad + [quad[0]], 0.85, 1.6)]
    out.append(line([(x - w / 2, y), (x - w / 2, y + 7 * s),
                     (x + w / 2 - d, y + 7 * s), (x + w / 2 - d, y)], 0.6, 1.4))
    for r in range(3):
        for c in range(6):
            px = x - w / 2 + d * 0.5 + c * (w - d) / 6.2 + r * d * 0.26
            py = y - 7 * s - r * d * 0.19
            out.append(f'<ellipse cx="{px:.1f}" cy="{py:.1f}" rx="{3.4 * s:.1f}" '
                       f'ry="{2.0 * s:.1f}" fill="none" stroke="#fff" '
                       f'stroke-opacity="0.45" stroke-width="1"/>')
    return out


def vessel_glyph(x, y, s=1.0, tall=False):
    """Bench bioreactor / production tank."""
    w = (34 if not tall else 52) * s
    h = (54 if not tall else 88) * s
    out = [
        f'<rect x="{x - w / 2:.1f}" y="{y - h:.1f}" width="{w:.1f}" height="{h:.1f}" '
        f'rx="{w * 0.22:.1f}" fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="1.7"/>',
        f'<ellipse cx="{x:.1f}" cy="{y - h:.1f}" rx="{w / 2:.1f}" ry="{w * 0.16:.1f}" '
        f'fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="1.4"/>',
        line([(x, y - h), (x, y - h - 16 * s)], 0.75, 1.6),
        line([(x - 9 * s, y - h - 16 * s), (x + 9 * s, y - h - 16 * s)], 0.75, 2.2),
        line([(x, y - h * 0.72), (x, y - h * 0.2)], 0.4, 1.2),
        line([(x - 7 * s, y - h * 0.2), (x + 7 * s, y - h * 0.2)], 0.4, 1.6),
    ]
    for dx in (-w / 2 + 4 * s, w / 2 - 4 * s):
        out.append(line([(x + dx, y), (x + dx * 1.25, y + 11 * s)], 0.55, 1.4))
    if tall:
        out.append(line([(x - w / 2, y - h * 0.55), (x - w / 2 - 13 * s, y - h * 0.55),
                         (x - w / 2 - 13 * s, y - h * 0.05)], 0.45, 1.3))
    return out


# ── 02 · Scientist-gated loop ────────────────────────────────────────

# Ring geometry. Emitted to lib/stage/loop-geometry.json so the DOM
# nodes that sit on this ring are positioned from the same numbers that
# drew it — the labels have to be HTML to render in Inter, since an SVG
# loaded through <img> cannot fetch a webfont.
LOOP = {"cx": 1010, "cy": 330, "rx": 392, "ry": 238, "hub": 150, "w": W, "h": H}


def build_loop():
    body = []
    ax, ay = P(0.34, route_v(0.34))
    ln = route(0.05, 0.34, 60)
    body.append(line(ln, 0.5, 2.6))

    cx, cy = LOOP["cx"], LOOP["cy"]
    rx, ry = LOOP["rx"], LOOP["ry"]
    lead = [(ax, ay),
            (ax + (cx - rx - ax) * 0.55, ay - (ay - (cy + ry * 0.6)) * 0.25),
            (cx - rx * 0.97, cy + ry * 0.6)]
    body.append(line(lead, 0.6, 2.8))
    body.append(ring(ax, ay, 11, 3.0, 0.8))
    body.append(
        f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="none" stroke="#fff" '
        f'stroke-opacity="0.32" stroke-width="1.8" stroke-dasharray="15 12"/>'
    )

    for i in range(6):
        a = -math.pi / 2 + i * math.pi / 3
        b = a + 0.34
        bx_, by_ = cx + rx * math.cos(b), cy + ry * math.sin(b)
        tx_, ty_ = -rx * math.sin(b), ry * math.cos(b)
        tl = math.hypot(tx_, ty_)
        tx_, ty_ = tx_ / tl, ty_ / tl
        body.append(line([(bx_ - tx_ * 15 - ty_ * 8, by_ - ty_ * 15 + tx_ * 8), (bx_, by_),
                          (bx_ - tx_ * 15 + ty_ * 8, by_ - ty_ * 15 - tx_ * 8)], 0.8, 2.6))

    # the three points where a person decides, drawn as gates on the ring
    for i in (0, 2, 4):
        a = -math.pi / 2 + i * math.pi / 3 + math.pi / 6
        gx, gy = cx + rx * math.cos(a), cy + ry * math.sin(a)
        nx_, ny_ = math.cos(a) * 0.6, math.sin(a) * 1.0
        nl = math.hypot(nx_, ny_)
        nx_, ny_ = nx_ / nl, ny_ / nl
        for s in (-1, 1):
            body.append(line([(gx + nx_ * 13 * s - ny_ * 15, gy + ny_ * 13 * s + nx_ * 15),
                              (gx + nx_ * 22 * s, gy + ny_ * 22 * s),
                              (gx + nx_ * 13 * s + ny_ * 15, gy + ny_ * 13 * s - nx_ * 15)],
                             0.75, 2.2))

    hub = LOOP["hub"]
    body.append(f'<circle cx="{cx}" cy="{cy}" r="{hub}" fill="{BOARD}" fill-opacity="0.9"/>')
    body.append(ring(cx, cy, hub, 2.2, 0.45))
    svg(body, "overlay-loop")

    os.makedirs("lib/stage", exist_ok=True)
    with open("lib/stage/loop-geometry.json", "w") as fh:
        json.dump(LOOP, fh, indent=2)
    print("  loop-geometry.json")


# ── 03 · Shared benchmark ────────────────────────────────────────────

def build_evidence():
    body = []
    sx, sy = P(0.06, 0.5)
    body.append(dot(sx, sy, 7, 0.9))

    # OFAT — one factor at a time: right angles, stays in the near band
    ofat, u, v = [P(0.06, 0.5)], 0.06, 0.5
    for i in range(7):
        if i % 2:
            v += 0.055 * (1 if i % 4 == 1 else -1)
        else:
            u += 0.045
        ofat.append(P(u, v))
    body.append(line(ofat, 0.5, 2.4, dash="4 6", cap="butt"))
    for p in ofat:
        body.append(dot(*p, 4.4, 0.45))
    body.append(ring(*ofat[-1], 11, 2.4, 0.6))

    # DoE — one planned grid, laid down all at once, spread everywhere
    grid = [(0.14 + 0.68 * c / 4, 0.14 + 0.72 * r / 3) for r in range(4) for c in range(5)]
    for u_, v_ in grid:
        body.append(dot(*P(u_, v_), 5.0, 0.5))
    hull = [P(0.14, 0.14), P(0.82, 0.14), P(0.82, 0.86), P(0.14, 0.86), P(0.14, 0.14)]
    body.append(line(hull, 0.3, 1.4, dash="9 8"))
    best_doe = max(grid, key=lambda p: height(*p))
    body.append(ring(*P(*best_doe), 13, 2.6, 0.7))

    # Trellis — adaptive: two deliberate detours, then the high ridge
    tr = []
    for n in range(101):
        t = n / 100
        u_ = 0.06 + 0.80 * t
        v_ = route_v(u_) + 0.26 * math.sin(t * 7.4) * math.exp(-3.1 * t)
        tr.append(P(u_, min(max(v_, 0.03), 0.97)))
    body.append(line(tr, 0.95, 4.0))
    body.append(arrow(tr, 0.95, 4.4))
    for t in (0.12, 0.34, 0.58, 0.80):
        body.append(ring(*tr[int(t * 100)], 11, 3.2, 0.95))

    # the convergence inset, kept out of the landscape
    ix, iy, iw, ih = 150, 258, 360, 170
    body.append(line([(ix, iy - ih), (ix, iy), (ix + iw, iy)], 0.22, 1.2))
    body.append(line([(ix, iy - ih), (ix + iw, iy - ih)], 0.34, 1.3, dash="7 8"))
    for ceil, k, o, w, dash in (
        (0.505, 0.030, 0.34, 2.0, "3 7"),
        (0.790, 0.032, 0.55, 2.4, "12 8"),
        (1.000, 0.046, 0.95, 3.4, None),
    ):
        body.append(line(
            [(ix + iw * n / 60, iy - ih * ceil * (1 - math.exp(-k * (n / 60) * 100)))
             for n in range(61)], o, w, dash=dash))
    svg(body, "overlay-evidence")


print("stage artwork:")
build_surface()
build_problem()
build_loop()
build_evidence()
