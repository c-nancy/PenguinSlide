// Blend the generated material's wrap bands once at load time. Normal repeats
// then meet adjacent source pixels, without reversing the ice's grain.
export function createIceWallTexture(image){
  const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const overlapX=Math.round(image.width*.25),overlapY=Math.round(image.height*.25);
  const width=image.width-overlapX,height=image.height-overlapY;
  const horizontal=canvas(width,image.height),hc=horizontal.getContext('2d');
  hc.drawImage(image,0,0);
  const side=canvas(overlapX,image.height),sc=side.getContext('2d');
  sc.drawImage(image,width,0,overlapX,image.height,0,0,overlapX,image.height);
  const gx=sc.createLinearGradient(0,0,overlapX,0);gx.addColorStop(0,'#fff');gx.addColorStop(1,'#fff0');
  sc.globalCompositeOperation='destination-in';sc.fillStyle=gx;sc.fillRect(0,0,overlapX,image.height);hc.drawImage(side,0,0);
  const result=canvas(width,height),rc=result.getContext('2d');rc.drawImage(horizontal,0,0);
  const strip=canvas(width,overlapY),tc=strip.getContext('2d');
  tc.drawImage(horizontal,0,height,width,overlapY,0,0,width,overlapY);
  const gy=tc.createLinearGradient(0,0,0,overlapY);gy.addColorStop(0,'#fff');gy.addColorStop(1,'#fff0');
  tc.globalCompositeOperation='destination-in';tc.fillStyle=gy;tc.fillRect(0,0,width,overlapY);rc.drawImage(strip,0,0);
  return result;
}
