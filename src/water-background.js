export function waterBackgroundFrame(level,cam){
 const source=level.source||level;
 const top=source.gates?310:source.waterY-(source.tide?.amplitude||0);
 return {horizonY:source.waterY-cam.y,underwaterY:top-cam.y,underwaterHeight:source.bottom-top+160};
}

export function visibleWaterRegions(level,cam,width=1280){
 if(!level.basinSurfaces)return [{left:cam.x,right:cam.x+width,waterY:level.waterY}];
 // Camera padding can expose space outside the physical world. Continue the
 // outer sea through that padding while preserving every interior basin edge.
 return level.basinSurfaces.map(region=>({...region,
  left:region.left<=0?Math.min(region.left,cam.x):region.left,
  right:region.right>=level.width?Math.max(region.right,cam.x+width):region.right
 }));
}
