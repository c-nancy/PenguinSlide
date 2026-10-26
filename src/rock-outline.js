import {ROCK_MASKS} from './rock-mask-data.js';

export const ROCK_SINK=7;
export function rockBounds(rock){
  return {left:rock.x-rock.w/2,right:rock.x+rock.w/2,top:rock.y-rock.h+ROCK_SINK,bottom:rock.y+ROCK_SINK};
}
function maskFor(rock){return rock.mask||ROCK_MASKS[rock.sprite];}
function visitPixels(rock,box,visit){
  const bounds=rockBounds(rock),mask=maskFor(rock);
  if(box.right<=bounds.left||box.left>=bounds.right||box.bottom<=bounds.top||box.top>=bounds.bottom)return false;
  if(!mask)return visit(bounds.left,bounds.right,bounds.top,bounds.bottom);
  const sx=rock.w/mask.width,sy=rock.h/mask.height;
  const start=Math.max(0,Math.floor((box.left-bounds.left)/sx)),end=Math.min(mask.width,Math.ceil((box.right-bounds.left)/sx));
  for(let x=start;x<end;x++)for(const [a,b] of mask.columns[x]){
    const top=bounds.top+a*sy,bottom=bounds.top+b*sy;
    if(box.bottom>top&&box.top<bottom&&visit(bounds.left+x*sx,bounds.left+(x+1)*sx,top,bottom))return true;
  }
  return false;
}
export function rockOverlap(rock,box){return visitPixels(rock,box,()=>true);}

// Sweep the penguin box against the original alpha runs, including diagonal
// movement. Transparent pixels never become a filled bounding rectangle.
export function rockSweep(rock,from,to,radius=17,halfHeight=22){
  const dx=to.x-from.x,dy=to.y-from.y;
  const box={left:Math.min(from.x,to.x)-radius,right:Math.max(from.x,to.x)+radius,
    top:Math.min(from.y,to.y)-halfHeight,bottom:Math.max(from.y,to.y)+halfHeight};
  let first=Infinity;
  visitPixels(rock,box,(left,right,top,bottom)=>{
    const x1=left-radius,x2=right+radius,y1=top-halfHeight,y2=bottom+halfHeight;
    let entry=0,exit=1;
    if(dx){const a=(x1-from.x)/dx,b=(x2-from.x)/dx;entry=Math.max(entry,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));}
    else if(from.x<=x1||from.x>=x2)return false;
    if(dy){const a=(y1-from.y)/dy,b=(y2-from.y)/dy;entry=Math.max(entry,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));}
    else if(from.y<=y1||from.y>=y2)return false;
    if(entry<exit&&entry<first)first=entry;
    return false;
  });
  return Number.isFinite(first)?first:null;
}
