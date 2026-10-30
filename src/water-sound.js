export const WATER_SOUND_URL=new URL('../assets/audio/se/743910__alex_eapo__jump-on-water.wav',import.meta.url).href;
export const SPLASH_SOUND_URL=new URL('../assets/audio/se/212143__qubodup__splash-by-blaukreuz.flac',import.meta.url).href;
const waterClips={splash:{url:SPLASH_SOUND_URL,offset:0,volume:.08},breach:{url:WATER_SOUND_URL,offset:.205,volume:.1625}};

export function createWaterSound({clips=waterClips,cooldown=.18,createContext=()=>new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'}),
  load=async url=>{const response=await fetch(url);if(!response.ok)throw Error('Water audio unavailable');return response.arrayBuffer();}}={}){
  let context,loading,mode='menu',unlocked=false;
  const buffers=new Map(),last=new Map(),active=new Set();
  function reset(){
    for(const source of active)try{source.stop();}catch{/* Already ended. */}
    active.clear();last.clear();
  }
  function prepare(){
    try{
      if(!context)context=createContext();
      if(!loading)loading=Promise.all(Object.entries(clips).map(async([event,clip])=>{
        try{buffers.set(event,await context.decodeAudioData(await load(clip.url)));}catch{/* Other clips can still load. */}
      }));
      return loading;
    }catch{return Promise.resolve();}
  }
  return {
    prepare,
    async unlock(){
      try{
        const ready=prepare();
        // Resume during the gesture; decoding was already started at page load.
        const resumed=context.resume();unlocked=true;
        await Promise.all([resumed,ready]);
      }catch{/* Optional sound must not block play. */}
    },
    setMode(value){mode=value;if(mode!=='playing')reset();},
    reset,
    play(event){
      const clip=clips[event],buffer=buffers.get(event);
      if(mode!=='playing'||!unlocked||!buffer||context.currentTime-(last.get(event)??-Infinity)<cooldown)return;
      try{
        const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.playbackRate.value=1;
        gain.gain.value=clip.volume;source.connect(gain);gain.connect(context.destination);
        source.onended=()=>active.delete(source);active.add(source);
        // Start immediately before the audible attack, skipping the quiet lead-in.
        source.start(0,clip.offset);last.set(event,context.currentTime);
      }catch{/* Audio remains optional. */}
    }
  };
}
