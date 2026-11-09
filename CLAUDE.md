# Working in lemnisca (Trellis site)

Astro 7 + Tailwind v4 static site. README has commands, deploy and structure. Read only what the task needs.

## Rules

- Branches: `dev` is where work lands and auto-deploys to https://lemnisca.dev.corevoice.in. Production is `main`, **not wired yet**. Never push straight to `main`. Naming and commits follow `cv-server-infra` -> `docs/standards/repos.md` (Conventional Commits, caveman style, subject <= 50 chars).
- Do not commit or push unless the user says so.
- Content and SEO text live in `src/data/*`; never hard-code titles, FAQ or nav in components.
- Colours and fonts live in `src/styles/theme.css` only. No hex values in section CSS.
- New animation on scroll: use `data-reveal` attributes (README), not new JS.
- Canvas scenes must go through `visLoop` (core.js) so they pause off-screen and restart on re-entry.
- `PUBLIC_DEMO_FORM_HOOK` is a webhook URL. The Astro site takes it from `.env` / the repo variable. The owner chose to commit it inside `standalone/index.html` (it is public in any hosted page anyway); do not copy it anywhere else in the repo.
- `standalone/index.html` is generated (`npm run build:standalone`); regenerate and commit it whenever the site changes, never hand-edit.
- Before "done": `npm run check` (build + SEO gate) and look at the page at 375x667 and 1440x900.
- Local Node must be >= 22.23.4 (Astro 7). On this Mac use `/opt/homebrew/bin/node` (v26); nvm's 22.22.2 is too old.

## Known traps

- Dev host is noindex by design. `SITE_INDEXABLE=true` is for the production build only.
- `.js` class on `<html>` hides `[data-reveal]` content; without JS everything stays visible.
- Elements with their own transform/transition (buttons, hover cards) must not carry `data-reveal`; wrap them.
- Mobile Why Trellis is a docked card + media, driven by `src/scripts/sections/why.js`; the desktop list stays in the DOM (hidden) because the script reads it.
- Retired UI kept hidden on purpose because scenes still write to it: hero `.fig-bar/.fig-foot`, `#sysViz .toggle`.
