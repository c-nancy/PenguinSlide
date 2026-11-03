import {surfaceAt} from './level.js';
export const BIRD_HEIGHTS=Object.freeze({petrel:34,skua:46,albatross:86});
export const BIRD_WINGSPANS=Object.freeze({petrel:84,skua:112,albatross:240});
const exterior=(l,x)=>l.theme!=='cave'||x<600||x>7200;
const clear=(l,x,r=80)=>(l.checkpoints||[]).every(cp=>Math.abs(x-cp.x)>r+60&&Math.abs(x-(cp.x+123))>r+76);
const clearLandmark=(l,x)=>l.goal?.kind!=='lighthouse'||x<l.goal.x-290*.78-72||x>l.goal.x+290*.22+72;
export function placeBirds(level,old){
 const result=[];
 for(const [oldX,oldSpecies] of old){
  let x=oldX,species=oldSpecies==='petrel'?'skua':oldSpecies;
  if(species==='albatross'){
   const options=[];
   for(const s of level.solids){
    if(['reef','floe','tunnel','weak-wall'].includes(s.kind)||s.y1!==s.y2||s.y1>=level.waterY)continue;
    const spots=[s.x2-80];for(let px=s.x1+80;px<=s.x2-80;px+=25)spots.push(px);
    for(const px of spots)
     if(px>=s.x1+80&&px>80&&px<=level.width-80&&exterior(level,px)&&clear(level,px)&&clearLandmark(level,px))options.push({x:px,s});
   }
   options.sort((a,b)=>Math.abs(a.x-oldX)-Math.abs(b.x-oldX));
   if(options.length)x=options[0].x;else species='skua';
  }
  const s=level.solids.find(s=>!['reef','tunnel'].includes(s.kind)&&x>=s.x1&&x<=s.x2);
  if(s)result.push({x,y:surfaceAt(s,x),species,height:BIRD_HEIGHTS[species]});
 }
 const perches=[];
 for(const type of ['solids','movingIce','thinIce'])for(const [index,s] of (level[type]||[]).entries()){
  const x=(s.x1+s.x2)/2;
  if(s.kind==='floe'&&s.x2-s.x1>=140&&surfaceAt(s,x)<level.waterY&&exterior(level,x)&&clear(level,x,45))perches.push({x,y:surfaceAt(s,x),perch:{type,index}});
 }
 if(perches.length)result.push({...perches[0],species:'petrel',height:BIRD_HEIGHTS.petrel});
 // One encounter in shorter chapters; at most two, several screens apart,
 // in long chapters. Rotate the preferred species without random respawns.
 const speciesOrder=['petrel','albatross','skua'],preferred=speciesOrder[((level.chapter||1)-1)%3];
 const candidates=[...result].sort((a,b)=>(a.species===preferred?0:1)-(b.species===preferred?0:1));
 const sparse=[],limit=level.width>10000?2:1;
 for(const bird of candidates){
  if(sparse.length>=limit)break;
  if(sparse.every(other=>Math.abs(other.x-bird.x)>=3000))sparse.push(bird);
 }
 return sparse;
}
