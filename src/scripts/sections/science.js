import { RM, rng } from '../lib/core.js';

/* ---------- SCIENCE: 50 parameters, all in play ---------- */
export function initScience(){
  const svg=document.getElementById('params');if(!svg)return;let o='';
  for(let i=0;i<50;i++){const x=36+(i%10)*24,y=24+Math.floor(i/10)*26;o+=`<rect x="${x}" y="${y}" width="14" height="14" class="hol" id="pq${i}"/><line x1="${x}" x2="${x+14}" y1="${y+7}" y2="${y+7}" stroke="#1F2226" id="pl${i}"/>`;}
  o+=`<rect x="28" y="16" width="246" height="140" class="dash"/><rect id="pbest" width="20" height="20" fill="none" stroke="#DF681E" stroke-width="1.6"/><text x="28" y="178" class="tx">50 factors · all in play</text>`;
  svg.innerHTML=o;const r=rng(12);
  function tick(){for(let i=0;i<50;i++){const on=r()<.45;const q=document.getElementById('pq'+i);q.setAttribute('class',on?'dot':'hol');const l=document.getElementById('pl'+i);const y=+q.getAttribute('y')+2+r()*10;l.setAttribute('y1',y);l.setAttribute('y2',y);l.setAttribute('stroke',on?'#FCF9EF':'#1F2226');}
    const b=Math.floor(r()*50),bq=document.getElementById('pq'+b);const pb=document.getElementById('pbest');pb.setAttribute('x',+bq.getAttribute('x')-3);pb.setAttribute('y',+bq.getAttribute('y')-3);}
  tick();if(!RM){let vis=false;new IntersectionObserver(e=>vis=e[e.length-1].isIntersecting).observe(svg);setInterval(()=>{if(vis)tick();},1800);}
}
