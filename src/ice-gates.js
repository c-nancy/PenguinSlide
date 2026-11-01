export const WALL_BREAK_URLS=[new URL('../assets/terrain/walls/break-animation/wall-hit.png',import.meta.url).href,new URL('../assets/terrain/walls/break-animation/wall-break.png',import.meta.url).href,new URL('../assets/terrain/walls/break-animation/wall-clear.png',import.meta.url).href];
// Visible content bounds exclude the transparent margins of the three drawings.
const WALL_BREAK_RECTS=[[70,84,1124,1089],[42,15,1186,1224],[34,28,1188,1200]];
export function advanceGates(world,p,input,dt){
 p.pushingIce=false;p.gatePushHold=0;
 for(const gate of world.gateActors){
  gate.hitCooldown=Math.max(0,(gate.hitCooldown||0)-dt);
  if(p.x>gate.x2+100)gate.armed=true;
  if(gate.armed!==false&&gate.hitCooldown===0&&!gate.breaking&&!gate.open&&input.x<0&&p.vx<-180&&p.x>=gate.x2&&p.x-(p.swimSideRadius||17)-12<=gate.x2&&p.y+22>gate.y1&&p.y-22<gate.bottom){
   const speed=Math.abs(p.vx);gate.hits=(gate.hits||0)+1;gate.armed=false;gate.hitCooldown=.8;gate.age=0;
   if(gate.hits===2)gate.breaking=true;
   const damage=Math.min(5,p.health);p.health-=damage;p.invulnerable=1;
   p.weakWallHit={damage,speed,nx:1,ny:0,kind:'weak-wall'};
   p.vx=0;p.vy=0;p.hitStop=.08;p.controlLock=.2;p.pendingKnockback={vx:110,vy:0};
   p.energy=0;p.maxDepth=0;p.boosting=false;p.rechargePending=true;
   if(p.health===0)p.dead=true;
  }
  if(gate.breaking){gate.age+=dt;if(gate.age>=.65){gate.breaking=false;gate.open=true;}}
  if(gate.open)gate.fill=Math.min(1,gate.fill+dt/9);
 }
 world.basinSurfaces=world.source.basins.map(b=>({...b,waterY:b.feed===undefined?b.initial:b.initial-(b.initial-b.target)*world.gateActors[b.feed].fill}));
 world.waterY=world.basinSurfaces.find(b=>p.x>=b.left&&p.x<=b.right)?.waterY??world.source.waterY;
 world.waters=[[world.source.solids[0].x1,world.width]];
 if(p.grounded&&p.y>world.waterY){p.grounded=false;p.wet=true;}
 world.tideDiving=input.y>0;world.tidePreviousY=p.y;
}
export function gateSolid(g){return !g.open&&(!g.breaking||g.age<.36);}
function drawOpeningEdges(c,art,g,cam){
 const line=art.pencilEdgeTexture;if(!line)return;
 for(const y of [g.y1,g.bottom]){
  c.save();c.translate(g.x1-cam.x,y-cam.y);c.rotate(-Math.PI/2);
  c.drawImage(line,0,0,line.width,line.height,-3,0,6,g.x2-g.x1);c.restore();
 }
}
export function drawBreakableWalls(c,art,world,cam){
 for(const g of world.gateActors||[]){
  if(g.open){drawOpeningEdges(c,art,g,cam);continue;}
  const x=g.x1-cam.x,y=g.y1-cam.y,w=g.x2-g.x1,h=g.bottom-g.y1;
  c.save();c.beginPath();c.rect(x,y,w,h);c.clip();
  const index=g.breaking?2:g.hits===1?1:0,im=art.images.get(WALL_BREAK_URLS[index]);
  if(im){
   c.globalAlpha=g.breaking&&g.age>.46?Math.max(0,(.65-g.age)/.19):1;
   c.drawImage(im,...WALL_BREAK_RECTS[index],x,y,w,h);
  }
  c.restore();
  if(!g.breaking&&!g.hits){
   const line=art.pencilEdgeTexture;
   if(line)c.drawImage(line,0,0,line.width,line.height,x-3,y,6,h);
  }
  if(g.breaking&&g.age>=.36)drawOpeningEdges(c,art,g,cam);
 }
}
