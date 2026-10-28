const smooth=value=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export function waterCurrentAt(level,x,y){
  for(const flow of level.currents||[]){
    if(x<=flow.x1||x>=flow.x2||y<=flow.y1||y>=flow.y2)continue;
    const blend=flow.blend||60;
    return flow.speed*smooth(Math.min(x-flow.x1,flow.x2-x)/blend)*smooth(Math.min(y-flow.y1,flow.y2-y)/blend);
  }
  return 0;
}
