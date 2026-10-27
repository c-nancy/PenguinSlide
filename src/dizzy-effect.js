import {drawSprite} from './art.js';
import {HEALTH} from './health.js';

export function dizzyFrame(p){
  if(p.dead||!(p.invulnerable>0))return -1;
  return Math.floor(Math.max(0,HEALTH.protection-p.invulnerable)/.09)%6;
}

export function drawDizzyEffect(c,art,p,x,y){
  const frame=dizzyFrame(p);if(frame<0)return;
  const id='effect-dizzy-'+frame,sprite=art.sprites.get(id);if(!sprite)return;
  const width=46,height=width*sprite.rect.h/sprite.rect.w;
  c.save();c.globalAlpha=Math.min(1,p.invulnerable/.12);
  drawSprite(c,art,id,x-width/2,y-height+2,width,height);c.restore();
}
