import type { APIRoute } from 'astro';
import { site } from '../data/site.js';
import { faq } from '../data/faq.js';
import { principles } from '../data/principles.js';

/*
 * llms.txt: a plain-text briefing for AI assistants (llmstxt.org format).
 * Built from the same data as the page, so it can never drift from it.
 */
export const GET: APIRoute = ({ site: origin }) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const url = (p: string) => new URL(base + p, origin).href;
  const body = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    '## Why Trellis',
    ...principles.map((p) => `- ${p.title}: ${p.text}`),
    '',
    '## Pages',
    `- [Home](${url('/')}): overview, case study, FAQ and demo request`,
    `- [Book a demo](${url('/#demo')}): request a demo`,
    '',
    '## FAQ',
    ...faq.flatMap(({ q, a }) => [`### ${q}`, a, '']),
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
