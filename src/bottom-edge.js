import {ICE_CORNERS} from './ice-corner-data.js';
export const CORNER_URLS=[
 new URL('../assets/terrain/walls/curved-edges/corner-01.png',import.meta.url).href,
 new URL('../assets/terrain/walls/curved-edges/corner-02.png',import.meta.url).href,
 new URL('../assets/terrain/walls/curved-edges/corner-03.png',import.meta.url).href
];
const sample=(p,t)=>{const u=Math.max(0,Math.min(256,t*256)),i=Math.min(255,Math.floor(u));return p[i]+(p[i+1]-p[i])*(u-i);};
function cornerFor(s){const i=Math.abs(Math.floor(s.x1/100))%3;return {...ICE_CORNERS[i+1],url:CORNER_URLS[i],width:Math.min(220,(s.x2-s.x1)*.26),height:90};}
import {BOTTOM_EDGES} from './bottom-edge-data.js';
export const BOTTOM_EDGE_URLS=[
 new URL('../assets/terrain/walls/curved-edges/curve-01.png',import.meta.url).href,
 new URL('../assets/terrain/walls/curved-edges/angular-edge-01.png',import.meta.url).href,
 new URL('../assets/terrain/walls/curved-edges/curve-02.png',import.meta.url).href,
 new URL('../assets/terrain/walls/curved-edges/angular-edge-02.png',import.meta.url).href,
 new URL('../assets/terrain/walls/curved-edges/curve-03.png',import.meta.url).href,
 new URL('../assets/terrain/walls/curved-edges/angular-edge-03.png',import.meta.url).href
];
export function bottomEdge(s){
 const index=Math.abs(Math.floor(s.x1/100))%BOTTOM_EDGE_URLS.length;
 const url=BOTTOM_EDGE_URLS[index],id=url.split('/').at(-1).slice(0,-4);
 return {...BOTTOM_EDGES[id],url};
}
export function iceBottomAt(s,x){
 if(s.roughBottom){
  const left=s.roughBottom.start??s.x1;if(x<=left)return s.bottom;
  const t=Math.max(0,Math.min(1,(x-left)/(s.x2-left))),p=bottomEdge(s).profile;
  return s.bottom+s.roughBottom.height*(sample(p,t)-(p[0]*(1-t)+p[256]*t));
 }
 if(s.kind!=='tunnel')return s.bottom;
 if(s.caveRoof){
  const corner=cornerFor(s),base=s.bottom-20,dist=Math.min(x-s.x1,s.x2-x);
  if(dist<corner.width)return base-corner.height*sample(corner.profile,1-dist/corner.width);
  const p=bottomEdge(s).profile,t=(x-s.x1-corner.width)/(s.x2-s.x1-2*corner.width);
  return base+32*(sample(p,t)-(p[0]*(1-t)+p[256]*t));
 }
 const {profile}=bottomEdge(s),u=Math.max(0,Math.min(256,(x-s.x1)/(s.x2-s.x1)*256)),i=Math.min(255,Math.floor(u)),f=u-i;
 return s.bottom-40+32*(profile[i]*(1-f)+profile[i+1]*f);
}
export function clipIceBottom(c,s,cam){
 c.beginPath();c.moveTo(s.x1-cam.x,s.y1-cam.y);c.lineTo(s.x2-cam.x,s.y2-cam.y);
 for(let i=256;i>=0;i--){const x=s.x1+(s.x2-s.x1)*i/256;c.lineTo(x-cam.x,iceBottomAt(s,x)-cam.y);}
 c.closePath();c.clip();
}
export function drawIceBottom(c,art,s,cam){
 const edge=bottomEdge(s),im=art.images.get(edge.url);if(!im)return;
 if(s.roughBottom){
  const left=s.roughBottom.start??s.x1,width=s.x2-left,height=s.roughBottom.height;
  const [rx,ry,rw,rh]=edge.rect,p=edge.profile;
  for(let x=0;x<width;x+=4){
   const w=Math.min(4,width-x),t=(x+w/2)/width,y=s.bottom-height*(p[0]*(1-t)+p[256]*t)-cam.y;
   c.drawImage(im,rx+x/width*rw,ry,w/width*rw,rh,left+x-cam.x,y,w+.3,height);
  }
  return;
 }
 if(s.caveRoof){
  const corner=cornerFor(s),image=art.images.get(corner.url),base=s.bottom-20-cam.y;
  if(image)for(const side of [-1,1]){
   c.save();c.translate((side<0?s.x1+corner.width:s.x2-corner.width)-cam.x,base);c.scale(side,-1);
   c.drawImage(image,...corner.rect,0,0,corner.width,corner.height);c.restore();
  }
  const width=s.x2-s.x1-2*corner.width,[rx,ry,rw,rh]=edge.rect,p=edge.profile;
  for(let x=0;x<width;x+=4){const w=Math.min(4,width-x),t=(x+w/2)/width;
   const y=s.bottom-20-32*(p[0]*(1-t)+p[256]*t)-cam.y;
   c.drawImage(im,rx+x/width*rw,ry,w/width*rw,rh,s.x1+corner.width+x-cam.x,y,w+.3,32);
  }
  return;
 }
 c.drawImage(im,...edge.rect,s.x1-cam.x,s.bottom-40-cam.y,s.x2-s.x1,32);
}

export function drawCaveRoof(c,art,s,cam){
 if(!art.wallTexture)return false;
 // Fill first without the modular slab's inset outline. The side strokes and
 // corner artwork now share the exact same world-space wall boundary.
 c.save();clipIceBottom(c,s,cam);
 const left=Math.max(s.x1,cam.x),right=Math.min(s.x2,cam.x+1280);
 const top=Math.max(s.y1,cam.y),bottom=Math.min(s.bottom,cam.y+720);
 for(let x=s.x1+Math.floor((left-s.x1)/320)*320;x<right;x+=320)
  for(let y=s.y1+Math.floor((top-s.y1)/320)*320;y<bottom;y+=320)
   c.drawImage(art.wallTexture,x-cam.x,y-cam.y,320.5,320.5);
 c.restore();
 const corner=cornerFor(s),join=s.bottom-20-corner.height,line=art.pencilEdgeTexture;
 if(line)for(const x of [s.x1,s.x2]){
  c.save();c.beginPath();c.rect(x-cam.x-3,s.y1-cam.y,6,join-s.y1);c.clip();
  for(let y=s.y1+Math.floor((Math.max(s.y1,cam.y)-s.y1)/320)*320;y<Math.min(join,cam.y+720);y+=320)
   c.drawImage(line,x-cam.x-3,y-cam.y,6,320.5);
  c.restore();
 }
 drawIceBottom(c,art,s,cam);return true;
}
