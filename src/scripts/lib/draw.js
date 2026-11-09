/* Small canvas drawing helpers. */
import { RM } from './core.js';

function stars(ctx,list,t){list.forEach(([x,y,sz,c,rt],i)=>{ctx.save();ctx.globalAlpha=RM?1:.55+.45*Math.sin(t*1.4+i*1.7);ctx.translate(x,y);ctx.rotate(rt);ctx.fillStyle=c;ctx.fillRect(-sz,-sz,sz*2,sz*2);ctx.restore();});}

/* pillAt was switched off in the original page; kept as a no-op so callers need no change. */
const pillAt=()=>{};

export { stars, pillAt };
