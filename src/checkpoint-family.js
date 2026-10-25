import {drawGroundedSprite} from './grounded-art.js';

export function checkpointFamilySprite(player,index){
  const reached=player.checkpointIndex??(player.checkpoint?0:-1);
  return index<=reached?'checkpoint-family-greeting':'checkpoint-family-standing';
}

export function drawCheckpointFamily(c,art,level,cam,cp,index,player){
  // Leave the nest and the arriving player clear; adults match the hero's height.
  drawGroundedSprite(c,art,checkpointFamilySprite(player,index),level,cam,
    cp.x+105,cp.y+22,96,64,.5,true);
}
