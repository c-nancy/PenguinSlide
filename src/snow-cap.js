export const SNOW_CAP={width:320,height:48,y:-6,wallStart:18};

// Crossfade matching horizontal edge bands with premultiplied-alpha addition.
// The transparent contour remains transparent; no pale backing is painted.
export function createSnowCapTexture(image,rect){
  const make=(w,h)=>{const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;return canvas;};
  const overlap=Math.round(rect.w*.25),width=rect.w-overlap,height=rect.h;
  const tile=make(width,height),c=tile.getContext('2d');
  c.drawImage(image,rect.x,rect.y,width,height,0,0,width,height);
  const band=make(overlap,height),bc=band.getContext('2d');
  bc.drawImage(image,rect.x,rect.y,overlap,height,0,0,overlap,height);
  const first=bc.createLinearGradient(0,0,overlap,0);first.addColorStop(0,'#fff0');first.addColorStop(1,'#fff');
  bc.globalCompositeOperation='destination-in';bc.fillStyle=first;bc.fillRect(0,0,overlap,height);
  const tail=make(overlap,height),tc=tail.getContext('2d');
  tc.drawImage(image,rect.x+width,rect.y,overlap,height,0,0,overlap,height);
  const last=tc.createLinearGradient(0,0,overlap,0);last.addColorStop(0,'#fff');last.addColorStop(1,'#fff0');
  tc.globalCompositeOperation='destination-in';tc.fillStyle=last;tc.fillRect(0,0,overlap,height);
  bc.globalCompositeOperation='lighter';bc.drawImage(tail,0,0);
  c.clearRect(0,0,overlap,height);c.drawImage(band,0,0);
  return tile;
}
