import {createWaterSound} from './water-sound.js';
export const BUBBLE_CLIPS={
 little:{url:new URL('../assets/audio/se/mixkit-water-bubble-little.wav',import.meta.url).href,offset:.06,volume:.08},
 big:{url:new URL('../assets/audio/se/mixkit-liquid-bubble-big.wav',import.meta.url).href,offset:.045,volume:.08},
 ring:{url:new URL('../assets/audio/se/mixkit-deep-water-bubbles-ring.wav',import.meta.url).href,offset:.095,volume:.08}
};
export function createBubbleSound(options={}){
 const sound=createWaterSound({...options,clips:BUBBLE_CLIPS,cooldown:.06});
 let heard=new WeakSet();
 return {...sound,reset(){sound.reset();heard=new WeakSet();},
  update(bubbles,rings){
   for(const b of bubbles)if(b.phase==='burst'&&!heard.has(b)){heard.add(b);sound.play(b.size==='large'?'big':'little');}
   for(const r of rings)if(r.broken!==null&&!heard.has(r)){heard.add(r);sound.play('big');}
  }
 };
}
