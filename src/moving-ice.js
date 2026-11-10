import {waterCurrentAt} from './currents.js';
import {shapeSweep} from './shape-collision.js';
import {surfaceAt} from './level.js';
export function movingWorld(p,level){
 if(!level.movingIce?.length&&!level.thinIce?.length&&!level.tide&&!level.gates)return level;
 if(p.iceWorld?.source===level)return p.iceWorld;
 const actors=(level.movingIce||[]).map(def=>({...def,vx:0,delta:0,clock:0,active:false,pushOffset:0,pushVX:0,localShape:{...def}}));
 const thinActors=(level.thinIce||[]).map(s=>({...s,thin:true,phase:'intact',age:0,restore:0,...(s.motion==='water'?{localShape:{...s}}:{})}));
 const gateActors=(level.gates||[]).map((g,i)=>{
  const saved=level.checkpointGateState&&p.checkpoint?p.checkpointGates?.find(state=>state.id===g.id):null;
  const cleared=p.checkpoint&&i<p.checkpointIndex;
  return {...g,shift:0,open:saved?!!saved.open:!!cleared,fill:saved?saved.fill:cleared?1:0,hits:saved?saved.hits:cleared?2:0};
 });
 const basinSurfaces=level.basins?.map(b=>({...b,waterY:b.initial-(b.feed===undefined?0:(b.initial-b.target)*gateActors[b.feed].fill)}));
 for(const s of [...actors,...thinActors])if(s.motion==='water'){
  const dy=basinSurfaces[s.basin].waterY+s.freeboard-s.y1;s.y1+=dy;s.y2+=dy;s.bottom+=dy;
 }
 const waterY=basinSurfaces?.find(b=>p.x>=b.left&&p.x<=b.right)?.waterY??level.waterY;
 p.iceWorld={...level,waterY,source:level,actors,thinActors,gateActors,basinSurfaces,solids:[...level.solids,...actors,...thinActors,...gateActors]};return p.iceWorld;
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
  if(s.motion==='water'){
   const water=world.basinSurfaces?.[s.basin]?.waterY??world.source.waterY;
   const dy=water+s.freeboard-s.y1;
   s.y1+=dy;s.y2+=dy;s.bottom+=dy;s.deltaY=dy;s.delta=0;s.vx=0;s.vy=dy/dt;
   if(riding)p.y+=dy;
   continue;
  }
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
