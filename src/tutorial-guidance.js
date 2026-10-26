import {chargeForDepth} from './physics.js';
export const TUTORIAL_KEYS_URL=new URL('../assets/ui/tutorial/arrow-keys.png',import.meta.url).href;
const KEY_RECTS={right:[514,270,238,237],up:[274,30,242,240],down:[276,280,236,226]};
const dismissedKeys=new WeakMap();

function visible(hint,player){
  return (hint.fromX===undefined||player.x>=hint.fromX)&&(hint.untilX===undefined||player.x<hint.untilX)&&
    (hint.when!=='water'||player.wet)&&(hint.when!=='air'||(!player.wet&&!player.grounded))&&
    (hint.when!=='rising'||(!player.grounded&&player.vy<0))&&
    (hint.minDepth===undefined||player.maxDepth>=hint.minDepth)&&(hint.maxDepth===undefined||player.maxDepth<hint.maxDepth)&&
    (hint.minY===undefined||player.y>=hint.minY)&&(hint.maxY===undefined||player.y<hint.maxY)&&
    (hint.minLastCharge===undefined||(player.lastCharge||0)>=hint.minLastCharge)&&
    (hint.minCharge===undefined||(player.wet?chargeForDepth(player.maxDepth||0):(player.lastCharge||0))>=hint.minCharge);
}

export function dismissTutorialKey(level,player,code){
  const key={ArrowRight:'right',KeyD:'right',ArrowUp:'up',KeyW:'up',Space:'up',ArrowDown:'down',KeyS:'down'}[code];
  const hints=level.keyHints?.filter(hint=>hint.key===key&&(!hint.onlyWhenVisible||visible(hint,player)))||[];
  if(!hints.length)return;
  let dismissed=dismissedKeys.get(player);
  if(!dismissed){dismissed=new Set();dismissedKeys.set(player,dismissed);}
  for(const hint of hints)dismissed.add(hint.id||hint.key);
}

export function tutorialKeyHints(level,player,mode){
  if(mode!=='playing'&&mode!=='paused')return [];
  return (level.keyHints||[])
    .filter(hint=>!dismissedKeys.get(player)?.has(hint.id||hint.key)&&visible(hint,player))
    .map(hint=>({...hint,...(hint.anchor==='player'?{x:player.x+hint.dx,y:player.y+hint.dy}:{}),rect:KEY_RECTS[hint.key]}));
}

export function drawTutorialKeys(context,art,level,player,cam,mode){
  const image=art.images.get(TUTORIAL_KEYS_URL);if(!image)return;
  for(const hint of tutorialKeyHints(level,player,mode)){
    const [sx,sy,sw,sh]=hint.rect,width=64,height=width*sh/sw;
    context.drawImage(image,sx,sy,sw,sh,hint.x-cam.x-width/2,hint.y-cam.y-height/2,width,height);
  }
}
