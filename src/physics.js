import {advanceThin,touchThin} from './thin-ice.js';
import {movingWorld,riddenIce,advanceIce} from './moving-ice.js';
import { surfaceAt } from './level.js';
import { HEALTH, healthState, resolveImpacts, landingAngle } from './health.js';
import {hasShape,shapeOverlap,shapeSweep} from './shape-collision.js';
import {collideRocks,isSliding,applyRockFeedback} from './rocks.js';
import {waterCurrentAt} from './currents.js';

// Distances are world pixels; velocities are pixels/second. Mass is normalized to 1.
export const CONFIG = Object.freeze({
  radius:17, halfHeight:22, gravity:1000, jump:300,
  groundThrust:220, groundBrakeThrust:420, slideRampTime:1, slideDriveGain:.12, iceFriction:.018, iceLinearDrag:.025, iceQuadraticDrag:.00075,
  standingFriction:.6,standingSpeed:18,
  airControl:100, swimThrust:650, swimHorizontalThrust:4400, swimStartThrust:1000, swimCruiseSpeed:1200, buoyancy:75,
  waterLinearDrag:.45, waterQuadraticDrag:.0024,
  airLinearDrag:.5, airQuadraticDrag:.0025,
  maxDepth:500, energyPerDepth:2500, boostAcceleration:2500
});
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const chargeForDepth = depth => clamp(depth/CONFIG.maxDepth,0,1);
const depthForce=depth=>.4+chargeForDepth(depth);
const storedWork=depth=>depth*CONFIG.energyPerDepth*depthForce(depth);
export const remainingCharge = p => clamp(p.energy/storedWork(CONFIG.maxDepth),0,1);
export function createPlayer(x=150,y=238) {
  return {iceWorld:null,platformVX:0,x,y,vx:0,vy:0,wet:false,grounded:false,maxDepth:0,energy:0,boosting:false,
    facing:1,event:null,waterSoundEvent:null,waterEntrySounded:false,waterExitSounded:false,checkpoint:false,checkpointIndex:-1,levelId:null,finished:false,lastCharge:0,surfaceJumped:false,
    forceSlide:0,sliding:false,slideDriveTime:0,slideDriveDirection:0,brokenRocks:[],rockContacts:[],rockDebris:[],rockPasses:[],rockBounce:false,rockTrip:false,chargeFloor:0,rechargePending:false,...healthState()};
}
export function checkpointsFor(level){return level.checkpoints|| (level.checkpoint?[level.checkpoint]:[]);}
export function resetPlayer(p,level,fromStart=false) {
  const index=p.checkpointIndex>=0?p.checkpointIndex:0;
  const checkpoint=checkpointsFor(level)[index];
  const saved=!!(!fromStart&&p.checkpoint&&checkpoint&&(!p.levelId||!level.id||p.levelId===level.id));
  const at=saved?checkpoint:level.start;
  Object.assign(p,createPlayer(at.x,at.y),{health:saved?HEALTH.max:clamp(level.initialHealth??HEALTH.max,1,HEALTH.max),
    checkpoint:saved,checkpointIndex:saved?index:-1,levelId:level.id||null});
}
function waterColumn(p,level) {
  return level.waters.some(([a,b])=>p.x>=a&&p.x<=b) &&
    !level.solids.some(s=>hasShape(s)?shapeOverlap(s,{left:p.x-.1,right:p.x+.1,top:p.y-.1,bottom:p.y+.1}):p.x>s.x1&&p.x<s.x2&&p.y>surfaceAt(s,p.x)&&p.y<s.bottom);
}
function recordDepth(p,level) {
  if(level.depthCharge===false)return;
  const absoluteDepth=Math.max(0,p.y-level.waterY);
  if(p.rechargePending){
    // A new descent restores the reserve appropriate to the current depth.
    // Upward recoil alone cannot refill it, and old spent maxima are discarded.
    if(p.vy<=0)return;
    p.rechargePending=false;p.chargeFloor=0;
  }
  const depth=clamp(absoluteDepth-(p.chargeFloor||0),0,CONFIG.maxDepth);
  if(depth>p.maxDepth){p.energy+=storedWork(depth)-storedWork(p.maxDepth);p.maxDepth=depth;}
}
function restartCharge(p,level){
  p.energy=0;p.boosting=false;p.lastCharge=0;p.maxDepth=0;
  p.chargeFloor=Math.max(0,p.y-level.waterY);p.rechargePending=true;
}
function tangent(s) {
  const slope=(s.y2-s.y1)/(s.x2-s.x1),length=Math.hypot(1,slope);
  return {x:1/length,y:slope/length};
}
function supportFor(p,level) {
  // Landing accepts a foot box overlapping the edge, so support must use that
  // same footprint. Otherwise an overhanging body can land without being able
  // to walk or jump, and the painted slope blocks both movement axes.
  const atFoot=s=>Math.abs(p.y+CONFIG.halfHeight-surfaceAt(s,p.x))<5;
  return level.solids.find(s=>p.x>=s.x1&&p.x<=s.x2&&atFoot(s))||
    level.solids.find(s=>(hasShape(s)||level.actors?.length)&&p.x+CONFIG.radius>s.x1&&p.x-CONFIG.radius<s.x2&&atFoot(s));
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
  const forward=ix!==0&&ix*speed>=0;
  const building=forward&&isSliding(p);
  if(!building||p.slideDriveDirection!==Math.sign(ix))p.slideDriveTime=0;
  p.slideDriveDirection=building?Math.sign(ix):0;
  if(building)p.slideDriveTime=Math.min(CONFIG.slideRampTime,p.slideDriveTime+dt);
  const ramp=p.slideDriveTime/CONFIG.slideRampTime;
  const driveGain=1+CONFIG.slideDriveGain*ramp*ramp*(3-2*ramp);
  const normalForce=CONFIG.gravity*t.x,downhillForce=CONFIG.gravity*t.y;
  // Standing feet grip more strongly than a sliding belly. Hold small residual
  // motion only when idle and gravity stays within the static-friction limit.
  if(ix===0&&Math.abs(speed)<CONFIG.standingSpeed&&Math.abs(downhillForce)<=CONFIG.standingFriction*normalForce){
    p.vx=0;p.vy=0;return;
  }
  const drive=ix*speed<0?CONFIG.groundBrakeThrust:CONFIG.groundThrust*driveGain;
  const force=ix*drive*t.x+CONFIG.gravity*t.y;
  speed=(speed+force*dt)/(1+(CONFIG.iceLinearDrag+CONFIG.iceQuadraticDrag*Math.abs(speed))*dt);
  const grip=ix===0&&!isSliding(p)?CONFIG.standingFriction:CONFIG.iceFriction;
  const friction=grip*CONFIG.gravity*t.x*dt;
  speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-friction);
  p.vx=speed*t.x;p.vy=speed*t.y;
}
function moveFreely(p,ix,iy,immersion,depth,dt,flowX=0) {
  const inputLength=Math.hypot(ix,iy)||1;
  // Build forward propulsion with swimming speed, keeping full thrust available
  // for braking. Momentum carries across water entry; no timer or speed reset.
  const relativeX=p.vx-flowX;
  // Opposing water already increases relative speed while the penguin is at
  // rest. Do not count most of that water motion as self-powered buildup.
  const upstream=ix*flowX<0&&ix*p.vx>=0;
  const propulsionSpeed=upstream?Math.max(0,Math.abs(relativeX)-.75*Math.abs(flowX)):Math.abs(relativeX);
  const ramp=clamp(propulsionSpeed/CONFIG.swimCruiseSpeed,0,1);
  const drive=ix*relativeX<0||iy<0?CONFIG.swimHorizontalThrust:
    CONFIG.swimStartThrust+(CONFIG.swimHorizontalThrust-CONFIG.swimStartThrust)*ramp*ramp*(3-2*ramp);
  const thrustX=ix/inputLength*drive;
  const thrustY=iy/inputLength*CONFIG.swimThrust;
  p.vx+=(ix*CONFIG.airControl*(1-immersion)+thrustX*immersion)*dt;
  p.vy+=(CONFIG.gravity*(1-immersion)+(thrustY-CONFIG.buoyancy)*immersion)*dt;
  // Blend both media through the waterline; airborne speed no longer survives
  // without resistance. The quadratic term especially damps fast breaches.
  const waterSpeed=Math.hypot(p.vx-flowX,p.vy),airSpeed=Math.hypot(p.vx,p.vy);
  const waterDrag=(CONFIG.waterLinearDrag+CONFIG.waterQuadraticDrag*waterSpeed)*immersion;
  const airDrag=(CONFIG.airLinearDrag+CONFIG.airQuadraticDrag*airSpeed)*(1-immersion);
  const damping=1+(waterDrag+airDrag)*dt;
  p.vx=(p.vx+waterDrag*flowX*dt)/damping;p.vy/=damping;

  // Releasing the ascent key leaves only momentum, water resistance and buoyancy.
  p.boosting=p.wet&&iy<0&&p.energy>0;
  if(p.wet&&p.boosting&&p.vy<0&&p.energy>0&&depth<=CONFIG.maxDepth){
    // E = a * distance, including the acceleration contribution to distance.
    const upwardSpeed=-p.vy;
    const affordable=(Math.sqrt(upwardSpeed*upwardSpeed+2*p.energy)-upwardSpeed)/dt;
    // The deepest recorded dive determines force as well as stored work. Keep
    // that force while ascending, rather than weakening it near the surface.
    const acceleration=Math.min(CONFIG.boostAcceleration*depthForce(p.maxDepth)*immersion,affordable);
    const work=acceleration*(upwardSpeed*dt+.5*acceleration*dt*dt);
    p.energy=Math.max(0,p.energy-work);p.vy-=acceleration*dt;
  }
}
export function step(p,input,level,dt){
  if(!level.movingIce?.length&&!level.thinIce?.length)return stepCore(p,input,level,dt);
  if(p.finished||p.dead)return;
  const world=movingWorld(p,level),ride=riddenIce(p,world),oldVX=ride?.vx||0;
  const previous={x:p.x,y:p.y};
  advanceThin(world,p,dt);
  const hits=advanceIce(world,p,dt);
  // A body wider than the closing seam should step across its lips, rather
  // than fall a few pixels and then get carried through the receiving wall.
  if(!p.wet&&p.vy>=0)for(const ice of world.actors){
    for(const shore of level.solids){
      const gap=shore.x1-ice.x2;
      if(gap<0||gap>CONFIG.radius*2||p.x<ice.x2-CONFIG.radius||p.x>shore.x1+CONFIG.radius)continue;
      const top=surfaceAt(shore,shore.x1),iceTop=surfaceAt(ice,ice.x2),feet=p.y+CONFIG.halfHeight;
      if(Math.abs(top-iceTop)<=5&&feet>=top&&feet<=top+CONFIG.halfHeight){p.y=top-CONFIG.halfHeight;p.vy=0;p.grounded=true;}
    }
  }
  const jump=!!input.jump&&p.controlLock<=0&&p.hitStop<=0;
  if(ride){
    if(jump)p.vx+=ride.vx-oldVX;
    else {p.x+=ride.delta;p.vx-=oldVX;}
  }
  p.relativeIce=ride&&!jump?ride.id:null;
  stepCore(p,input,world,dt);
  touchThin(world,p,previous);
  p.relativeIce=null;
  if(ride&&!jump)p.vx+=ride.vx;
  const landed=riddenIce(p,world);
  p.platformVX=landed?.vx||0;
  if(landed&&landed!==ride&&Math.abs(p.vx-landed.vx)<180)p.vx=landed.vx;
  if(hits.length)resolveImpacts(p,hits,[...p.contacts,...hits.map(h=>h.key)]);
}
function stepCore(p,input,level,dt) {
  p.event=null;p.waterSoundEvent=null;p.hit=null;p.reaction=null;p.impactEffect=null;
  if(level.depthCharge===false){p.maxDepth=0;p.energy=0;p.boosting=false;p.lastCharge=0;}
  if(!p.levelId&&level.id)p.levelId=level.id;
  if(p.finished||p.dead)return;
  p.forceSlide=Math.max(0,(p.forceSlide||0)-dt);
  p.rockEvent=null;p.rockHit=null;
  for(const e of p.rockDebris)e.age=Math.min(.36,e.age+dt);
  p.invulnerable=Math.max(0,p.invulnerable-dt);
  if(p.hitStop>0){p.slideDriveTime=0;p.slideDriveDirection=0;p.hitStop=Math.max(0,p.hitStop-dt);return;}
  if(p.pendingKnockback){
    p.vx=p.pendingKnockback.vx;p.vy=p.pendingKnockback.vy;p.pendingKnockback=null;
  }
  // Alpha edges and moving surfaces can leave a tiny initial overlap. Sweeping
  // from inside otherwise blocks both axes, including movement away from ice.
  const solidContains=(s,x,y)=>{
    if(hasShape(s))return shapeOverlap(s,{left:x-CONFIG.radius,right:x+CONFIG.radius,top:y-CONFIG.halfHeight,bottom:y+CONFIG.halfHeight});
    if(x+CONFIG.radius<=s.x1||x-CONFIG.radius>=s.x2||y-CONFIG.halfHeight>=s.bottom)return false;
    return y+CONFIG.halfHeight>Math.min(surfaceAt(s,Math.max(s.x1,x-CONFIG.radius)),surfaceAt(s,Math.min(s.x2,x+CONFIG.radius)))+1e-5;
  };
  for(const s of level.solids){
    if(hasShape(s)||p.x<=s.x1||p.x>=s.x2||p.y<=surfaceAt(s,p.x)+CONFIG.halfHeight||!solidContains(s,p.x,p.y))continue;
    if(p.grounded&&p.x>=s.x1&&p.x<=s.x2&&Math.abs(p.y+CONFIG.halfHeight-surfaceAt(s,p.x))<5)continue;
    const candidates=[{x:s.x1-CONFIG.radius,y:p.y},{x:s.x2+CONFIG.radius,y:p.y},
      {x:p.x,y:Math.min(s.y1,s.y2)-CONFIG.halfHeight},{x:p.x,y:s.bottom+CONFIG.halfHeight}];
    candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
    const free=candidates.find(q=>q.x>=CONFIG.radius&&q.x<=level.width-CONFIG.radius&&q.y<=level.bottom-CONFIG.halfHeight&&!level.solids.some(o=>solidContains(o,q.x,q.y)));
    if(free){p.x=free.x;p.y=free.y;p.vx=0;p.vy=0;p.grounded=false;p.wet=waterColumn(p,level)&&p.y>=level.waterY;}
  }
  const shapes=level.solids.filter(hasShape);
  // Painted corner landings can sit just below the authored top. Resolve them
  // onto that same top before support and movement use it.
  if(p.grounded&&!p.wet){
    const corner=shapes.find(s=>p.x+CONFIG.radius>s.x1&&p.x-CONFIG.radius<s.x2&&p.y+CONFIG.halfHeight>=surfaceAt(s,p.x)&&p.y+CONFIG.halfHeight<=surfaceAt(s,p.x)+CONFIG.halfHeight);
    if(corner)p.y=surfaceAt(corner,p.x)-CONFIG.halfHeight;
  }
  const overlaps=(x,y)=>shapes.some(s=>shapeOverlap(s,{left:x-CONFIG.radius,right:x+CONFIG.radius,top:y-CONFIG.halfHeight,bottom:y+CONFIG.halfHeight}));
  const onTop=p.grounded&&shapes.some(s=>p.x+CONFIG.radius>s.x1&&p.x-CONFIG.radius<s.x2&&Math.abs(p.y+CONFIG.halfHeight-surfaceAt(s,p.x))<5);
  if(!onTop&&overlaps(p.x,p.y)){
    escape:for(let distance=.5;distance<=32;distance+=.5){
      for(const [dx,dy] of [[-distance,0],[distance,0],[0,-distance],[0,distance]]){
        if(!overlaps(p.x+dx,p.y+dy)){p.x+=dx;p.y+=dy;p.grounded=false;break escape;}
      }
    }
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
    p.slideDriveTime=0;p.slideDriveDirection=0;
    if(support&&jump&&!wasWet){
      const t=tangent(support);p.vx+=CONFIG.jump*t.y;p.vy-=CONFIG.jump*t.x;p.event='jump';
    }
    // An uncharged swimmer can make one ordinary hop near the surface. Deep
    // swimming and a charged ascent still use their existing propulsion rules.
    if(wasWet&&jump&&!p.surfaceJumped&&p.energy<=0&&p.y<=level.waterY+CONFIG.halfHeight){
      p.vy=Math.min(p.vy,-CONFIG.jump);p.surfaceJumped=true;p.event='jump';
    }
    const immersion=waterColumn(p,level)?clamp((p.y+CONFIG.halfHeight-level.waterY)/(2*CONFIG.halfHeight),0,1):0;
    moveFreely(p,ix,iy,immersion,p.y-level.waterY-(p.chargeFloor||0),dt,
      immersion>0?waterCurrentAt(level,p.x,p.y):0);
  }

  const incoming={vx:p.vx,vy:p.vy};
  p.x+=p.vx*dt;
  const bounded=clamp(p.x,CONFIG.radius,level.width-CONFIG.radius);
  if(bounded!==p.x){impact(p.vx>0?'edge:right':'edge:left',Math.abs(p.vx),p.vx>0?-1:1,0);p.vx=0;}p.x=bounded;
  for(const [index,s] of level.solids.entries()){
    if(hasShape(s)){
      if((wasGrounded&&support===s)||(p.vy<0&&p.y+CONFIG.halfHeight<=surfaceAt(s,p.x)+5))continue;
      const hit=shapeSweep(s,'x',oldX,p.x,p.y,CONFIG.radius,CONFIG.halfHeight);
      if(hit){const right=p.x>oldX;if(s.localShape&&p.wet)s.pushVX=Math.max(-45,Math.min(45,(s.pushVX||0)+p.vx*.12));impact(`solid:${index}:${right?'left':'right'}`,Math.abs(p.vx),right?-1:1,0);p.x=hit.position;p.vx=0;}
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
    const follow=groundMotion&&(hasShape(s)?support===s&&p.x+CONFIG.radius>s.x1&&p.x-CONFIG.radius<s.x2:
      oldX>=s.x1&&oldX<=s.x2&&p.x>=s.x1&&p.x<=s.x2&&Math.abs(oldY+CONFIG.halfHeight-surfaceAt(s,oldX))<5);
    const entering=p.vy*t.x-p.vx*t.y>=0;
    const paintedTop=!hasShape(s)||shapeOverlap(s,{left:p.x-CONFIG.radius,right:p.x+CONFIG.radius,top:top-1,bottom:top+3});
    if(paintedTop&&(follow||(entering&&oldY+CONFIG.halfHeight<=top+5&&p.y+CONFIG.halfHeight>=top))){
      const contactVX=incoming.vx-(s.id===p.relativeIce?0:s.vx||0);
      impact(`solid:${index}:top`,Math.max(0,incoming.vy*t.x-contactVX*t.y),t.y,-t.x,
        {kind:'landing',angle:landingAngle(contactVX,incoming.vy,t.x,t.y)});
      p.y=top-CONFIG.halfHeight;
      const speed=p.vx*t.x+p.vy*t.y;p.vx=speed*t.x;p.vy=speed*t.y;p.grounded=true;
    }else if(hasShape(s)){
      // Ground support uses the foot centre. On takeoff an uphill box corner can
      // still touch the painted ice; do not treat that departing contact as a ceiling.
      if(incoming.vy<0&&oldY+CONFIG.halfHeight<=surfaceAt(s,oldX)+5)continue;
      const hit=shapeSweep(s,'y',oldY,p.y,p.x,CONFIG.radius,CONFIG.halfHeight);
      if(hit){
        const down=p.y>oldY;
        if(!down&&wasWet){
          const side=p.x<(s.x1+s.x2)/2?-1:1;
          let slid=false;
          for(let distance=1;distance<=8;distance++){
            const x=p.x+side*distance,box={left:x-CONFIG.radius,right:x+CONFIG.radius,top:p.y-CONFIG.halfHeight,bottom:p.y+CONFIG.halfHeight};
            if(x<CONFIG.radius||x>level.width-CONFIG.radius)break;
            if(!level.solids.some(other=>hasShape(other)&&shapeOverlap(other,box))&&!shapeSweep(s,'y',oldY,p.y,x,CONFIG.radius,CONFIG.halfHeight)){p.x=x;slid=true;break;}
          }
          if(slid)continue;
        }
        impact(`solid:${index}:${down?'top':'bottom'}`,Math.abs(p.vy),0,down?-1:1,down?{kind:'landing',angle:landingAngle(incoming.vx-(s.id===p.relativeIce?0:s.vx||0),incoming.vy)}:{});
        p.y=down&&hit.position+CONFIG.halfHeight<=top+CONFIG.halfHeight?top-CONFIG.halfHeight:hit.position;p.vy=0;p.grounded=down;
      }
    }else if(p.vy<0&&oldY-CONFIG.halfHeight>=s.bottom-2&&p.y-CONFIG.halfHeight<s.bottom){
      impact(`solid:${index}:bottom`,-p.vy,0,1);
      p.y=s.bottom+CONFIG.halfHeight;p.vy=0;
    }
  }
  if(p.y+CONFIG.halfHeight>level.bottom){impact('floor',Math.max(0,incoming.vy),0,-1,{kind:'landing',angle:landingAngle(incoming.vx,incoming.vy)});p.y=level.bottom-CONFIG.halfHeight;p.vy=Math.min(0,p.vy);}
  if(p.rockBounce&&p.grounded){
    for(let i=impacts.length-1;i>=0;i--)if(impacts[i].kind==='landing')impacts.splice(i,1);
    p.rockBounce=false;
    if(p.rockTrip){p.rockTrip=false;p.forceSlide=.85;}
  }
  collideRocks(p,level,{x:oldX,y:oldY});
  p.sliding=!p.wet&&isSliding(p);
  p.wet=p.y>level.waterY&&waterColumn(p,level);
  if(p.wet){
    const speed=Math.hypot(incoming.vx,incoming.vy);
    if(speed>=8)p.swimSideRadius=Math.max(CONFIG.radius,34.5*Math.abs(incoming.vx)/speed+12*Math.abs(incoming.vy)/speed);
    const radius=p.swimSideRadius||CONFIG.radius;
    for(const [index,s] of level.solids.entries()){
      if(p.y-CONFIG.halfHeight>=s.bottom||p.y+CONFIG.halfHeight<=Math.min(s.y1,s.y2)+5)continue;
      const side=p.x<=s.x1?-1:p.x>=s.x2?1:0;if(!side)continue;
      const before=p.x;
      if(hasShape(s)){
        const from=p.x+side*(radius+2),hit=shapeSweep(s,'x',from,p.x,p.y,radius,CONFIG.halfHeight);
        if(hit)p.x=hit.position;
      }else if(side<0&&p.x+radius>s.x1)p.x=s.x1-radius;
      else if(side>0&&p.x-radius<s.x2)p.x=s.x2+radius;
      if(Math.abs(p.x-before)>1e-5&&incoming.vx*side<0){impact(`solid:${index}:${side<0?'left':'right'}`,Math.abs(incoming.vx),side,0);p.vx=0;}
    }
  }else p.swimSideRadius=CONFIG.radius;
  if(p.wet&&!wasWet){p.maxDepth=0;p.energy=0;p.boosting=false;p.chargeFloor=0;p.rechargePending=false;p.surfaceJumped=false;p.event='splash';}
  if(p.wet)recordDepth(p,level);
  if(wasWet&&!p.wet){
    if(oldY>level.waterY&&p.y<=level.waterY&&p.vy<0){p.lastCharge=chargeForDepth(p.maxDepth);p.event='breach';}
    // The waterline changes forces and visuals, never velocity.
    p.maxDepth=0;p.energy=0;p.boosting=false;p.rechargePending=false;
  }
  // Sound follows first body contact with the waterline, rather than waiting
  // for the centre to cross it. Keep physics/charge transitions unchanged.
  if(p.y+CONFIG.halfHeight<level.waterY)p.waterEntrySounded=false;
  if(p.y-CONFIG.halfHeight>level.waterY)p.waterExitSounded=false;
  const surfaceWater=waterColumn(p,level);
  const enteringWater=surfaceWater&&p.vy>0&&oldY+CONFIG.halfHeight<level.waterY&&p.y+CONFIG.halfHeight>=level.waterY;
  const leavingWater=surfaceWater&&wasWet&&p.vy<0&&oldY-CONFIG.halfHeight>level.waterY&&p.y-CONFIG.halfHeight<=level.waterY;
  if(!p.waterEntrySounded&&(enteringWater||p.event==='splash')){
    p.waterSoundEvent='splash';p.waterEntrySounded=true;
  }
  if(!p.waterExitSounded&&(leavingWater||p.event==='breach')){
    p.waterSoundEvent='breach';p.waterExitSounded=true;
  }
  if(wasWet&&incoming.vy<0&&impacts.some(hit=>hit.kind!=='landing'&&hit.speed>0)){
    restartCharge(p,level);
  }
  // Visual feedback includes safe landings, independently of damage rules.
  p.impactEffect=impacts.filter(hit=>hit.speed>180&&!p.contacts.includes(hit.key))
    .sort((a,b)=>b.speed-a.speed)[0]||null;
  resolveImpacts(p,p.rockHit?[]:impacts,[...touchingSurfaces(p,level),...impacts.map(hit=>hit.key)]);
  if(wasWet&&p.reaction)restartCharge(p,level);
  applyRockFeedback(p);
  if(p.dead)return;
  for(const [index,checkpoint] of checkpointsFor(level).entries()){
    const previous=p.checkpointIndex>=0?p.checkpointIndex:p.checkpoint?0:-1;
    // Passing above the nest counts too; travelling below it or underwater does not.
    if(index>previous&&!p.wet&&p.y<checkpoint.y+12&&p.x>checkpoint.x-(level.checkpointActivationBefore??100)&&p.x<checkpoint.x+120){
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
