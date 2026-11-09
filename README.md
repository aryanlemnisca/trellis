# Lemnisca / Trellis site

Marketing site for **Trellis**. Astro + Tailwind CSS v4, plain CSS and ES modules, no framework runtime.
Dev: <https://lemnisca.dev.corevoice.in> (auto-deploys from `dev`).

> **Need it as one file?** There is also a standalone, all-in-one HTML build at [`standalone/index.html`](standalone/index.html): just upload it to any static host. See [Standalone single file](#standalone-single-file).

## Commands

Needs Node >= 22.23.4 (Astro 7).

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # -> dist/
npm run check        # build + SEO/AEO gate (scripts/check-seo.mjs)
npm run make:og      # regenerate public/og.png (after changing headline/logo)
npm run build:standalone   # -> standalone/index.html (whole site in one file)
```

Copy `.env.example` to `.env` for local work (the form needs `PUBLIC_DEMO_FORM_HOOK`).

## Standalone single file

`standalone/index.html` is the whole site in **one file** (CSS, JS, fonts, logo, favicon inlined, ~230 KB, no external requests). Upload it as `index.html` to any static host.

- It is generated from the same source: run `npm run build:standalone` and commit the result. Do not edit it by hand.
- The demo-form webhook is baked in from `.env` (`PUBLIC_DEMO_FORM_HOOK`), by choice. To point the file elsewhere without rebuilding, fill the `<meta name="demo-form-hook" content="">` tag near the top.
- Canonical and share-image URLs point at `SITE_URL` (default the dev host) and the page is `noindex`. For a real domain rebuild with `SITE_URL=https://example.com SITE_INDEXABLE=true npm run build:standalone`. The share image (`og:image`) is not inlined: host `public/og.png` at that domain.

## Deploy

| Branch | Goes to | How |
| --- | --- | --- |
| `dev` | https://lemnisca.dev.corevoice.in | push -> GitHub Actions builds -> `dist/` streamed over a pinned-command SSH key to `dev-sites` on the Docker box |
| `main` | production | **not wired yet**: no production host/domain decided |

Promote with a PR `dev` -> `main`. Never push straight to `main`. Workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml).
Pattern and server side: `cv-server-infra` -> `docs/staging.md`.

**One-time setup for a new dev site** (done by hand, once):

1. Deploy key for this site only, in `authorized_keys` on `64.227.184.151` with `command="/opt/dev-sites/receive.sh lemnisca"`.
2. Repo secrets `DEPLOY_SSH_KEY_DEV` and `DEPLOY_HOST_DEV=64.227.184.151`; repo variable `PUBLIC_DEMO_FORM_HOOK`.
3. Two `dev-lemnisca` Traefik router blocks in Portainer stack **35 `dev-sites`**, then redeploy it (copy an existing `dev-<site>` pair).
4. UptimeRobot monitor and status-page entry (`cv-server-infra` -> `docs/monitoring.md`).

`*.dev.corevoice.in` is a wildcard A record, so no DNS change is needed. Dev is open but noindex.

**Going to production** needs: a host + domain, a `production` job in the workflow, and a build with
`SITE_URL=https://<domain>` and `SITE_INDEXABLE=true`. Until then every build is `noindex` and `robots.txt` disallows all.

## Environment

| Variable | Used for | Default |
| --- | --- | --- |
| `PUBLIC_DEMO_FORM_HOOK` | webhook that receives the "Book a demo" form (baked into the client JS and the standalone file, so it is public) | empty: form shows "not connected" |
| `SITE_URL` | canonical URLs, sitemap, OG tags | `https://lemnisca.dev.corevoice.in` |
| `SITE_INDEXABLE` | `true` = indexable; anything else = noindex everywhere | `false` |
| `BASE_PATH` | serve under a sub-path | `/` |

## Everyday tasks

**Change copy or SEO text:** `src/data/site.js` (title, description, nav), `src/data/faq.js`, `src/data/principles.js`. The page, JSON-LD, sitemap and `llms.txt` all read these, so they cannot drift. Run `npm run check`.

**Add a section:** create `src/components/sections/X.astro` and `src/styles/sections/x.css`, import the CSS in `src/styles/main.css`, add the component to `src/pages/index.astro`. A scene with canvas: `src/scripts/sections/x.js` exporting `initX()`, called from `src/scripts/pages/home.js`.

**Add a page:** `src/pages/<name>.astro` using `<Base path="/<name>">`; add its path to `PAGES` in `src/pages/sitemap.xml.ts`. Global behaviour (Lenis, reveal, nav) comes with `Base`; page scripts go in `src/scripts/pages/`.

**Change a colour or font:** `src/styles/theme.css` only. Tokens are also Tailwind utilities (`bg-paper`, `text-ink-2`, `font-mono`).

**Animate something in on scroll** (works on any page, no JS to write):

```html
<h2 data-reveal="up">Heading</h2>
<p data-reveal="fade" data-reveal-delay="200">Copy</p>
<ul data-reveal-group="up" data-reveal-stagger="90"> <li>one</li> <li>two</li> </ul>
```

Types: `up down left right fade scale blur`. Options: `data-reveal-delay`, `-duration`, `-distance` (px), `data-reveal-once="false"` to replay on every entry. Put it on a wrapper, not on a button or card that has its own hover transform. Nothing is hidden if JS is off or the visitor prefers reduced motion.

## Structure

```
astro.config.mjs        site URL, base path, Tailwind via @tailwindcss/vite
public/                 logo, favicon, og.png (static, copied as-is)
scripts/                check-seo.mjs (CI gate), make-og.mjs, build-standalone.mjs
standalone/             generated single-file site (index.html)
src/
  data/                 site.js, faq.js, principles.js  <- content + SEO source of truth
  layouts/Base.astro    <head>, skip link, global script
  components/
    seo/Seo.astro       meta, Open Graph, JSON-LD (Organization, WebSite, WebPage, SoftwareApplication, FAQPage)
    layout/             Nav, Footer, SvgDefs
    sections/           one component per page section
  pages/                index, sitemap.xml, robots.txt, llms.txt
  styles/
    theme.css           design tokens (@theme)
    base.css            element defaults
    components/         frame, button, nav, form, reveal, faq ...
    sections/           one file per section
    main.css            imports everything into cascade layers
  scripts/
    global.js           every page: Lenis smooth scroll, reveal, nav hide-on-scroll
    pages/home.js       home-page scenes + form
    lib/                core, fields, draw, smooth-scroll, reveal, nav
    sections/           one module per scene (canvas drawings)
```

Design system: tokens in `theme.css` -> cascade layers `theme, base, components, utilities` (see `main.css`), so Tailwind utilities always win over component CSS.
Scenes only animate while on screen and restart each time they scroll back in (`visLoop` in `lib/core.js`).
