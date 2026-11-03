import {REEF_MASKS} from './reef-mask-data.js';
export const REEF_URLS=[
 new URL('../assets/terrain/reefs/reef-01.png',import.meta.url).href,
 new URL('../assets/terrain/reefs/reef-02.png',import.meta.url).href,
 new URL('../assets/terrain/reefs/reef-03.png',import.meta.url).href
];
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function reefBlock(x,width,variant,base=1040){
 const mask=REEF_MASKS[variant],height=width*mask.rect[3]/mask.rect[2],bottom=base+32;
 return {kind:'reef',reefVariant:variant,x1:x,x2:x+width,y1:bottom-height,y2:bottom-height,bottom,seabedY:base};
}
export function reefColumns(s){
 const mask=REEF_MASKS[s.reefVariant],dx=(s.x2-s.x1)/mask.width,dy=(s.bottom-s.y1)/mask.height;
 return mask.columns.map((runs,x)=>({left:s.x1+x*dx,right:s.x1+(x+1)*dx,runs:runs.map(([a,b])=>[s.y1+a*dy,s.y1+b*dy])}));
}
function distance(s,x,y){
 const m=REEF_MASKS[s.reefVariant],scale=(s.x2-s.x1)/m.width;
 const px=(x-s.x1)/scale-.5,py=(y-s.y1)/(s.bottom-s.y1)*m.height-.5;
 const gx=clamp(px,0,m.width-1),gy=clamp(py,0,m.height-1),ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
 const at=(a,b)=>m.distance[Math.min(m.height-1,b)*m.width+Math.min(m.width-1,a)]/8;
 const d=(at(ix,iy)*(1-fx)+at(ix+1,iy)*fx)*(1-fy)+(at(ix,iy+1)*(1-fx)+at(ix+1,iy+1)*fx)*fy;
 return (d+Math.hypot(px-gx,py-gy))*scale;
}
export function reefContact(s,x,y,radius=35){
 if(x+radius<s.x1||x-radius>s.x2||y+radius<s.y1||y-radius>s.bottom)return null;
 const d=distance(s,x,y);if(d>=radius)return null;
 const e=Math.max(1,(s.x2-s.x1)/256),gx=distance(s,x+e,y)-distance(s,x-e,y),gy=distance(s,x,y+e)-distance(s,x,y-e),length=Math.hypot(gx,gy);
 if(length<1e-8)return {nx:0,ny:-1,depth:radius-d};
 return {nx:gx/length,ny:gy/length,depth:radius-d};
}
export function collideReefs(p,level,old,impact){
 const reefs=level.solids.filter(s=>s.kind==='reef');if(!reefs.length)return;
 let x=old.x,y=old.y,dx=p.x-old.x,dy=p.y-old.y;
 const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));dx/=count;dy/=count;
 for(let i=0;i<count;i++){
  x+=dx;y+=dy;
  for(let iteration=0;iteration<8;iteration++){
   let found=false;
   for(const [index,s] of reefs.entries()){
    const hit=reefContact(s,x,y);if(!hit)continue;found=true;
    x+=hit.nx*(hit.depth+.05);y+=hit.ny*(hit.depth+.05);
    const normal=p.vx*hit.nx+p.vy*hit.ny;
    if(normal<0){impact(`reef:${index}`, -normal,hit.nx,hit.ny,{kind:'reef'});p.vx-=normal*hit.nx;p.vy-=normal*hit.ny;}
    const remaining=dx*hit.nx+dy*hit.ny;
    if(remaining<0){dx-=remaining*hit.nx;dy-=remaining*hit.ny;}
   }
   if(!found)break;
  }
 }
 // Reef separation must also respect the seabed constraint already resolved
 // by the main solver; a rounded underside cannot push the body below it.
 p.x=clamp(x,17,level.width-17);p.y=Math.min(y,level.bottom-22);
 if(y>p.y)p.vy=Math.min(0,p.vy);
}
export function drawReef(c,art,s,cam){
 const im=art.images.get(REEF_URLS[Number(s.reefVariant.slice(-2))-1]);if(!im)return;
 c.drawImage(im,...REEF_MASKS[s.reefVariant].rect,s.x1-cam.x,s.y1-cam.y,s.x2-s.x1,s.bottom-s.y1);
}
