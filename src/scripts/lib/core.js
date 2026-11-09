/* Core helpers: reduced-motion flag, palette, easing, canvas sizing, visibility-gated draw loop. */

const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const INK='#1F2226',INK3='#8A8372',BG='#FCF9EF',OR='#DF681E',CREAM='#F1EAD6';
const rng=s=>()=>{s|=0;s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function fit(c){const d=Math.min(devicePixelRatio||1,2),w=c.clientWidth,h=c.clientHeight;c.width=Math.max(1,Math.round(w*d));c.height=Math.max(1,Math.round(h*d));const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);return{ctx:x,w,h,d};}
/*
 * Runs draw(seconds) only while `el` is on screen. Each time the scene scrolls back
 * into view it fades in and, by default, restarts from t=0 so it plays from its first frame.
 * Scenes that keep time-stamped state of their own (the bioprocess cells and reactions) pass
 * {restart:false}: their clock keeps running and they manage their own restart.
 */
function visLoop(el,draw,{restart=true}={}){
  let vis=false,raf=0,t0=performance.now();
  const target=el.matches('canvas,svg')?el:(el.querySelector('canvas,svg')||el);
  const fade=!RM;
  if(fade){target.style.opacity='0';target.style.transition='opacity .7s ease';}
  let warned=false;
  /* a frame that throws is logged once and skipped; the loop keeps running so the scene never freezes or disappears */
  const frame=t=>{try{draw(t);}catch(err){if(!warned){warned=true;console.error('[scene] frame skipped:',err);}}};
  const tick=t=>{frame((t-t0)/1000);if(vis&&!RM)raf=requestAnimationFrame(tick);};
  if('IntersectionObserver'in window){
    new IntersectionObserver(e=>{
      const now=e[e.length-1].isIntersecting; /* the NEWEST record: observers can batch several, and the first may be stale */
      if(now===vis)return;vis=now;cancelAnimationFrame(raf);
      if(vis){if(restart)t0=performance.now();if(fade)target.style.opacity='1';if(!RM)raf=requestAnimationFrame(tick);}
      else if(fade)target.style.opacity='0';
    },{threshold:.05}).observe(el);
  }else{vis=true;if(fade)target.style.opacity='1';}
  frame(RM?999:0);}

export { RM, INK, INK3, BG, OR, CREAM, rng, ease, clamp, fit, visLoop };
