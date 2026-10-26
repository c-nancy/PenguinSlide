export function cameraY(level,player){
  return level.cameraY??Math.max(-360,Math.min(440,player.y-335));
}
