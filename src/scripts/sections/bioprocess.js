import { RM, INK, OR, rng, clamp, fit, visLoop } from '../lib/core.js';
import { aura } from '../lib/fields.js';

/* ---------- BIOPROCESSING: a living system: cells carried by four currents, held within an economic boundary ---------- */
export function initBioprocess(){
  const cv=document.getElementById('sysCv'),viz=document.getElementById('sysViz');if(!cv)return;
  const TY=['232,184,48','56,104,190','46,150,84']; /* yellow + blue react to green */
  const HUE=['52,128,96','108,150,78','56,104,190','30,74,140']; /* biology, chemistry, physics, mathematics */
  const rnd=rng(77);let o,G=null,last=0;
  function setup(){o=fit(cv);const{w,h,d}=o;
    const wide=w>=500,R=wide?Math.min(w*.25,h*.32):Math.min(w*.3,h*.19),cx=wide?w*.28:w/2,cy=wide?h*.47:h*.3,gate=[cx-R,cy];
    const trail=document.createElement('canvas');trail.width=w*d;trail.height=h*d;const tx=trail.getContext('2d');tx.scale(d,d);tx.fillStyle='#F7F4EC';tx.fillRect(0,0,w,h);
    const wash=document.createElement('canvas');wash.width=w*d;wash.height=h*d;
    aura(wash.getContext('2d'),w*d,h*d,[0,1,2,3].map(q=>{const a=-Math.PI/4+q*Math.PI/2;return{x:(cx+Math.cos(a)*R*.48)*d,y:(cy+Math.sin(a)*R*.48)*d,rx:R*.42*d,c:HUE[q],a:.09,blur:R*.18*d};}));
    const parts=Array.from({length:260},()=>{const a=rnd()*Math.PI*2,rr=Math.sqrt(rnd())*R*.95;return{x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr};});
    G={w,h,d,R,cx,cy,gate,trail,tx,wash,parts,cells:Array.from({length:30},(_,k)=>{const a=rnd()*Math.PI*2,rr=Math.sqrt(rnd())*R*.85;return{x:cx+Math.cos(a)*rr,y:cy+Math.sin(a)*rr,vx:0,vy:0,r:R*(.045+rnd()*.02),ph:rnd()*6,hue:[0,0,0],born:-9,q:0,ty:k<4?2:k%2,pt:-rnd()*6,z:(rnd()-.5)*R*1.15};}),tilt:RM?.55:0,fx:[],hist:Array.from({length:90},()=>[13,13,4]),hT:0,pulses:[],data:[],spawn:0,ctx:o.ctx};}
  const quad=(x,y)=>{const a=Math.atan2(y-G.cy,x-G.cx);return((Math.floor((a+Math.PI*2+Math.PI/4)/(Math.PI/2)))%4+4)%4;};
  /* four currents: a slow overall turn plus a vortex in each quadrant, alternating spin */
  function flow(x,y){const{cx,cy,R}=G;const dd=Math.hypot(x-cx,y-cy),pull=dd>R*.62?-(dd-R*.62)/R*1.2:0;let vx=-(y-cy)*.08+(x-cx)*pull,vy=(x-cx)*.08+(y-cy)*pull;
    for(let q=0;q<4;q++){const a=-Math.PI/4+q*Math.PI/2,qx=cx+Math.cos(a)*R*.5,qy=cy+Math.sin(a)*R*.5,dx=x-qx,dy=y-qy,d2=dx*dx+dy*dy+R*R*.02,s=(q%2?1:-1)*R*R*.26/d2;vx+=-dy*s;vy+=dx*s;}
    return[vx,vy];}
  function blob(ctx,x,y,r,ph,t){ctx.beginPath();for(let i=0;i<=28;i++){const th=i/28*Math.PI*2,rr=r*(1+.07*Math.sin(3*th+ph+t*1.6)+.04*Math.sin(5*th-ph));i?ctx.lineTo(x+Math.cos(th)*rr,y+Math.sin(th)*rr):ctx.moveTo(x+Math.cos(th)*rr,y+Math.sin(th)*rr);}ctx.closePath();}
  function step(dt,t){const{cx,cy,R,gate,cells,data,parts,tx}=G;
    /* streamlines */
    tx.fillStyle='rgba(247,244,236,.07)';tx.fillRect(0,0,G.w,G.h);
    parts.forEach(p=>{const[vx,vy]=flow(p.x,p.y),nx=p.x+vx*dt*.9,ny=p.y+vy*dt*.9;const q=quad(p.x,p.y);
      if(Math.hypot(nx-cx,ny-cy)>R*.96||rnd()<.004){const a=rnd()*Math.PI*2,rr=Math.sqrt(rnd())*R*.9;p.x=cx+Math.cos(a)*rr;p.y=cy+Math.sin(a)*rr;return;}
      tx.strokeStyle=`rgba(${HUE[q]},.55)`;tx.lineWidth=1.2;tx.beginPath();tx.moveTo(p.x,p.y);tx.lineTo(nx,ny);tx.stroke();p.x=nx;p.y=ny;});
    /* cells: carried by the currents, pushed apart, kept inside the ring */
    cells.forEach((c,i)=>{const[vx,vy]=flow(c.x,c.y);c.vx+=(vx-c.vx)*dt*1.4;c.vy+=(vy-c.vy)*dt*1.4;
      for(let j=i+1;j<cells.length;j++){const e=cells[j],dx=e.x-c.x,dy=e.y-c.y,dd=Math.hypot(dx,dy)||1,m=c.r+e.r+3;if(dd<m&&!c.dead&&!e.dead&&c.ty+e.ty===1&&rnd()<.3&&t-(c.cool||-9)>1.2&&t-(e.cool||-9)>1.2){c.x=(c.x+e.x)/2;c.y=(c.y+e.y)/2;c.z=(c.z+e.z)/2;c.ty=2;c.pt=t;c.r=Math.max(c.r,e.r)*1.12;e.dead=1;G.fx.push({x:c.x,y:c.y,z:c.z,t0:t});G.pulses.push(t);continue;}if(dd<m){const f=(m-dd)/dd*.5;c.x-=dx*f;c.y-=dy*f;e.x+=dx*f;e.y+=dy*f;}}
      c.x+=c.vx*dt;c.y+=c.vy*dt;const dx=c.x-cx,dy=c.y-cy,dd=Math.hypot(dx,dy),lim=R-c.r-4;
      if(dd>lim){const nx=dx/dd,ny=dy/dd;c.x=cx+nx*lim;c.y=cy+ny*lim;const vn=c.vx*nx+c.vy*ny;if(vn>0){c.vx-=2*vn*nx;c.vy-=2*vn*ny;c.hit=1;}}
      c.hit=Math.max(0,(c.hit||0)-dt*2.5);c.q=quad(c.x,c.y);});
    for(let i=cells.length-1;i>=0;i--)if(cells[i].dead)cells.splice(i,1);
    cells.slice().forEach(c=>{if(c.ty===2&&t-c.pt>7){c.ty=0;c.r/=1.12;c.cool=t;const a=rnd()*Math.PI*2;cells.push({x:c.x+Math.cos(a)*c.r*2.2,y:c.y+Math.sin(a)*c.r*2.2,vx:-c.vx,vy:-c.vy,r:c.r,ph:rnd()*6,hue:[0,0,0],born:t,q:c.q,ty:1,cool:t,z:c.z});}});
    G.fx=G.fx.filter(f=>t-f.t0<.9);G.pulses=G.pulses.filter(p=>t-p<1.2);
    G.hT-=dt;if(G.hT<=0){G.hT=.25;const n=[0,0,0];cells.forEach(c=>n[c.ty]++);G.hist.push(n);if(G.hist.length>90)G.hist.shift();}}
  function draw(t){if(!G)return;const{ctx,w,h,R,cx,cy,gate,cells,data,trail,wash}=G;const dt=clamp(t-last,0,.05);last=t;
    if(!RM)step(dt,t);
    ctx.clearRect(0,0,w,h);
    /* the camera: once the section is in view, the bioreactor stands in side view for a moment, then tilts on its own to look
       straight down; it plays again each time the section comes back into view */
    {if(G.seen==null&&t>0)G.seen=t; /* draw only runs while most of the plate is on screen, so the first live frame is the start (t=0 is the static first paint) */
      G.tilt=RM?.55:G.seen==null?0:clamp((t-G.seen-.9)/1.6,0,1);}
    const k=G.tilt*G.tilt*(3-2*G.tilt),phi=(13+77*k)*Math.PI/180,sn=Math.sin(phi),co=Math.cos(phi),side=1-k,Hc=R*(w>=500?1.9:1.45),Lz=Hc*.32;
    const P=(x,y,z)=>[x,cy+(y-cy)*sn-z*co],cz=(c,t)=>c.z*(Hc/(R*1.15))*.5+Math.sin(t*.6+c.ph)*R*.03;
    const topY=cy-(Hc/2)*co,botY=cy+(Hc/2)*co,liqY=cy-Lz*co;
    /* the culture: liquid filling the vessel */
    ctx.save();ctx.beginPath();ctx.moveTo(cx-R,liqY);ctx.lineTo(cx-R,botY);ctx.ellipse(cx,botY,R,R*sn,0,Math.PI,0,true);ctx.lineTo(cx+R,liqY);ctx.ellipse(cx,liqY,R,R*sn,0,0,Math.PI,true);ctx.closePath();
    const lg=ctx.createLinearGradient(0,liqY-R*sn,0,botY+R*sn);lg.addColorStop(0,'rgba(236,168,122,.16)');lg.addColorStop(1,'rgba(52,128,96,.16)');ctx.fillStyle=lg;ctx.fill();ctx.restore();
    /* the four currents, in the plane of the vessel, strongest when seen from above */
    ctx.save();ctx.translate(0,cy);ctx.scale(1,sn);ctx.translate(0,-cy);ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.clip();ctx.globalAlpha=.55*k*k;ctx.drawImage(trail,0,0,w,h);ctx.globalAlpha=k*k;ctx.drawImage(wash,0,0,w,h);ctx.restore();
    /* sparged air rising, seen from the side */
    if(side>.05){ctx.save();ctx.globalAlpha=side*.7;for(let i=0;i<14;i++){const f=((t*.18+i*.0714)%1),bx=cx+Math.sin(i*2.3)*R*.6+Math.sin(t+i)*4,by=botY-f*(botY-liqY)*1.0;ctx.beginPath();ctx.arc(bx,by,1.6+i%3,0,7);ctx.strokeStyle='rgba(31,34,38,.45)';ctx.lineWidth=1;ctx.stroke();}ctx.restore();}
    /* stirrer: a shaft through the headplate and two impellers */
    {const sh0=P(cx,cy,Hc/2+R*.22),sh1=P(cx,cy,-Hc*.3);ctx.strokeStyle='rgba(31,34,38,.7)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(...sh0);ctx.lineTo(...sh1);ctx.stroke();
      [-Hc*.3,Hc*.02].forEach((zb,bi)=>{for(let q=0;q<4;q++){const an=t*2.2+q*Math.PI/2+bi*.4,e1=P(cx+Math.cos(an)*R*.3,cy+Math.sin(an)*R*.3,zb),c0=P(cx,cy,zb);ctx.strokeStyle='rgba(31,34,38,.6)';ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(...c0);ctx.lineTo(...e1);ctx.stroke();}});
      ctx.fillStyle=INK;ctx.beginPath();ctx.arc(sh0[0],sh0[1],2.5,0,7);ctx.fill();}
    /* living cells, back to front */
    const order=cells.slice().sort((p,q)=>(p.y*sn+cz(p,t)*0)-(q.y*sn+cz(q,t)*0));
    order.forEach(c=>{const[X,Y]=P(c.x,c.y,cz(c,t));const age=clamp((t-c.born)/.6,0,1),r=c.r*(.5+.5*age)*(1+.06*Math.sin(t*1.8+c.ph)),col=TY[c.ty];
      /* a fresh product shows the two colours swirling into the new one */
      const fr=c.ty===2?clamp((t-c.pt)/1.4,0,1):1,rp=r*(1+.3*Math.sin(Math.min(1,fr*1.6)*Math.PI));
      blob(ctx,X,Y,rp,c.ph,t);ctx.fillStyle=`rgba(252,249,239,.95)`;ctx.fill();
      if(fr<1){const g=ctx.createLinearGradient(X-rp,Y,X+rp,Y);g.addColorStop(0,`rgba(${TY[0]},${.55*(1-fr)})`);g.addColorStop(1,`rgba(${TY[1]},${.55*(1-fr)})`);ctx.fillStyle=g;ctx.fill();}
      ctx.fillStyle=`rgba(${col},${.34*fr})`;ctx.fill();ctx.strokeStyle=`rgba(31,34,38,${.65+.3*(c.hit||0)})`;ctx.lineWidth=1;ctx.stroke();
      if(fr<1){const off=rp*.42*(1-fr),sp=t*4;[[0,-1],[1,1]].forEach(([k,sd])=>{ctx.beginPath();ctx.arc(X+Math.cos(sp)*off*sd,Y+Math.sin(sp)*off*sd,rp*.32,0,7);ctx.fillStyle=`rgba(${TY[k]},${.9*(1-fr)})`;ctx.fill();});}
      ctx.beginPath();ctx.arc(X+r*.12,Y-r*.1,r*.38,0,7);ctx.fillStyle=`rgba(${col},${.95*fr})`;ctx.fill();});
    /* a reaction: a brief bloom where two cells became one */
    G.fx.forEach(f=>{const kk=(t-f.t0)/.9,[X,Y]=P(f.x,f.y,(f.z||0)*(Hc/(R*1.15))*.5);ctx.beginPath();ctx.arc(X,Y,R*.06+kk*R*.16,0,7);ctx.strokeStyle=`rgba(46,150,84,${.85*(1-kk)})`;ctx.lineWidth=2;ctx.stroke();});
    /* the vessel: walls, a dished bottom, the headplate rim and the liquid surface */
    ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(cx-R,topY);ctx.lineTo(cx-R,botY);ctx.moveTo(cx+R,topY);ctx.lineTo(cx+R,botY);ctx.stroke();
    ctx.beginPath();ctx.ellipse(cx,botY,R,R*sn,0,0,Math.PI);ctx.stroke();
    if(side>.02){ctx.save();ctx.globalAlpha=side;ctx.setLineDash([3,4]);ctx.strokeStyle='rgba(31,34,38,.35)';ctx.beginPath();ctx.ellipse(cx,botY,R,R*sn,0,Math.PI,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='rgba(31,34,38,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,liqY,R,R*sn,0,0,Math.PI*2);ctx.stroke();
      /* headplate ports */
      [-.55,-.25,.35,.6].forEach((u,qi)=>{const[px2,py2]=P(cx+u*R,cy-R*.15,Hc/2);ctx.fillStyle='#F7F4EC';ctx.strokeStyle=INK;ctx.lineWidth=1.2;const hh=8+qi%2*6;ctx.fillRect(px2-3,py2-hh,6,hh);ctx.strokeRect(px2-3,py2-hh,6,hh);});ctx.restore();}
    ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(cx,topY,R,R*sn,0,0,Math.PI*2);ctx.stroke();
    /* seen from the side, it reads as a real bioreactor: domed head with a port, collars, legs, jacket pipes, a sight glass */
    if(side>.03){ctx.save();ctx.globalAlpha*=side;ctx.strokeStyle=INK;ctx.lineWidth=1.4;
      const dH=R*.42*co;/* domed head and its port */
      ctx.beginPath();ctx.moveTo(cx-R*.78,topY-R*sn*.2);ctx.bezierCurveTo(cx-R*.7,topY-dH,cx+R*.7,topY-dH,cx+R*.78,topY-R*sn*.2);ctx.stroke();
      const pw=R*.2,ph2=R*.16,pt=topY-dH*.78-ph2;ctx.fillStyle='#F7F4EC';ctx.fillRect(cx-pw/2,pt,pw,ph2);ctx.strokeRect(cx-pw/2,pt,pw,ph2);ctx.fillRect(cx-pw*.75,pt-5,pw*1.5,5);ctx.strokeRect(cx-pw*.75,pt-5,pw*1.5,5);
      /* collars at the top and near the base */
      [[topY,1],[botY-R*.1*co,1]].forEach(([y])=>{ctx.beginPath();ctx.ellipse(cx,y,R+7,(R+7)*sn,0,0,Math.PI);ctx.stroke();ctx.beginPath();ctx.ellipse(cx,y+7,R+7,(R+7)*sn,0,0,Math.PI);ctx.stroke();ctx.beginPath();ctx.moveTo(cx-R-7,y);ctx.lineTo(cx-R-7,y+7);ctx.moveTo(cx+R+7,y);ctx.lineTo(cx+R+7,y+7);ctx.stroke();});
      /* rounded base and legs */
      const by=botY+R*sn,legB=by+R*.42*co+R*.18;ctx.beginPath();ctx.moveTo(cx-R,botY);ctx.bezierCurveTo(cx-R,by+R*.5*co,cx+R,by+R*.5*co,cx+R,botY);ctx.stroke();
      [-.82,-.5,.5,.82].forEach((f,i)=>{if(i===1||i===2){ctx.globalAlpha*=.5;}const x=cx+f*R;ctx.beginPath();ctx.moveTo(x-3,botY-R*.1*co+7+(R+7)*sn*.6);ctx.lineTo(x-3,legB);ctx.moveTo(x+3,botY-R*.1*co+7+(R+7)*sn*.6);ctx.lineTo(x+3,legB);ctx.moveTo(x-6,legB);ctx.lineTo(x+6,legB);ctx.stroke();if(i===1||i===2)ctx.globalAlpha/=.5;});
      /* jacket pipes down each side */
      [-1].forEach(sd=>{const x0=cx+sd*(R+7),y0=topY+3; /* jacket pipe on the far side only, so it is never mistaken for the data cable */ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0+sd*R*.06,y0);ctx.quadraticCurveTo(x0+sd*R*.11,y0,x0+sd*R*.11,y0+R*.08);ctx.lineTo(x0+sd*R*.11,botY-R*.3*co);ctx.quadraticCurveTo(x0+sd*R*.11,botY-R*.2*co,x0+sd*R*.18,botY-R*.2*co);ctx.stroke();});
      /* sight glass with the culture visible, and a graduated scale */
      const gw=R*.34,gh=(botY-topY)*.52,gx=cx+R*.12,gy=topY+(botY-topY)*.2,gr=gw/2;
      ctx.beginPath();ctx.moveTo(gx-gw/2,gy+gr);ctx.arc(gx,gy+gr,gr,Math.PI,0);ctx.lineTo(gx+gw/2,gy+gh-gr);ctx.arc(gx,gy+gh-gr,gr,0,Math.PI);ctx.closePath();ctx.fillStyle='rgba(247,244,236,.82)';ctx.fill();
      ctx.save();ctx.clip();const lvY=gy+gh*.45;ctx.beginPath();ctx.moveTo(gx-gw,lvY);for(let i=0;i<=12;i++)ctx.lineTo(gx-gw/2+gw*i/12,lvY+Math.sin(i*.9+t*2)*2);ctx.lineTo(gx+gw,gy+gh);ctx.lineTo(gx-gw,gy+gh);ctx.closePath();ctx.fillStyle='rgba(52,128,96,.3)';ctx.fill();ctx.strokeStyle='rgba(31,34,38,.6)';ctx.lineWidth=1;ctx.stroke();
        [[.3,.2],[.62,.32],[.45,.12]].forEach(([fx,fy])=>{ctx.beginPath();ctx.arc(gx-gw/2+gw*fx,gy+gh*fy+gr*.3,1.8,0,7);ctx.fillStyle=INK;ctx.fill();});ctx.beginPath();ctx.arc(gx,gy+gh*.78,gw*.14,0,7);ctx.stroke();ctx.beginPath();ctx.arc(gx,gy+gh*.78,gw*.05,0,7);ctx.fillStyle='rgba(232,184,48,.9)';ctx.fill();ctx.restore();
      ctx.strokeStyle=INK;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(gx-gw/2,gy+gr);ctx.arc(gx,gy+gr,gr,Math.PI,0);ctx.lineTo(gx+gw/2,gy+gh-gr);ctx.arc(gx,gy+gh-gr,gr,0,Math.PI);ctx.closePath();ctx.stroke();
      const sx2=gx-gw/2-R*.2;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(sx2,gy);ctx.lineTo(sx2,gy+gh);ctx.stroke();for(let i=0;i<=8;i++){const y=gy+gh*i/8;ctx.beginPath();ctx.moveTo(sx2,y);ctx.lineTo(sx2+(i%2?5:9),y);ctx.stroke();}
      ctx.restore();}
    /* the economics ring: measured ticks around the rim */
    ctx.lineWidth=1;for(let i=0;i<120;i++){const a=i/120*Math.PI*2,L=i%10===0?9:4,nx=Math.cos(a),ny=Math.sin(a)*sn,nl=Math.hypot(nx,ny)||1;ctx.globalAlpha=(i%10===0?.85:.4)*(.35+.65*k);
      const x0=cx+Math.cos(a)*(R+3),y0=topY+Math.sin(a)*(R+3)*sn;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0+nx/nl*L,y0+ny/nl*L);ctx.stroke();}
    ctx.globalAlpha=1;
    const ea=t*.15;ctx.save();ctx.translate(cx+Math.cos(ea)*(R+3),topY+Math.sin(ea)*(R+3)*sn);ctx.rotate(ea+.6);ctx.fillStyle=OR;ctx.fillRect(-5,-5,10,10);ctx.restore();
    /* the software reading the reaction: a probe on the ring, cabled to a laptop running a live readout */
    {const wide=w>=500,sw=wide?Math.min(w*.34,h*.48):Math.min(w*.62,R*2.1),sh=sw*.64,sx=wide?Math.min(w-sw-w*.05,cx+R+w*.11):cx-sw/2,sy=wide?cy-sh*.62:cy+R*1.75;
      const px=wide?cx+R:cx,py=wide?cy:botY+R*sn,dx=wide?1:0,dy=wide?0:1,deckY=sy+sh,dk=sw*.08,portX=sx+Math.max(5,sw*.025),portY=deckY-Math.max(4,sh*.025); /* the cable runs round to the hinge and into the back of the laptop, low down */
      /* cable */
      const c1=wide?[px+R*.45,py]:[sx-sw*.3,py+(sy-py)*.55],c2=wide?[sx-sw*.16,portY]:[sx-sw*.3,portY];
      ctx.strokeStyle='rgba(31,34,38,.5)';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(px+dx*6,py+dy*6);ctx.bezierCurveTo(...c1,...c2,portX,portY);ctx.stroke();
      ctx.save();ctx.translate(px,py);ctx.rotate(wide?0:Math.PI/2);ctx.fillStyle=INK;ctx.fillRect(-3,-5,10,10);ctx.restore();
      const bz=(s,p0,p1,p2,p3)=>(1-s)**3*p0+3*(1-s)**2*s*p1+3*(1-s)*s*s*p2+s**3*p3;
      G.pulses.forEach(p0=>{const s=(t-p0)/1.2;ctx.fillStyle='rgb(46,150,84)';ctx.beginPath();ctx.arc(bz(s,px,c1[0],c2[0],portX),bz(s,py,c1[1],c2[1],portY),3,0,7);ctx.fill();});
      /* the laptop: lid with bezel and screen, then the keyboard deck */
      ctx.fillStyle=INK;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(sx,sy,sw,sh,7);else ctx.rect(sx,sy,sw,sh);ctx.fill();
      ctx.beginPath();ctx.moveTo(sx-dk,deckY+dk*.9);ctx.lineTo(sx+sw+dk,deckY+dk*.9);ctx.lineTo(sx+sw,deckY);ctx.lineTo(sx,deckY);ctx.closePath();ctx.fillStyle='#E6E0D0';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.stroke();
      ctx.fillStyle=INK;ctx.fillRect(sx-dk,deckY+dk*.9,sw+dk*2,3);ctx.strokeStyle='rgba(31,34,38,.4)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx+sw*.42,deckY+dk*.9);ctx.lineTo(sx+sw*.44,deckY+dk*.35);ctx.lineTo(sx+sw*.56,deckY+dk*.35);ctx.lineTo(sx+sw*.58,deckY+dk*.9);ctx.stroke();
      ctx.fillStyle='rgba(247,244,236,.35)';ctx.beginPath();ctx.arc(sx+sw/2,sy+5,1.6,0,7);ctx.fill();
      const bz2=Math.max(7,sw*.035),wx=sx+bz2,wy=sy+bz2+2,ww=sw-bz2*2,wh=sh-bz2*2-2,tb=Math.max(12,wh*.1);
      ctx.fillStyle='#F7F4EC';ctx.fillRect(wx,wy,ww,wh);
      ctx.strokeStyle='rgba(31,34,38,.25)';ctx.beginPath();ctx.moveTo(wx,wy+tb);ctx.lineTo(wx+ww,wy+tb);ctx.stroke();
      [0,1,2].forEach(i=>{ctx.beginPath();ctx.arc(wx+8+i*7,wy+tb/2,2,0,7);ctx.fillStyle=i?'rgba(31,34,38,.25)':'rgba(236,168,122,.9)';ctx.fill();});
      /* the mathematics of the process: a model fitted to the measured reaction, its matrix, and its phase portrait */
      const H=G.hist,L=H.length,gx0=wx+10,gx1=wx+ww*.6,gy0=wy+tb+10,gy1=wy+wh-10;
      ctx.strokeStyle='rgba(31,34,38,.08)';ctx.lineWidth=1;for(let i=1;i<4;i++){const y=gy0+(gy1-gy0)*i/4;ctx.beginPath();ctx.moveTo(gx0,y);ctx.lineTo(gx1,y);ctx.stroke();}
      ctx.strokeStyle='rgba(31,34,38,.6)';ctx.beginPath();ctx.moveTo(gx0,gy0);ctx.lineTo(gx0,gy1);ctx.lineTo(gx1,gy1);ctx.stroke();
      const Y=v=>gy1-(v/16)*(gy1-gy0),XX=i=>gx0+4+(i/(L-1))*(gx1-gx0-8);
      /* measured product, as points */
      ctx.fillStyle='rgb(46,150,84)';for(let i=0;i<L;i+=3){ctx.fillRect(XX(i)-1.6,Y(H[i][2])-1.6,3.2,3.2);}
      /* the fitted model: a smooth curve through them, and its equilibrium */
      ctx.strokeStyle='rgb(56,104,190)';ctx.lineWidth=1.8;ctx.beginPath();for(let i=0;i<L;i++){let a2=0,n2=0;for(let j=Math.max(0,i-10);j<=Math.min(L-1,i+10);j++){a2+=H[j][2];n2++;}const y=Y(a2/n2);i?ctx.lineTo(XX(i),y):ctx.moveTo(XX(i),y);}ctx.stroke();
      const eq=H.reduce((s2,n)=>s2+n[2],0)/L;ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(31,34,38,.45)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(gx0,Y(eq));ctx.lineTo(gx1,Y(eq));ctx.stroke();ctx.setLineDash([]);
      /* a matrix of interactions, in brackets, its entries shifting with the process */
      const mx0=wx+ww*.67,mw=ww*.27,my0=gy0,mh=(gy1-gy0)*.44,N=4,cs=Math.min(mw,mh)/N;
      ctx.strokeStyle=INK;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(mx0+3,my0-2);ctx.lineTo(mx0-1,my0-2);ctx.lineTo(mx0-1,my0+cs*N+2);ctx.lineTo(mx0+3,my0+cs*N+2);ctx.moveTo(mx0+cs*N-3,my0-2);ctx.lineTo(mx0+cs*N+1,my0-2);ctx.lineTo(mx0+cs*N+1,my0+cs*N+2);ctx.lineTo(mx0+cs*N-3,my0+cs*N+2);ctx.stroke();
      for(let r=0;r<N;r++)for(let q=0;q<N;q++){const v=.5+.5*Math.sin(t*.7+r*1.3+q*2.1+(H[L-1][2]-eq)*.3),col=r===q?'56,104,190':'236,168,122';ctx.fillStyle=`rgba(${col},${.15+.65*v})`;ctx.fillRect(mx0+q*cs+1.5,my0+r*cs+1.5,cs-3,cs-3);}
      /* phase portrait: reactant against product, spiralling toward balance */
      const py0=my0+mh+12,ph2=gy1-py0,pw=mw,pX=v=>mx0+(v/20)*pw,pY=v=>gy1-(v/16)*ph2;
      ctx.strokeStyle='rgba(31,34,38,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(mx0,py0);ctx.lineTo(mx0,gy1);ctx.lineTo(mx0+pw,gy1);ctx.stroke();
      ctx.strokeStyle='rgba(46,150,84,.85)';ctx.lineWidth=1.2;ctx.beginPath();for(let i=Math.max(0,L-60);i<L;i++){let p2=0,u2=0,n2=0;for(let j=Math.max(0,i-4);j<=i;j++){p2+=H[j][0];u2+=H[j][2];n2++;}const x=pX(p2/n2),y=pY(u2/n2);i>L-60?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
      {const n=H[L-1];ctx.fillStyle=OR;ctx.beginPath();ctx.arc(pX(n[0]),pY(n[2]),2.8,0,7);ctx.fill();}
      /* a reaction arriving */
      const lit=G.pulses.some(p0=>t-p0>1&&t-p0<1.2);ctx.beginPath();ctx.arc(wx+ww-9,wy+tb/2,3,0,7);ctx.fillStyle=lit?'rgb(46,150,84)':'rgba(31,34,38,.15)';ctx.fill();}
  }
  const THR=Math.min(.6,innerHeight*.9/Math.max(1,viz.offsetHeight)); /* play once ~60% of the plate is on screen (less if the plate is taller than the window) */
  setup();
  if(RM){for(let i=0;i<600;i++){last=i/60;step(1/60,i/60);} }
  visLoop(viz,draw,{restart:false,threshold:THR}); /* cells and reactions carry absolute timestamps, so its clock must not reset */
  /* replay from the standing view every time the section comes back: reset as soon as it leaves the screen */
  if('IntersectionObserver'in window)new IntersectionObserver(e=>{if(e[e.length-1].intersectionRatio<THR&&G){G.seen=null;G.tilt=0;}},{threshold:[0,THR]}).observe(viz);
  let lw=innerWidth;addEventListener('resize',()=>{if(innerWidth===lw)return;lw=innerWidth;setup();});
}
