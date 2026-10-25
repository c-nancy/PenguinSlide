import {surfaceAt} from './level.js';
import {SNOW_CAP} from './snow-cap.js';

export function createPencilEdgeTexture(image,rect){
  const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const overlap=Math.round(rect.h*.25),height=rect.h-overlap;
  const tile=make(rect.w,height),c=tile.getContext('2d');
  c.drawImage(image,rect.x,rect.y,rect.w,height,0,0,rect.w,height);
  const band=make(rect.w,overlap),bc=band.getContext('2d');
  bc.drawImage(image,rect.x,rect.y,rect.w,overlap,0,0,rect.w,overlap);
  const a=bc.createLinearGradient(0,0,0,overlap);a.addColorStop(0,'#fff0');a.addColorStop(1,'#fff');
  bc.globalCompositeOperation='destination-in';bc.fillStyle=a;bc.fillRect(0,0,rect.w,overlap);
  const tail=make(rect.w,overlap),tc=tail.getContext('2d');
  tc.drawImage(image,rect.x,rect.y+height,rect.w,overlap,0,0,rect.w,overlap);
  const b=tc.createLinearGradient(0,0,0,overlap);b.addColorStop(0,'#fff');b.addColorStop(1,'#fff0');
  tc.globalCompositeOperation='destination-in';tc.fillStyle=b;tc.fillRect(0,0,rect.w,overlap);
  bc.globalCompositeOperation='lighter';bc.drawImage(tail,0,0);
  c.clearRect(0,0,rect.w,overlap);c.drawImage(band,0,0);
  return tile;
}

export function exposedWallSpans(s,solids,side){
  const left=side==='left',x=left?s.x1:s.x2,top=(left?s.y1:s.y2)+SNOW_CAP.wallStart;
  let spans=top<s.bottom?[{start:top,end:s.bottom}]:[];
  for(const other of solids){
    if(other===s)continue;
    const touches=left?other.x1<x-.01&&other.x2>=x-.01:other.x2>x+.01&&other.x1<=x+.01;
    if(!touches)continue;
    const a=surfaceAt(other,x),b=other.bottom;
    spans=spans.flatMap(span=>{
      if(b<=span.start||a>=span.end)return [span];
      const rest=[];
      if(a>span.start)rest.push({start:span.start,end:a});
      if(b<span.end)rest.push({start:b,end:span.end});
      return rest;
    });
  }
  return spans;
}

export function drawWallPencilEdges(c,art,s,solids,cam){
  const line=art.pencilEdgeTexture;if(!line)return;
  const width=6,repeat=320;
  for(const side of ['left','right']){
    const x=(side==='left'?s.x1:s.x2)-cam.x;
    if(x< -width||x>1280+width)continue;
    const anchor=(side==='left'?s.y1:s.y2)+SNOW_CAP.wallStart;
    for(const span of exposedWallSpans(s,solids,side)){
      if(span.end<cam.y||span.start>cam.y+720)continue;
      c.save();c.beginPath();c.rect(x-width/2,span.start-cam.y,width,span.end-span.start);c.clip();
      const first=anchor+Math.floor((Math.max(span.start,cam.y)-anchor)/repeat)*repeat;
      for(let y=first;y<Math.min(span.end,cam.y+720);y+=repeat)
        c.drawImage(line,0,0,line.width,line.height,x-width/2,y-cam.y,width,repeat+.5);
      c.restore();
    }
  }
}
