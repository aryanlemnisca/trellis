/*
 * SEO / AEO gate. Run after `astro build` (npm run check). Fails the build on:
 * missing title/description/canonical, wrong title or description length, not
 * exactly one <h1>, skipped heading levels, <img> without alt, broken #anchors,
 * unparseable or inconsistent JSON-LD, FAQ schema that does not match the visible
 * FAQ, and robots/sitemap/llms.txt that disagree with the page's indexability.
 */
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync('dist/index.html', 'utf8');
const errors = [];
const warns = [];
const must = (ok, msg) => { if (!ok) errors.push(msg); };

const meta = (re) => html.match(re)?.[1];
const title = meta(/<title>([^<]*)<\/title>/);
const desc = meta(/<meta name="description" content="([^"]*)"/);
const canonical = meta(/<link rel="canonical" href="([^"]*)"/);
const robots = meta(/<meta name="robots" content="([^"]*)"/);

must(title, 'missing <title>');
must(title && title.length <= 65, `title is ${title?.length} chars (keep <= 65)`);
must(desc, 'missing meta description');
must(desc && desc.length >= 70 && desc.length <= 160, `description is ${desc?.length} chars (want 70-160)`);
must(canonical && /^https?:\/\//.test(canonical), 'missing absolute canonical');
must(robots, 'missing robots meta');
for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'twitter:card']) {
  must(html.includes(`property="${p}"`) || html.includes(`name="${p}"`), `missing ${p}`);
}
must(/<html lang="[a-z-]+"/.test(html), 'missing <html lang>');

// headings
const h1s = html.match(/<h1[\s>]/g) || [];
must(h1s.length === 1, `expected exactly one <h1>, found ${h1s.length}`);
const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
levels.reduce((prev, cur) => { if (cur - prev > 1) errors.push(`heading jumps h${prev} -> h${cur}`); return cur; }, 1);

// images + anchors
for (const m of html.matchAll(/<img\b[^>]*>/g)) must(/\balt="/.test(m[0]), `img without alt: ${m[0].slice(0, 80)}`);
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
for (const m of html.matchAll(/href="#([^"]+)"/g)) must(ids.has(m[1]), `anchor #${m[1]} has no target`);

// structured data
const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
must(blocks.length >= 1, 'no JSON-LD found');
let graph = [];
try { graph = JSON.parse(blocks[0])['@graph'] || []; } catch (e) { errors.push('JSON-LD does not parse: ' + e.message); }
const types = graph.map((n) => n['@type']);
for (const t of ['Organization', 'WebSite', 'WebPage', 'SoftwareApplication', 'FAQPage']) must(types.includes(t), `JSON-LD missing ${t}`);
const faqNode = graph.find((n) => n['@type'] === 'FAQPage');
const visibleQs = [...html.matchAll(/<details class="faq-item"[^>]*>\s*<summary><h3>([^<]*)<\/h3>/g)].map((m) => m[1].trim());
const schemaQs = (faqNode?.mainEntity || []).map((q) => q.name);
must(visibleQs.length > 0, 'no visible FAQ found');
must(JSON.stringify(visibleQs) === JSON.stringify(schemaQs), 'FAQPage JSON-LD questions differ from the visible FAQ');

// indexability must agree everywhere
const indexable = process.env.SITE_INDEXABLE === 'true';
must(indexable ? robots.startsWith('index') : robots.startsWith('noindex'), `robots meta "${robots}" disagrees with SITE_INDEXABLE=${indexable}`);
const robotsTxt = existsSync('dist/robots.txt') ? readFileSync('dist/robots.txt', 'utf8') : '';
must(indexable ? /Allow: \//.test(robotsTxt) && /Sitemap:/.test(robotsTxt) : /Disallow: \//.test(robotsTxt), 'robots.txt disagrees with indexability');
const sitemap = existsSync('dist/sitemap.xml') ? readFileSync('dist/sitemap.xml', 'utf8') : '';
must(canonical && sitemap.includes(`<loc>${canonical}</loc>`), 'canonical URL missing from sitemap.xml');
must(existsSync('dist/llms.txt'), 'llms.txt missing');
must(existsSync('dist/og.png'), 'og.png missing');

if (!indexable) warns.push('built as NOINDEX (dev/preview). Production needs SITE_URL and SITE_INDEXABLE=true.');

for (const w of warns) console.log('  note:', w);
if (errors.length) { console.error(`\nSEO check FAILED (${errors.length}):`); errors.forEach((e) => console.error('  x', e)); process.exit(1); }
console.log(`SEO check passed: ${title.length}-char title, ${desc.length}-char description, ${schemaQs.length} FAQ items, ${types.length} schema types, ${indexable ? 'indexable' : 'noindex'}.`);
