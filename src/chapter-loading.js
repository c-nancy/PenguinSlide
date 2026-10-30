// Dynamic sprite families must be declared alongside literal level references.
export function chapterSpriteIds(level){
 const ids=new Set();
 function visit(v){if(typeof v==='string')ids.add(v);else if(v&&typeof v==='object')Object.values(v).forEach(visit);}
 visit(level);
 for(const r of level.rocks||[])for(let i=0;i<2;i++)ids.add(`${r.sprite}-break-${i}`);
 if(!level.tutorial)for(const b of level.birds||[])for(const pose of ['standing','fly','folded'])ids.add(`bird-${b.species}-${pose}`);
 if(level.checkpoints?.length){ids.add('checkpoint-family-standing');ids.add('checkpoint-family-greeting');}
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
