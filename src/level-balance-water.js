const ice=(id,x1,x2,y,bottom=y+140)=>({id,x1,x2,y1:y,y2:y,bottom,kind:'floe',floeVariant:'floe-shallow'});
const add=(level,solid)=>{if(!level.solids.some(s=>s.id===solid.id))level.solids.splice(level.solids.length-1,0,solid);};

// Fixed receivers give a moving floe a destination, while the water remains a
// recovery route. Clearances include the moving floe's full push allowance.
export function balanceWaterLevels(levels){
 const drift=levels[3];
 Object.assign(drift.movingIce[0],{period:18,amplitude:140});
 drift.movingIce.find(s=>s.id==='current-ride').end=4320;
 add(drift,ice('current-relay',4800,5100,325));
 add(drift,ice('transfer-relay',8310,8500,325));

 const seals=levels[4];
 // Open water at every shore lets a swimmer dive before entering seal territory.
 Object.assign(seals.movingIce.find(s=>s.id==='safe'),{x1:820,x2:1220,amplitude:140});
 Object.assign(seals.movingIce.find(s=>s.id==='pair-a'),{x1:2565,x2:2955,amplitude:285});
 Object.assign(seals.movingIce.find(s=>s.id==='triple-a'),{x1:5240,x2:5620,amplitude:260});
 // Leave broad exit columns so swimming never depends on waiting for the
 // final shuttle to expose the last few pixels beside the shore.
 Object.assign(seals.movingIce.find(s=>s.id==='pair-b'),{x1:3500,x2:3890,amplitude:100,period:22});
 Object.assign(seals.movingIce.find(s=>s.id==='triple-c'),{x1:6450,x2:6830,amplitude:50,period:20});
 // The fixed body sits below moving ice, with a broad shallow and deep choice.
 add(seals,ice('swim-entry-ice',1030,1220,650,800));
 add(seals,{id:'swim-turn-ridge',x1:3060,x2:3270,y1:760,y2:760,bottom:1280,kind:'shelf'});
 // The chase ends before the mandatory rise, leaving a broad recovery turn.
 Object.assign(seals.seals[0],{x:900,y:550});
 Object.assign(seals.seals[1],{left:2200,right:2780,x:2500});

 const high=levels[7];
 for(const floe of high.movingIce.slice(1))floe.period=10;
 add(high,ice('high-relay',4790,5050,235,410));
 add(high,ice('high-near',7440,7790,245,420));
 add(high,ice('high-far',7900,8400,310,470));

 const tide=levels[8];
 add(tide,ice('tide-preparation',4370,4650,370,540));
 // A shorter local cycle retains about six seconds of fully high water.
 // Arrival preparation now overlaps the rise instead of a long idle wait.
 tide.tide={...tide.tide,period:18,hold:2,phase:-2};
 tide.decorations=tide.decorations.map(d=>d.kind==='buoy'&&d.x===6000?{...d,x:7750}:d);

 const gates=levels[9];
 Object.assign(gates.movingIce[0],{x1:3190,x2:3570});
 add(gates,ice('inlet-final-rest',5600,5960,350,520));
}
