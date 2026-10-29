export function cameraY(level,player){
  const lowerLimit=level.bottom-678;
  return level.cameraY??Math.max(-360,Math.min(lowerLimit,player.y-335));
}

// During a rapid dive, do not let camera smoothing leave the swimmer below the screen.
export function constrainCameraY(level,player,currentY){
  return level.cameraY===undefined&&player.wet?Math.max(currentY,player.y-658):currentY;
}
