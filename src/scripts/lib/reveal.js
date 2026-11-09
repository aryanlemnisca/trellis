import { RM } from './core.js';

/*
 * Reveal-on-scroll, driven entirely by attributes (see src/styles/components/reveal.css).
 *
 *   data-reveal="up|down|left|right|fade|scale|blur"   animate this element in
 *   data-reveal-delay="200"        ms before it starts
 *   data-reveal-duration="900"     ms it takes
 *   data-reveal-distance="40"      px it travels (up/down/left/right)
 *   data-reveal-once="false"       replay every time it re-enters the screen
 *
 *   data-reveal-group="up"         on a PARENT: reveal its direct children one by one
 *   data-reveal-stagger="90"       ms between children (default 90)
 *
 * Put it on a wrapper, not on an element that has its own transform/transition
 * (buttons, cards with hover states).
 */
export function initReveal(root = document) {
  const items = [];

  root.querySelectorAll('[data-reveal-group]').forEach((group) => {
    const type = group.dataset.revealGroup || 'up';
    const step = Number(group.dataset.revealStagger) || 90;
    const base = Number(group.dataset.revealDelay) || 0;
    [...group.children].forEach((child, i) => {
      if (child.hasAttribute('data-reveal')) return;
      child.dataset.reveal = type;
      child.dataset.revealDelay = String(base + i * step);
    });
  });

  root.querySelectorAll('[data-reveal]').forEach((el) => {
    const d = el.dataset;
    if (d.revealDelay) el.style.setProperty('--reveal-delay', `${Number(d.revealDelay)}ms`);
    if (d.revealDuration) el.style.setProperty('--reveal-duration', `${Number(d.revealDuration)}ms`);
    if (d.revealDistance) el.style.setProperty('--reveal-distance', `${Number(d.revealDistance)}px`);
    items.push(el);
  });

  const show = (el) => el.classList.add('is-revealed');
  if (RM || !('IntersectionObserver' in window)) {
    items.forEach(show);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const el = e.target;
        const repeat = el.dataset.revealOnce === 'false';
        if (e.isIntersecting) {
          show(el);
          if (!repeat) io.unobserve(el);
        } else if (repeat) {
          el.classList.remove('is-revealed');
        }
      }
    },
    { threshold: 0, rootMargin: '0px 0px -8% 0px' },
  );
  // observe on the next frame so the hero intro plays right after first paint
  requestAnimationFrame(() => items.forEach((el) => io.observe(el)));
}
