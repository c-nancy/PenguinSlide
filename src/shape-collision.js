import {FLOE_MASK} from './floe-mask-data.js';

const cache=new WeakMap(),cell=2;
export const hasShape=s=>s.kind==='floe';
function columnsFor(s){
  if(cache.has(s))return cache.get(s);
  const width=s.x2-s.x1,slope=(s.y2-s.y1)/width,mask=FLOE_MASK,columns=[];
  for(let x=0;x<width;x+=cell){
    const center=Math.min(width,x+cell/2),band=Math.floor(center/4)*4,step=Math.min(4,width-band),overlap=band+step<width?.35:0;
    const a=Math.floor(band/width*mask.width),b=Math.min(mask.width,Math.ceil((band+step+overlap)/width*mask.width));
    let inset=mask.height;
    for(let i=a;i<b;i++)if(mask.columns[i].length)inset=Math.min(inset,mask.columns[i][0][0]);
    const source=mask.columns[Math.min(mask.width-1,Math.floor(center/width*mask.width))];
    const top=s.y1+slope*center,height=s.bottom-(s.y1+slope*(band+step/2));
    const runs=inset>=mask.height?[]:source.map(([lo,hi])=>[
      Math.max(top,top+(lo-inset)/(mask.height-inset)*height),
      Math.min(s.bottom,top+(hi-inset)/(mask.height-inset)*height)
    ]);
    columns.push({left:s.x1+x,right:s.x1+Math.min(width,x+cell),runs});
  }
  cache.set(s,columns);return columns;
}
export function shapeOverlap(s,box){
  if(box.right<=s.x1||box.left>=s.x2||box.top>=s.bottom||box.bottom<=Math.min(s.y1,s.y2))return false;
  const columns=columnsFor(s),start=Math.max(0,Math.floor((box.left-s.x1)/cell)),end=Math.min(columns.length,Math.ceil((box.right-s.x1)/cell));
  for(let i=start;i<end;i++)for(const [top,bottom] of columns[i].runs)
    if(bottom>top&&box.bottom>top+1e-5&&box.top<bottom-1e-5)return true;
  return false;
}
export function shapeSweep(s,axis,from,to,fixed,radius,halfHeight){
  if(Math.abs(to-from)<1e-9)return null;
  const occupied=value=>{
    const x=axis==='x'?value:fixed,y=axis==='y'?value:fixed;
    return shapeOverlap(s,{left:x-radius,right:x+radius,top:y-halfHeight,bottom:y+halfHeight});
  };
  const steps=Math.max(1,Math.ceil(Math.abs(to-from)/4));let safe=from;
  for(let i=1;i<=steps;i++){
    const target=from+(to-from)*i/steps;
    if(occupied(target)){
      let low=safe,high=target;
      for(let j=0;j<12;j++){const mid=(low+high)/2;if(occupied(mid))high=mid;else low=mid;}
      return {position:low};
    }
    safe=target;
  }
  return null;
}
