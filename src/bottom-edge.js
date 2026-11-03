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
 if(s.kind!=='tunnel')return s.bottom;
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
 c.drawImage(im,...edge.rect,s.x1-cam.x,s.bottom-40-cam.y,s.x2-s.x1,32);
}
