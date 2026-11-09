import { RM, INK, OR, rng, clamp, fit, visLoop } from '../lib/core.js';
import { aura, field } from '../lib/fields.js';

/* ---------- WHY: five principles, five precise drawings ---------- */
export function initWhy(){
  const btns=[...document.querySelectorAll('.pr')],no=document.getElementById('whyNo'),cv=document.getElementById('whyCv');if(!cv)return;
  const LBL=['A predicted-versus-measured chart above a lab bench: each round, recommendations are run in vessels and land as measured results, closing onto the diagonal as real feedback tunes the tool.',
    'From one molecule, others appear and bond. Every three bonded molecules close into a filled triangle that shares its edges with its neighbours, until the network is one solid shape with no gaps, coloured from the core outward.',
    'Two scientists on one slope of experience. A new one takes short steps with Trellis in front, drawing the route, keeping rails either side and prompting before every step. An experienced one takes long strides with Trellis beside them, linked, now and then offering an alternative.',
    'A grid of model weights recolours with every dataset and every run, from scattered noise into a clear pattern, while a knowledge curve below compounds run over run.',
    'A highlight starts on the answer and hops back through each step of the reasoning, growing smaller each time, until it rests on the data the answer came from. The chain then runs forward again from data to answer, and the whole is framed, ready to defend.'];
  const desk=matchMedia('(min-width: 901px)'),track=document.getElementById('whyTrack');
  let cur=0,auto=!RM&&!desk.matches,t0=performance.now(),sw=performance.now()/1000;const DUR=7000;
  /* phone dock: slides, dots and arrows mirror the same index */
  const dock=document.getElementById('whyDock'),slides=dock?[...dock.querySelectorAll('.why-dock-slide')]:[],dots=dock?[...dock.querySelectorAll('.why-dots i')]:[],dockNo=document.getElementById('whyDockNo'),dockBar=dock&&dock.querySelector('.why-dock-bar');
  const N=btns.length;
  function show(i){cur=i;sw=performance.now()/1000;btns.forEach((b,j)=>{b.classList.toggle('on',j===i);b.setAttribute('aria-pressed',j===i);b.querySelector('.bar').style.width='0';});
    slides.forEach((el,j)=>{el.classList.toggle('on',j===i);el.setAttribute('aria-hidden',j===i?'false':'true');});dots.forEach((d,j)=>d.classList.toggle('on',j===i));if(dockBar)dockBar.style.width='0';
    if(no)no.textContent=`${i+1} / ${N}`;if(dockNo)dockNo.textContent=`${i+1} / ${N}`;cv.setAttribute('aria-label',LBL[i]);t0=performance.now();}
  const step=d=>{auto=false;show((cur+d+N)%N);if(RM)draw();};
  if(dock){dock.querySelectorAll('.why-arrow').forEach(b=>b.addEventListener('click',()=>step(+b.dataset.dir)));
    /* swipe the media or the card to change slide */
    let x0=null,y0=0;const area=[dock,cv.closest('.why-plate')];
    area.forEach(el=>{el.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY;},{passive:true});
      el.addEventListener('touchend',e=>{if(x0===null)return;const dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;x0=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.4)step(dx<0?1:-1);},{passive:true});});}
  /* Desktop: scroll position drives the active principle and its progress bar. Phones: arrows, swipe and autoplay. */
  const NAVH=69; /* visible nav height the track is pinned under */
  const runway=()=>track.offsetHeight-(innerHeight-NAVH);
  function syncToScroll(){
    if(!desk.matches||!track)return;
    const p=clamp((NAVH-track.getBoundingClientRect().top)/runway(),0,1),x=p*N,i=Math.min(N-1,Math.floor(x));
    if(i!==cur)show(i);
    btns[i].querySelector('.bar').style.width=(p>=1?100:(x-i)*100)+'%';
  }
  addEventListener('scroll',syncToScroll,{passive:true});
  desk.addEventListener('change',()=>{auto=!RM&&!desk.matches;btns.forEach(b=>b.querySelector('.bar').style.width='0');if(dockBar)dockBar.style.width='0';t0=performance.now();syncToScroll();});
  btns.forEach((b,i)=>b.addEventListener('click',()=>{
    if(desk.matches&&track){ /* glide to the start of that principle's slice of the scroll track */
      const y=scrollY+track.getBoundingClientRect().top-NAVH+runway()*(i+.04)/N;
      window.lenis?window.lenis.scrollTo(y,{duration:1}):scrollTo({top:y,behavior:'smooth'});
    }else{auto=false;show(i);}
  }));
  const G_='52,128,96',BL='56,104,190',PE='236,168,122',SG='108,150,78';
  const E=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,EO=x=>1-Math.pow(1-x,3);
  let o;const fitc=()=>{o=fit(cv);};fitc();
  const line=(c,pts)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));};
  /* ---- shared drawing language: hairlines, measured ticks, hollow and square nodes, watercolour washes, one orange square ---- */
  const WCACHE={};
  function wash(key,w,h,shapes){const d=(o&&o.d)||1,k=key+'|'+w+'|'+h;if(!WCACHE[k]){const cv2=document.createElement('canvas');cv2.width=Math.max(1,Math.round(w*d));cv2.height=Math.max(1,Math.round(h*d));
    aura(cv2.getContext('2d'),cv2.width,cv2.height,shapes.map(s=>({c:s.c,a:s.a,x:s.x*d,y:s.y*d,rx:s.rx*d,ry:(s.ry||s.rx)*d,rot:s.rot||0,blur:(s.blur||s.rx*.28)*d})));WCACHE[k]=cv2;}return WCACHE[k];}
  const hollow=(c,x,y,r,a=1)=>{c.save();c.globalAlpha*=a;c.beginPath();c.arc(x,y,r,0,7);c.fillStyle='#F7F4EC';c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();c.restore();};
  const sq=(c,x,y,s,col=INK,a=1)=>{c.save();c.globalAlpha*=a;c.fillStyle=col;c.fillRect(x-s/2,y-s/2,s,s);c.restore();};
  const osq=(c,x,y,s,a=1)=>{c.save();c.globalAlpha*=a;c.translate(x,y);c.rotate(.35);c.fillStyle=OR;c.fillRect(-s/2,-s/2,s,s);c.restore();};
  const ruler=(c,x0,y0,x1,n,maj=5,a=.5)=>{c.save();c.strokeStyle=`rgba(31,34,38,${a})`;c.lineWidth=1;c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y0);c.stroke();for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n;c.beginPath();c.moveTo(x,y0);c.lineTo(x,y0+(i%maj?3:6));c.stroke();}c.restore();};
  const vruler=(c,x0,y0,y1,n,maj=5,a=.5)=>{c.save();c.strokeStyle=`rgba(31,34,38,${a})`;c.lineWidth=1;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0,y1);c.stroke();for(let i=0;i<=n;i++){const y=y0+(y1-y0)*i/n;c.beginPath();c.moveTo(x0,y);c.lineTo(x0-(i%maj?3:6),y);c.stroke();}c.restore();};
  const dashed=(c,pts,a=.4,dash=[2,3])=>{c.save();c.strokeStyle=`rgba(31,34,38,${a})`;c.lineWidth=1;c.setLineDash(dash);line(c,pts);c.stroke();c.restore();};
  const fadeOut=(u,T)=>1-clamp((u-T+.5)/.5,0,1);

  /* colour scale shared by the filled drawings: blue (low) to green to peach (high), like self-tuning */
  const colv=v=>{const a=[56,104,190],b=[52,128,96],cc=[236,168,122],m=(p,q,k)=>p.map((x,n)=>Math.round(x+(q[n]-x)*k));v=clamp(v,0,1);return v<.5?m(a,b,v*2):m(b,cc,(v-.5)*2);};

  /* 0: lab-in-the-loop. Predicted against measured: each round Trellis's recommendations are run in its own lab (the vessels
        below) and land where they were actually measured; real feedback tunes the tool until results sit on the diagonal */
  const LNOISE=(()=>{const r=rng(9);return Array.from({length:18},()=>[r(),r()*2-1]);})();
function lab(c,w,h,t){const u=RM?6.4:t%7;c.save();c.globalAlpha*=fadeOut(u,7);
  const x0=w*.14,x1=w*.92,y0=h*.06,y1=h*.66,X=v=>x0+v*(x1-x0),Y=v=>y1-v*(y1-y0),err=[.3,.13,.035],R=[.5,2.4,4.3],q=EO(clamp((u-.5)/5.2,0,1));
  /* tolerance band around the diagonal, narrowing as the tool is tuned */
  const bw=.3*(1-q)+.04;c.beginPath();c.moveTo(X(0),Y(bw));c.lineTo(X(1-bw),Y(1));c.lineTo(X(1),Y(1));c.lineTo(X(1),Y(1-bw));c.lineTo(X(bw),Y(0));c.lineTo(X(0),Y(0));c.closePath();c.fillStyle='rgba(236,168,122,.28)';c.fill();
  c.strokeStyle='rgba(31,34,38,.08)';c.lineWidth=1;for(let i=1;i<5;i++){c.beginPath();c.moveTo(X(i/5),y0);c.lineTo(X(i/5),y1);c.moveTo(x0,Y(i/5));c.lineTo(x1,Y(i/5));c.stroke();}
  c.strokeStyle='rgba(31,34,38,.6)';c.beginPath();c.moveTo(x0,y0);c.lineTo(x0,y1);c.lineTo(x1,y1);c.stroke();
  for(let i=0;i<=10;i++){c.beginPath();c.moveTo(X(i/10),y1);c.lineTo(X(i/10),y1+(i%5?3:6));c.moveTo(x0,Y(i/10));c.lineTo(x0-(i%5?3:6),Y(i/10));c.stroke();}
  c.save();c.setLineDash([5,4]);c.strokeStyle=INK;c.beginPath();c.moveTo(X(0),Y(0));c.lineTo(X(1),Y(1));c.stroke();c.restore();
  /* the lab bench below: one row of vessels per round */
  const bench=h*.93,vw=(x1-x0)/20;c.strokeStyle=INK;c.lineWidth=1.2;c.beginPath();c.moveTo(x0-10,bench);c.lineTo(x1+10,bench);c.stroke();
  /* a rack holding the tubes upright */{const rk=bench-h*.13*.62;c.save();c.strokeStyle='rgba(31,34,38,.45)';c.lineWidth=1;c.beginPath();c.moveTo(x0-6,rk);c.lineTo(x1+6,rk);c.moveTo(x0-6,rk+4);c.lineTo(x1+6,rk+4);c.moveTo(x0-6,rk);c.lineTo(x0-6,bench);c.moveTo(x1+6,rk);c.lineTo(x1+6,bench);c.stroke();c.restore();}
  R.forEach((r0,ri)=>{const col=colv(.15+ri*.35);for(let k=0;k<6;k++){const i=ri*6+k,pv=.12+.8*((i*.61)%1),vx=X(pv),vt=bench-h*.13,run=clamp((u-r0-.3)/.5,0,1),land=EO(clamp((u-r0-.8-k*.05)/.6,0,1));
      const tr=Math.min(vw*.36,7),tb=bench-5;c.save();c.beginPath();c.moveTo(vx-tr,vt);c.lineTo(vx-tr,tb-tr);c.arc(vx,tb-tr,tr,Math.PI,0,true);c.lineTo(vx+tr,vt);
      if(run>0){c.save();c.clip();c.fillStyle=`rgba(${col.join(',')},${.55*run})`;c.fillRect(vx-vw,vt+(bench-vt)*.25,vw*2,bench);c.restore();}c.strokeStyle=`rgba(31,34,38,${run>0?.9:.25})`;c.lineWidth=1;c.stroke();c.beginPath();c.moveTo(vx-tr-2,vt);c.lineTo(vx+tr+2,vt);c.stroke();c.restore();
      /* the recommendation, then its measured result */
      if(u>r0){const mv=clamp(pv+LNOISE[i][1]*err[ri],0,1),y=Y(0)+(Y(mv)-Y(0))*land;if(land>0&&land<1){c.save();c.setLineDash([2,3]);c.strokeStyle=`rgba(${col.join(',')},.9)`;c.beginPath();c.moveTo(vx,vt);c.lineTo(vx,y);c.stroke();c.restore();}
        if(land>0){c.beginPath();c.arc(vx,y,5,0,7);c.fillStyle=`rgba(${col.join(',')},.85)`;c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();}else hollow(c,vx,Y(0),3.2);}}});
  if(u>6.1)osq(c,X(.95),Y(.95)-12,9,clamp((u-6.1)/.3,0,1));c.restore();}

  /* 1: systems thinking. From one molecule, others appear and bond; every three bonded molecules close into a filled
        triangle that shares its edges with its neighbours, so the network becomes one solid surface with no gaps,
        coloured from the core (blue) to the whole (peach), and finally drawn as one outline */
  const scales=(()=>{let M=null;
    const bnd=(S,a)=>S*.42*(1+.1*Math.sin(3*a+.6)+.06*Math.sin(5*a+1.9)+.04*Math.sin(2*a+.3));
    const outl=(w,h,n)=>{const S=Math.min(w,h);return Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2,r=bnd(S,a);return[w/2+Math.cos(a)*r,h/2+Math.sin(a)*r];});};
    function delaunay(P){const big=1e5,pts=P.concat([[-big,-big],[big*2,-big],[0,big*2]]),n=P.length;let tris=[[n,n+1,n+2]];
      const cc=t=>{const[a,b,c]=t.map(i=>pts[i]),dd=2*(a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1])),ux=((a[0]**2+a[1]**2)*(b[1]-c[1])+(b[0]**2+b[1]**2)*(c[1]-a[1])+(c[0]**2+c[1]**2)*(a[1]-b[1]))/dd,uy=((a[0]**2+a[1]**2)*(c[0]-b[0])+(b[0]**2+b[1]**2)*(a[0]-c[0])+(c[0]**2+c[1]**2)*(b[0]-a[0]))/dd;return[ux,uy,(a[0]-ux)**2+(a[1]-uy)**2];};
      let C=tris.map(cc);
      for(let i=0;i<n;i++){const[x,y]=pts[i],bad=[],keep=[],keepC=[];tris.forEach((t,k)=>{const[ux,uy,r2]=C[k];if((x-ux)**2+(y-uy)**2<r2)bad.push(t);else{keep.push(t);keepC.push(C[k]);}});
        const edges=[];bad.forEach(t=>[[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]].forEach(e=>{const j=edges.findIndex(f=>f[0]===e[1]&&f[1]===e[0]);if(j>=0)edges.splice(j,1);else edges.push(e);}));
        tris=keep;C=keepC;edges.forEach(e=>{const t=[e[0],e[1],i];tris.push(t);C.push(cc(t));});}
      return tris.filter(t=>t.every(i=>i<n));}
    function build(w,h){const S=Math.min(w,h),r=rng(11),cx=w/2,cy=h/2,d=S*.075,P=[[cx,cy]];
      outl(w,h,Math.round(2*Math.PI*S*.42/d)).forEach(p=>P.push(p));let tries=0;
      while(tries<20000){tries++;const a=r()*Math.PI*2,rr=Math.sqrt(r())*bnd(S,a)*.97,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;if(P.some(p=>Math.hypot(p[0]-x,p[1]-y)<d))continue;P.push([x,y]);}
      const r2=rng(5),md=S*.5,V=P.map(([x,y],i)=>({x,y,t:i?.25+Math.hypot(x-cx,y-cy)/md*3.4+r2()*.3:0,sq:i&&r2()<.22}));
      const TR=delaunay(P).filter(t=>{const gx=(P[t[0]][0]+P[t[1]][0]+P[t[2]][0])/3,gy=(P[t[0]][1]+P[t[1]][1]+P[t[2]][1])/3;return Math.hypot(gx-cx,gy-cy)<bnd(S,Math.atan2(gy-cy,gx-cx));})
        .map(t=>{const gx=(P[t[0]][0]+P[t[1]][0]+P[t[2]][0])/3,gy=(P[t[0]][1]+P[t[1]][1]+P[t[2]][1])/3;return{t,v:.06+.9*Math.hypot(gx-cx,gy-cy)/(S*.44)+(r2()-.5)*.08,t0:Math.max(...t.map(i=>V[i].t))+.2};});
      const EM=new Map();TR.forEach(({t})=>[[t[0],t[1]],[t[1],t[2]],[t[2],t[0]]].forEach(([a,b])=>{const k=a<b?a+'_'+b:b+'_'+a;if(!EM.has(k))EM.set(k,[a,b]);}));
      M={w,h,V,TR,ED:[...EM.values()],OUT:outl(w,h,120)};}
    return function(c,w,h,t){if(!M||M.w!==w||M.h!==h)build(w,h);const{V,TR,ED,OUT}=M,T=7,u=RM?6.2:t%T;c.save();c.globalAlpha*=fadeOut(u,T);
      TR.forEach(o=>{const k=EO(clamp((u-o.t0)/.5,0,1));if(k<=0)return;const col=colv(o.v).join(',');c.beginPath();o.t.forEach((i,j)=>c[j?'lineTo':'moveTo'](V[i].x,V[i].y));c.closePath();c.fillStyle=`rgba(${col},${.2+.32*k})`;c.fill();c.strokeStyle=`rgba(${col},${.2+.32*k})`;c.lineWidth=1;c.stroke();});
      ED.forEach(([a,b])=>{const k=EO(clamp((u-Math.max(V[a].t,V[b].t))/.35,0,1));if(k<=0)return;const A=V[a].t>V[b].t?V[b]:V[a],B=A===V[a]?V[b]:V[a];c.strokeStyle='rgba(31,34,38,.4)';c.lineWidth=.8;c.beginPath();c.moveTo(A.x,A.y);c.lineTo(A.x+(B.x-A.x)*k,A.y+(B.y-A.y)*k);c.stroke();});
      V.forEach((p,i)=>{if(!i)return;const k=EO(clamp((u-p.t)/.3,0,1));if(k<=0)return;c.save();c.globalAlpha*=k;if(p.sq){c.fillStyle=INK;c.fillRect(p.x-2.5,p.y-2.5,5,5);}else{c.beginPath();c.arc(p.x,p.y,2.6,0,7);c.fillStyle='#F7F4EC';c.fill();c.strokeStyle=INK;c.lineWidth=1;c.stroke();}c.restore();});
      {const k=EO(clamp((u-4.8)/.6,0,1));if(k>0){c.save();c.globalAlpha*=k;c.strokeStyle=INK;c.lineWidth=1.6;c.beginPath();OUT.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.stroke();c.restore();}}
      osq(c,w/2,h/2,12,EO(clamp(u/.4,0,1)));c.restore();};})();

  /* 2: adapts to the user. The same slope of experience, two scientists on it at once.
        Lower down, a new scientist (open marker) takes short steps; Trellis walks in front, draws the route ahead, keeps rails
        either side and prompts before every step: a guide. Higher up, an experienced scientist (solid marker) takes long strides;
        Trellis walks beside them at the same pace, linked, and now and then offers an alternative: a peer */
  function adapt(c,w,h,t){const T=7,u=RM?6.2:t%T,BLU='56,104,190';c.save();c.globalAlpha*=fadeOut(u,T);
    const reticle=(x,y,r,a)=>{c.save();c.globalAlpha*=a;c.translate(x,y);c.rotate(t*1.6);c.strokeStyle=`rgb(${BLU})`;c.lineWidth=1.3;c.beginPath();c.arc(0,0,r,0,7);c.stroke();for(let q=0;q<4;q++){c.rotate(Math.PI/2);c.beginPath();c.moveTo(r,0);c.lineTo(r*1.5,0);c.stroke();}c.restore();};
    const P=s=>[w*(.08+.84*s),h*(.86-.72*Math.pow(s,1.1))-Math.sin(s*Math.PI*2)*h*.04];
    const N=s=>{const a=P(Math.max(0,s-.01)),b=P(Math.min(1,s+.01)),dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return[-dy/L,dx/L];};
    const trellis=(x,y)=>{c.beginPath();c.arc(x,y,6,0,7);c.fillStyle='#F7F4EC';c.fill();c.strokeStyle=`rgb(${BLU})`;c.lineWidth=2;c.stroke();};
    /* the slope of experience */
    {const g=c.createLinearGradient(w*.05,h*.95,w*.95,h*.05);g.addColorStop(0,'rgba(56,104,190,.28)');g.addColorStop(.5,'rgba(52,128,96,.22)');g.addColorStop(1,'rgba(236,168,122,.34)');
      const gp=x=>P(clamp((x-w*.08)/(w*.84),0,1))[1]+14;c.beginPath();c.moveTo(0,h);for(let i=0;i<=60;i++){const x=i/60*w;c.lineTo(x,gp(x));}c.lineTo(w,h);c.closePath();c.fillStyle=g;c.fill();
      for(let k=1;k<7;k++){c.beginPath();for(let i=0;i<=60;i++){const x=i/60*w,y=gp(x)+k*h*.06;i?c.lineTo(x,y):c.moveTo(x,y);}c.strokeStyle='rgba(31,34,38,.12)';c.lineWidth=1;c.stroke();}}
    const walk=(a0,a1,step,t0,dur)=>{const ST=[];for(let q=a0;q<a1-1e-6;q+=step)ST.push(q);ST.push(a1);const pr=clamp((u-t0)/dur,0,1)*(ST.length-1),ni=Math.floor(pr),fr=EO(pr-ni);return{ST,ni,fr,pr,s:ni<ST.length-1?ST[ni]+(ST[ni+1]-ST[ni])*fr:a1};};
    const trail=(ST,a0,s)=>{c.strokeStyle=INK;c.lineWidth=1.8;line(c,Array.from({length:41},(_,i)=>P(a0+(s-a0)*i/40)));c.stroke();ST.forEach(q=>{if(q<=s+1e-6){const[x,y]=P(q);sq(c,x,y,5);}});};

    /* NEW SCIENTIST: short steps all the way to the goal, in a lane just inside the slope that merges at the top; Trellis in front */
    const sst=x=>{x=clamp(x,0,1);return x*x*(3-2*x);},off=q=>26*sst((q-.02)/.14)*(1-sst((q-.8)/.2)) /* both lanes leave one start and meet at the top */,Q=q=>{const[x,y]=P(q),[nx,ny]=N(q),o=off(q);return[x+nx*o,y+ny*o];};
    const QN=q=>{const a=Q(Math.max(0,q-.01)),b=Q(Math.min(1,q+.01)),dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;return[-dy/L,dx/L];};
    {const A=walk(.02,1,.035,.2,3.8),me=Q(A.s),ahead=Math.min(1,A.s+.06),tp=Q(ahead);
      if(A.s<.97){c.save();c.strokeStyle='rgba(31,34,38,.45)';c.lineWidth=1;[-1,1].forEach(sd=>{line(c,Array.from({length:21},(_,i)=>{const q=Math.min(1,A.s+i/20*.14),[nx,ny]=QN(q),[x,y]=Q(q);return[x+nx*11*sd,y+ny*11*sd];}));c.stroke();});c.restore();}
      c.strokeStyle=INK;c.lineWidth=1.8;line(c,Array.from({length:61},(_,i)=>Q(.02+(A.s-.02)*i/60)));c.stroke();A.ST.forEach(q=>{if(q<=A.s+1e-6){const[x,y]=Q(q);sq(c,x,y,4);}});
      if(ahead<1){c.save();c.setLineDash([3,3]);c.strokeStyle=`rgba(${BLU},.9)`;c.lineWidth=1.6;line(c,Array.from({length:21},(_,i)=>Q(Math.min(1,ahead+i/20*.1))));c.stroke();c.restore();}
      if(A.ni<A.ST.length-1){const nx2=Q(A.ST[A.ni+1]);reticle(nx2[0],nx2[1],8,.5+.5*Math.sin(Math.PI*clamp(A.pr-A.ni,0,1)));}
      if(A.s<.99)trellis(tp[0],tp[1]);
      c.beginPath();c.arc(me[0],me[1],6.5,0,7);c.fillStyle='#F7F4EC';c.fill();c.strokeStyle=INK;c.lineWidth=1.6;c.stroke();}

    /* EXPERIENCED SCIENTIST, upper slope: long strides, Trellis beside */
    /* from the same start, one smooth unbroken climb that reaches the top well before the new scientist */
    {const ST=[.02,.18,.34,.5,.66,.82,1],g=E(clamp((u-.2)/2.2,0,1)),s1=.02+.98*g,pr=g*(ST.length-1),ni=Math.min(ST.length-2,Math.floor(pr)),B={ST,s:s1,ni,pr:g>=1?ST.length-1:pr};
      const me=P(B.s),[nx,ny]=N(B.s),tx=me[0]-nx*17,ty=me[1]-ny*17;
      trail(B.ST,.02,B.s);
      c.save();c.setLineDash([4,3]);c.strokeStyle=`rgba(${BLU},.9)`;c.lineWidth=1.8;line(c,Array.from({length:41},(_,i)=>{const q=.02+(B.s-.02)*i/40,[mx,my]=N(q),[x,y]=P(q);return[x-mx*17,y-my*17];}));c.stroke();c.restore();
      c.strokeStyle=`rgba(${BLU},.65)`;c.lineWidth=1;c.beginPath();c.moveTo(...me);c.lineTo(tx,ty);c.stroke();
      /* now and then, an alternative offered; the scientist decides */
      if(g<1&&B.ni%2===1){const k=Math.sin(Math.PI*clamp(B.pr-B.ni,0,1)),bx=tx-nx*h*.07+w*.05,by=ty-ny*h*.07-h*.03;c.save();c.globalAlpha*=k;c.setLineDash([3,3]);c.strokeStyle=`rgb(${BLU})`;c.lineWidth=1.5;c.beginPath();c.moveTo(tx,ty);c.quadraticCurveTo(tx-nx*h*.05,ty-ny*h*.05,bx,by);c.stroke();c.setLineDash([]);c.beginPath();c.arc(bx,by,4,0,7);c.fillStyle='#F7F4EC';c.fill();c.stroke();c.restore();}
      trellis(tx,ty);
      c.beginPath();c.arc(me[0],me[1],6.5,0,7);c.fillStyle=INK;c.fill();
      osq(c,P(1)[0]+12,P(1)[1]+4,10,clamp((u-4.05)/.3,0,1));}
    c.restore();}

  /* 4: regulator ready. A highlight starts on the answer and hops back through the reasoning, growing smaller with every
        step, until it rests on the very data it came from: every claim backed, every step explainable. Then the chain is
        run forward again, data to answer (computable, testable), and the whole is framed, ready to defend */
  const PH=(()=>{const r=rng(37),bg=[];for(let i=0;i<46;i++)bg.push([.06+r()*.9,.08+r()*.84]);
    const A=[.84,.46],R1=[.63,.6],R2=[.43,.38],D=[[.2,.2],[.15,.47],[.25,.7]];return{bg,A,R1,R2,D};})();
  function proof(c,w,h,t){const T=7,u=RM?6.6:t%T;c.save();c.globalAlpha*=fadeOut(u,T);
    const{bg,A,R1,R2,D}=PH,X=p=>[p[0]*w,p[1]*h],S=Math.min(w,h);
    const kB=EO(clamp(u/.6,0,1)),h1=E(clamp((u-.9)/.55,0,1)),h2=E(clamp((u-1.9)/.55,0,1)),h3=E(clamp((u-2.9)/.65,0,1)),kRet=clamp((u-4)/.9,0,1),kF=EO(clamp((u-5.4)/.5,0,1));
    /* colour washes, one per tier, appearing as the highlight reaches it */
    const W=wash('ph',w,h,[{c:'236,168,122',a:.46,x:A[0]*w,y:A[1]*h,rx:S*.2,ry:S*.24},{c:'52,128,96',a:.34,x:(R1[0]+R2[0])/2*w,y:(R1[1]+R2[1])/2*h,rx:S*.24,ry:S*.2,rot:-.6},{c:'56,104,190',a:.36,x:.2*w,y:.45*h,rx:S*.15,ry:S*.32}]);
    {const k=EO(clamp((u-.3)/1.2,0,1));c.save();c.globalAlpha*=k*.95;c.drawImage(W,0,0,w,h);c.restore();}
    /* the field: other data and reasoning, faintly linked */
    c.save();c.globalAlpha*=kB;c.strokeStyle='rgba(31,34,38,.1)';c.lineWidth=1;bg.forEach((p,i)=>{const q=bg[(i*7+3)%bg.length];if(Math.hypot(p[0]-q[0],p[1]-q[1])<.28){c.beginPath();c.moveTo(...X(p));c.lineTo(...X(q));c.stroke();}});
    bg.forEach(p=>{const[x,y]=X(p);c.fillStyle='rgba(31,34,38,.28)';c.beginPath();c.arc(x,y,2,0,7);c.fill();});c.restore();
    /* the chain, traced back as the highlight hops */
    const seg=(p,q,k,lw,col)=>{if(k<=0)return;const[a,b]=X(p),[x2,y2]=X(q);c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(a,b);c.lineTo(a+(x2-a)*k,b+(y2-b)*k);c.stroke();};
    /* the chain is there from the start: every line and point already exists */
    {const ka=kB,lc=`rgba(31,34,38,${.4*ka})`;seg(A,R1,1,1.2,lc);seg(R1,R2,1,1.2,lc);D.forEach(d=>seg(R2,d,1,1.1,lc));}
    seg(A,R1,h1,1.4,INK);seg(R1,R2,h2,1.4,INK);D.forEach(d=>seg(R2,d,h3,1.2,INK));
    /* run forward again: the same chain lights from data to answer */
    if(kRet>0){const or='rgba(223,104,30,.85)',f=x=>E(clamp(x,0,1));D.forEach(d=>seg(d,R2,f(kRet*3),2.2,or));seg(R2,R1,f(kRet*3-1),2.2,or);seg(R1,A,f(kRet*3-2),2.2,or);}
    /* visited points stay marked, sized by their tier */
    const node=(p,r,cv,k)=>{if(k<=0)return;const[x,y]=X(p);c.save();c.globalAlpha*=k;c.beginPath();c.arc(x,y,r,0,7);c.fillStyle=`rgb(${colv(cv).join(',')})`;c.fill();c.strokeStyle=INK;c.lineWidth=1.2;c.stroke();c.restore();};
    node(A,9,.9,kB);node(R1,7,.55,kB);node(R2,5.5,.45,kB);D.forEach(d=>node(d,4,.1,kB));
    /* the highlight: a plain orange ring that shrinks at every hop */
    const ring=(x,y,r,a)=>{if(a<=0)return;c.save();c.globalAlpha*=a;c.strokeStyle=OR;c.lineWidth=1.6;c.beginPath();c.arc(x,y,r,0,7);c.stroke();c.restore();};
    const lerp=(p,q,k)=>[p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k],ha=EO(clamp((u-.4)/.3,0,1))*(1-clamp((u-3.9)/.3,0,1));
    if(u<2.9){const P2=h2>0?lerp(R1,R2,h2):h1>0?lerp(A,R1,h1):A,r=S*(h2>0?.036+(.024-.036)*h2:.056+(.036-.056)*h1);ring(...X(P2),r,ha);}
    else D.forEach(d=>{const p=lerp(R2,d,h3);ring(...X(p),S*(.024+(.013-.024)*h3),ha);});
    /* the answer, confirmed */
    if(u>4.9){const[x,y]=X(A);osq(c,x,y-24,11,clamp((u-4.9)/.3,0,1));}
    /* framed, ready to defend */
    if(kF>0){c.save();c.globalAlpha*=kF;const fx0=w*.03,fx1=w*.97,fy0=h*.05,fy1=h*.95,m=16;c.strokeStyle=INK;c.lineWidth=1.3;
      [[fx0,fy0,1,1],[fx1,fy0,-1,1],[fx0,fy1,1,-1],[fx1,fy1,-1,-1]].forEach(([x,y,sx,sy])=>{c.beginPath();c.moveTo(x+sx*m,y);c.lineTo(x,y);c.lineTo(x,y+sy*m);c.stroke();});c.restore();}
    c.restore();}

  /* 3: self-tuning. With every dataset and every run, the weights adjust: a grid of weights recolours from noise into a clear
        pattern, and the knowledge it holds compounds run over run */
  const STN=(()=>{const r=rng(23);return Array.from({length:8*6},()=>r());})();
  function rings(c,w,h,t){const T=7,u=RM?6.4:t%T,NR=6,RT=.92,R0=.5;c.save();c.globalAlpha*=fadeOut(u,T);
    const runAt=i=>R0+i*RT,nDone=Math.max(0,Math.min(NR,Math.floor((u-R0-.55)/RT)+1));
    /* the weights */
    const C=8,Rw=6,gx0=w*.22,gx1=w*.86,gy0=h*.12,cs=(gx1-gx0)/C,gy1=gy0+cs*Rw,gap=3;
    const target=(i,j)=>clamp(.04+.72*i/(C-1)+.22*(1-j/(Rw-1))+.06*Math.sin(i*1.3+j),0,1);
    const col=v=>{const a=[56,104,190],b=[52,128,96],cc=[236,168,122],m=(p,q,k)=>p.map((x,n)=>Math.round(x+(q[n]-x)*k));return v<.5?m(a,b,v*2):m(b,cc,(v-.5)*2);};
    for(let j=0;j<Rw;j++)for(let i=0;i<C;i++){
      /* each run pulls the cell part of the way toward what the data says; a sweep passes left to right as it lands */
      let n=0;for(let r=0;r<NR;r++){const arrive=runAt(r)+.55+i*.04;n+=clamp((u-arrive)/.35,0,1);}
      const k=1-Math.pow(.55,n),v=STN[j*C+i]*(1-k)+target(i,j)*k,rgb=col(v),x=gx0+i*cs,y=gy0+j*cs;
      c.fillStyle=`rgba(${rgb.join(',')},${.28+.4*k})`;c.fillRect(x+gap/2,y+gap/2,cs-gap,cs-gap);
      }
    /* the sweep line of the latest update */
    for(let r=0;r<NR;r++){const s=(u-runAt(r)-.55)/.6;if(s>0&&s<1){const x=gx0+(gx1-gx0)*s;c.strokeStyle='rgba(31,34,38,.55)';c.lineWidth=1;c.beginPath();c.moveTo(x,gy0-6);c.lineTo(x,gy1+6);c.stroke();}}
    /* each run: a dataset slides in from the left and lands in the grid */
    for(let r=0;r<NR;r++){const k=EO(clamp((u-runAt(r))/.55,0,1));if(k<=0||k>=1)continue;const x=w*.04+(gx0-8-w*.04)*k;for(let q=0;q<Rw;q++)sq(c,x,gy0+(q+.5)*cs,4.5,INK,1-k*.6);}
    for(let q=0;q<Rw;q++){c.strokeStyle='rgba(31,34,38,.18)';c.setLineDash([2,4]);c.beginPath();c.moveTo(w*.04,gy0+(q+.5)*cs);c.lineTo(gx0-10,gy0+(q+.5)*cs);c.stroke();c.setLineDash([]);}
    /* knowledge, compounding run over run */
    const ax0=w*.22,ax1=w*.86,ay0=h*.62,ay1=h*.88,K=x=>1-Math.pow(.62,x);
    c.strokeStyle='rgba(31,34,38,.08)';for(let i=1;i<4;i++){const y=ay0+(ay1-ay0)*i/4;c.beginPath();c.moveTo(ax0,y);c.lineTo(ax1,y);c.stroke();}
    vruler(c,ax0,ay1,ay0,8,4,.5);ruler(c,ax0,ay1,ax1,NR*2,2,.5);
    const X=x=>ax0+(x/NR)*(ax1-ax0),Y=v=>ay1-v*(ay1-ay0)*.92,prog=clamp((u-R0)/(NR*RT),0,1)*NR;
    c.save();c.beginPath();c.rect(ax0,ay0-10,X(prog)-ax0+1,ay1-ay0+20);c.clip();
    const pts=Array.from({length:121},(_,i)=>{const x=i/120*NR;return[X(x),Y(K(x))];});
    const g=c.createLinearGradient(0,ay0,0,ay1);g.addColorStop(0,'rgba(236,168,122,.32)');g.addColorStop(1,'rgba(236,168,122,0)');line(c,pts);c.lineTo(ax1,ay1);c.lineTo(ax0,ay1);c.closePath();c.fillStyle=g;c.fill();
    c.strokeStyle=INK;c.lineWidth=1.6;line(c,pts);c.stroke();c.restore();
    for(let r=1;r<=nDone;r++)sq(c,X(r),Y(K(r)),4.5);
    if(nDone>=NR)osq(c,X(NR),Y(K(NR))-10,8,clamp((u-runAt(NR-1)-1.1)/.3,0,1));
    c.restore();}

  const SC=[lab,scales,adapt,rings,proof];
  function draw(){const{ctx,w,h}=o,now=performance.now()/1000,ts=now-sw;ctx.clearRect(0,0,w,h);
    if(auto&&!RM){const p=(performance.now()-t0)/DUR;const b=btns[cur].querySelector('.bar');b.style.width=Math.min(100,p*100)+'%';if(dockBar)dockBar.style.width=Math.min(100,p*100)+'%';if(p>=1)show((cur+1)%N);}
    ctx.save();ctx.globalAlpha=RM?1:clamp(ts/.45,0,1);ctx.lineCap='round';ctx.lineJoin='round';SC[cur](ctx,w,h,RM?0:ts);ctx.restore();}
  show(0);syncToScroll();visLoop(cv,draw);
  let lw=innerWidth;addEventListener('resize',()=>{if(innerWidth===lw)return;lw=innerWidth;fitc();draw();});
  btns.forEach(b=>b.addEventListener('click',()=>{if(RM)draw();}));
}
