export const MUSIC_URL=new URL('../assets/audio/music/Snow Theme/BGM_Snow_Theme_Loop.ogg',import.meta.url).href;
const KEY='little-penguin.music.enabled';

export function createMusic(audio,storage){
  let enabled=true,unlocked=false,mode='menu';
  try{enabled=storage?.getItem(KEY)!=='false';}catch{/* Storage is optional. */}
  audio.src=MUSIC_URL;
  audio.loop=true;audio.preload='none';audio.volume=.3;audio.playbackRate=1;
  function sync(){
    if(enabled&&unlocked&&['playing','transition'].includes(mode)){
      if(audio.paused)try{Promise.resolve(audio.play()).catch(()=>{});}catch{/* Playback may need another gesture. */}
    }else audio.pause();
  }
  return {
    get enabled(){return enabled;},
    unlock(){unlocked=true;sync();},
    setMode(value){mode=value;sync();},
    toggle(){enabled=!enabled;unlocked=true;try{storage?.setItem(KEY,String(enabled));}catch{}sync();return enabled;}
  };
}
