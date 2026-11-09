import { wcSvg, field } from '../lib/fields.js';

export function initColorFields(){
/* loop: a soft blue stroke where Trellis models (04 -> 01), a green one where your lab runs (02 -> 03) */
{const d=Math.PI/180,arc=(a1,a2)=>{const p=new Path2D();p.arc(220,220,150,a1,a2);return p;};
 wcSvg('loopWash',440,440,[{path:arc(186*d,264*d),lw:30,c:'B',a:.42,blur:9},{path:arc(6*d,84*d),lw:30,c:'G',a:.45,blur:9}]);}
/* lab-in-the-loop: the wet-lab lobe green, the model lobe blue */
{const lem=new Path2D('M200 200 C 160 120, 60 120, 60 200 C 60 280, 160 280, 200 200 C 240 120, 340 120, 340 200 C 340 280, 240 280, 200 200 Z');
 wcSvg('labWash',400,400,[{path:lem,c:'G',a:.34,blur:12,clip:[0,0,200,400]},{path:lem,c:'B',a:.3,blur:12,clip:[200,0,200,400]}]);}
/* mechanistic core: science (green) and ML (blue) meet */
(()=>{})||wcSvg('mechWash',300,190,[{x:138,y:95,rx:24,c:'G',a:.45,blur:7},{x:162,y:95,rx:24,c:'B',a:.4,blur:7}]);
/* scientist's challenge: a deep blue field of computation behind the dots */
/* scientist's challenge: the whole panel becomes a deep, grainy field of computation (blue) with a trace of the living side (green) */

/* book a demo: a flowing green-to-blue field behind a frosted form */
/* book a demo: a flowing blue band crossing the whole panel (after the NID poster), green rising from the base; top-left kept light for the heading */
field(document.querySelector('.demo'),(w,h)=>{const m=Math.min(w,h),flow=new Path2D();
  flow.moveTo(w*.62,-h*.1);flow.bezierCurveTo(w*.98,h*.25,w*.38,h*.55,w*.6,h*.82);flow.bezierCurveTo(w*.72,h*.98,w*.95,h*1.05,w*1.05,h*1.1);
  return[{path:flow,lw:Math.max(w*.17,150),c:'B',a:.55,blur:m*.13},
  {x:w*.02,y:h*1.02,rx:w*.3,ry:h*.3,c:'G',a:.5,blur:m*.16},
  {x:w*.42,y:h*1.05,rx:w*.16,ry:h*.18,c:'S',a:.4,blur:m*.12},
  {x:w*1.02,y:h*.02,rx:w*.14,ry:h*.22,c:'G',a:.38,blur:m*.12}];});

}
