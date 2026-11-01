export function tideSurface(level,time){
 const tide=level.tide;
 return tide?level.waterY-tide.amplitude*Math.sin(time*2*Math.PI/tide.period+(tide.phase||0)):level.waterY;
}
export function advanceTide(world,p,input,dt){
 world.tideTime=(world.tideTime||0)+dt;
 world.waterY=tideSurface(world.source,world.tideTime);
 // The tide also floods the shallow shore shelves between the open pools.
 world.waters=[[world.source.solids[0].x1,world.source.width]];
 if(p.grounded&&p.y>world.waterY){p.grounded=false;p.wet=true;}
 world.tideDiving=input.y>0;
 world.tidePreviousY=p.y;
 world.decorations=(world.source.decorations||[]).map(d=>d.kind==='buoy'?{...d,y:world.waterY}:d);
}
