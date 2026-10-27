import {drawSprite} from './art.js';

export function addImpactEffect(state,hit){
  const p=state.p,landing=hit.kind==='landing';
  const nx=hit.nx||0,ny=hit.ny||0;
  state.impactEffects.push({born:state.time,
    x:p.x-nx*20,y:p.y-ny*22,
    sprite:landing?(hit.speed>500?'landing-hard':'landing-soft'):'wall-hit',
    angle:(landing?Math.atan2(nx,-ny):Math.atan2(ny,nx))+Math.PI,
    size:hit.speed>500?60:44});
}

export function drawImpactEffects(c,art,state){
  for(const e of state.impactEffects||[]){
    const t=(state.time-e.born)/.32;if(t<0||t>=1)continue;
    const size=e.size*(.85+.15*Math.min(1,t*5));
    c.save();c.translate(e.x-state.cam.x,e.y-state.cam.y);c.rotate(e.angle);
    c.globalAlpha=Math.min(1,(1-t)*3);
    // The opening faces the penguin; spikes point into the struck surface.
    if(e.sprite==='wall-hit')drawSprite(c,art,'effect-'+e.sprite,0,-size*.5,size*.6,size);
    else drawSprite(c,art,'effect-'+e.sprite,-size*.5,-size*.48,size,size*.48);
    c.restore();
  }
}
