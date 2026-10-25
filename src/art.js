import {createIceWallTexture} from './ice-wall.js';
import {createSnowCapTexture} from './snow-cap.js';
import {createPencilEdgeTexture} from './pencil-edge.js';
import {floatingIceProfile} from './floating-ice.js';
import {createSlabParts} from './modular-slab.js';
export function getAssetRoots(moduleURL=import.meta.url){
  return {
    ENV:new URL('../assets/level-01/pencil-v1/',moduleURL).href,
    CHARACTER:new URL('../assets/character/animations/',moduleURL).href,
    CAMPAIGN:new URL('../assets/campaign/pencil-v1/',moduleURL).href
  };
}
const {ENV,CHARACTER,CAMPAIGN}=getAssetRoots();
export function surfaceTransform(s,cam){return {x:s.x1-cam.x,y:s.y1-cam.y,width:s.x2-s.x1,slope:(s.y2-s.y1)/(s.x2-s.x1)};}
export function animationFrame(clip,seconds){
  const total=clip.durationsMs.reduce((a,b)=>a+b,0);
  let tick=Math.max(0,seconds*1000);
  if(clip.loop)tick%=total;else tick=Math.min(tick,total-.001);
  for(let i=0;i<clip.sequence.length;i++){if(tick<clip.durationsMs[i])return clip.sequence[i];tick-=clip.durationsMs[i];}
  return clip.sequence.at(-1);
}
export async function loadArt(){
  const json=async url=>{const response=await fetch(url);if(!response.ok)throw Error(`无法载入素材 ${url}`);return response.json();};
  const [environment,character,campaign]=await Promise.all([json(ENV+'manifest.json'),json(CHARACTER+'manifest.json'),json(CAMPAIGN+'manifest.json')]);
  const images=new Map();
  const files=[...environment.backgrounds.map(item=>ENV+item.file),...environment.sprites.map(item=>ENV+item.file),...campaign.backgrounds.map(item=>CAMPAIGN+item.file),...campaign.sprites.map(item=>CAMPAIGN+item.file),...Object.values(character.animations).map(clip=>CHARACTER+clip.spritesheet)];
  await Promise.all([...new Set(files)].map(url=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>{images.set(url,image);resolve();};image.onerror=()=>reject(Error(`无法载入图片 ${url}`));image.src=url;
  })));
  const wall=environment.sprites.find(item=>item.id==='ice-wall-repeat');
  const wallTexture=wall?createIceWallTexture(images.get(ENV+wall.file)):null;
  const cap=environment.sprites.find(item=>item.id==='snow-cap-repeat');
  const snowCapTexture=cap?createSnowCapTexture(images.get(ENV+cap.file),cap.rect):null;
  const edge=environment.sprites.find(item=>item.id==='ice-edge-pencil');
  const pencilEdgeTexture=edge?createPencilEdgeTexture(images.get(ENV+edge.file),edge.rect):null;
  const end=environment.sprites.find(item=>item.id==='snow-cap-end');
  const snowEndCap=end?{image:images.get(ENV+end.file),rect:end.rect}:null;
  const sprites=new Map([...environment.sprites.map(item=>[item.id,{...item,url:ENV+item.file}]),...campaign.sprites.map(item=>[item.id,{...item,url:CAMPAIGN+item.file}])]);
  for(const id of ['ice-floe','ice-slab']){
    const sprite=sprites.get(id);if(sprite)sprite.topRows=floatingIceProfile(images.get(sprite.url),sprite.rect);
  }
  const slab=sprites.get('ice-slab'),slabParts=slab?createSlabParts(images.get(slab.url),slab):null;
  return {environment,character,campaign,images,ENV,CHARACTER,CAMPAIGN,wallTexture,snowCapTexture,pencilEdgeTexture,snowEndCap,slabParts,
    backgrounds:new Map([...environment.backgrounds.map(item=>[item.id,ENV+item.file]),...campaign.backgrounds.map(item=>[item.id,CAMPAIGN+item.file])]),
    sprites};
}
export function drawSprite(c,art,id,x,y,w,h){const sprite=art.sprites.get(id);if(!sprite)return;const r=sprite.rect;c.drawImage(art.images.get(sprite.url||art.ENV+sprite.file),r.x,r.y,r.w,r.h,x,y,w,h);}
