import { RM, ease, clamp, visLoop } from '../lib/core.js';

/* ---------- WHAT: the loop dial ---------- */
export function initWhat(){
  const dial=document.getElementById('dial'),nodesG=document.getElementById('loopNodes'),runner=document.getElementById('runner'),tx=document.getElementById('loopTx');
  const items=[...document.querySelectorAll('#steps li')];
  let s='';for(let i=0;i<120;i++){const a=i/120*Math.PI*2,r1=176,r2=i%10===0?188:182;s+=`<line x1="${220+Math.cos(a)*r1}" y1="${220+Math.sin(a)*r1}" x2="${220+Math.cos(a)*r2}" y2="${220+Math.sin(a)*r2}" stroke="#1F2226" stroke-opacity="${i%10===0?.7:.3}"/>`;}
  dial.innerHTML=s;
  const names=['Design of experiment','Building protocols','Ingesting data','Next design space'];const angs=[-90,0,90,180];
  /* each point labelled in full, as the statement names it */
  const LBLS=[['01 Design of','experiment (DOE)'],['02 Building','protocols'],['03 Ingesting the','experimental data'],['04 Recommending','the next','design space']];
  const LPOS=[[220,100,'middle'],[356,193,'end'],[220,330,'middle'],[84,180,'start']]; /* side labels sit just above the dotted line, beside their box */
  let n='';angs.forEach((a,i)=>{const r=a*Math.PI/180,x=220+Math.cos(r)*150,y=220+Math.sin(r)*150;
    n+=`<rect x="${x-9}" y="${y-9}" width="18" height="18" class="${i===3?'dot':'hol'}"/>`;
    const[lx,ly,an]=LPOS[i];n+=`<text x="${lx}" y="${ly}" text-anchor="${an}" class="tx-k lbl">${LBLS[i].map((l,j)=>`<tspan x="${lx}" dy="${j?13:0}">${l}</tspan>`).join('')}</text>`;});
  nodesG.innerHTML=n;
  let step=0;const T=2.8;
  function place(t){const k=Math.floor(t/T),u=t-k*T,i=k%4;const e=ease(clamp((u-1.8)/1,0,1));const a=(angs[i]+e*90)*Math.PI/180;
    runner.setAttribute('transform',`translate(${220+Math.cos(a)*150} ${220+Math.sin(a)*150}) rotate(${angs[i]+e*90+45})`);
    if(i!==step||t===0){step=i;items.forEach((li,j)=>li.classList.toggle('on',j===i));tx.textContent=`Step ${String(i+1).padStart(2,'0')} · ${names[i]}`;}}
  visLoop(runner.ownerSVGElement,t=>place(RM?0:t));
}
