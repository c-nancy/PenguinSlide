import { surfaceAt } from './level.js';
import { HEALTH, healthState, resolveImpacts, landingAngle } from './health.js';
import {hasShape,shapeOverlap,shapeSweep} from './shape-collision.js';

// Distances are world pixels; velocities are pixels/second. Mass is normalized to 1.
export const CONFIG = Object.freeze({
  radius:17, halfHeight:22, gravity:1000, jump:300,
  groundThrust:220, groundBrakeThrust:420, iceFriction:.018, iceLinearDrag:.025, iceQuadraticDrag:.00075,
  standingFriction:.6,standingSpeed:18,
  airControl:100, swimThrust:650, swimHorizontalThrust:4400, buoyancy:75,
  waterLinearDrag:.45, waterQuadraticDrag:.0024,
  maxDepth:500, energyPerDepth:2500, boostAcceleration:2500
});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const chargeForDepth = depth => clamp(depth/CONFIG.maxDepth,0,1);
export const remainingCharge = p => clamp(p.energy/(CONFIG.maxDepth*CONFIG.energyPerDepth),0,1);
export function createPlayer(x=150,y=238) {
  return {x,y,vx:0,vy:0,wet:false,grounded:false,maxDepth:0,energy:0,boosting:false,
    facing:1,event:null,checkpoint:false,checkpointIndex:-1,levelId:null,finished:false,lastCharge:0,...healthState()};
}
export function checkpointsFor(level){return level.checkpoints|| (level.checkpoint?[level.checkpoint]:[]);}
export function resetPlayer(p,level,fromStart=false) {
  const index=p.checkpointIndex>=0?p.checkpointIndex:0;
  const checkpoint=checkpointsFor(level)[index];
  const saved=!!(!fromStart&&p.checkpoint&&checkpoint&&(!p.levelId||!level.id||p.levelId===level.id));
  const at=saved?checkpoint:level.start;
  Object.assign(p,createPlayer(at.x,at.y),{checkpoint:saved,checkpointIndex:saved?index:-1,levelId:level.id||null});
}
function waterColumn(p,level) {
  return level.waters.some(([a,b])=>p.x>=a&&p.x<=b) &&
    !level.solids.some(s=>hasShape(s)?shapeOverlap(s,{left:p.x-.1,right:p.x+.1,top:p.y-.1,bottom:p.y+.1}):p.x>s.x1&&p.x<s.x2&&p.y>surfaceAt(s,p.x)&&p.y<s.bottom);
}
function recordDepth(p,level) {
  const depth=clamp(p.y-level.waterY,0,CONFIG.maxDepth);
  if(depth>p.maxDepth){p.energy+=(depth-p.maxDepth)*CONFIG.energyPerDepth;p.maxDepth=depth;}
}
function tangent(s) {
  const slope=(s.y2-s.y1)/(s.x2-s.x1),length=Math.hypot(1,slope);
  return {x:1/length,y:slope/length};
}
function supportFor(p,level) {
  return level.solids.find(s=>p.x>=s.x1&&p.x<=s.x2&&Math.abs(p.y+CONFIG.halfHeight-surfaceAt(s,p.x))<5);
}
function exposedSideTop(s,left,level){
  const x=left?s.x1:s.x2,y=left?s.y1:s.y2;
  let top=y;
  // Equal-height neighbours cover this internal face. If one block ends sooner,
  // the lower part of the longer block remains an exposed, collidable wall.
  for(const neighbour of level.solids){
    if(neighbour===s)continue;
    if(Math.abs((left?neighbour.x2:neighbour.x1)-x)<1e-6&&Math.abs((left?neighbour.y2:neighbour.y1)-y)<1e-6)top=Math.max(top,neighbour.bottom);
  }
  return top>=s.bottom?Infinity:top;
}
function touchingSurfaces(p,level){
  const keys=[],r=CONFIG.radius,h=CONFIG.halfHeight,e=.5;
  if(p.x<=r+e)keys.push('edge:left');
  if(p.x>=level.width-r-e)keys.push('edge:right');
  if(p.y+h>=level.bottom-e)keys.push('floor');
  for(const [index,s] of level.solids.entries()){
    if(hasShape(s)){
      const near=(dx,dy)=>shapeOverlap(s,{left:p.x+dx-r,right:p.x+dx+r,top:p.y+dy-h,bottom:p.y+dy+h});
      if(near(e,0))keys.push(`solid:${index}:left`);
      if(near(-e,0))keys.push(`solid:${index}:right`);
      if(near(0,e))keys.push(`solid:${index}:top`);
      if(near(0,-e))keys.push(`solid:${index}:bottom`);
      continue;
    }
    if(p.y-h<s.bottom&&Math.abs(p.x+r-s.x1)<e&&p.y+h>exposedSideTop(s,true,level)+4)keys.push(`solid:${index}:left`);
    if(p.y-h<s.bottom&&Math.abs(p.x-r-s.x2)<e&&p.y+h>exposedSideTop(s,false,level)+4)keys.push(`solid:${index}:right`);
    if(p.x+r<=s.x1||p.x-r>=s.x2)continue;
    if(Math.abs(p.y+h-surfaceAt(s,p.x))<e)keys.push(`solid:${index}:top`);
    if(Math.abs(p.y-h-s.bottom)<e)keys.push(`solid:${index}:bottom`);
  }
  return keys;
}
function moveOnIce(p,s,ix,dt) {
  const t=tangent(s);
  let speed=p.vx*t.x+p.vy*t.y;
  const normalForce=CONFIG.gravity*t.x,downhillForce=CONFIG.gravity*t.y;
  // Standing feet grip more strongly than a sliding belly. Hold small residual
  // motion only when idle and gravity stays within the static-friction limit.
  if(ix===0&&Math.abs(speed)<CONFIG.standingSpeed&&Math.abs(downhillForce)<=CONFIG.standingFriction*normalForce){
    p.vx=0;p.vy=0;return;
  }
  const drive=ix*speed<0?CONFIG.groundBrakeThrust:CONFIG.groundThrust;
  const force=ix*drive*t.x+CONFIG.gravity*t.y;
  speed=(speed+force*dt)/(1+(CONFIG.iceLinearDrag+CONFIG.iceQuadraticDrag*Math.abs(speed))*dt);
  const friction=CONFIG.iceFriction*CONFIG.gravity*t.x*dt;
  speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-friction);
  p.vx=speed*t.x;p.vy=speed*t.y;
}
function moveFreely(p,ix,iy,immersion,depth,dt) {
  const inputLength=Math.hypot(ix,iy)||1;
  const thrustX=ix/inputLength*CONFIG.swimHorizontalThrust;
  const thrustY=iy/inputLength*CONFIG.swimThrust;
  p.vx+=(ix*CONFIG.airControl*(1-immersion)+thrustX*immersion)*dt;
  p.vy+=(CONFIG.gravity*(1-immersion)+(thrustY-CONFIG.buoyancy)*immersion)*dt;
  const drag=(CONFIG.waterLinearDrag+CONFIG.waterQuadraticDrag*Math.hypot(p.vx,p.vy))*immersion;
  p.vx/=1+drag*dt;p.vy/=1+drag*dt;

  // Releasing the ascent key leaves only momentum, water resistance and buoyancy.
  p.boosting=p.wet&&iy<0&&p.energy>0;
  if(p.wet&&p.boosting&&p.vy<0&&p.energy>0&&depth<=CONFIG.maxDepth){
    // E = a * distance, including the acceleration contribution to distance.
    const upwardSpeed=-p.vy;
    const affordable=(Math.sqrt(upwardSpeed*upwardSpeed+2*p.energy)-upwardSpeed)/dt;
    const acceleration=Math.min(CONFIG.boostAcceleration*immersion,affordable);
    const work=acceleration*(upwardSpeed*dt+.5*acceleration*dt*dt);
    p.energy=Math.max(0,p.energy-work);p.vy-=acceleration*dt;
  }
}
export function step(p,input,level,dt) {
  p.event=null;p.hit=null;p.reaction=null;
  if(!p.levelId&&level.id)p.levelId=level.id;
  if(p.finished||p.dead)return;
  p.invulnerable=Math.max(0,p.invulnerable-dt);
  if(p.hitStop>0){p.hitStop=Math.max(0,p.hitStop-dt);return;}
  if(p.pendingKnockback){
    p.vx=p.pendingKnockback.vx;p.vy=p.pendingKnockback.vy;p.pendingKnockback=null;
  }
  const recovering=p.controlLock>0;
  p.controlLock=Math.max(0,p.controlLock-dt);
  const impacts=[];
  const impact=(key,speed,nx,ny,details={})=>impacts.push({key,speed,nx,ny,...details});
  const ix=recovering?0:clamp(input.x||0,-1,1),iy=recovering?0:clamp(input.y||0,-1,1);
  const jump=!recovering&&!!input.jump;
  const oldX=p.x,oldY=p.y,wasGrounded=p.grounded,wasWet=p.wet;
  if(ix)p.facing=ix;
  if(wasWet)recordDepth(p,level);
  const support=wasGrounded?supportFor(p,level):null;
  const groundMotion=!!support&&!jump&&!wasWet;
  if(groundMotion)moveOnIce(p,support,ix,dt);
  else {
    if(support&&jump&&!wasWet){
      const t=tangent(support);p.vx+=CONFIG.jump*t.y;p.vy-=CONFIG.jump*t.x;p.event='jump';
    }
    const immersion=waterColumn(p,level)?clamp((p.y+CONFIG.halfHeight-level.waterY)/(2*CONFIG.halfHeight),0,1):0;
    moveFreely(p,ix,iy,immersion,p.y-level.waterY,dt);
  }

  const incoming={vx:p.vx,vy:p.vy};
  p.x+=p.vx*dt;
  const bounded=clamp(p.x,CONFIG.radius,level.width-CONFIG.radius);
  if(bounded!==p.x){impact(p.vx>0?'edge:right':'edge:left',Math.abs(p.vx),p.vx>0?-1:1,0);p.vx=0;}p.x=bounded;
  for(const [index,s] of level.solids.entries()){
    if(hasShape(s)){
      if((wasGrounded&&support===s)||(p.vy<0&&p.y+CONFIG.halfHeight<=surfaceAt(s,p.x)+5))continue;
      const hit=shapeSweep(s,'x',oldX,p.x,p.y,CONFIG.radius,CONFIG.halfHeight);
      if(hit){const right=p.x>oldX;impact(`solid:${index}:${right?'left':'right'}`,Math.abs(p.vx),right?-1:1,0);p.x=hit.position;p.vx=0;}
      continue;
    }
    const left=s.x1-CONFIG.radius,right=s.x2+CONFIG.radius;
    if(p.y-CONFIG.halfHeight>=s.bottom-2)continue;
    if(oldX<=left&&p.x>left&&p.y+CONFIG.halfHeight>exposedSideTop(s,true,level)+4){impact(`solid:${index}:left`,Math.max(0,p.vx),-1,0);p.x=left;p.vx=0;}
    if(oldX>=right&&p.x<right&&p.y+CONFIG.halfHeight>exposedSideTop(s,false,level)+4){impact(`solid:${index}:right`,Math.max(0,-p.vx),1,0);p.x=right;p.vx=0;}
  }
  p.y+=p.vy*dt;p.grounded=false;
  for(const [index,s] of level.solids.entries()){
    if(p.x+CONFIG.radius<=s.x1||p.x-CONFIG.radius>=s.x2)continue;
    const top=surfaceAt(s,p.x),t=tangent(s);
    const follow=groundMotion&&oldX>=s.x1&&oldX<=s.x2&&p.x>=s.x1&&p.x<=s.x2&&Math.abs(oldY+CONFIG.halfHeight-surfaceAt(s,oldX))<5;
    const entering=p.vy*t.x-p.vx*t.y>=0;
    const paintedTop=!hasShape(s)||shapeOverlap(s,{left:p.x-CONFIG.radius,right:p.x+CONFIG.radius,top:top-1,bottom:top+3});
    if(paintedTop&&(follow||(entering&&oldY+CONFIG.halfHeight<=top+5&&p.y+CONFIG.halfHeight>=top))){
      impact(`solid:${index}:top`,Math.max(0,incoming.vy*t.x-incoming.vx*t.y),t.y,-t.x,
        {kind:'landing',angle:landingAngle(incoming.vx,incoming.vy,t.x,t.y)});
      p.y=top-CONFIG.halfHeight;
      const speed=p.vx*t.x+p.vy*t.y;p.vx=speed*t.x;p.vy=speed*t.y;p.grounded=true;
    }else if(hasShape(s)){
      // Ground support uses the foot centre. On takeoff an uphill box corner can
      // still touch the painted ice; do not treat that departing contact as a ceiling.
      if(incoming.vy<0&&oldY+CONFIG.halfHeight<=surfaceAt(s,oldX)+5)continue;
      const hit=shapeSweep(s,'y',oldY,p.y,p.x,CONFIG.radius,CONFIG.halfHeight);
      if(hit){
        const down=p.y>oldY;
        impact(`solid:${index}:${down?'top':'bottom'}`,Math.abs(p.vy),0,down?-1:1,down?{kind:'landing',angle:landingAngle(incoming.vx,incoming.vy)}:{});
        p.y=hit.position;p.vy=0;p.grounded=down;
      }
    }else if(p.vy<0&&oldY-CONFIG.halfHeight>=s.bottom-2&&p.y-CONFIG.halfHeight<s.bottom){
      impact(`solid:${index}:bottom`,-p.vy,0,1);
      p.y=s.bottom+CONFIG.halfHeight;p.vy=0;
    }
  }
  if(p.y+CONFIG.halfHeight>level.bottom){impact('floor',Math.max(0,incoming.vy),0,-1,{kind:'landing',angle:landingAngle(incoming.vx,incoming.vy)});p.y=level.bottom-CONFIG.halfHeight;p.vy=Math.min(0,p.vy);}
  p.wet=p.y>level.waterY&&waterColumn(p,level);
  if(p.wet&&!wasWet){p.maxDepth=0;p.energy=0;p.boosting=false;p.event='splash';}
  if(p.wet)recordDepth(p,level);
  if(wasWet&&!p.wet){
    if(oldY>level.waterY&&p.y<=level.waterY&&p.vy<0){p.lastCharge=chargeForDepth(p.maxDepth);p.event='breach';}
    // The waterline changes forces and visuals, never velocity.
    p.maxDepth=0;p.energy=0;p.boosting=false;
  }
  if(wasWet&&incoming.vy<0&&impacts.some(hit=>hit.kind!=='landing'&&hit.speed>0)){
    // Even harmless/protected ascent impacts spend the reserve. Keep the deepest
    // depth recorded so holding ascent or revisiting it cannot refill that energy.
    p.energy=0;p.boosting=false;p.lastCharge=0;
  }
  resolveImpacts(p,impacts,[...touchingSurfaces(p,level),...impacts.map(hit=>hit.key)]);
  if(p.dead)return;
  for(const [index,checkpoint] of checkpointsFor(level).entries()){
    const previous=p.checkpointIndex>=0?p.checkpointIndex:p.checkpoint?0:-1;
    // Passing above the nest counts too; travelling below it or underwater does not.
    if(index>previous&&!p.wet&&p.y<checkpoint.y+12&&p.x>checkpoint.x-100&&p.x<checkpoint.x+120){
      p.checkpoint=true;p.checkpointIndex=index;p.health=HEALTH.max;p.event='checkpoint';
    }
  }
  if(p.x>level.goalX&&p.grounded){p.finished=true;p.event='finish';}
}

// Unobstructed vertical ascent with the same forces; steering and obstacles change the result.
export function predictJumpHeight(p,level) {
  if(!p.wet)return Math.max(0,-p.vy)**2/(2*CONFIG.gravity);
  const ghost={...p};
  const open={waterY:level.waterY,bottom:level.bottom,width:1e9,waters:[[-1e9,1e9]],solids:[],goalX:Infinity};
  let breached=false,top=Infinity;
  for(let i=0;i<1200;i++){
    step(ghost,{y:-1},open,1/120);
    if(ghost.event==='breach')breached=true;
    if(breached){top=Math.min(top,ghost.y);if(ghost.vy>=0)return Math.max(0,level.waterY-top);}
  }
  return 0;
}
