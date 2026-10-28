import {hasShape,shapeOverlap} from './shape-collision.js';
import {surfaceAt} from './level.js';
import {waterCurrentAt} from './currents.js';
export const RING_URLS=[
 new URL('../assets/effects/bubble-rings/bubble-ring-01.png',import.meta.url).href,
 new URL('../assets/effects/bubble-rings/bubble-ring-02.png',import.meta.url).href,
 new URL('../assets/effects/bubble-rings/burst-01-01.png',import.meta.url).href,
 new URL('../assets/effects/bubble-rings/burst-01-02.png',import.meta.url).href,
 new URL('../assets/effects/bubble-rings/burst-02-01.png',import.meta.url).href,
 new URL('../assets/effects/bubble-rings/burst-02-02.png',import.meta.url).href
];
export function emitRing(rings,p,motion,time){
 if(!p.wet||time-(rings.lastShot??-Infinity)<.4)return false;
 const dx=Math.cos(motion.swimTilt)*motion.facing,dy=Math.sin(motion.swimTilt)*motion.facing;
 // Place the ring beyond the beak and above the body centre in sprite space.
 const mouthX=p.x+dx*40+Math.sin(motion.swimTilt)*8;
 const mouthY=p.y+dy*40-Math.cos(motion.swimTilt)*8;
 rings.lastShot=time;rings.push({x:mouthX,y:mouthY,dx,dy,age:0,distance:0,broken:null,variant:rings.length%2});return true;
}
function blocked(level,x,y){
 if(y-7<=level.waterY||y+7>=level.bottom)return true;
 return level.solids.some(s=>hasShape(s)?shapeOverlap(s,{left:x-7,right:x+7,top:y-7,bottom:y+7}):x+7>s.x1&&x-7<s.x2&&y+7>surfaceAt(s,x)&&y-7<s.bottom);
}
export function updateRings(rings,level,dt){
 for(const r of rings){
  if(r.broken!==null){r.broken+=dt;continue;}
  r.age+=dt;
  const speed=276*Math.exp(-.45*r.age),flow=waterCurrentAt(level,r.x,r.y);
  const dx=(r.dx*speed+flow*.25)*dt,dy=(r.dy*speed-10)*dt,n=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));
  for(let i=0;i<n;i++){
   const x=r.x+dx/n,y=r.y+dy/n;
   if(blocked(level,x,y)){r.broken=0;break;}
   r.x=x;r.y=y;r.distance+=Math.hypot(dx/n,dy/n);
   if(r.distance>=300||r.age>=1.8){r.broken=0;break;}
  }
 }
 for(let i=rings.length-1;i>=0;i--)if(rings[i].broken>=.36&&rings[i].broken!==null)rings.splice(i,1);
}
export function drawRings(c,art,rings,cam){
 for(const r of rings||[]){
  const broken=r.broken!==null,index=broken?2+r.variant*2+(r.broken>=.16?1:0):r.variant;
  const im=art.images.get(RING_URLS[index]);if(!im)continue;
  const w=broken?64:54,h=w*im.height/im.width;
  c.save();c.translate(r.x-cam.x,r.y-cam.y);c.rotate(Math.atan2(r.dy,r.dx)+Math.PI/2);
  c.globalAlpha=broken?Math.min(1,(.36-r.broken)/.12):.85;c.drawImage(im,-w/2,-h/2,w,h);c.restore();
 }
}
