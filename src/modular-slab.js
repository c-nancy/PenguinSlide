import {createSnowCapTexture} from './snow-cap.js';

const CUT={side:56,top:88,bottom:0};
export function slabLayout(width,height){
  const scale=Math.min(.65,width/(CUT.side*2),height/(CUT.top+CUT.bottom));
  const side=CUT.side*scale,top=CUT.top*scale,bottom=CUT.bottom*scale;
  return {width,height,scale,side,top,bottom,coreWidth:Math.max(0,width-side*2),coreHeight:Math.max(0,height-top-bottom)};
}

export function createSlabParts(image,sprite){
  const r=sprite.rect,middleWidth=r.w-CUT.side*2;
  return {image,rect:r,topInset:Math.min(...sprite.topRows),
    top:createSnowCapTexture(image,{x:r.x+CUT.side,y:r.y,w:middleWidth,h:CUT.top})};
}

const caches=new WeakMap();
export function modularSlab(art,width,height){
  if(!art.slabParts||!art.wallTexture)return null;
  let cache=caches.get(art);if(!cache){cache=new Map();caches.set(art,cache);}
  const key=width+':'+height;if(cache.has(key))return cache.get(key);
  const parts=art.slabParts,offset=-parts.topInset*.65,layout=slabLayout(width,height-offset);
  const {side,top,scale,coreWidth}=layout,resolution=2;
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(width*resolution);canvas.height=Math.ceil(layout.height*resolution);
  const c=canvas.getContext('2d');c.scale(resolution,resolution);
  const area=(x,y,w,h,draw)=>{if(w<=0||h<=0)return;c.save();c.beginPath();c.rect(x,y,w,h);c.clip();draw();c.restore();};
  // Only the interior is enlarged; its graphite remains at the wall material's
  // normal 320px repeat size, instead of enlarging the original slab's strokes.
  const inset=5,join=16,wallTop=top-join,base=layout.height-3;
  area(inset,wallTop,width-inset*2,base-wallTop,()=>{
    for(let y=wallTop;y<base;y+=320)for(let x=inset;x<width-inset;x+=320)
      c.drawImage(art.wallTexture,x,y,320.5,320.5);
  });
  const edge=art.pencilEdgeTexture;
  if(edge){
    for(const x of [inset,width-inset])area(x-3,wallTop,6,base-wallTop,()=>{
      for(let y=wallTop;y<base;y+=320)c.drawImage(edge,x-3,y,6,320.5);
    });
    // Reuse the same transparent graphite stroke sideways; no source icicle
    // strip or corner fragments remain along the bottom.
    area(inset-3,base-3,width-inset*2+6,6,()=>{
      c.translate(inset,base);c.rotate(-Math.PI/2);
      for(let x=0;x<width-inset*2;x+=320)c.drawImage(edge,-3,x,6,320.5);
    });
  }
  const r=parts.rect;
  // Fade the cut through the ice below the snow instead of exposing a straight
  // pale crop line across the new wall material.
  const topLayer=document.createElement('canvas');topLayer.width=canvas.width;topLayer.height=Math.ceil(top*resolution);
  const tc=topLayer.getContext('2d');tc.scale(resolution,resolution);
  const topStep=parts.top.width*scale;
  tc.save();tc.beginPath();tc.rect(side,0,coreWidth,top);tc.clip();
  for(let x=side;x<width-side;x+=topStep)tc.drawImage(parts.top,x,0,topStep+.5,top);
  tc.restore();
  tc.drawImage(parts.image,r.x,r.y,CUT.side,CUT.top,0,0,side,top);
  tc.drawImage(parts.image,r.x+r.w-CUT.side,r.y,CUT.side,CUT.top,width-side,0,side,top);
  const fade=tc.createLinearGradient(0,top-join,0,top);fade.addColorStop(0,'#fff');fade.addColorStop(1,'#fff0');
  tc.globalCompositeOperation='destination-in';tc.fillStyle=fade;tc.fillRect(0,0,width,top);
  c.drawImage(topLayer,0,0,width,top);
  const result={canvas,width,height:layout.height,y:offset,layout};cache.set(key,result);return result;
}
