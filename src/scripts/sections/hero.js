import { RM, INK, OR, rng, ease, clamp, fit, visLoop } from '../lib/core.js';
import { makeField, field } from '../lib/fields.js';

/* ---------- HERO: a plain map of the design space; the search wanders and stalls, the orange path goes straight to the best point, then the map lifts into a landscape ---------- */
export function initHero(){
  const cvH=document.getElementById('heroCv');if(!cvH)return;
/* shared scene: one design-space field, a start point, the true summit and a false peak */
const FLD=makeField([[.7,.68,.13,1],[.3,.32,.13,.55],[.24,.76,.09,.38],[.8,.24,.1,.32]]);
const START=[.12,.14],PEAK=[.7,.68],FALSE=[.3,.32],NQ=34;
const ZQ=[];for(let j=0;j<=NQ;j++){ZQ[j]=[];for(let i=0;i<=NQ;i++)ZQ[j][i]=FLD.f(i/NQ,j/NQ)/FLD.max;}
const zf=(u,v)=>FLD.f(u,v)/FLD.max;
const PATH=[];for(let i=0;i<=60;i++){const t=i/60,c=[.52,.2];PATH.push([(1-t)*(1-t)*START[0]+2*(1-t)*t*c[0]+t*t*PEAK[0],(1-t)*(1-t)*START[1]+2*(1-t)*t*c[1]+t*t*PEAK[1]]);}
/* a short wander that circles the false peak and stalls there */
const WANDER=(()=>{const r=rng(23),out=[START.slice()];let p=START.slice(),dir=.9;for(let i=0;i<34;i++){const to=Math.atan2(FALSE[1]-p[1],FALSE[0]-p[0]);dir+=((to-dir+Math.PI*3)%(Math.PI*2)-Math.PI)*.25+(r()-.5)*.9;p=[clamp(p[0]+Math.cos(dir)*.03,.05,.6),clamp(p[1]+Math.sin(dir)*.03,.05,.6)];out.push(p.slice());}return out;})();
const COLZ=z=>z>.72?'52,128,96':z>.45?'56,104,190':z>.22?'236,168,122':null;
const ph=(a,b,t)=>clamp((t-a)/(b-a),0,1);
function makeProj(G){return(u,v,z,L,yaw,H=1)=>{const{w,h,S}=G;const pitch=L*1.02,x=u-.5,y=.5-v;const X=x*Math.cos(yaw)-y*Math.sin(yaw),Y=x*Math.sin(yaw)+y*Math.cos(yaw);const cx=w*.5,cy=h*(.5+.1*L);return[cx+X*S,cy+Y*S*Math.cos(pitch)-z*H*S*.62*Math.sin(pitch)*L];};}
function surface(ctx,P,L,yaw,H,tint){const q=[];for(let j=0;j<NQ;j++)for(let i=0;i<NQ;i++){const z=(ZQ[j][i]+ZQ[j][i+1]+ZQ[j+1][i]+ZQ[j+1][i+1])/4;
  const pts=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>P(a/NQ,b/NQ,ZQ[b][a],L,yaw,H));const fc=P((i+.5)/NQ,(j+.5)/NQ,0,L,yaw,0);q.push({pts,z,d:fc[1],u:(i+.5)/NQ,v:(j+.5)/NQ});}
  q.sort((a,b)=>a.d-b.d);q.forEach(o=>{ctx.beginPath();o.pts.forEach((c,i)=>i?ctx.lineTo(...c):ctx.moveTo(...c));ctx.closePath();ctx.fillStyle='#F7F4EC';ctx.fill();
    const c=COLZ(o.z),k=tint(o);if(c&&k>0){ctx.fillStyle=`rgba(${c},${(.14+o.z*.36)*k})`;ctx.fill();}ctx.strokeStyle='rgba(31,34,38,.16)';ctx.lineWidth=.7;ctx.stroke();});}
function polyline(ctx,pts){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));}
function summit(ctx,P,L,yaw,H,k){const[x,y]=P(...PEAK,1,L,yaw,H);const sz=6+4*k;ctx.save();ctx.translate(x,y);ctx.rotate(.35);ctx.fillStyle=OR;ctx.fillRect(-sz,-sz,sz*2,sz*2);ctx.restore();}
function scaleAxis(ctx,P,L,yaw,H,a){const[bx,by]=P(0,1,0,L,yaw,H),[tx,ty]=P(0,1,1,L,yaw,H);ctx.save();ctx.globalAlpha*=a;ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(tx,ty-10);ctx.stroke();ctx.beginPath();ctx.moveTo(tx-4,ty-4);ctx.lineTo(tx,ty-12);ctx.lineTo(tx+4,ty-4);ctx.stroke();[.12,.5,.92].forEach(z=>{const[x,y]=P(0,1,z,L,yaw,H);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+7,y);ctx.stroke();});ctx.restore();}
function wanderMarks(ctx,pts,n,a){if(n<2)return;ctx.save();ctx.globalAlpha*=a;ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.setLineDash([2,4]);polyline(ctx,pts.slice(0,n));ctx.stroke();ctx.setLineDash([]);
  for(let i=0;i<n;i+=6){const[x,y]=pts[i];ctx.fillStyle='#FCF9EF';ctx.fillRect(x-3.5,y-3.5,7,7);ctx.strokeRect(x-3.5,y-3.5,7,7);}ctx.restore();}
function stage(id,frameFn){const cv=document.getElementById(id);let G=null,st=null,lt=null;
  const setup=()=>{const o=fit(cv);G={...o,S:Math.min(o.w*.6,o.h*.62)};G.P=makeProj(G);};setup();
  visLoop(cv,t=>{if(!G)return;if(lt===null||t<lt||t-lt>1.2)st=t;lt=t;const T=9.6,u=RM?8.4:(t-st)%T;const{ctx}=G;ctx.clearRect(0,0,G.w,G.h);ctx.save();ctx.globalAlpha=u>9.1?(T-u)/.5:1;ctx.lineCap='round';ctx.lineJoin='round';frameFn(G,u,t);ctx.restore();});
  let lw=innerWidth;addEventListener('resize',()=>{if(innerWidth===lw)return;lw=innerWidth;setup();});
  /* if the canvas was measured before layout settled (0 size), or its box changes without a window resize, fit it again */
  if('ResizeObserver'in window){let w0=cv.clientWidth,h0=cv.clientHeight;new ResizeObserver(()=>{const w=cv.clientWidth,h=cv.clientHeight;if(w&&h&&(Math.abs(w-w0)>1||Math.abs(h-h0)>1||!G.w)){w0=w;h0=h;setup();}}).observe(cv);}}

/* ---- the line, told in three acts ----
   1 wander into unmapped design space: the map is blank; exploration charts the terrain only where it has been
   2 the shortest path to a robust bioprocess: the orange path goes straight to the summit, inside its broad, safe zone
   3 from lab to scale: the map lifts, and the orange square steps up in size, lab to pilot to production */
const WCTRL=[[.12,.14],[.24,.36],[.4,.28],[.3,.52],[.18,.74],[.42,.88],[.6,.62],[.86,.4],[.8,.16],[.58,.12]];
const WTRAIL=(()=>{const o=[],C=WCTRL,r=rng(8);for(let i=0;i<C.length-1;i++){const p0=C[Math.max(0,i-1)],p1=C[i],p2=C[i+1],p3=C[Math.min(C.length-1,i+2)];
  for(let k=0;k<14;k++){const t=k/14,t2=t*t,t3=t2*t;const f=(a,b,c,d)=>.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);o.push([f(p0[0],p1[0],p2[0],p3[0])+(r()-.5)*.012,f(p0[1],p1[1],p2[1],p3[1])+(r()-.5)*.012]);}}o.push(C[C.length-1]);return o;})();
function surfaceM(ctx,P,L,yaw,mask){const q=[];for(let j=0;j<NQ;j++)for(let i=0;i<NQ;i++){const uu=(i+.5)/NQ,vv=(j+.5)/NQ,m=mask(uu,vv);if(m<=.01)continue;const z=(ZQ[j][i]+ZQ[j][i+1]+ZQ[j+1][i]+ZQ[j+1][i+1])/4;
  const pts=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([a,b])=>P(a/NQ,b/NQ,ZQ[b][a],L,yaw,1));const fc=P(uu,vv,0,L,yaw,0);q.push({pts,z,d:fc[1],m});}
  q.sort((a,b)=>a.d-b.d);q.forEach(o=>{ctx.beginPath();o.pts.forEach((c,i)=>i?ctx.lineTo(...c):ctx.moveTo(...c));ctx.closePath();ctx.fillStyle=`rgba(247,244,236,${o.m})`;ctx.fill();
    const c=COLZ(o.z);if(c){ctx.fillStyle=`rgba(${c},${(.14+o.z*.36)*o.m})`;ctx.fill();}ctx.strokeStyle=`rgba(31,34,38,${.16*o.m})`;ctx.lineWidth=.7;ctx.stroke();});}
function threeActs(id,opt){stage(id,(G,u)=>{const{ctx,P,S}=G,pW=ph(.3,2.7,u),pP=ph(2.8,3.7,u),kF=ease(ph(3.7,5.1,u)),Lk=.5-.5*Math.cos(Math.PI*ph(4.6,7.1,u)),L=Lk,yaw=-.62*Lk,pH=ph(7.1,7.5,u); /* the map fills in gently, then lifts slowly */
  const nW=Math.max(1,Math.floor(pW*WTRAIL.length)),seen=WTRAIL.slice(0,nW);
  const dS=(a,b)=>{let m=9;for(let i=0;i<seen.length;i+=2)m=Math.min(m,Math.hypot(seen[i][0]-a,seen[i][1]-b));return m;};
  /* the frame of the design space, empty until explored */
  const corner=[[0,0],[1,0],[1,1],[0,1]].map(([a,b])=>P(a,b,0,L,yaw));ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.globalAlpha*=1-kF;ctx.setLineDash([3,5]);polyline(ctx,corner);ctx.closePath();ctx.stroke();ctx.restore();ctx.save();ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.globalAlpha*=kF;polyline(ctx,corner);ctx.closePath();ctx.stroke();ctx.restore();
  surfaceM(ctx,P,L,yaw,(a,b)=>{const d=dS(a,b);return Math.max(clamp(kF*1.9-d*3.2,0,1),clamp((.16-d)/.07,0,1));} /* the map spreads out from what was explored */);
  /* the exploration trail, with an experiment every few steps */
  {const wp=WTRAIL.map(([a,b])=>P(a,b,zf(a,b),L,yaw));ctx.save();ctx.globalAlpha*=1-.6*pP;ctx.strokeStyle=INK;ctx.lineWidth=1;ctx.setLineDash([2,4]);polyline(ctx,wp.slice(0,nW));ctx.stroke();ctx.setLineDash([]);
    for(let i=7;i<nW;i+=9){const[x,y]=wp[i];ctx.fillStyle='#FCF9EF';ctx.fillRect(x-3.5,y-3.5,7,7);ctx.strokeRect(x-3.5,y-3.5,7,7);}
    if(pW<1){const[x,y]=wp[nW-1];ctx.fillStyle=INK;ctx.beginPath();ctx.arc(x,y,3,0,7);ctx.fill();}ctx.restore();}
  /* the robust zone around the summit: broad enough to hold */
  {const k=ease(ph(3.3,3.9,u));if(k>0){ctx.save();ctx.globalAlpha*=k*(1-.4*Lk);ctx.strokeStyle=OR;ctx.lineWidth=1.1;ctx.setLineDash([3,4]);ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,uu=PEAK[0]+Math.cos(a)*.1,vv=PEAK[1]+Math.sin(a)*.1,[x,y]=P(uu,vv,zf(uu,vv),L,yaw);i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.restore();}}
  /* the shortest path */
  const nP=Math.floor(pP*PATH.length);if(nP>1){ctx.strokeStyle=OR;ctx.lineWidth=2.2;polyline(ctx,PATH.slice(0,nP).map(([a,b])=>P(a,b,zf(a,b),L,yaw)));ctx.stroke();}
  {const[x,y]=P(...START,zf(...START),L,yaw);ctx.fillStyle=INK;ctx.fillRect(x-4,y-4,8,8);}
  scaleAxis(ctx,P,L,yaw,1,L);
  /* lab to scale: the square lands, then steps up twice, leaving the outline of each earlier scale */
  if(pP>=1){const[x,y]=P(...PEAK,1,L,yaw),st=[[0,6],[7.8,10],[8.4,15]],cur=st.reduce((s,[t0,sz],i)=>u>=t0?i:s,0),
      grow=i=>{const[t0,sz]=st[i],pr=i?st[i-1][1]:3;return pr+(sz-pr)*ease(ph(i?t0:7.1,(i?t0:7.1)+.35,u));};
    ctx.save();ctx.translate(x,y);ctx.rotate(.35);
    const s=grow(cur);ctx.fillStyle=OR;ctx.globalAlpha*=ease(pH);ctx.fillRect(-s,-s,s*2,s*2);
    for(let i=0;i<cur;i++){const q=st[i][1];ctx.strokeStyle='rgba(247,244,236,.9)';ctx.lineWidth=1.2;ctx.strokeRect(-q,-q,q*2,q*2);}ctx.restore();
    if(opt&&opt.base){/* the footprint on the base grows with it: a larger vessel at each scale */const[bx,by]=P(...PEAK,0,L,yaw);ctx.save();ctx.globalAlpha*=L*.6;ctx.strokeStyle=OR;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(x,y);ctx.stroke();ctx.restore();}}
});}
threeActs('heroCv');
}
