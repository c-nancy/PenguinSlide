import {waterCurrentAt} from './currents.js';
import {shapeSweep} from './shape-collision.js';
import {surfaceAt} from './level.js';
export function movingWorld(p,level){
 if(!level.movingIce?.length)return level;
 if(p.iceWorld?.source===level)return p.iceWorld;
 const actors=level.movingIce.map(def=>({...def,vx:0,delta:0,clock:0,active:false,pushOffset:0,pushVX:0,localShape:{...def}}));
 p.iceWorld={...level,source:level,actors,solids:[...level.solids,...actors]};return p.iceWorld;
}
export function riddenIce(p,world){
 return p.grounded&&!p.wet?world.actors?.find(s=>p.x+17>s.x1&&p.x-17<s.x2&&Math.abs(p.y+22-surfaceAt(s,p.x))<5):null;
}
export function advanceIce(world,p,dt){
 const hits=[];
 for(const s of world.actors||[]){
  const old={...s,localShape:s.localShape},start=s.x1,width=s.x2-s.x1;
  s.x1-=s.pushOffset;
  const riding=p.grounded&&!p.wet&&p.x+17>s.x1&&p.x-17<s.x2&&Math.abs(p.y+22-surfaceAt(s,p.x))<5;
  if(s.motion==='slow'){
   s.clock+=dt;s.x1=s.localShape.x1+s.amplitude*Math.sin(s.clock*Math.PI*2/s.period+(s.phase||0));
  }else{
   if(p.x>=(s.trigger??s.localShape.x1-450))s.active=true;
   if(s.active){
    let flow=0;
    for(const fraction of [.25,.5,.75])flow+=waterCurrentAt(world,s.x1+width*fraction,(Math.max(world.waterY,s.y1)+s.bottom)/2)/3;
    const target=Math.min(35+Math.max(0,flow)*.7,Math.max(0,(s.end-s.x1)*.7));
    s.vx+=(target-s.vx)*(1-Math.exp(-dt/((s.end-s.x1)<250?.4:1.2)));s.x1=Math.min(s.end,s.x1+s.vx*dt);
    if(!riding&&p.x>s.end+width+1500){s.x1=s.localShape.x1;s.vx=0;s.active=false;}
   }
  }
  s.pushOffset+=s.pushVX*dt;s.pushVX*=Math.exp(-3*dt);
  const limit=s.motion==='slow'?s.amplitude+20:0;
  const min=s.localShape.x1-limit,max=s.motion==='slow'?s.localShape.x1+limit:s.end;
  const base=s.x1;s.x1=Math.max(min,Math.min(max,base+s.pushOffset));s.pushOffset=s.x1-base;
  s.x2=s.x1+width;s.delta=s.x1-start;s.previousVX=s.lastVX||0;s.vx=s.delta/dt;s.lastVX=s.vx;
  if(!riding&&Math.abs(s.delta)>1e-8&&p.y+22>Math.min(s.y1,s.y2)+4){
   const hit=shapeSweep(old,'x',p.x,p.x-s.delta,p.y,17,22);
   if(hit){p.x=hit.position+s.delta;hits.push({key:'moving:'+s.id,speed:Math.abs(s.vx-p.vx),nx:Math.sign(s.delta),ny:0});}
  }
 }
 return hits;
}
