import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Where this build is served. Defaults to the dev host; production builds set
// SITE_URL (and SITE_INDEXABLE=true) in CI. Same pattern as the other CoreVoice
// sites: one codebase, the environment decides the URL.
const SITE = process.env.SITE_URL || 'https://lemnisca.dev.corevoice.in';
const BASE = process.env.BASE_PATH || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  build: { assets: '_assets' },
  devToolbar: { enabled: false },
  vite: { plugins: [tailwindcss()] },
});
