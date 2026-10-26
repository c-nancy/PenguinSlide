export function floatingIceProfile(image,rect){
  const canvas=document.createElement('canvas');canvas.width=rect.w;canvas.height=rect.h;
  const c=canvas.getContext('2d');c.drawImage(image,rect.x,rect.y,rect.w,rect.h,0,0,rect.w,rect.h);
  const data=c.getImageData(0,0,rect.w,rect.h).data;
  return Array.from({length:rect.w},(_,x)=>{
    for(let y=0;y<rect.h;y++)if(data[(y*rect.w+x)*4+3]>64)return y;
    return rect.h;
  });
}

export function drawFloatingIce(c,art,s,cam){
  const id=s.kind==='tunnel'?'ice-slab':s.floeVariant||'floe-original-pointed',sprite=art.sprites.get(id)||art.sprites.get('ice-floe');
  if(!sprite)return;
  const r=sprite.rect,image=art.images.get(sprite.url||art.ENV+sprite.file);
  const width=s.x2-s.x1,slope=(s.y2-s.y1)/width,band=!sprite.topRows&&Math.abs(slope)<1e-9?width:4;
  // Map the whole sprite into the trapezoid instead of clipping a level image
  // against the sloping floor. Narrow sheared bands preserve both snow edges.
  for(let x=0;x<width;x+=band){
    const step=Math.min(band,width-x),overlap=x+step<width?.35:0,w=step+overlap;
    const top=s.y1+slope*x,height=s.bottom-(s.y1+slope*(x+step/2));
    const sourceX=x/width*r.w,sourceWidth=w/width*r.w;
    const inset=sprite.topRows?Math.min(...sprite.topRows.slice(Math.floor(sourceX),Math.min(r.w,Math.ceil(sourceX+sourceWidth)))):0;
    if(inset>=r.h)continue;
    c.save();c.transform(1,slope,0,1,s.x1+x-cam.x,top-cam.y);
    c.drawImage(image,r.x+sourceX,r.y+inset,sourceWidth,r.h-inset,0,0,w,height);
    c.restore();
  }
}
