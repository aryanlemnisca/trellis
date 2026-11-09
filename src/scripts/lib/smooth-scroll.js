import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { RM } from './core.js';

/*
 * Lenis smooth scroll. Native touch scrolling is kept on phones (no syncTouch),
 * so momentum feels right there; wheel and trackpad get the eased scroll.
 * Anchor links (#what, #demo...) glide too, stopping below the 68px sticky nav.
 * Skipped entirely under prefers-reduced-motion.
 */
export function initSmoothScroll() {
  if (RM) return null;
  const lenis = new Lenis({
    autoRaf: true,
    lerp: 0.1,
    wheelMultiplier: 1,
    anchors: { offset: -68, duration: 1.2 },
  });
  window.lenis = lenis; // handy for debugging and for page scripts that need scrollTo
  return lenis;
}
