import {drawGroundedSprite} from './grounded-art.js';

export function checkpointFamilySprite(player,index){
  const reached=player.checkpointIndex??(player.checkpoint?0:-1);
  return index<=reached?'checkpoint-family-greeting':'checkpoint-family-standing';
}

export function drawCheckpointFamily(c,art,level,cam,cp,index,player){
  // Larger emperor penguins stand beyond the nest and remain clear of the player.
  const compact=cp.id==='chapter-3-flag-1';
  drawGroundedSprite(c,art,checkpointFamilySprite(player,index),level,cam,
    cp.x+(compact?100:123),cp.y+22,compact?100:132,compact?67:88,.5,true);
}
