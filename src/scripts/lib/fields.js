/* Scalar fields, contour images and the watercolour "colour field" painter. */
import { rng } from './core.js';

/* ---------- fields ---------- */
function makeField(peaks){const f=(x,y)=>{let s=0;for(const[px,py,w,a]of peaks){const dx=x-px,dy=y-py;s+=a*Math.exp(-(dx*dx+dy*dy)/(2*w*w));}return s+0.03*Math.sin(x*9)*Math.cos(y*7);};
  let m=0;for(let i=0;i<=120;i++)for(let j=0;j<=120;j++)m=Math.max(m,f(i/120,j/120));return{f,max:m,peak:peaks[0]};}
/* contour image of field over [lo,hi]^2 drawn into a square offscreen canvas */
function contourImg(F,px,color,lo=-0.25,hi=1.25,alpha=1){
  const c=document.createElement('canvas');c.width=c.height=px;const x=c.getContext('2d');const M=90,span=hi-lo;
  const g=[];for(let j=0;j<=M;j++){g[j]=[];for(let i=0;i<=M;i++)g[j][i]=F.f(lo+i/M*span,hi-j/M*span);}
  const s=px/M;
  [.1,.2,.3,.4,.5,.6,.7,.8,.9].forEach((L,k)=>{x.beginPath();x.strokeStyle=color;x.globalAlpha=(.14+k*.04)*alpha;x.lineWidth=Math.max(1,px/700);
    for(let j=0;j<M;j++)for(let i=0;i<M;i++){const a=g[j][i],b=g[j][i+1],cc=g[j+1][i+1],d=g[j+1][i],p=[];
      const e=(v1,v2,i1,j1,i2,j2)=>{const t=(L-v1)/(v2-v1);p.push([(i1+(i2-i1)*t)*s,(j1+(j2-j1)*t)*s]);};
      if((a<L)!==(b<L))e(a,b,i,j,i+1,j);if((b<L)!==(cc<L))e(b,cc,i+1,j,i+1,j+1);if((cc<L)!==(d<L))e(cc,d,i+1,j+1,i,j+1);if((d<L)!==(a<L))e(d,a,i,j+1,i,j);
      for(let q=0;q+1<p.length;q+=2){x.moveTo(p[q][0],p[q][1]);x.lineTo(p[q+1][0],p[q+1][1]);}}
    x.stroke();});
  return c;}

/* ---------- colour fields: soft, out-of-focus pigment with film grain ----------
   Green = the living / wet-lab side. Blue = the computational side. */
const WC={G:'52,128,96',S:'108,150,78',B:'56,104,190',P:'30,74,140',D:'38,72,200'};
const NOISE=(()=>{const n=document.createElement('canvas');n.width=n.height=180;const x=n.getContext('2d'),im=x.createImageData(180,180),r=rng(909);
  for(let i=0;i<im.data.length;i+=4){const v=r();im.data[i+3]=v<.55?Math.round(Math.pow(r(),1.6)*150):0;}x.putImageData(im,0,0);return n;})();
/* shapes: {x,y,rx,ry,rot,c,a,blur} ellipse, or {path:Path2D,lw,c,a,blur,clip:[x,y,w,h]} stroked/filled path.
   Each shape keeps a clear, slightly irregular outline; inside, the pigment pools at the edge, lifts in the
   middle and mottles, the way a watercolour wash dries. 'blur' sets how soft the inside reads. */
function aura(ctx,w,h,shapes,k=1){
  const W=Math.max(1,Math.round(w*k)),H=Math.max(1,Math.round(h*k));
  const t=document.createElement('canvas');t.width=W;t.height=H;const x=t.getContext('2d');
  const L=document.createElement('canvas');L.width=W;L.height=H;const l=L.getContext('2d');
  l.filter='blur(1px)';const hasF=l.filter==='blur(1px)';l.filter='none';
  let seed=17;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(const s of shapes){
    l.setTransform(1,0,0,1,0,0);l.globalCompositeOperation='source-over';l.globalAlpha=1;l.filter='none';l.clearRect(0,0,W,H);l.scale(k,k);
    const rgb=WC[s.c]||s.c,soft=s.blur;let P,stroke=!!(s.path&&s.lw);
    if(s.path)P=s.path;
    else{P=new Path2D();const n=72,ph=[rnd()*6,rnd()*6,rnd()*6],ry=s.ry||s.rx,c=Math.cos(s.rot||0),sn=Math.sin(s.rot||0);
      for(let i=0;i<=n;i++){const th=i/n*Math.PI*2,wob=1+.028*Math.sin(3*th+ph[0])+.018*Math.sin(5*th+ph[1])+.01*Math.sin(9*th+ph[2]);
        const ex=Math.cos(th)*s.rx*wob,ey=Math.sin(th)*ry*wob,px=s.x+ex*c-ey*sn,py=s.y+ex*sn+ey*c;i?P.lineTo(px,py):P.moveTo(px,py);}P.closePath();}
    const paint=(alpha,blur,lwMul=1)=>{l.save();if(s.clip){l.beginPath();l.rect(...s.clip);l.clip();}
      l.globalAlpha=alpha;if(hasF&&blur>0)l.filter=`blur(${blur}px)`;
      if(stroke){l.lineWidth=s.lw*lwMul;l.lineCap='round';l.lineJoin='round';l.strokeStyle=`rgb(${rgb})`;l.stroke(P);}else{l.fillStyle=`rgb(${rgb})`;l.fill(P);}
      l.filter='none';l.restore();};
    /* 1 the wash, with a clear edge */
    paint(Math.min(1,s.a*1.15),.8);
    /* 2 mottling: uneven pigment settling inside the shape only */
    l.globalCompositeOperation='source-atop';
    const bx=s.path?0:s.x-Math.max(s.rx,s.ry||s.rx),by=s.path?0:s.y-Math.max(s.rx,s.ry||s.rx),bw=s.path?w:Math.max(s.rx,s.ry||s.rx)*2,bh=s.path?h:bw;
    for(let i=0;i<(s.path?16:9);i++){const r=soft*(.8+rnd()*1.4),px=bx+rnd()*bw,py=by+rnd()*bh;
      l.save();if(hasF)l.filter=`blur(${soft*.5}px)`;l.globalAlpha=.18+rnd()*.22;l.fillStyle=rnd()<.6?`rgb(${rgb})`:'rgba(255,255,255,.9)';
      l.beginPath();l.ellipse(px,py,r,r*(.6+rnd()*.6),rnd()*3,0,Math.PI*2);l.fill();l.restore();}
    /* 3 lift the middle so pigment pools at the edge */
    if(hasF){l.globalCompositeOperation='destination-out';paint(.42,soft*.9,.82);}
    /* 4 a fine dried rim */
    if(!stroke){l.globalCompositeOperation='source-over';l.save();if(s.clip){l.beginPath();l.rect(...s.clip);l.clip();}
      if(hasF)l.filter='blur(.6px)';l.globalAlpha=Math.min(1,s.a*.9);l.strokeStyle=`rgb(${rgb})`;l.lineWidth=1.4;l.stroke(P);l.restore();}
    x.globalCompositeOperation='multiply';x.drawImage(L,0,0);x.globalCompositeOperation='source-over';
  }
  /* grain: lift speckles out of the pigment, then settle a few darker ones in */
  x.globalCompositeOperation='destination-out';x.fillStyle=x.createPattern(NOISE,'repeat');x.globalAlpha=.8;x.fillRect(0,0,W,H);
  x.globalCompositeOperation='source-atop';x.globalAlpha=.25;x.save();x.translate(37,61);x.fillRect(-37,-61,W,H);x.restore();
  ctx.drawImage(t,0,0,w,h);}
/* paint into an SVG group as an <image>; coords in the SVG's viewBox units */
function wcSvg(id,vw,vh,shapes){const g=document.getElementById(id);if(!g)return;const k=2,c=document.createElement('canvas');c.width=vw*k;c.height=vh*k;
  aura(c.getContext('2d'),c.width,c.height,shapes.map(s=>{const o={...s,blur:s.blur*k};if(s.path){const p=new Path2D();p.addPath(s.path,new DOMMatrix().scale(k));o.path=p;o.lw=s.lw&&s.lw*k;}else{o.x*=k;o.y*=k;o.rx*=k;if(o.ry)o.ry*=k;}if(s.clip)o.clip=s.clip.map(v=>v*k);return o;}),1);
  const im=document.createElementNS('http://www.w3.org/2000/svg','image');im.setAttribute('href',c.toDataURL());im.setAttribute('x',0);im.setAttribute('y',0);im.setAttribute('width',vw);im.setAttribute('height',vh);g.appendChild(im);}
/* a full-bleed colour field behind a section */
function field(host,shapes){if(!host)return;const c=document.createElement('canvas');c.className='field-cv';c.setAttribute('aria-hidden','true');host.prepend(c);
  const paint=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;c.width=w;c.height=h;aura(c.getContext('2d'),w,h,shapes(w,h),1);};
  paint();let lw=innerWidth,t;addEventListener('resize',()=>{if(innerWidth===lw)return;lw=innerWidth;clearTimeout(t);t=setTimeout(paint,250);});}


export { makeField, contourImg, WC, NOISE, aura, wcSvg, field };
