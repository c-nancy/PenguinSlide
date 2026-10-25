import {SNOW_CAP} from './snow-cap.js';

export function snowCapEnds(s,solids){
  const connects=side=>solids.some(other=>other!==s&&
    Math.abs((side==='left'?other.x2:other.x1)-(side==='left'?s.x1:s.x2))<.01&&
    Math.abs((side==='left'?other.y2:other.y1)-(side==='left'?s.y1:s.y2))<1);
  return {left:!connects('left'),right:!connects('right')};
}

const caches=new WeakMap();
// Assemble once per platform. Complementary premultiplied-alpha weights let
// the rounded endpoint replace the cut-off tile without filling transparent air.
export function snowCapStrip(art,s,solids){
  if(!art.snowEndCap)return null;
  let cache=caches.get(art);if(!cache){cache=new Map();caches.set(art,cache);}
  const ends=snowCapEnds(s,solids),width=s.x2-s.x1,phase=((s.x1%320)+320)%320;
  const key=[width,phase,ends.left,ends.right].join(':');if(cache.has(key))return cache.get(key);
  const scale=2,padding=12,endWidth=48,overlap=16,height=64,y=-12,total=width+padding*2;
  const make=(w,h)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*scale);c.height=Math.ceil(h*scale);return c;};
  const canvas=make(total,height),c=canvas.getContext('2d'),tile=art.snowCapTexture;
  c.scale(scale,scale);c.save();c.beginPath();c.rect(padding,0,width,height);c.clip();
  for(let x=-phase;x<width;x+=SNOW_CAP.width)
    c.drawImage(tile,padding+x,SNOW_CAP.y-y,SNOW_CAP.width+.5,SNOW_CAP.height);
  c.restore();
  const mask=make(total,height),m=mask.getContext('2d');m.scale(scale,scale);m.fillStyle='#fff';m.fillRect(0,0,total,height);
  if(ends.left){
    m.clearRect(0,0,endWidth,height);
    const g=m.createLinearGradient(endWidth-overlap,0,endWidth,0);g.addColorStop(0,'#fff0');g.addColorStop(1,'#fff');
    m.fillStyle=g;m.fillRect(endWidth-overlap,0,overlap,height);
  }
  if(ends.right){
    const x=total-endWidth;m.clearRect(x,0,endWidth,height);
    const g=m.createLinearGradient(x,0,x+overlap,0);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');
    m.fillStyle=g;m.fillRect(x,0,overlap,height);
  }
  c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0,total,height);
  const patch=make(endWidth,height),p=patch.getContext('2d'),{image,rect}=art.snowEndCap;
  p.scale(scale,scale);
  const endY=SNOW_CAP.y+(rect.y-408)*SNOW_CAP.height/288;
  p.drawImage(image,rect.x,rect.y,rect.w,rect.h,0,endY-y,endWidth,rect.h*SNOW_CAP.height/288);
  const g=p.createLinearGradient(0,0,endWidth,0);g.addColorStop(0,'#fff');g.addColorStop((endWidth-overlap)/endWidth,'#fff');g.addColorStop(1,'#fff0');
  p.globalCompositeOperation='destination-in';p.fillStyle=g;p.fillRect(0,0,endWidth,height);
  c.globalCompositeOperation='lighter';
  if(ends.left)c.drawImage(patch,0,0,endWidth,height);
  if(ends.right){c.save();c.translate(total,0);c.scale(-1,1);c.drawImage(patch,0,0,endWidth,height);c.restore();}
  const strip={canvas,x:-padding,y,width:total,height,ends};cache.set(key,strip);return strip;
}
