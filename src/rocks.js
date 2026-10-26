// Rock state belongs to the player/run; level definitions remain reusable.
import {rockSweep,rockBounds} from './rock-outline.js';
import {scatteredRock} from './stone-animation.js';
import {HEALTH} from './health.js';
export const ROCKS={heightCutoff:24,bounceSpeed:125,tripBounceSpeed:180,tripForwardSpeed:220,damage:5,walkingDamage:15};
export const isLowRock=rock=>rock.type?rock.type==='low':rock.h<=ROCKS.heightCutoff;
export function isSliding(p){return !p.wet&&((p.forceSlide||0)>0||(p.grounded&&Math.abs(p.vx)>=(p.sliding?200:240)));}

export function collideRocks(p,level,old){
  const contacts=[];
  for(const original of level.rocks||[]){
    const rock=p.brokenRocks.includes(original.id)?scatteredRock(original):original;
    const dx=p.x-old.x;
    if(!isLowRock(rock)){
      const bounds=rockBounds(rock),left=bounds.left-17,right=bounds.right+17;
      if(p.rockPasses.includes(rock.id)){
        if(p.x<left||p.x>right)p.rockPasses=p.rockPasses.filter(id=>id!==rock.id);
        continue;
      }
      const safeTop=rock.y-(rock.y-bounds.top)*2/3;
      if(!p.grounded&&Math.max(old.x,p.x)>=left&&Math.min(old.x,p.x)<=right&&Math.min(old.y,p.y)+22<=safeTop){
        p.rockPasses.push(rock.id);continue;
      }
    }
    if(rockSweep(rock,old,p)===null)continue;
    contacts.push(rock.id);
    const sliding=isSliding(p);
    if(isLowRock(rock)){
      if(p.rockContacts.includes(rock.id))continue;
      p.forceSlide=.85;
      p.vy=-(sliding?ROCKS.bounceSpeed:ROCKS.tripBounceSpeed);p.grounded=false;p.rockBounce=true;
      p.rockTrip=!sliding;
      if(!sliding)p.vx=(Math.sign(dx)||p.facing||1)*Math.max(Math.abs(p.vx),ROCKS.tripForwardSpeed);
      p.rockEvent={kind:sliding?'bounce':'trip',...rock};
    }else{
      p.brokenRocks.push(rock.id);
      const speed=Math.abs(p.vx),direction=Math.sign(dx)||p.facing||1;
      if(sliding){p.vx*=.9;p.forceSlide=Math.max(p.forceSlide,.5);}
      const damage=Math.min(p.health,sliding?ROCKS.damage:ROCKS.walkingDamage);p.health-=damage;
      p.rockHit={damage,kind:'rock',speed,nx:-direction,ny:0,stun:!sliding};
      p.rockEvent={kind:'break',...rock};p.rockDebris.push({...rock,age:0});
      if(p.health===0){p.dead=true;p.vx=p.vy=p.energy=0;p.boosting=false;p.event='death';}
    }
  }
  p.rockContacts=contacts;
}

export function applyRockFeedback(p){
  if(!p.rockHit)return;
  p.hit=p.rockHit;
  if(p.dead||!p.rockHit.stun)return;
  const direction=-p.rockHit.nx,speed=Math.max(p.rockHit.speed,ROCKS.tripForwardSpeed);
  p.invulnerable=Math.max(p.invulnerable,HEALTH.protection);
  p.hitStop=HEALTH.hitStop;p.controlLock=HEALTH.recoilRecovery;
  p.pendingKnockback={vx:direction*speed,vy:-ROCKS.tripBounceSpeed};
  p.rockTrip=true;p.rockBounce=true;p.forceSlide=.85;p.grounded=false;
  p.reaction={kind:'trip',nx:direction,speed};p.vx=0;p.vy=0;p.boosting=false;
}
