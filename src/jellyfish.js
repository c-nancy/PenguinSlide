import {hasShape,shapeOverlap} from './shape-collision.js';
import {surfaceAt} from './level.js';
import {iceBottomAt} from './bottom-edge.js';
export const JELLYFISH_URLS=[
 new URL('../assets/scenery/jellyfish/animations/swim/spritesheet.png',import.meta.url).href
];
function driftNoise(time,seed){
 // Seeded smooth noise keeps render/collision samples identical at any frame rate.
 const index=Math.floor(time),fraction=time-index,blend=fraction*fraction*(3-2*fraction);
 const sample=n=>{const value=Math.sin(n*127.1+seed*311.7)*43758.5453;return (value-Math.floor(value))*2-1;};
 return sample(index)*(1-blend)+sample(index+1)*blend;
}
function repelOffset(event,time){
 if(!event)return {x:0,y:0};
 const elapsed=time-event.time;
 if(elapsed<0||elapsed>=3)return {x:0,y:0};
 const smooth=t=>t*t*(3-2*t);
 if(elapsed<.35){const f=smooth(elapsed/.35);return {x:event.fromX+(event.dx-event.fromX)*f,y:event.fromY+(event.dy-event.fromY)*f};}
 const f=elapsed<1.4?1:1-smooth((elapsed-1.4)/1.6);
 return {x:event.dx*f,y:event.dy*f};
}
function limitRepel(pose,offset,level){
 if(!level)return offset;
 const steps=Math.max(1,Math.ceil(Math.hypot(offset.x,offset.y)/4));
 const blocked=f=>{
  const x=pose.x+offset.x*f,y=pose.y+offset.y*f;
  const box={left:x-pose.w*.34,right:x+pose.w*.34,top:y-pose.h/2,bottom:y+pose.h/2};
  return box.top<=level.waterY||box.bottom>=level.bottom||(level.solids||[]).some(s=>hasShape(s)?shapeOverlap(s,box):box.right>s.x1&&box.left<s.x2&&box.bottom>surfaceAt(s,Math.max(s.x1,Math.min(s.x2,x)))&&box.top<iceBottomAt(s,x));
 };
 let safe=0;
 for(let i=1;i<=steps;i++){
  if(blocked(i/steps)){
   let high=i/steps;
   for(let n=0;n<10;n++){const mid=(safe+high)/2;if(blocked(mid))high=mid;else safe=mid;}
   break;
  }
  safe=i/steps;
 }
 return {x:offset.x*safe,y:offset.y*safe};
}
export function jellyfishPose(j,time=0,repel=null,level=null){
 // Each patrol contains whole umbrella beats, so its authored period is preserved.
 const period=j.period||8,pulses=Math.max(2,Math.round(period/1.8));
 const clock=(time/period+(j.phase||0))*pulses,beat=Math.floor(clock),phase=clock-beat;
 const frame=[0,1,2,1][Math.floor(phase*4)];
 // The patrol advances only through the two contraction frames.
 const contraction=Math.max(0,Math.min(1,(phase-.25)/.5));
 const advance=contraction*contraction*(3-2*contraction);
 const wave=Math.cos(2*Math.PI*(beat+advance)/pulses);
 // Vertical resting drift fades before contraction; subtle sideways wandering continues.
 const rest=phase>=.75?phase-.75:phase+.25;
 const drift=phase<.25||phase>=.75?Math.sin(2*Math.PI*rest)**2:0;
 const seed=j.x*.13+j.y*.17+(j.phase||0)*7;
 const offsetX=5*driftNoise(time*.45,seed);
 const offsetY=2*drift*driftNoise(time*.65,seed+19);
 const pose={x:j.x+offsetX,y:j.y+(j.dy||0)*wave+offsetY,w:j.width||170,h:(j.width||170)*1112/1415,frame};
 if(repel){
  const offset=limitRepel(pose,repelOffset(repel,time),level);
  pose.x+=offset.x;pose.y+=offset.y;
  if(time>repel.time&&time<repel.time+.65)pose.frame=2;
 }
 return pose;
}
export function repelJellyfishWithRing(p,level,ring,x=ring.x,y=ring.y){
 if(p.dead||p.finished||ring.broken!==null)return false;
 const time=p.jellyTime||0;
 for(const [index,j] of (level.jellyfish||[]).entries()){
  const pose=jellyfishPose(j,time,p.jellyRepels?.[index],level);
  if(((x-pose.x)/(pose.w*.34+Math.hypot(27*ring.dy,10*ring.dx)))**2+((y-pose.y)/(pose.h*.45+Math.hypot(27*ring.dx,10*ring.dy)))**2>1)continue;
  const base=jellyfishPose(j,time),fromX=pose.x-base.x,fromY=pose.y-base.y;
  const length=Math.hypot(ring.dx,ring.dy)||1;
  let dx=fromX+ring.dx/length*160,dy=fromY+ring.dy/length*160;
  const cap=Math.min(1,220/(Math.hypot(dx,dy)||1));dx*=cap;dy*=cap;
  // Replace the array rather than sharing mutable state with physics prediction.
  p.jellyRepels=[...(p.jellyRepels||[])];
  p.jellyRepels[index]={time,fromX,fromY,dx,dy};
  return true;
 }
 return false;
}
function sweptEllipse(a,b,rx,ry){
 const x=a.x/rx,y=a.y/ry,dx=(b.x-a.x)/rx,dy=(b.y-a.y)/ry;
 const c=x*x+y*y-1;if(c<=0)return 0;
 const length=dx*dx+dy*dy;if(length<1e-12)return null;
 const dot=x*dx+y*dy,discriminant=dot*dot-length*c;
 if(discriminant<0)return null;
 const t=(-dot-Math.sqrt(discriminant))/length;
 return t>=0&&t<=1?t:null;
}
export function advanceJellyfish(p,level,previous,dt){
 const before=p.jellyTime||0;p.jellyTime=before+dt;
 p.jellyCooldown=Math.max(0,(p.jellyCooldown||0)-dt);
 if(p.dead||p.finished||p.jellyCooldown>0||(!p.wet&&previous.y<level.waterY))return;
 for(const [index,j] of (level.jellyfish||[]).entries()){
  const repel=p.jellyRepels?.[index];
  const a=jellyfishPose(j,before,repel,level),b=jellyfishPose(j,p.jellyTime,repel,level);
  const zone=(offset,rx,ry)=>sweptEllipse(
   {x:previous.x-a.x,y:previous.y-a.y-a.h*offset},
   {x:p.x-b.x,y:p.y-b.y-b.h*offset},b.w*rx+12,b.h*ry+16);
  const sting=zone(.16,.25,.25),bell=zone(-.28,.34,.08);
  if(sting===null&&bell===null)continue;
  if(bell!==null&&(sting===null||bell<=sting)){
   const cx=a.x+(b.x-a.x)*bell,cy=a.y+(b.y-a.y)*bell-b.h*.28;
   const hitX=previous.x+(p.x-previous.x)*bell,hitY=previous.y+(p.y-previous.y)*bell;
   const rx=b.w*.34+12,ry=b.h*.08+16;
   const ux=dt>0?(b.x-a.x)/dt:0,uy=dt>0?(b.y-a.y)/dt:0;
   const vx=p.vx-ux,vy=p.vy-uy;
   let nx=(hitX-cx)/rx**2,ny=(hitY-cy)/ry**2;
   let length=Math.hypot(nx,ny);
   if(length<1e-10){nx=-vx;ny=-vy;length=Math.hypot(nx,ny);}
   if(length<1e-10)continue;
   nx/=length;ny/=length;
   const normalSpeed=vx*nx+vy*ny;
   // Moving elastic surface: reverse the normal component, retain the tangent.
   // Restitution 0.8 dissipates energy rather than adding a scripted push.
   if(normalSpeed<0){
    p.vx-=1.8*normalSpeed*nx;p.vy-=1.8*normalSpeed*ny;p.boosting=false;
    // Resolve initial overlap and leave a tiny gap to avoid a repeated contact.
    const q=Math.hypot((hitX-cx)/rx,(hitY-cy)/ry);
    if(q>1e-10){p.x=cx+(hitX-cx)/q+nx*.1;p.y=cy+(hitY-cy)/q+ny*.1;}
    else {p.x=cx+nx*rx;p.y=cy+ny*ry;}
    return;
   }
  }
  if(sting===null||p.invulnerable>0)continue;
  const nx=p.x>=b.x?1:-1;
  p.vx=nx*110;p.vy=Math.max(-90,Math.min(90,p.vy));p.jellyCooldown=.65;
  if(sting!==null){
   const damage=Math.min(8,p.health);p.health-=damage;p.invulnerable=1.2;
   p.hit={kind:'jellyfish',damage,nx,ny:0};
   if(p.health<=0){p.dead=true;p.event='death';p.vx=p.vy=0;p.energy=0;p.boosting=false;}
  }
  return;
 }
}
export function drawJellyfish(c,art,level,p,cam){
 for(const [index,j] of (level.jellyfish||[]).entries()){
  const t=p.jellyTime||0,s=jellyfishPose(j,t,p.jellyRepels?.[index],level);
  if(s.x+s.w/2<cam.x||s.x-s.w/2>cam.x+(cam.width||1440)||s.y+s.h/2<cam.y||s.y-s.h/2>cam.y+720)continue;
  const im=art.images.get(JELLYFISH_URLS[0]);
  if(im){const fw=im.width/3;c.drawImage(im,s.frame*fw,0,fw,im.height,s.x-s.w/2-cam.x,s.y-s.h/2-cam.y,s.w,s.h);}
 }
}
