/*
 * Sticky nav behaviour:
 *  - a thin progress bar tracks page scroll
 *  - the bar slides fully out of view (-100%) while scrolling down and returns
 *    to 0 as soon as the user scrolls up, or is near the top, or focuses a link in it
 *  - the link of the section currently on screen is highlighted (aria-current)
 *  - except inside [data-nav-hide="small"] sections on small screens, where it stays hidden
 * It also publishes the nav's visible height as --nav-h on <html>, so other
 * sticky elements (see sections/*.css) glide up with it instead of leaving a gap.
 */
export function initNav() {
  const nav = document.getElementById('top');
  const bar = document.getElementById('progress');
  if (!nav) return;

  const root = document.documentElement;
  const TOP_ZONE = 80;   // always visible this close to the top
  const MIN_DELTA = 6;   // ignore jitter smaller than this (px)
  let lastY = Math.max(0, window.scrollY);
  let hidden = false;
  let ticking = false;

  const setHidden = (value) => {
    if (value === hidden) return;
    hidden = value;
    nav.classList.toggle('is-hidden', hidden);
    root.classList.toggle('nav-hidden', hidden);
  };

  /*
   * Sections marked data-nav-hide="small" keep the nav hidden on screens <= 900px
   * for as long as they fill the top of the viewport, to give the content more room.
   */
  const small = window.matchMedia('(max-width: 900px)');
  const quietZones = [...document.querySelectorAll('[data-nav-hide="small"]')];
  const inQuietZone = () => {
    if (!small.matches) return false;
    const line = nav.offsetHeight || 68;
    return quietZones.some((el) => {
      const r = el.getBoundingClientRect();
      return r.top <= line && r.bottom > line;
    });
  };

  /* Scroll-spy: the nav link whose section crosses a line 40% down the screen is marked active. */
  const links = [...nav.querySelectorAll('a[href^="#"]')]
    .filter((a) => a.getAttribute('href').length > 1 && !a.classList.contains('btn'))
    .map((a) => ({ a, el: document.getElementById(a.getAttribute('href').slice(1)) }))
    .filter((l) => l.el);
  const markActive = () => {
    const line = window.innerHeight * 0.4;
    const current = links.find(({ el }) => { const r = el.getBoundingClientRect(); return r.top <= line && r.bottom > line; });
    for (const { a } of links) {
      const on = current && current.a === a;
      a.classList.toggle('is-active', !!on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    }
  };

  const update = () => {
    ticking = false;
    markActive();
    const y = Math.max(0, window.scrollY); // iOS rubber-banding reports negative values
    const max = root.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;

    const delta = y - lastY;
    if (inQuietZone()) { setHidden(true); lastY = y; return; }
    if (y < TOP_ZONE) setHidden(false);
    else if (Math.abs(delta) >= MIN_DELTA) setHidden(delta > 0 && !nav.matches(':focus-within'));
    if (Math.abs(delta) >= MIN_DELTA || y < TOP_ZONE) lastY = y;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  nav.addEventListener('focusin', () => setHidden(false));
  update();
}
