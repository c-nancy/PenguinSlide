const states=new WeakMap();
const swimDirectionSpeed=8,swimTurnSpeed=6;
export function resetPose(player){states.delete(player);}

// Shared by the sprite renderer and HUD so the description matches the drawing.
export function characterMotion(p,time,menu=false){
  let state=states.get(p);
  if(!state){state={grounded:p.grounded,landAt:-Infinity,gait:'idle',swimFacing:p.facing===-1?-1:1,swimTilt:0};states.set(p,state);}
  if(!menu&&p.grounded&&!state.grounded)state.landAt=time;
  if(!p.grounded||p.wet||menu)state.landAt=-Infinity;
  state.grounded=p.grounded;
  const speed=Math.abs(p.vx),landAge=time-state.landAt;
  if(p.grounded&&!p.wet&&!menu){
    // Separate rest/step thresholds keep tiny residual motion from restarting the walk.
    const standing=speed<12||(state.gait==='idle'&&speed<18);
    state.gait=standing?'idle':speed<(state.gait==='slide'?200:240)?'walk':'slide';
  }else state.gait='idle';
  const pose=menu?'idle':p.wet?'swim':p.grounded?(landAge<.44?'landing':state.gait):'landing';
  let facing=p.facing===-1?-1:1,swimTilt=0;
  if(pose==='swim'){
    const vy=p.vy||0;
    if(Math.hypot(p.vx,vy)>=swimDirectionSpeed){
      // Near vertical, keep the same mirrored side through tiny horizontal drift.
      if(p.vx>swimTurnSpeed)state.swimFacing=1;
      else if(p.vx<-swimTurnSpeed)state.swimFacing=-1;
      state.swimTilt=Math.atan2(vy*state.swimFacing,p.vx*state.swimFacing);
    }
    facing=state.swimFacing;swimTilt=state.swimTilt;
  }else{
    state.swimFacing=facing;state.swimTilt=0;
  }
  return {pose,speed,landAge,facing,swimTilt};
}
export function groundMotionLabel(pose){
  return {idle:'冰面站立',walk:'冰面行走',slide:'冰面滑行',landing:'落地缓冲'}[pose]||'冰面行走';
}
