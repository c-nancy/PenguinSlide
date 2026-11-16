import {surfaceAt} from './level.js';
import {iceBottomAt} from './bottom-edge.js';
import {hasShape,shapeOverlap} from './shape-collision.js';
import {rockOverlap} from './rock-outline.js';
import {scatteredRock} from './stone-animation.js';

export const SNOWBALL_URL=new URL('../assets/character/animations/snowball/snowball.png',import.meta.url).href;
export const SNOWBALL_IMPACT_URLS=[
 new URL('../assets/character/animations/snowball/impact/snowball-hit.png',import.meta.url).href,
 new URL('../assets/character/animations/snowball/impact/snowball-break.png',import.meta.url).href,
 new URL('../assets/character/animations/snowball/impact/snowball-scatter.png',import.meta.url).href
];
const IMPACT_DURATION=.38;
export const SNOW_ACTION={release:.62,duration:.84,scale:48/406,radius:5.3};
export function canThrowSnowball(p,world){
 return p.grounded&&!p.wet&&!p.dead&&!p.finished&&!p.controlLock&&!p.hitStop&&
  world.solids.some(s=>!['reef','weak-wall'].includes(s.kind)&&!s.wallSection&&!s.caveRoof&&
   p.x+17>s.x1&&p.x-17<s.x2&&Math.abs(p.y+22-surfaceAt(s,p.x))<5);
}
export function prepareSnowAction(p,input,world,dt){
 const fresh=!!input.snowball&&!p.snowHeld;p.snowHeld=!!input.snowball;
 if(input.jump||!canThrowSnowball(p,world))p.snowAction=null;
 else if(fresh&&!p.snowAction)p.snowAction={age:0,facing:p.facing===-1?-1:1,released:false};
 const action=p.snowAction;if(!action)return input;
 action.age+=dt;p.facing=action.facing;p.vx=p.vy=0;
 p.forceSlide=0;p.slideDriveTime=0;p.slideDriveDirection=0;
 if(!action.released&&action.age>=SNOW_ACTION.release){
  action.released=true;
  const ball={x:p.x,y:p.y+25-350*SNOW_ACTION.scale,vx:380*action.facing,vy:-210,age:0};
  const distance=284*SNOW_ACTION.scale,steps=Math.ceil(distance/3);
  let blocked=false;
  for(let i=0;i<=steps;i++){
   ball.x=p.x+distance*i/steps*action.facing;
   if(hitsTerrain(ball,world,p)){burst(p,ball);blocked=true;break;}
  }
  if(!blocked)p.snowballs.push(ball);
 }
 if(action.age>=SNOW_ACTION.duration)p.snowAction=null;
 return {...input,x:0,y:0,jump:false,surfaceHop:false};
}
function hitsTerrain(ball,world,p){
 const r=SNOW_ACTION.radius,box={left:ball.x-r,right:ball.x+r,top:ball.y-r,bottom:ball.y+r};
 return world.solids.some(s=>{
  if(hasShape(s))return shapeOverlap(s,box);
  return box.right>s.x1&&box.left<s.x2&&box.bottom>surfaceAt(s,ball.x)&&box.top<iceBottomAt(s,ball.x);
 })||(world.rocks||[]).some(rock=>rockOverlap(p.brokenRocks.includes(rock.id)?scatteredRock(rock):rock,box));
}
function burst(p,ball){
 p.snowImpacts.push({x:ball.x,y:ball.y,age:0});
}
export function advanceSnowballs(p,world,dt){
 p.snowballFlights=[];
 for(const impact of p.snowImpacts)impact.age+=dt;
 p.snowImpacts=p.snowImpacts.filter(impact=>impact.age<IMPACT_DURATION);
 p.snowballs=p.snowballs.filter(ball=>{
  const flight={x1:ball.x,y1:ball.y,x2:ball.x,y2:ball.y};
  p.snowballFlights.push(flight);
  ball.age+=dt;ball.vy+=650*dt;
  const steps=Math.max(1,Math.ceil(Math.hypot(ball.vx,ball.vy)*dt/3));
  for(let i=0;i<steps;i++){
   ball.x+=ball.vx*dt/steps;ball.y+=ball.vy*dt/steps;
   flight.x2=ball.x;flight.y2=ball.y;
   if(hitsTerrain(ball,world,p)){burst(p,ball);return false;}
   const surface=world.basinSurfaces?.find(b=>ball.x>=b.left&&ball.x<=b.right)?.waterY??world.waterY;
   if(world.waters.some(([a,b])=>ball.x>=a&&ball.x<=b)&&ball.y+SNOW_ACTION.radius>=surface){
    burst(p,{x:ball.x,y:surface});return false;
   }
   if(ball.x<0||ball.x>world.width||ball.y>world.bottom||ball.age>4)return false;
  }
  return true;
 });
}
export function drawSnowAction(c,art,p,cam){
 if(!p.snowAction)return false;
 const clip=art.character.animations.snowball,image=clip&&art.images.get(art.CHARACTER+clip.spritesheet);
 if(!image)return false;
 const age=p.snowAction.age,frame=age<.38?0:age<SNOW_ACTION.release?1:2;
 c.save();c.translate(p.x-cam.x,p.y+25-cam.y);c.scale(p.snowAction.facing*SNOW_ACTION.scale,SNOW_ACTION.scale);c.translate(-420,-460);
 if(frame===2){
  // The supplied release frame includes a painted ball. Mask that separate
  // island of pixels; the projectile starts at exactly that painted position.
  c.beginPath();c.rect(0,0,768,512);c.rect(650,40,118,115);c.clip('evenodd');
 }
 c.drawImage(image,frame*768,0,768,512,0,0,768,512);c.restore();return true;
}
export function drawSnowballs(c,art,p,cam){
 const image=art.images.get(SNOWBALL_URL),r=SNOW_ACTION.radius;
 if(image)for(const ball of p.snowballs||[])c.drawImage(image,ball.x-cam.x-r,ball.y-cam.y-r,r*2,r*2);
 for(const impact of p.snowImpacts||[]){
  const frame=impact.age<.08?0:impact.age<.18?1:2;
  const texture=art.images.get(SNOWBALL_IMPACT_URLS[frame]);if(!texture)continue;
  const scatter=Math.max(0,(impact.age-.18)/(IMPACT_DURATION-.18));
  // All three supplied images share a 160px canvas. Their central snowball
  // matches the 94px projectile, so transparent padding must not shrink it.
  const size=r*2*160/94*(frame===0?1:frame===1?1.08:1.12+scatter*.45);
  c.save();c.globalAlpha=frame===2?1-scatter:1;
  c.drawImage(texture,impact.x-cam.x-size/2,impact.y-cam.y-size/2+scatter*3,size,size);
  c.restore();
 }
}
