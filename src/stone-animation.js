import {STONE_BREAKS} from './stone-animation-data.js';

export function scatteredRock(rock){return frameRock(rock,1);}
function frameRock(rock,index){
  const clip=STONE_BREAKS[rock.sprite];
  if(!clip)return {...rock,type:'low',h:Math.min(24,rock.h*.4),w:rock.w*1.4};
  const f=clip.frames[index],scale=Math.max(rock.h/clip.height,index===1?14/f.h:0);
  return {...rock,type:'low',sprite:f.sprite,x:rock.x+(f.x+f.w/2)*scale,
    y:rock.y+(f.y+f.h)*scale,w:f.w*scale,h:f.h*scale};
}
export function rockAppearance(rock,p){
  if(!p.brokenRocks.includes(rock.id))return rock;
  const age=p.rockDebris.find(e=>e.id===rock.id)?.age??.36;
  return frameRock(rock,age<.12?0:1);
}
