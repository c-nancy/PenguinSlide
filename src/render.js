import {drawRings} from './bubble-rings.js';
import {drawAmbientBubbles} from './ambient-bubbles.js';
import {drawDizzyEffect} from './dizzy-effect.js';
import {drawImpactEffects} from './impact-effects.js';
import {CONFIG,remainingCharge} from './physics.js';
import {surfaceAt} from './level.js';
import {drawSprite,animationFrame,surfaceTransform} from './art.js';
import {characterMotion} from './character-state.js';
import {drawEnergyBubbles} from './energy-bubbles.js';
import {drawCurrents} from './current-art.js';
import {drawGroundedSprite} from './grounded-art.js';
import {drawCheckpointFamily} from './checkpoint-family.js';
import {SNOW_CAP} from './snow-cap.js';
import {drawWallPencilEdges} from './pencil-edge.js';
import {snowCapStrip} from './snow-cap-ends.js';
import {drawFloatingIce} from './floating-ice.js';
import {modularSlab} from './modular-slab.js';
import {drawWallCracks} from './wall-cracks.js';
import {drawTutorialKeys} from './tutorial-guidance.js';
import {rockBounds} from './rock-outline.js';
import {rockAppearance} from './stone-animation.js';
import {drawBirds} from './birds.js';
export {resetPose} from './character-state.js';
const W=1280,H=720;
function polygon(c,s,cam){c.beginPath();c.moveTo(s.x1-cam.x,s.y1-cam.y);c.lineTo(s.x2-cam.x,s.y2-cam.y);c.lineTo(s.x2-cam.x,s.bottom-cam.y);c.lineTo(s.x1-cam.x,s.bottom-cam.y);c.closePath();}
function terrain(c,art,s,cam,solids){
  const t=surfaceTransform(s,cam),height=s.bottom-Math.min(s.y1,s.y2);
  if(s.kind==='floe'||s.kind==='tunnel'){
    // These sprites already contain their own irregular ice silhouette.
    // Leave transparent corners clear instead of backing them with a box.
    c.save();polygon(c,s,cam);c.clip();
    const slab=s.kind==='tunnel'?modularSlab(art,t.width,s.bottom-s.y1):null;
    if(slab){c.save();c.transform(1,t.slope,0,1,t.x,t.y);c.drawImage(slab.canvas,0,slab.y,slab.width,slab.height);c.restore();drawWallCracks(c,art,s,cam);}
    else drawFloatingIce(c,art,s,cam);
    c.restore();return;
  }
  c.save();polygon(c,s,cam);c.clip();
  c.transform(1,t.slope,0,1,t.x,t.y);
  const source=art.sprites.get('ice-wall-repeat')||art.sprites.get('ice-cliff');
  const image=art.wallTexture||art.images.get(source.url||art.ENV+source.file);
  const r=art.wallTexture?{x:0,y:0,w:image.width,h:image.height}:source.rect;
  const tile=320,start=Math.max(0,Math.floor((cam.x-s.x1)/tile)*tile);
  for(let x=start;x<t.width&&x<cam.x-s.x1+W+tile;x+=tile){
    for(let y=SNOW_CAP.wallStart;y<height+tile;y+=tile){
      c.drawImage(image,r.x,r.y,r.w,r.h,x,y,tile+.5,tile+.5);
    }
  }
  c.restore();
  drawWallCracks(c,art,s,cam);
  drawWallPencilEdges(c,art,s,solids,cam);
  // Preserve the snow's top silhouette instead of clipping it to a straight
  // collision edge. Only the platform's horizontal extent limits this layer.
  const cap=art.snowCapTexture;
  if(cap){
    c.save();c.transform(1,t.slope,0,1,t.x,t.y);
    const strip=snowCapStrip(art,s,solids);
    if(strip)c.drawImage(strip.canvas,strip.x,strip.y,strip.width,strip.height);
    else{
      c.beginPath();c.rect(0,SNOW_CAP.y,t.width,SNOW_CAP.height);c.clip();
      for(let x=start;x<t.width&&x<cam.x-s.x1+W+tile;x+=SNOW_CAP.width)
        c.drawImage(cap,0,0,cap.width,cap.height,x,SNOW_CAP.y,SNOW_CAP.width+.5,SNOW_CAP.height);
    }
    c.restore();
  }
}
function penguin(c,art,p,cam,time,level,menu=false){
  const {pose,walkTime,landAge,facing,swimTilt}=characterMotion(p,time,menu);
  const clip=art.character.animations[pose];
  const frame=pose==='landing'?clip.frames[p.grounded?animationFrame(clip,.15+landAge):0]:clip.frames[animationFrame(clip,pose==='walk'?walkTime:time)];
  const scale=(pose==='slide'||pose==='swim'?69/clip.frames[0].contentBounds[2]:48/clip.frames[0].contentBounds[3])*(menu?3.25:1);
  const [bx,by,bw,bh]=frame.contentBounds,x=menu?W/2:p.x-cam.x,y=menu?445:p.y-cam.y+(p.grounded?3:0);
  let tilt=0;
  if(pose==='swim')tilt=swimTilt;
  else if(p.grounded){
    if(pose!=='idle'){
      const ground=level.solids.find(s=>p.x>=s.x1&&p.x<=s.x2&&Math.abs(surfaceAt(s,p.x)-p.y-CONFIG.halfHeight)<5);
      if(ground)tilt=Math.atan2(ground.y2-ground.y1,ground.x2-ground.x1);
    }
  }
  else if(!menu)tilt=Math.max(-.32,Math.min(.32,p.vy*.0003))*facing;
  c.save();c.translate(x,y);c.rotate(tilt);c.scale(facing,1);
  const anchorY=menu?0:p.grounded?CONFIG.halfHeight:-bh*scale/2;
  c.drawImage(art.images.get(art.CHARACTER+clip.spritesheet),frame.x+bx,by,bw,bh,-bw*scale/2,anchorY-(p.grounded||menu?bh*scale:0),bw*scale,bh*scale);
  c.restore();
  if(!menu){
    const hx=bw*scale*(pose==='swim'||pose==='slide'?.36:.24)*facing;
    const hy=anchorY+bh*scale*(p.grounded?-.9:.12);
    drawDizzyEffect(c,art,p,x+hx*Math.cos(tilt)-hy*Math.sin(tilt),y+hx*Math.sin(tilt)+hy*Math.cos(tilt));
  }
}
const PROP_SIZE={cairn:[36,34],signpost:[73,66],rocks:[100,45],buoy:[42,66],footprints:[88,24],'cave-arch':[210,150],'ice-cracks':[100,82],envelope:[38,25],'home-lighthouse':[260,285],lighthouse:[100,155],checkpoint:[96,25.47]};
const GROUND_PROPS=new Set(['cairn','signpost','rocks','footprints','envelope','home-lighthouse','lighthouse','checkpoint']);
function decorations(c,art,level,cam,behind=false){
  for(const item of level.decorations||[]){
    if((item.kind==='cave-arch')!==behind)continue;
    const [dw,dh]=PROP_SIZE[item.kind]||[60,60],w=item.w||dw,h=item.h||dh;
    if(item.x+w<cam.x||item.x-w>cam.x+W)continue;
    c.save();if(behind)c.globalAlpha=.42;
    if(GROUND_PROPS.has(item.kind))drawGroundedSprite(c,art,item.kind,level,cam,item.x,item.y,w,h);
    else drawSprite(c,art,item.kind,item.x-w/2-cam.x,item.y-h-cam.y,w,h);
    c.restore();
  }
}
function landmarks(c,art,level,cam,p,mode){
  for(const [index,cp] of (level.checkpoints||[]).entries()){
    const x=cp.x-cam.x,y=cp.y+CONFIG.halfHeight-cam.y;
    if(x< -170||x>W+100)continue;
    const nest=art.sprites.get('checkpoint'),w=96,h=w*nest.rect.h/nest.rect.w;
    drawGroundedSprite(c,art,'checkpoint',level,cam,cp.x,cp.y+CONFIG.halfHeight,w,h);
    drawCheckpointFamily(c,art,level,cam,cp,index,p);
  }
  const goal=level.goal;if(!goal)return;
  const x=goal.x-cam.x,y=goal.y-cam.y;
  if(x< -360||x>W+360)return;
  if(goal.kind==='lighthouse'){
    // Keep the porch over the goal, but ground the whole rock foundation.
    c.save();const glow=c.createRadialGradient(x,y-30,2,x,y-30,90);glow.addColorStop(0,'#d6b66a55');glow.addColorStop(1,'#d6b66a00');c.fillStyle=glow;c.fillRect(x-90,y-120,180,180);c.restore();
    drawGroundedSprite(c,art,'home-lighthouse',level,cam,goal.x,goal.y,290,310,.78);
  }else if(goal.kind==='beacon')drawGroundedSprite(c,art,'lighthouse',level,cam,goal.x,goal.y,104,158);
  else if(goal.kind==='shore')drawGroundedSprite(c,art,'finish-flag',level,cam,goal.x+50,goal.y,62,76);
  else if(goal.kind==='cave-exit')drawGroundedSprite(c,art,'finish-flag',level,cam,goal.x+45,goal.y,62,76);
}
function scenery(c,art,level,cam,sy){
  const width=Math.max(1800,W+level.width*.07),height=width*1024/1536;
  const seaBlend=level.openSeaFrom===undefined?0:Math.max(0,Math.min(1,(cam.x+W*.45-level.openSeaFrom)/700));
  const backdrop=(theme,opacity)=>{
    if(opacity<=0)return;
    const url=art.backgrounds?.get(theme)||art.ENV+'coast-background.png';
    c.save();c.globalAlpha=opacity*(theme==='cave'?.72:1);
    if(theme==='cave')c.drawImage(art.images.get(url),-cam.x*.07,-120-cam.y*.12,width,960);
    else c.drawImage(art.images.get(url),-cam.x*.07,sy-height*.72,width,height);
    c.restore();
  };
  const theme=level.theme||'coast';
  backdrop(theme,1-seaBlend);backdrop('home',seaBlend);
  if(theme==='ridge'||theme==='home'||seaBlend>0){
    const home=theme==='home'||seaBlend>0;
    const size=home?60:36,x=1040-cam.x*.025,y=sy+2;
    c.save();c.globalAlpha=home?.64*(seaBlend||1):.42;
    drawSprite(c,art,'home-lighthouse',x,y-size,size*.94,size);c.restore();
  }
}
export function render(c,state,level){
  const {p,cam,time,particles,mode,art}=state;
  c.clearRect(0,0,W,H);c.fillStyle='#f2ecdf';c.fillRect(0,0,W,H);if(!art)return;
  const sy=level.waterY-cam.y,bed=level.bottom-cam.y;
  scenery(c,art,level,cam,sy);
  if(sy<H){
    c.save();c.beginPath();c.rect(0,Math.max(0,sy),W,H);c.clip();
    // The parallax image must still cover the screen at the far end of long levels.
    const underwaterX=Math.min(0,-cam.x*.045);
    const underwaterWidth=Math.max(1580,W+Math.max(0,level.width-1160)*.045+16);
    c.drawImage(art.images.get(art.backgrounds?.get('underwater')||art.ENV+'underwater-background.png'),underwaterX,sy,underwaterWidth,level.bottom-level.waterY+160);
    c.globalAlpha=.45;
    for(let i=0;i<12;i++){const x=i*370+110-cam.x+Math.sin(time*.4+i)*16,y=level.waterY+150+(i*83%400)-cam.y;if(x>-150&&x<W+100){
      const id=['fish','fish-school-02','fish-school-03'][i%3],sprite=art.sprites.get(id)||art.sprites.get('fish');
      const height=sprite?.rect?76*sprite.rect.h/sprite.rect.w:42;
      drawSprite(c,art,sprite?.id||'fish',x,y,76,height);
    }}
    c.restore();
  }
  if(mode!=='menu'){
    drawCurrents(c,art,level,cam,time);
    c.save();c.beginPath();for(const [left,right] of level.waters)c.rect(left-cam.x,sy,right-left,Math.max(0,bed-sy));c.clip();
    drawAmbientBubbles(c,art,state.ambientBubbles,cam,time);c.restore();
  }
  // The seabed is the bottom of the scene: fill beneath its transparent edge.
  if(bed+40<H){c.fillStyle='#777267';c.fillRect(0,bed+40,W,H-(bed+40));}
  for(let x=Math.floor(cam.x/240)*240;x<cam.x+W+240;x+=240){
    drawSprite(c,art,'seabed',x-cam.x,bed-28,252,74);if(x%480===0){
    const index=((x/480)%3+3)%3,id=['kelp','kelp-02','kelp-03'][index],sprite=art.sprites.get(id)||art.sprites.get('kelp');
    const ratio=sprite?.rect?sprite.rect.w/sprite.rect.h:65/94,height=Math.min(94,96/ratio),width=height*ratio;
    drawSprite(c,art,sprite?.id||'kelp',x+92-cam.x-width/2,bed+2-height,width,height);
  }}
  if(mode!=='menu'){
    decorations(c,art,level,cam,true);
    for(const s of level.solids)if(s.x2>cam.x&&s.x1<cam.x+W)terrain(c,art,s,cam,level.solids);
    decorations(c,art,level,cam);
    for(const original of level.rocks||[]){
      const rock=rockAppearance(original,p);
      const bounds=rockBounds(rock);
      drawSprite(c,art,rock.sprite,bounds.left-cam.x,bounds.top-cam.y,rock.w,rock.h);
    }
    landmarks(c,art,level,cam,p,mode);
  }
  if(sy>-25&&sy<H)for(const [left,right] of level.waters){
    c.save();c.beginPath();c.rect(left-cam.x,sy-7,right-left,28);c.clip();
    for(let x=left;x<right;x+=180)if(x+180>cam.x&&x<cam.x+W)drawSprite(c,art,'waterline',x-cam.x,sy-6+Math.sin(time*2)*1.2,184,23);
    c.restore();
  }
  if(mode==='menu'){
    const wash=c.createLinearGradient(0,0,790,0);wash.addColorStop(0,'#f3ecdedf');wash.addColorStop(.7,'#f3ecdebc');wash.addColorStop(1,'#f3ecde00');c.fillStyle=wash;c.fillRect(0,0,790,H);
    drawSprite(c,art,art.sprites.has('floe-original-pointed')?'floe-original-pointed':'ice-floe',W/2-158,438,310,145);
  }
  for(const effect of state.waterEffects||[]){const age=time-effect.born;if(age>=0&&age<.6){c.save();c.globalAlpha=1-age/.6;drawSprite(c,art,effect.kind,effect.x-cam.x-42,sy-64-age*12,84,75);c.restore();}}
  if(mode!=='menu')drawBirds(c,art,state.birds||[],cam);
  penguin(c,art,p,cam,time,level,mode==='menu');
  drawRings(c,art,state.rings,cam);
  drawImpactEffects(c,art,state);
  if(p.wet&&mode==='playing'&&level.depthCharge!==false){
    drawEnergyBubbles(c,remainingCharge(p),p.x-cam.x,p.y-cam.y);
  }
  drawTutorialKeys(c,art,level,p,cam,mode);
  for(const a of particles){c.save();c.globalAlpha=Math.max(0,a.life/a.maxLife);if(a.kind==='bubble'){c.strokeStyle='#686b60';c.lineWidth=1;c.beginPath();c.arc(a.x-cam.x,a.y-cam.y,a.size,0,Math.PI*2);c.stroke();}else{c.fillStyle=a.kind==='hurt'?'#a7655a':a.kind==='gold'?'#a18a56':'#eee8da';c.fillRect(a.x-cam.x,a.y-cam.y,a.size,a.size);}c.restore();}
}
