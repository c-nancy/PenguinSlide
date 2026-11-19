import {drawGroundedSprite} from './grounded-art.js';

export function checkpointFamilySprite(player,index){
  const reached=player.checkpointIndex??(player.checkpoint?0:-1);
  return index<=reached?'checkpoint-family-greeting':'checkpoint-family-standing';
}

export function drawCheckpointFamily(c,art,level,cam,cp,index,player){
  // Larger emperor penguins stand beyond the nest and remain clear of the player.
  const compact=cp.id==='chapter-3-flag-1';
  const scale=1.2,width=(compact?100:132)*scale,height=(compact?67:88)*scale;
  // Keep the family's nest-side edge in place as the whole sprite grows.
  const offset=(compact?100:123)+width*(1-1/scale)/2;
  drawGroundedSprite(c,art,checkpointFamilySprite(player,index),level,cam,
    cp.x+offset,cp.y+22,width,height,.5,true);
}
