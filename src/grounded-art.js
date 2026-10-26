import {surfaceAt} from './level.js';
import {drawSprite} from './art.js';
import {ROCK_SINK} from './rock-outline.js';

export function groundedPlacement(level,x,y,width,height,pivot=.5,footY=1){
  const candidates=(level.solids||[]).filter(s=>x>=s.x1&&x<=s.x2)
    .map(s=>({surface:s,y:surfaceAt(s,x)})).sort((a,b)=>Math.abs(a.y-y)-Math.abs(b.y-y));
  const support=candidates[0],grounded=!!support&&Math.abs(support.y-y)<=64;
  return {x,y:grounded?support.y:y,slope:grounded?(support.surface.y2-support.surface.y1)/(support.surface.x2-support.surface.x1):0,
    grounded,drawX:-pivot*width,drawY:-footY*height};
}

export function drawGroundedSprite(c,art,id,level,cam,x,y,width,height,pivot=.5,mirror=false){
  if(id==='cairn'||id==='rocks'){
    const variants=['stones-original-cairn','stones-original-rocks','stones-low','stones-staggered','stones-twin'];
    const selected=variants[Math.abs(Math.round(x*13+y*7))%variants.length];
    const stone=art.sprites.get(selected);
    if(stone){id=selected;height=width*stone.rect.h/stone.rect.w;}
  }
  const sprite=art.sprites.get(id);if(!sprite)return null;
  const placement=groundedPlacement(level,x,y,width,height,pivot,sprite.groundFootY??1);
  if(id.startsWith('stones-'))placement.drawY+=ROCK_SINK;
  if(id==='finish-flag')placement.drawY+=4;
  // Nest stones sit slightly within the snow instead of balancing on its edge.
  if(id==='checkpoint')placement.drawY+=height*.3+4;
  if(['signpost','lighthouse','home-lighthouse'].includes(id))placement.drawY+=6;
  if(id==='checkpoint-family-standing'||id==='checkpoint-family-greeting')placement.drawY+=6;
  // Prints lie across the snow's upper face, below the platform's top edge.
  if(id==='footprints')placement.drawY+=height*1.05;
  c.save();c.translate(x-cam.x,placement.y-cam.y);
  // Vertical shear seats the full foundation on a slope while keeping towers
  // and posts upright. The painted foot, not transparent padding, touches ice.
  c.transform(1,placement.slope,0,1,0,0);
  if(mirror)c.scale(-1,1);
  drawSprite(c,art,id,mirror?-(1-pivot)*width:placement.drawX,placement.drawY,width,height);c.restore();
  return placement;
}
