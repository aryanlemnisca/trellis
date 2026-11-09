import { RM, rng, clamp, fit, visLoop } from '../lib/core.js';
import { field } from '../lib/fields.js';

/* ---------- SCIENTIST: one notebook page, then the camera pulls back through an endless field of untested pages ---------- */
export function initScientist(){
  const cv=document.getElementById('dotCv'),viz=document.getElementById('dotViz');if(!cv)return;
  cv.setAttribute('aria-label','Animation behind the text: a close-up of one notebook page with a few hand-tested points. The view drifts back and turns until that page is a single glowing speck among thousands of untested pages.');
  const r=rng(51);let o;
  const tried=Array.from({length:9},(_,i)=>[.2+.6*r(),.2+.6*r(),i===6?2:r()<.3?1:0]);
  const SH=Array.from({length:400},()=>[Math.floor(r()*120)-60,Math.floor(r()*120)-60,r()*6]); /* a few pages faintly shimmer */
  function setup(){o=fit(cv);}
  function page(ctx,x,y,s,a,detail){
    ctx.globalAlpha=a;ctx.strokeStyle='rgba(241,234,214,.55)';ctx.lineWidth=Math.max(.6,Math.min(1.2,s/60));ctx.strokeRect(x,y,s,s);
    if(detail>0){ctx.globalAlpha=a*detail;ctx.strokeStyle='rgba(241,234,214,.2)';const n=8;ctx.beginPath();for(let i=1;i<n;i++){ctx.moveTo(x+i*s/n,y);ctx.lineTo(x+i*s/n,y+s);ctx.moveTo(x,y+i*s/n);ctx.lineTo(x+s,y+i*s/n);}ctx.stroke();}
    ctx.globalAlpha=1;}
  function draw(t){const{ctx,w,h}=o;ctx.clearRect(0,0,w,h);
    const wide=w>900,cx=wide?w*.7:w/2,cy=h/2,base=Math.min(wide?w*.46:w,h)*.72;
    const CYC=11,u=RM?7.5:t%CYC;
    const k=u<2.8?0:u<7.2?(u-2.8)/4.4:u<9.6?1:1-(u-9.6)/1.4,ke=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2;
    const zoom=Math.exp(Math.log(1/80)*ke),S=base*zoom,rot=-.2*ke+(RM?0:.015*Math.sin(t*.3));
    ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);
    /* the endless field */
    const step=S*1.16,reach=Math.hypot(w,h),n=Math.min(140,Math.ceil(reach/step)+1);
    const det=clamp((S-30)/80,0,1),fa=.55+ke*.45;
    for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++){if(!i&&!j)continue;const x=i*step-S/2,y=j*step-S/2;const dd=Math.hypot(x,y);if(dd>reach)continue;
      page(ctx,x,y,S,fa*(1-.7*dd/reach),det);}
    /* shimmer: distant pages catch the light now and then */
    if(ke>.2&&!RM)SH.forEach(([i,j,p])=>{const f=Math.max(0,Math.sin(t*.9+p*3))**8;if(f<.05)return;const x=i*step-S/2,y=j*step-S/2;ctx.globalAlpha=f*.8*ke;ctx.fillStyle='rgba(241,234,214,.55)';ctx.fillRect(x,y,S,S);});
    ctx.globalAlpha=1;
    /* our page */
    page(ctx,-S/2,-S/2,S,1,det);ctx.save();ctx.beginPath();ctx.rect(-S/2,-S/2,S,S);ctx.clip();
    const nT=Math.ceil(clamp(u/2.4,0,1)*tried.length);
    if(S>14){ctx.strokeStyle='rgba(255,154,82,.8)';ctx.lineWidth=Math.max(.6,S/240);ctx.setLineDash([S/90,S/70]);ctx.beginPath();for(let i=0;i<nT;i++){const[a,b2]=tried[i],px=-S/2+a*S,py=-S/2+b2*S;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();ctx.setLineDash([]);}
    for(let i=0;i<nT;i++){const[a,b2,q]=tried[i],px=-S/2+a*S,py=-S/2+b2*S,rr=Math.max(1.2,S*.018);
      if(q===2){ctx.save();ctx.shadowColor='rgba(255,150,80,.9)';ctx.shadowBlur=S*.04;ctx.fillStyle='#FF9A52';ctx.fillRect(px-rr,py-rr,rr*2,rr*2);ctx.restore();}
      else if(q===1){ctx.fillStyle='rgba(120,190,150,.95)';ctx.beginPath();ctx.arc(px,py,rr,0,7);ctx.fill();}
      else{ctx.strokeStyle='rgba(241,234,214,.85)';ctx.lineWidth=Math.max(.6,S/300);ctx.beginPath();ctx.moveTo(px-rr,py-rr);ctx.lineTo(px+rr,py+rr);ctx.moveTo(px+rr,py-rr);ctx.lineTo(px-rr,py+rr);ctx.stroke();}}
    ctx.restore();
    /* far out: our page becomes a glowing speck with a slow pulse */
    if(ke>.3){const a=clamp((ke-.3)/.4,0,1),m=Math.max(S,3.5),pr=10+6*(RM?0:(t*.8%1));ctx.save();ctx.globalAlpha=a;ctx.fillStyle='#FF9A52';ctx.shadowColor='rgba(255,150,80,.95)';ctx.shadowBlur=14;ctx.fillRect(-m/2,-m/2,m,m);ctx.restore();
      ctx.save();ctx.globalAlpha=a*(1-((RM?0:t*.8)%1));ctx.strokeStyle='rgba(255,154,82,.7)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,pr,0,7);ctx.stroke();ctx.restore();}
    ctx.restore();
    /* blend into the section: dark falls off around the edges and behind the text */
    const g=ctx.createRadialGradient(cx,cy,Math.min(w,h)*.38,cx,cy,Math.max(w,h)*.8);g.addColorStop(0,'rgba(25,28,36,0)');g.addColorStop(1,'rgba(25,28,36,.75)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    if(wide){const l=ctx.createLinearGradient(0,0,w*.55,0);l.addColorStop(0,'rgba(25,28,36,.9)');l.addColorStop(.6,'rgba(25,28,36,.55)');l.addColorStop(1,'rgba(25,28,36,0)');ctx.fillStyle=l;ctx.fillRect(0,0,w*.55,h);}
  }
  setup();visLoop(viz,draw);
  let lw=innerWidth;addEventListener('resize',()=>{if(innerWidth===lw)return;lw=innerWidth;setup();});
}
