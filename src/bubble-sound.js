import {createWaterSound} from './water-sound.js';
export const BUBBLE_CLIPS={
 little:{url:new URL('../assets/audio/se/mixkit-water-bubble-little.wav',import.meta.url).href,offset:.06,volume:.08},
 big:{url:new URL('../assets/audio/se/mixkit-liquid-bubble-big.wav',import.meta.url).href,offset:.045,volume:.08},
 ring:{url:new URL('../assets/audio/se/mixkit-deep-water-bubbles-ring.wav',import.meta.url).href,offset:.095,volume:.08}
};
function visibleBurst(item,camera,radius){
 if(!camera)return true;
 const x=item.burstX??item.x,y=item.burstY??item.y;
 return x+radius>=camera.x&&x-radius<=camera.x+1280&&y+radius>=camera.y&&y-radius<=camera.y+720;
}
export function createBubbleSound(options={}){
 const sound=createWaterSound({...options,clips:BUBBLE_CLIPS,cooldown:.06});
 let heard=new WeakSet();
 return {...sound,reset(){sound.reset();heard=new WeakSet();},
  update(bubbles,rings,camera){
   for(const b of bubbles)if(b.phase==='burst'&&!heard.has(b)){heard.add(b);if(visibleBurst(b,camera,b.radius*1.5))sound.play(b.size==='large'?'big':'little');}
   for(const r of rings)if(r.broken!==null&&!heard.has(r)){heard.add(r);if(visibleBurst(r,camera,32))sound.play('big');}
  }
 };
}
