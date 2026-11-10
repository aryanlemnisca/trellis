/* Site-wide facts. Edit here; every page, meta tag and structured-data block reads this. */
export const site = {
  name: 'Trellis',
  tagline: 'Scale newer heights',
  title: 'Trellis: design of experiments for faster bioprocess scale-up',
  description:
    'Trellis recommends the design of experiments, builds protocols and ingests your data to find the shortest path to a robust bioprocess, with fewer runs.',
  locale: 'en',
  themeColor: '#F7F4EC',
  // Only a build with SITE_INDEXABLE=true may be indexed. Dev and preview builds are always noindex.
  indexable: process.env.SITE_INDEXABLE === 'true',
  nav: [
    { label: 'What is Trellis', href: '#what' },
    { label: 'Why Trellis', href: '#why' },
    { label: 'Case study', href: '#case' },
  ],
  cta: { label: 'Book a demo →', href: '#demo' },
};
