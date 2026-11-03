// Dynamic sprite families must be declared alongside literal level references.
export function chapterSpriteIds(level){
 // These are drawn procedurally in every chapter, without literal level references.
 const ids=new Set(['seabed','kelp','kelp-02','kelp-03','fish','fish-school-02','fish-school-03',
  'waterline','splash-entry','splash-breach','ice-wall-repeat','snow-cap-repeat','ice-edge-pencil','snow-cap-end',
  'crack-long','crack-diagonal','crack-cross','effect-landing-soft','effect-landing-hard','effect-wall-hit']);
 for(let i=0;i<6;i++)ids.add(`effect-dizzy-${i}`);
 for(const size of ['small','medium','large'])for(const suffix of ['','-pop','-scatter'])ids.add(`bubble-${size}${suffix}`);
 function visit(v){if(typeof v==='string')ids.add(v);else if(v&&typeof v==='object')Object.values(v).forEach(visit);}
 visit(level);
 for(const r of level.rocks||[])for(let i=0;i<2;i++)ids.add(`${r.sprite}-break-${i}`);
 if(!level.tutorial)for(const b of level.birds||[])for(const pose of ['standing','fly','folded'])ids.add(`bird-${b.species}-${pose}`);
 for(const s of level.solids||[]){
  if(s.kind==='floe')ids.add(s.floeVariant||'floe-original-pointed');
  if(s.kind==='tunnel')ids.add('floe-original-flat');
 }
 if(level.decorations?.some(d=>['rocks','cairn'].includes(d.kind)))for(const name of ['original-cairn','original-rocks','low','staggered','twin'])ids.add('stones-'+name);
 if(level.checkpoints?.length){ids.add('checkpoint');ids.add('checkpoint-family-standing');ids.add('checkpoint-family-greeting');}
 if(['ridge','home'].includes(level.theme)||level.openSeaFrom!==undefined||level.goal?.kind==='lighthouse')ids.add('home-lighthouse');
 if(level.goal?.kind==='beacon')ids.add('lighthouse');
 if(['shore','cave-exit'].includes(level.goal?.kind))ids.add('finish-flag');
 return ids;
}
export function createImageQueue(load,limit=3){
 const promises=new Map(),queue=[];let active=0;
 const pump=()=>{while(active<limit&&queue.length){const job=queue.shift();active++;Promise.resolve().then(()=>load(job.url)).then(job.resolve,error=>{promises.delete(job.url);job.reject(error);}).finally(()=>{active--;pump();});}};
 return (url,background=false)=>{
  if(promises.has(url))return promises.get(url);
  const promise=new Promise((resolve,reject)=>{const job={url,resolve,reject};background?queue.push(job):queue.unshift(job);});
  promises.set(url,promise);pump();return promise;
 };
}
