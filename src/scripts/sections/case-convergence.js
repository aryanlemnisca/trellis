import { RM, OR, rng, clamp, fit, visLoop } from '../lib/core.js';

/* ---------- CASE: convergence. Percent of known optimum titre against experiments run, with uncertainty bands ---------- */
export function initCaseConvergence(){
  const cv=document.getElementById('convCv');if(!cv)return;const box=cv.parentNode;
  const line=(c,pts)=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));};
  /* stepped series, 0..100 experiments: Trellis fast to 99, DoE steadily to 77, OFAT in long plateaus to 50 */
  const mk=(f,seed,jit)=>{const r=rng(seed);let m=0;return Array.from({length:101},(_,i)=>{const x=i/100,v=f(x)+(r()-.5)*jit;m=Math.max(m,Math.min(v,f(1)));return m;});};
  const TRs=mk(x=>99*(1-Math.exp(-x*4.4))/(1-Math.exp(-4.4)),3,5),DOs=mk(x=>77*(1-Math.exp(-x*2.1))/(1-Math.exp(-2.1)),5,6);
  const OFs=(()=>{const J=[[0,0],[3,4],[8,13],[24,15],[25,25],[33,27],[46,29],[50,32],[59,36],[64,41],[70,42],[80,45],[91,50]];return Array.from({length:101},(_,i)=>{let v=0;J.forEach(([x,y])=>{if(i>=x)v=y;});return v;});})();
  const SER=[{d:OFs,band:x=>7,lw:1.5,a:.65,win:0,name:'OFAT',pct:'50%',dur:4.6},{d:DOs,band:x=>6+2*x,lw:1.5,a:.75,win:0,name:'DoE',pct:'77%',dur:3.2},{d:TRs,band:x=>5*(1-x)+1.5,lw:3,a:1,win:1,name:'Trellis',pct:'99%',dur:1.8}]; /* Trellis arrives first, then DoE, then OFAT */
  let o,G,labels=[];
  function setup(){o=fit(cv);const{w,h}=o,narrow=w<560;G={x0:narrow?w*.12:w*.12,x1:narrow?w-96:w*.77,y0:h*.17,y1:h*.8};
    labels.forEach(l=>l.remove());labels=[];const add=(cls,txt,x,y)=>{const e=document.createElement('span');e.className='cvl '+cls;e.textContent=txt;e.style.left=x+'px';e.style.top=y+'px';box.appendChild(e);labels.push(e);return e;};
    const X=v=>G.x0+v/100*(G.x1-G.x0),Y=v=>G.y1-v/100*(G.y1-G.y0);
    [0,50,100].forEach(v=>add('num',String(v),G.x0,Y(v)));[0,20,40,60,80].forEach(v=>add('xnum',String(v),X(v),G.y1));
    add('',narrow?'Known optimum':'Known optimum',G.x0+14,Y(100)-22);add('',"Experiments run",G.x0,G.y1+44);add('ytitle','% of known optimum titre',G.x0-62,(G.y0+G.y1)/2);
    const LB=SER.map(s=>{const v=s.d[100],y=Y(v)+(s.win?-6:0),lx=G.x1+(narrow?14:30),nm=add('name'+(s.win?' win':''),s.name,lx,y-(s.win?22:16)),pc=add('pct'+(s.win?' win':''),s.pct,lx,y-(s.win?18:12));nm.dataset.dur=pc.dataset.dur=s.dur;return{nm,pc};}).reverse();
    /* stack the three results with equal spacing: Trellis at its line, DoE and OFAT below at the same gap */
    const stack=()=>{let cur=Y(SER[2].d[100])-28;LB.forEach(({nm,pc})=>{nm.style.top=cur+'px';pc.style.top=(cur+4)+'px';cur+=4+pc.offsetHeight+(narrow?14:22)+nm.offsetHeight;});};stack();
    /* centre the whole chart (axis to result labels) in the plate */
    const centre=()=>{const bb=box.getBoundingClientRect();let L=G.x0-8,R=G.x1+20;labels.forEach(e=>{if(!e.offsetParent)return;const r=e.getBoundingClientRect();if(!r.width)return;L=Math.min(L,r.left-bb.left);R=Math.max(R,r.right-bb.left);});const d=(o.w-R-L)/2;if(Math.abs(d)<1)return;G.x0+=d;G.x1+=d;labels.forEach(e=>{e.style.left=parseFloat(e.style.left)+d+'px';});};
    centre();if(document.fonts)document.fonts.ready.then(()=>{stack();centre();});}
  setup();let st=null,lt=null;
  function draw(t){const{ctx:c,w,h}=o;if(lt===null||t-lt>1.2)st=t;lt=t;const u=RM?6:t-st;c.clearRect(0,0,w,h);c.lineCap='round';c.lineJoin='round';
    const{x0,x1,y0,y1}=G,X=v=>x0+v/100*(x1-x0),Y=v=>y1-v/100*(y1-y0),pr=s=>1-Math.pow(1-clamp((u-.3)/s.dur,0,1),1.6),nn=s=>Math.round(pr(s)*100);
    /* a fine grid across the whole plate */
    c.lineWidth=1;c.strokeStyle='rgba(31,34,38,.6)';c.beginPath();c.moveTo(x0,Y(100));c.lineTo(x0,y1);c.lineTo(x1+12,y1);c.stroke();for(let i=0;i<=10;i++){c.beginPath();c.moveTo(x0,Y(i*10));c.lineTo(x0-(i%5?3:6),Y(i*10));c.moveTo(X(i*10),y1);c.lineTo(X(i*10),y1+(i%5?3:6));c.stroke();}
    c.save();c.setLineDash([4,4]);c.lineWidth=1;c.strokeStyle='rgba(31,34,38,.7)';c.beginPath();c.moveTo(x0,Y(100));c.lineTo(x1+20,Y(100));c.stroke();c.restore();
    /* bands, then lines */
    SER.forEach(s=>{const n=nn(s);if(n<1)return;const up=[],dn=[];for(let i=0;i<=n;i++){const b=s.band(i/100);up.push([X(i),Y(Math.min(100,s.d[i]+b))]);dn.push([X(i),Y(Math.max(0,s.d[i]-b))]);}
      line(c,up.concat(dn.reverse()));c.closePath();c.fillStyle=s.win?'rgba(236,168,122,.32)':'rgba(138,131,114,.14)';c.fill();});
    SER.forEach(s=>{const n=nn(s);if(n<1)return;const pts=[];for(let i=0;i<=n;i++)pts.push([X(i),Y(s.d[i])]);c.strokeStyle=s.win?OR:`rgba(138,131,114,${s.a})`;c.lineWidth=s.win?3:1.4;line(c,pts);c.stroke();});
    if(pr(SER[2])>=1){const k=clamp((u-.3-SER[2].dur)/.4,0,1);c.save();c.globalAlpha=k;c.translate(X(100),Y(TRs[100]));c.rotate(.35);c.fillStyle=OR;c.fillRect(-6,-6,12,12);c.restore();}
    labels.forEach(l=>{if(l.classList.contains('name')||l.classList.contains('pct'))l.style.opacity=String(clamp((u-.3-(+l.dataset.dur))/.5,0,1));});}
  visLoop(cv,draw);let lw=innerWidth;addEventListener('resize',()=>{if(innerWidth===lw)return;lw=innerWidth;setup();});
}
