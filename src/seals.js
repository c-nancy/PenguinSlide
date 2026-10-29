import {hasShape,shapeOverlap} from './shape-collision.js';
export const SEAL_URLS=[new URL('../assets/scenery/seals/leopard-seal.png',import.meta.url).href,new URL('../assets/scenery/seals/fur-seal.png',import.meta.url).href,new URL('../assets/scenery/seals/animations/leopard-seal/open-mouth.png',import.meta.url).href,new URL('../assets/scenery/seals/animations/fur-seal/charge.png',import.meta.url).href,new URL('../assets/scenery/seals/animations/fur-seal/headbutt.png',import.meta.url).href,
 new URL('../assets/scenery/seals/animations/leopard-seal/swim.png',import.meta.url).href,
 new URL('../assets/scenery/seals/animations/leopard-seal/swim-02.png',import.meta.url).href,
 new URL('../assets/scenery/seals/animations/fur-seal/swim.png',import.meta.url).href,
 new URL('../assets/scenery/seals/animations/fur-seal/swim-02.png',import.meta.url).href,
 new URL('../assets/scenery/seals/animations/leopard-seal/dash.png',import.meta.url).href];
export const createSeals=level=>(level.seals||[]).map(s=>({...s,homeY:s.y,vx:100,vy:0,mode:'patrol',inside:false,timer:0,facing:1}));
const touches=(s,x,y,r=0)=>((x-s.x)/(95+r))**2+((y-s.y)/(30+r))**2<=1;
function sealBlocked(world,x,y){
 const box={left:x-90,right:x+90,top:y-27,bottom:y+27};
 return world.solids.some(o=>hasShape(o)?shapeOverlap(o,box):box.right>o.x1&&box.left<o.x2&&box.bottom>Math.min(o.y1,o.y2)&&box.top<o.bottom);
}
export function updateSeals(seals,p,world,dt,random=Math.random){
 const biting=seals.find(s=>s.mode==='bite');
 if(biting){biting.timer=Math.max(0,biting.timer-dt);return biting.timer===0;}
 const charging=seals.find(s=>s.mode==='charge');
 if(charging){
  const s=charging;s.timer=Math.max(0,s.timer-dt);const t=1-s.timer/.35,e=t*t*(3-2*t);
  const x=s.chargeX+(s.targetX-s.chargeX)*e,y=s.chargeY+(s.targetY-s.chargeY)*e;
  const box={left:x-90,right:x+90,top:y-27,bottom:y+27};
  if(world.solids.some(o=>hasShape(o)?shapeOverlap(o,box):box.right>o.x1&&box.left<o.x2&&box.bottom>Math.min(o.y1,o.y2)&&box.top<o.bottom)){s.mode='retreat';s.timer=1.2;return false;}
  s.x=x;s.y=y;
  p.vx=0;p.vy=0;
  if(s.timer===0){s.mode='headbutt';s.timer=.25;p.health=Math.max(0,p.health-15);p.dead=p.health===0;p.invulnerable=1;p.vy=-250;p.vx=s.facing*80;p.hit={kind:'seal'};p.energy=0;p.boosting=false;p.rechargePending=true;}
  return false;
 }
 for(const s of seals){
  if(sealBlocked(world,s.x,s.y)){
   escape:for(let d=1;d<=100;d++)for(const [dx,dy] of [[0,d],[-d,0],[d,0]]){
    const x=s.x+dx,y=s.y+dy;
    if(x<s.left+95||x>s.right-95||y>world.bottom-40)continue;
    if(!sealBlocked(world,x,y)){s.x=x;s.y=y;s.avoid=1;break escape;}
   }
  }
  const near=p.wet&&p.x>s.left&&p.x<s.right&&Math.hypot(p.x-s.x,p.y-s.y)<s.range;
  if(near&&!s.inside&&s.mode==='patrol'&&random()<(s.species==='leopard'?.75:.5)){s.mode='alert';s.timer=.6;}
  s.inside=near;s.timer=Math.max(0,s.timer-dt);
  if(s.mode==='headbutt'){if(s.timer===0){s.mode='retreat';s.timer=1.2;}continue;}
  if(!p.wet&&(s.mode==='chase'||s.mode==='alert'))s.mode='return';
  if(s.mode==='alert'&&s.timer===0)s.mode='chase';
  if(s.mode==='retreat'&&s.timer===0)s.mode='return';
  let tx=s.vx,ty=0;
  if(s.mode==='chase'){
   if(!p.wet||p.x<s.left||p.x>s.right)s.mode='return';
   const dx=p.x+p.vx*.12-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy)||1,speed=s.species==='leopard'?1500:850;
   tx=dx/d*speed;ty=dy/d*speed;
  }else if(s.mode==='return'){tx=(s.left+s.right)/2-s.x;ty=s.homeY-s.y;if(Math.hypot(tx,ty)<40)s.mode='patrol';}
  else if(s.mode==='patrol'){tx=s.facing*110;ty=(s.homeY-s.y)*.8;}
  else if(s.mode==='alert'){tx=0;ty=0;}
  else {tx=s.facing*100;ty=90;}
  if(s.avoid>0){s.avoid=Math.max(0,s.avoid-dt);tx=s.facing*180;ty=150;}
  s.vx+=(tx-s.vx)*(1-Math.exp(-dt*4));s.vy+=(ty-s.vy)*(1-Math.exp(-dt*4));
  const x=Math.max(s.left+95,Math.min(s.right-95,s.x+s.vx*dt)),y=Math.max(world.waterY+48,Math.min(world.bottom-40,s.y+s.vy*dt));
  const count=Math.max(1,Math.ceil(Math.hypot(x-s.x,y-s.y)/4)),dx=(x-s.x)/count,dy=(y-s.y)/count;
  let blocked=false;
  for(let i=0;i<count;i++){
   if(!sealBlocked(world,s.x+dx,s.y))s.x+=dx;else blocked=true;
   if(!sealBlocked(world,s.x,s.y+dy))s.y+=dy;else blocked=true;
  }
  if(blocked){s.avoid=1;s.vy=Math.max(80,s.vy);s.mode='return';}
  if(x<=s.left+95)s.facing=1;else if(x>=s.right-95)s.facing=-1;else if(Math.abs(s.vx)>5)s.facing=Math.sign(s.vx);
  if(p.wet&&s.mode!=='retreat'&&touches(s,p.x,p.y,17)){
   if(s.species==='leopard'){s.mode='bite';s.timer=.5;s.vx=0;s.vy=0;p.vx=0;p.vy=0;return false;}
   if(p.invulnerable<=0){s.mode='charge';s.timer=.35;s.chargeX=s.x;s.chargeY=s.y;s.targetX=p.x-s.facing*100;s.targetY=p.y+13;s.vx=0;s.vy=0;p.vx=0;p.vy=0;return false;}
   s.mode='retreat';s.timer=1.2;
  }
 }
 return false;
}
export function sealEffects(seals,rings,bubbles,time){
 for(const s of seals){
  for(const r of rings)if(r.broken===null&&touches(s,r.x,r.y,27))r.broken=0;
  for(const b of bubbles)if(b.phase==='idle'&&touches(s,b.x,b.y,b.radius)){b.phase='burst';b.born=time;b.burstX=b.x;b.burstY=b.y;}
 }
}
export function drawSeals(c,art,seals,cam,time){
 for(const s of seals||[]){
 const swimming=s.mode==='patrol'||s.mode==='return';
 const frame=Math.floor((time+(s.homeY||0)*.007)*1/.28)%2;
 const index=s.mode==='charge'?3:s.mode==='headbutt'?4:s.mode==='bite'?2:s.species==='leopard'&&s.mode==='chase'?9:swimming?(s.species==='leopard'?5:7)+frame:s.species==='leopard'?0:1;
 const im=art.images.get(SEAL_URLS[index]);if(!im)continue;
 const acting=['bite','charge','headbutt'].includes(s.mode);
 const width=s.species==='leopard'?350:185,height=width/2;
 c.save();c.translate(s.x-cam.x,s.y-cam.y+(acting?0:Math.sin(time*3)*2));c.scale(s.facing,1);c.drawImage(im,-width/2,-height/2,width,height);c.restore();}
}
