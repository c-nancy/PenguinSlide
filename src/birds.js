import {drawSprite} from './art.js';

export function createBirds(level){
  if(level.tutorial)return [];
  return (level.birds||[]).map(b=>{
    const s=level.solids?.find(s=>b.x>=s.x1&&b.x<=s.x2);
    return {...b,height:b.height||28,homeX:b.x,homeY:b.y,phase:'standing',age:0,direction:b.facing||1,
      slope:s?(s.y2-s.y1)/(s.x2-s.x1):0};
  });
}
export function updateBirds(birds,p,dt){
  for(const b of birds){
    if(b.phase==='gone')continue;
    if(b.phase==='standing'){
      if(Math.abs(p.y+22-b.y)>100||Math.hypot(p.x-b.x,p.y+22-b.y)>140)continue;
      b.phase='flying';b.direction=p.x>b.x?-1:1;
    }
    b.age+=dt;
    b.x=b.homeX+b.direction*(60*b.age+65*b.age*b.age);
    b.y=b.homeY-70*b.age-35*b.age*b.age;
    if(b.age>=4.5)b.phase='gone';
  }
}
export function drawBirds(c,art,birds,cam){
  for(const b of birds){
    if(b.phase==='gone'||b.x<cam.x-160||b.x>cam.x+1440||b.y<cam.y-160||b.y>cam.y+880)continue;
    const standing=art.sprites.get(`bird-${b.species}-standing`);if(!standing)continue;
    const flying=b.phase==='flying',pose=flying?(Math.floor(b.age/.14)%2?'folded':'fly'):'standing';
    const id=`bird-${b.species}-${pose}`,sprite=art.sprites.get(id);if(!sprite)continue;
    const scale=b.height/standing.rect.h,w=sprite.rect.w*scale,h=sprite.rect.h*scale;
    c.save();c.translate(b.x-cam.x,b.y-cam.y);
    if(!flying)c.transform(1,b.slope,0,1,0,0);
    c.scale(b.direction,1);if(flying)c.rotate(-.12);
    drawSprite(c,art,id,-w/2,flying?-h/2-b.height*.5:-h+2,w,h);
    c.restore();
  }
}
