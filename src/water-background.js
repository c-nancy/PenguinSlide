export function waterBackgroundFrame(level,cam){
 const source=level.source||level;
 const top=source.gates?310:source.waterY-(source.tide?.amplitude||0);
 return {horizonY:source.waterY-cam.y,underwaterY:top-cam.y,underwaterHeight:source.bottom-top+160};
}
