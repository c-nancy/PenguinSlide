export const VIEW_WIDTH=1280,VIEW_HEIGHT=720;

export function cameraX(level,player,width=VIEW_WIDTH,lead=0){
  const anchor=Math.min(410,width*.36);
  return Math.max(-120,Math.min(level.width-width+120,player.x-anchor+(level.cameraLead||0)+lead));
}

export function cameraY(level,player){
  const lowerLimit=level.bottom-678;
  if(level.cameraY!==undefined)return level.cameraY;
  const target=Math.max(-360,Math.min(lowerLimit,player.y-335));
  // A compact puzzle can show its low water from the dry observation ledge,
  // while high jumps retain headroom and deep dives still follow normally.
  return level.overviewY===undefined?target:Math.max(target,Math.min(level.overviewY,player.y-100));
}

// During a rapid dive, do not let camera smoothing leave the swimmer below the screen.
export function constrainCameraY(level,player,currentY){
  return level.cameraY===undefined&&player.wet?Math.max(currentY,player.y-658):currentY;
}
