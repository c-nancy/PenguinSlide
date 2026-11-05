export function balanceThinLevels(levels){
 const intro=levels[5],sequel=levels[6];
 if(intro?.id==='chapter-6'){
  intro.thinIce.find(s=>s.id==='run-a').x2=2300;
  intro.thinIce.find(s=>s.id==='run-b').x2=2710;
  Object.assign(intro.solids.find(s=>s.x1===2790),{id:'thin-middle-rest',y1:320,y2:320});
  // Two cracking groups surround a permanent landing in the last pool.
  intro.thinIce=intro.thinIce.filter(s=>s.id!=='choice-3');
  Object.assign(intro.thinIce.find(s=>s.id==='choice-4'),{x1:7010,x2:7160,y1:320,y2:320,bottom:410});
  Object.assign(intro.thinIce.find(s=>s.id==='choice-5'),{x1:7250,x2:7400});
  if(!intro.solids.some(s=>s.id==='thin-final-rest'))intro.solids.push({id:'thin-final-rest',x1:6651,x2:6900,y1:320,y2:320,bottom:480,kind:'floe',floeVariant:'floe-shallow'});
  if(!intro.solids.some(s=>s.id==='thin-tunnel-exit-ridge'))intro.solids.push({id:'thin-tunnel-exit-ridge',x1:5010,x2:5100,y1:630,y2:630,bottom:1040,kind:'shelf'});
  intro.solids.sort((a,b)=>a.x1-b.x1);
 }
 if(sequel?.id==='chapter-7'){
  Object.assign(sequel.solids.find(s=>s.x1===2540),{id:'thin-sequel-middle',y1:315,y2:315,floeVariant:'floe-shallow'});
  Object.assign(sequel.thinIce.find(s=>s.id==='fur-c'),{x1:2940});
  Object.assign(sequel.solids.find(s=>s.x1===6651),{id:'thin-sequel-high',y1:320,y2:320});
  Object.assign(sequel.solids.find(s=>s.x1===7482),{id:'thin-sequel-low',y1:350,y2:350});
  Object.assign(sequel.thinIce.find(s=>s.id==='last-4'),{x1:7060,x2:7240,y1:320,y2:320,bottom:410});
  Object.assign(sequel.thinIce.find(s=>s.id==='last-5'),{x1:7330,x2:7442,y1:350,y2:350,bottom:440});
  Object.assign(sequel.thinIce.find(s=>s.id==='last-7'),{x1:7820,x2:8000,y1:350,y2:350,bottom:440});
  if(!sequel.solids.some(s=>s.id==='thin-low-reception-roof'))sequel.solids.push({id:'thin-low-reception-roof',x1:7810,x2:7940,y1:180,y2:180,bottom:303,kind:'tunnel'});
  sequel.solids.sort((a,b)=>a.x1-b.x1);
 }
 return levels;
}
