export const HEALTH=Object.freeze({max:100,safeSpeed:360,fullDamageSpeed:1400,minDamage:8,maxDamage:35,protection:1,
  hitStop:.08,recoilRecovery:.3,minRecoil:110,maxRecoil:145,recoilFactor:.15,safeLandingAngle:75});

export function healthState(){
  return {health:HEALTH.max,dead:false,invulnerable:0,contacts:[],hit:null,reaction:null,hitStop:0,controlLock:0,pendingKnockback:null};
}
export function impactDamage(speed){
  if(speed<=HEALTH.safeSpeed)return 0;
  const severity=Math.min(1,(speed*speed-HEALTH.safeSpeed**2)/(HEALTH.fullDamageSpeed**2-HEALTH.safeSpeed**2));
  return Math.round(HEALTH.minDamage+severity*(HEALTH.maxDamage-HEALTH.minDamage));
}
export function landingAngle(vx,vy,tx=1,ty=0){
  const normal=Math.max(0,vy*tx-vx*ty),along=Math.abs(vx*tx+vy*ty);
  return Math.atan2(normal,along)*180/Math.PI;
}
export function resolveImpacts(p,impacts,contacts){
  p.hit=null;p.reaction=null;
  const previous=new Set(p.contacts);
  p.contacts=[...new Set(contacts)];
  if(p.dead)return;
  let strongest=null,wall=null;
  for(const impact of impacts){
    if(impact.kind==='landing'&&!(impact.angle>HEALTH.safeLandingAngle+1e-9))continue;
    if(previous.has(impact.key)||impactDamage(impact.speed)===0)continue;
    if(!strongest||impact.speed>strongest.speed)strongest=impact;
    if(Math.abs(impact.nx)>.9&&Math.abs(impact.ny)<.1&&(!wall||impact.speed>wall.speed))wall=impact;
  }
  if(!strongest)return;
  if(p.invulnerable<=0){
    const damage=Math.min(p.health,impactDamage(strongest.speed));
    p.health-=damage;p.invulnerable=HEALTH.protection;
    p.hit={damage,speed:strongest.speed,nx:strongest.nx,ny:strongest.ny,kind:strongest.kind||'collision',angle:strongest.angle};
  }
  if(p.health===0){
    p.dead=true;p.vx=0;p.vy=0;p.boosting=false;p.energy=0;p.event='death';
    p.hitStop=0;p.controlLock=0;p.pendingKnockback=null;return;
  }
  if(wall){
    const speed=Math.max(HEALTH.minRecoil,Math.min(HEALTH.maxRecoil,wall.speed*HEALTH.recoilFactor));
    p.pendingKnockback={vx:wall.nx*speed,vy:p.vy};
    p.hitStop=HEALTH.hitStop;p.controlLock=HEALTH.recoilRecovery;
    p.reaction={kind:'wall',nx:wall.nx,speed};p.vx=0;p.vy=0;p.boosting=false;
  }
}
