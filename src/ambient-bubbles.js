import {CONFIG} from './physics.js';
import {surfaceAt} from './level.js';
import {hasShape,shapeOverlap} from './shape-collision.js';
import {drawSprite} from './art.js';

const sizes=[{name:'small',radius:10},{name:'medium',radius:16},{name:'large',radius:23}];
function randomFor(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
function hash(text){let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;}
function clearOfIce(level,x,y,r){
 const box={left:x-r-5,right:x+r+5,top:y-r-5,bottom:y+r+5};
 return !(level.solids||[]).some(s=>{
  if(hasShape(s))return shapeOverlap(s,box);
  if(box.right<=s.x1||box.left>=s.x2||box.top>=s.bottom)return false;
  const a=Math.max(s.x1,box.left),b=Math.min(s.x2,box.right);
  return box.bottom>Math.min(surfaceAt(s,a),surfaceAt(s,b));
 });
}
export function createAmbientBubbles(level){
 const rand=randomFor(hash(String(level.id??'level'))),result=[];
 for(const [left,right] of level.waters||[]){
  const waterHeight=level.bottom-level.waterY;if(right-left<100||waterHeight<100)continue;
  for(let x=left+65;x<right-35;x+=220){
   for(let attempt=0;attempt<5;attempt++){
    const spec=sizes[Math.floor(rand()*sizes.length)],bx=Math.min(right-spec.radius-8,x+rand()*90),by=level.waterY+60+rand()*Math.max(1,waterHeight-120);
    if(bx-spec.radius<left||by+spec.radius>level.bottom-12||!clearOfIce(level,bx,by,spec.radius))continue;
    result.push({x:bx,y:by,radius:spec.radius,size:spec.name,phase:'idle'});break;
   }
  }
 }
 return result;
}
export function bubblePosition(b,time){
 if(b.phase!=='idle')return {x:b.burstX??b.x,y:b.burstY??b.y};
 const phase=b.x*.031+b.y*.017;
 return {x:b.x+Math.sin(time*.65+phase)*3,y:b.y+Math.sin(time*.9+phase*1.7)*3};
}
function segmentDistanceSquared(a,b,p){
 const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;
 return (a.x+t*dx-p.x)**2+(a.y+t*dy-p.y)**2;
}
export function updateAmbientBubbles(bubbles,player,previous,time){
 for(const bubble of bubbles){
  if(bubble.phase==='burst'){if(time-bubble.born>=.34)bubble.phase='gone';continue;}
  if(bubble.phase!=='idle'||!player.wet)continue;
  const position=bubblePosition(bubble,time);
  if(segmentDistanceSquared(previous,player,position)<=(bubble.radius+CONFIG.radius)**2){bubble.burstX=position.x;bubble.burstY=position.y;bubble.phase='burst';bubble.born=time;}
 }
}
export function bubbleSprite(b,time){
 if(b.phase==='idle')return `bubble-${b.size}`;
 if(b.phase!=='burst')return null;
 return `bubble-${b.size}-${time-b.born<.13?'pop':'scatter'}`;
}
export function drawAmbientBubbles(c,art,bubbles,cam,time){
 for(const b of bubbles||[]){
  const id=bubbleSprite(b,time);if(!id||b.x+b.radius*2<cam.x||b.x-b.radius*2>cam.x+1280||b.y+b.radius*2<cam.y||b.y-b.radius*2>cam.y+720)continue;
  const sprite=art.sprites.get(id);if(!sprite)continue;
  const burst=b.phase==='burst',width=b.radius*(burst?3.0:2),height=width*sprite.rect.h/sprite.rect.w;
  c.save();if(burst)c.globalAlpha=Math.min(1,Math.max(0,(.34-(time-b.born))/.10));
  const position=bubblePosition(b,time);
  drawSprite(c,art,id,position.x-cam.x-width/2,position.y-cam.y-height/2,width,height);c.restore();
 }
}
