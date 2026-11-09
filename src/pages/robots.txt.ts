import type { APIRoute } from 'astro';
import { site } from '../data/site.js';

/*
 * Indexable builds welcome search and answer-engine crawlers; dev and preview
 * builds disallow everything (the dev host also sends X-Robots-Tag noindex).
 */
export const GET: APIRoute = ({ site: origin }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const url = (p: string) => new URL(base + p, origin).href;
  const body = site.indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${url('/sitemap.xml')}\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
