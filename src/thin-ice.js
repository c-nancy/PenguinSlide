import {surfaceAt} from './level.js';
import {cameraY} from './camera.js';
export const THIN_URLS=[new URL('../assets/terrain/floe-variants/thin-break-01.png',import.meta.url).href,new URL('../assets/terrain/floe-variants/thin-break-02.png',import.meta.url).href,new URL('../assets/terrain/floe-variants/thin-break-03.png',import.meta.url).href];
export function advanceThin(world,p,dt){
 for(const s of world.thinActors||[]){
  if(s.phase==='cracking'){s.age+=dt;if(s.age>=1.5){s.phase='broken';s.age=0;if(p.x+17>s.x1&&p.x-17<s.x2&&Math.abs(p.y+22-s.y1)<6)p.grounded=false;}}
  else if(s.phase==='broken'||s.phase==='restoring'){
   s.age+=dt;
   const safe=p.grounded&&!p.wet&&world.source.solids.some(o=>p.x>=o.x1&&p.x<=o.x2&&Math.abs(p.y+22-surfaceAt(o,p.x))<5);
   const clearAnimals=!(world.sealActors||[]).some(a=>a.x+110>s.x1&&a.x-110<s.x2&&a.y+40>s.y1&&a.y-40<s.bottom);
   const cam=world.camera||{x:Math.max(-120,Math.min(world.source.width-1160,p.x-410)),y:cameraY(world.source,p)};
   const offscreen=s.x2<cam.x||s.x1>cam.x+1280||s.bottom+40<cam.y||s.y1-5>cam.y+720;
   const far=(p.x+100<s.x1||p.x-100>s.x2)&&clearAnimals&&offscreen;
   if(s.phase==='restoring'){
    if(!safe||!far){s.phase='broken';s.restore=0;s.age=1;}
    else if(s.age>=.6){s.phase='intact';s.age=0;s.restore=0;}
   }else {s.restore=safe&&far?(s.restore||0)+dt:0;if(s.restore>=3){s.phase='restoring';s.age=0;}}
  }
 }
 world.solids=[...world.source.solids,...world.actors,...(world.thinActors||[]).filter(s=>s.phase==='intact'||s.phase==='cracking')];
}
export function touchThin(world,p,previous){
 for(const s of world.thinActors||[]){
  if(s.phase!=='intact'||p.wet)continue;
  const crossed=Math.max(previous.x,p.x)+17>s.x1&&Math.min(previous.x,p.x)-17<s.x2;
  if(crossed&&p.grounded&&Math.abs(p.y+22-s.y1)<5){s.phase='cracking';s.age=0;}
 }
}
export function drawThin(c,art,world,cam){
 for(const s of world.thinActors||[]){
  if(s.phase==='intact'){
   c.save();c.strokeStyle='#625e56';c.globalAlpha=.55;c.lineWidth=1;
   for(const fraction of [.3,.7]){const x=s.x1+(s.x2-s.x1)*fraction-cam.x,y=s.y1-cam.y;c.beginPath();c.moveTo(x-7,y+3);c.lineTo(x,y+10);c.lineTo(x-4,y+17);c.stroke();}c.restore();continue;
  }
  if(s.phase==='broken'&&s.age>.65)continue;
  const index=s.phase==='restoring'||s.phase==='cracking'?0:s.age<.25?1:2,im=art.images.get(THIN_URLS[index]);if(!im)continue;
  c.save();c.globalAlpha=s.phase==='restoring'?s.age/.6:s.phase==='broken'?Math.min(1,(.65-s.age)/.2):1;
  const shake=s.phase==='cracking'&&s.age>1.1?Math.sin(s.age*65)*1.5:0;
  c.drawImage(im,0,260,im.width,420,s.x1-cam.x+shake,s.y1-cam.y-5,s.x2-s.x1,s.bottom-s.y1+45);c.restore();
 }
}
