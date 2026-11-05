// Campaign-only geometry. Replacing by stable IDs keeps repeated application safe.
const block=(id,x1,x2,y1,y2=y1,kind='floe',bottom=1280)=>({id,x1,x2,y1,y2,kind,bottom,...(kind==='floe'?{floeVariant:'floe-original-flat'}:{})});
const roof=(id,x1,x2,bottom)=>block(id,x1,x2,200,200,'tunnel',bottom);
const add=(level,...solids)=>{
 const ids=new Set(solids.map(s=>s.id));
 level.solids=level.solids.filter(s=>!ids.has(s.id));
 level.solids.push(...solids);
 level.solids.sort((a,b)=>a.x1-b.x1);
};
export function balanceEarlyLevels(levels){
 const [floe,cave,current]=levels;
 if(floe?.id==='chapter-1'){
  Object.assign(floe.solids.find(s=>s.x1===1040),{x2:1650,y1:300,y2:300,bottom:620,floeVariant:'floe-original-flat'});
  add(floe,block('early-low-step',3860,4300,340,340,'floe',580),block('early-high-step',4500,4880,270,270,'floe',580),
   roof('early-choice-roof',5660,5930,650),block('early-choice-ridge',6200,6490,620,620,'shelf'),
   block('early-upper-runout',6540,6740,280,330,'ramp',500));
 }
 if(cave?.id==='chapter-2'){
  const ceiling=cave.solids.find(s=>s.x1===3060);
  Object.assign(ceiling,{x2:3410,bottom:680});
  // Keep the old decoration on the shortened ceiling, rather than at its
  // former world position in the now-open gap.
  cave.decorations=cave.decorations.map(d=>d.kind==='ice-cracks'?{...d,x:(ceiling.x1+ceiling.x2)/2}:d);
  // Preserve the floe's size while lowering its whole painted/collision body
  // into the water; its snow surface sits 30 px above the waterline.
  Object.assign(cave.solids.find(s=>s.kind==='floe'&&s.x1===4300),{y1:350,y2:350,bottom:570});
  Object.assign(cave.solids.find(s=>s.id==='early-second-shelf'||s.x1===4150),{x1:3500,x2:3780,y1:790,y2:790,id:'early-second-shelf'});
  add(cave,block('early-first-ridge',1190,1550,850,850,'ridge'),roof('early-second-roof',3960,4100,830),
   roof('early-later-roof',5880,6230,650),block('early-later-ridge',6360,6500,840,840,'shelf'),
   roof('early-exit-roof',8220,8430,540));
 }
 if(current?.id==='chapter-3'){
  Object.assign(current.currents[0],{x2:1550,speed:180});
  Object.assign(current.currents[1],{x2:4250});
  Object.assign(current.currents[3],{x2:10700});
  current.solids=current.solids.filter(s=>s.id!=='early-gentle-brake');
  add(current,roof('early-braking-roof',4510,4780,610),
   block('early-reverse-ridge',7120,7510,810,810,'shelf'),roof('early-reverse-exit',7900,8150,830),
   block('early-current-reception',11200,11840,395,350,'ramp',620));
 }
 return levels;
}
