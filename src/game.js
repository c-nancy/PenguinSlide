import {createSeals,updateSeals,sealEffects} from './seals.js';
import {movingWorld} from './moving-ice.js';
import {emitRing,updateRings} from './bubble-rings.js';
import { LEVELS } from './levels.js';
import { CONFIG, createPlayer, step, resetPlayer, remainingCharge } from './physics.js';
import { render, resetPose } from './render.js';
import { HEALTH } from './health.js';
import {createHealthHUD} from './health-hud.js';
import { loadArt } from './art.js';
import {addImpactEffect} from './impact-effects.js';
import {createAmbientBubbles,updateAmbientBubbles} from './ambient-bubbles.js';
import {snowCapStrip} from './snow-cap-ends.js';
import { loadProgress, saveProgress, completeChapter, selectChapter } from './campaign.js';
import { createNotices } from './narrative.js';
import {characterMotion,groundMotionLabel} from './character-state.js';
import {cameraY,constrainCameraY} from './camera.js';
import {dismissTutorialKey} from './tutorial-guidance.js';
import {createHealingFeedback} from './healing-feedback.js';
import {createBirds,updateBirds} from './birds.js';
import {createMusic} from './music.js';
import {createWaterSound} from './water-sound.js';

const $=id=>document.getElementById(id);
const canvas=$('game'),ctx=canvas.getContext('2d'),frameElement=document.querySelector('.game-frame');
const updateHealthFish=createHealthHUD($('health-meter'));
let storage;try{storage=window.localStorage;}catch{/* A private session can still play. */}
const music=createMusic(new Audio(),storage);
const waterSound=createWaterSound();
waterSound.prepare();
function updateMusicButton(){
  $('music').textContent=music.enabled?'♫':'♪';
  $('music').setAttribute('aria-label',music.enabled?'关闭背景音乐':'开启背景音乐');
  $('music').setAttribute('aria-pressed',String(music.enabled));
  $('music').title=music.enabled?'关闭背景音乐':'开启背景音乐';
}
$('music').onclick=()=>{music.toggle();updateMusicButton();};updateMusicButton();
let progress=loadProgress(storage,LEVELS.length),chapter=progress.current,level=LEVELS[chapter];
let p=createPlayer(level.start.x,level.start.y);
const state={seals:createSeals(level),rings:[],p,cam:{x:p.x-410,y:cameraY(level,p)},birds:createBirds(level),ambientBubbles:createAmbientBubbles(level),time:0,particles:[],waterEffects:[],impactEffects:[],shake:0,mode:'menu'};
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const healingFeedback=createHealingFeedback(canvas,$('health-meter'),()=>reducedMotion.matches);
const keys=new Set();
let last=0,accumulator=0,jumpQueued=false,elapsed=0,started=false,chaptersReturn='menu',effectTick=0;
let transitioning=false,artReady=false,transitionInterrupted=false;
const notices=createNotices(id=>{if(id&&!progress.seenStory.includes(id)){progress={...progress,seenStory:[...progress.seenStory,id]};persist();}});
function persist(){saveProgress(storage,progress);}
function setMode(mode){if(mode!=='playing')healingFeedback.clear();state.mode=mode;music.setMode(mode);waterSound.setMode(mode);frameElement.dataset.mode=mode;frameElement.dataset.chapter=level.id;}
function focusGame(){canvas.focus({preventScroll:true});}
function clearInput(){keys.clear();jumpQueued=false;accumulator=0;}
function clearEffects(){state.seals=createSeals(level);state.rings=[];waterSound.reset();healingFeedback.clear();state.birds=createBirds(level);state.ambientBubbles=createAmbientBubbles(level);state.particles=[];state.waterEffects=[];state.impactEffects=[];state.shake=0;effectTick=0;}
function hideNotice(){$('toast').classList.remove('visible');}
function hud(show){$('game-hud').hidden=!show;$('bottom-hud').hidden=!show;$('scene-caption').hidden=true;}
function play(){
  if(!artReady||transitioning)return;
  if(p.dead){dialog('dead');return;}
  if(p.finished){dialog(chapter===LEVELS.length-1?'finished':'chapter-complete');return;}
  started=true;setMode('playing');$('overlay').hidden=true;$('overlay').classList.remove('modal');hud(true);clearInput();focusGame();
}
function refreshMenu(){
  $('start').textContent='Start';
  $('journey-status').textContent=`两段练习与五章旅程 · 已走过 ${progress.completed.length} / ${LEVELS.length} 站`;
}
function menu(){setMode('menu');$('overlay').hidden=false;$('overlay').classList.remove('modal');$('intro').hidden=false;$('dialog').hidden=true;hud(false);refreshMenu();$('start').focus();}
function dialog(kind){
  if(transitioning)return;
  setMode(kind);clearInput();hideNotice();
  $('overlay').hidden=false;$('overlay').classList.add('modal');$('intro').hidden=true;$('dialog').hidden=false;
  if(kind==='finished'){hud(false);$('scene-caption').hidden=true;}
  $('chapter-list').hidden=kind!=='chapters';
  $('chapter-story').hidden=true;
  $('dialog-title').hidden=['paused','chapter-complete','finished','dead'].includes(kind);
  $('dialog-text').hidden=kind!=='dead';
  $('dialog-kicker').hidden=kind==='chapters';
  $('chapter-story').textContent=[level.story.entry,level.story.mid,level.story.exit].filter(Boolean).join('\n');
  const titles={dead:'歇一歇，再出发。',finished:'旅程暂歇，大海仍在前方。',paused:'歇一会儿',chapters:'沿着海湾，一站一站', 'chapter-complete':`${level.title} · 已走过`};
  $('dialog-kicker').textContent=kind==='paused'?`${chapter+1}/${LEVELS.length}`:['chapter-complete','finished','dead'].includes(kind)?`${chapter+1}/${LEVELS.length}·${level.title}`:kind==='chapters'?'先熟悉脚下，再走向海湾':`第 ${chapter+1} 站 / ${LEVELS.length} · ${level.title}`;
  $('dialog-title').textContent=titles[kind];
  const texts={
    dead:'生命值已耗尽。这次从本章起点重新出发。',
    finished:`${level.story.exit}\n这段旅程暂时走到这里，更远的海，留给下一次出发。`,
    paused:'冰海会在这里等你。',
    chapters:'海湾的路，一站一站留在这里。',
    'chapter-complete':`${level.story.exit}\n${level.story.transition||''}`
  };
  $('dialog-text').textContent=texts[kind];
  const labels={dead:'从本章起点重试',finished:'重玩整段旅程',paused:'继续冒险',chapters:'返回','chapter-complete':'继续前行'};
  $('resume').textContent=kind==='paused'?'Resume':kind==='chapter-complete'?'Continue':kind==='finished'?'重玩整段旅程':kind==='chapters'?'返回':labels[kind]+' →';
  $('restart').hidden=!started||kind!=='paused';
  $('replay').hidden=!started||!['dead','paused'].includes(kind);
  $('dialog-chapters').hidden=!['paused','dead','finished'].includes(kind);
  if(kind==='chapters')renderChapters();
  if(kind==='chapters'){
    $('dialog').scrollTop=0;
    $('chapter-list').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
  }else $('resume').focus({preventScroll:true});
}
function renderChapters(){
  $('chapter-list').replaceChildren(...LEVELS.map((item,index)=>{
    const button=document.createElement('button');button.className='chapter-option';button.disabled=index>progress.unlocked;button.dataset.chapter=item.id;
    if(index===chapter)button.setAttribute('aria-current','step');
    const number=document.createElement('span');number.className='chapter-number';number.textContent=String(index+1).padStart(2,'0');
    const title=document.createElement('strong');title.textContent=item.title;
    const status=document.createElement('small');status.textContent=index>progress.unlocked?'尚未抵达':progress.completed.includes(index)?'已走过':index===chapter?'当前章节':'可以出发';
    button.append(number,title,status);button.onclick=()=>enterChapter(index);return button;
  }));
}
function openChapters(){if(!artReady||transitioning||state.mode==='chapters')return;chaptersReturn=state.mode==='playing'?'paused':state.mode;dialog('chapters');}
function restore(kind){if(kind==='menu')menu();else if(kind==='playing')play();else dialog(kind);}
async function enterChapter(index){
  if(!artReady||transitioning||index>progress.unlocked||!LEVELS[index])return;
  music.setMode('transition');music.unlock();
  waterSound.unlock();
  transitioning=true;transitionInterrupted=false;setMode('transition');clearInput();hideNotice();
  $('overlay').hidden=true;hud(false);$('scene-caption').hidden=true;
  const curtain=$('chapter-transition');curtain.hidden=false;
  try{
    if(!reducedMotion.matches)await curtain.animate([{opacity:0},{opacity:1}],{duration:250,fill:'forwards',easing:'ease-out'}).finished;
    progress=selectChapter(progress,index,LEVELS.length);chapter=progress.current;level=LEVELS[chapter];persist();
    p=createPlayer(level.start.x,level.start.y);state.p=p;resetPlayer(p,level,true);resetPose(p);
    clearEffects();notices.clear();state.time=0;elapsed=0;
    state.cam={x:Math.max(-120,Math.min(level.width-1160,p.x-410)),y:cameraY(level,p)};
    setMode('transition');
    $('route-end').setAttribute('aria-label',chapter===LEVELS.length-1?'当前旅途暂止：灯塔':'终点旗子：下一站');
    if(!reducedMotion.matches)await curtain.animate([{opacity:1},{opacity:0}],{duration:250,fill:'forwards',easing:'ease-in'}).finished;
  }finally{
    curtain.getAnimations().forEach(animation=>animation.cancel());curtain.hidden=true;transitioning=false;clearInput();play();
    if(document.hidden||transitionInterrupted)dialog('paused');
  }
}
function retry(){
  if(!started||transitioning||!['playing','paused','dead'].includes(state.mode))return;
  resetPlayer(p,level);resetPose(p);clearEffects();notices.clear();hideNotice();
  state.cam.x=Math.max(-120,Math.min(level.width-1160,p.x-410));state.cam.y=cameraY(level,p);
  play();
}
function finish(){
  if(state.mode!=='playing')return;
  progress=completeChapter(progress,chapter,LEVELS.length);
  const id=`${level.id}:exit`;if(!progress.seenStory.includes(id))progress={...progress,seenStory:[...progress.seenStory,id]};
  persist();notices.clear();burst('gold',50);dialog(chapter===LEVELS.length-1?'finished':'chapter-complete');
}
$('start').onclick=()=>enterChapter(chapter);
$('chapters').onclick=openChapters;$('intro-chapters').onclick=openChapters;$('dialog-chapters').onclick=openChapters;
$('pause').onclick=()=>{if(transitioning)return;if(state.mode==='playing')dialog('paused');else if(state.mode==='paused')play();};
$('resume').onclick=()=>{
  music.unlock();
  waterSound.unlock();
  if(state.mode==='dead')enterChapter(chapter);
  else if(state.mode==='chapter-complete')enterChapter(chapter+1);
  else if(state.mode==='finished')enterChapter(0);
  else if(state.mode==='chapters')restore(chaptersReturn);
  else play();
};
$('restart').onclick=()=>enterChapter(chapter);$('replay').onclick=()=>enterChapter(0);$('retry').onclick=retry;
const handled=new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS','KeyR','Escape']);
$('credits-open').onclick=()=>{
  if(state.mode==='playing')dialog('paused');
  if(!$('credits').open)$('credits').showModal();
};
$('credits-close').onclick=()=>$('credits').close();
$('credits').addEventListener('click',event=>{
  const bounds=$('credits').getBoundingClientRect();
  if(event.target===$('credits')&&(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom))$('credits').close();
});
window.addEventListener('keydown',e=>{
  if($('credits').open||e.target instanceof Element&&e.target.closest('.credits'))return;
  if(transitioning){e.preventDefault();return;}
  if(e.code==='Tab'&&!$('overlay').hidden&&state.mode!=='menu'){
    const buttons=[...$('dialog').querySelectorAll('button:not(:disabled)')].filter(button=>button.getClientRects().length);
    const first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    return;
  }
  if(!handled.has(e.code))return;
  if(e.code==='Space'&&e.target instanceof HTMLButtonElement)return;
  if(state.mode==='playing'||e.code==='Escape')e.preventDefault();
  if(e.code==='Escape'&&!e.repeat){if(state.mode==='playing')dialog('paused');else if(state.mode==='paused')play();else if(state.mode==='chapters')$('resume').click();return;}
  if(e.code==='KeyR'&&!e.repeat&&state.mode==='dead'){e.preventDefault();retry();return;}
  if(state.mode!=='playing')return;
  if(e.code==='KeyR'&&!e.repeat){retry();return;}
  const freshPress=!keys.has(e.code)&&!e.repeat;
  if(freshPress)dismissTutorialKey(level,p,e.code);
  if(e.code==='Space'&&p.wet){if(freshPress)emitRing(state.rings,p,characterMotion(p,state.time),state.time);return;}
  keys.add(e.code);if(freshPress&&['Space','ArrowUp','KeyW'].includes(e.code))jumpQueued=true;
});
window.addEventListener('keyup',e=>keys.delete(e.code));
function interrupt(){clearInput();if(transitioning)transitionInterrupted=true;else if(state.mode==='playing')dialog('paused');}
window.addEventListener('blur',interrupt);
document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt();});
canvas.addEventListener('pointerdown',focusGame);
$('start').disabled=true;$('start').textContent='正在铺开冰海画稿…';
try{state.art=await loadArt();
  const retryCap=snowCapStrip(state.art,{x1:0,x2:180,y1:0,y2:0},[]);
  if(retryCap)$('retry').style.backgroundImage=`url("${retryCap.canvas.toDataURL()}")`;
  artReady=true;$('start').disabled=false;refreshMenu();}
catch(error){$('start').textContent='画稿加载失败，请刷新重试';console.error(error);}
setMode('menu');
function burst(kind,count=20){
  if(kind==='water')state.waterEffects=[...(state.waterEffects||[]).filter(effect=>state.time-effect.born<.6),{x:p.x,born:state.time,kind:p.event==='breach'?'splash-breach':'splash-entry'}];
  for(let i=0;i<count;i++){
    const angle=Math.random()*Math.PI*2,speed=40+Math.random()*200;
    state.particles.push({x:p.x,y:kind==='water'?level.waterY:p.y+16,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-80,life:.5+Math.random()*.5,maxLife:1,size:1.5+Math.random()*2.5,kind});
  }
}
function update(dt){
  if(state.mode!=='playing')return;
  state.time+=dt;
  elapsed+=dt;effectTick++;
  const input={x:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),y:Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp')||(!p.wet&&keys.has('Space'))),jump:jumpQueued};jumpQueued=false;
  const healthBefore=p.health,previous={x:p.x,y:p.y};
  if(state.seals.some(s=>s.mode==='bite')){
    if(updateSeals(state.seals,p,movingWorld(p,level),dt))retry();
    return;
  }
  if(state.seals.some(s=>s.mode==='charge')){
    updateSeals(state.seals,p,movingWorld(p,level),dt);
    return;
  }
  step(p,input,level,dt);
  if(updateSeals(state.seals,p,movingWorld(p,level),dt)){resetPlayer(p,level);resetPose(p);clearEffects();state.cam.y=cameraY(level,p);return;}
  sealEffects(state.seals,state.rings,state.ambientBubbles,state.time);
  updateRings(state.rings,movingWorld(p,level),dt,state.ambientBubbles,state.time);
  updateAmbientBubbles(state.ambientBubbles,p,previous,state.time,movingWorld(p,level));
  updateBirds(state.birds,p,dt);
  if(level.keyHints?.length)for(const code of keys)dismissTutorialKey(level,p,code);
  state.impactEffects=state.impactEffects.filter(e=>state.time-e.born<.32);
  if(p.impactEffect)addImpactEffect(state,p.impactEffect);
  if(p.hit){
    state.shake=.25;
  }
  if(p.reaction&&!p.hit){state.shake=.18;}
  if(p.event==='splash')burst('water');
  if(p.event==='breach'){burst('water',36);}
  waterSound.play(p.waterSoundEvent);
  if(p.event==='checkpoint'){
    burst('gold',24);
    updateHealthFish(p.health);healingFeedback.play(p,state.cam,healthBefore);
  }
  if(p.event==='finish'){finish();return;}
  if(p.event==='death'){dialog('dead');return;}
  const safe=p.grounded&&!p.wet&&Math.abs(p.vx)<190&&Math.abs(p.vy)<50&&!p.controlLock&&!p.hitStop;
  const notice=notices.update(dt,safe);
  if(notice){$('toast').textContent=notice.text;$('toast').dataset.kind=notice.kind;}
  $('toast').classList.toggle('visible',Boolean(notice));
  if(effectTick%9===0&&p.wet)state.particles.push({x:p.x-p.facing*20,y:p.y,vx:-p.vx*.15,vy:-35,life:1,maxLife:1,size:2+Math.random()*2,kind:'bubble'});
  if(effectTick%6===0&&p.grounded&&Math.abs(p.vx)>80)state.particles.push({x:p.x-p.facing*15,y:p.y+20,vx:-p.vx*.25,vy:-20-Math.random()*30,life:.5,maxLife:.5,size:2,kind:'snow'});
  for(const a of state.particles){a.life-=dt;a.x+=a.vx*dt;a.y+=a.vy*dt;if(a.kind!=='bubble')a.vy+=350*dt;}state.particles=state.particles.filter(a=>a.life>0);
  state.shake=Math.max(0,state.shake-dt);
  const targetX=Math.max(-120,Math.min(level.width-1160,p.x-410+p.vx*.18));
  const targetY=cameraY(level,p);
  const ease=1-Math.exp(-4*dt);state.cam.x+=(targetX-state.cam.x)*ease;state.cam.y+=(targetY-state.cam.y)*ease;
  state.cam.y=constrainCameraY(level,p,state.cam.y);
}
function updateHUD(){
  $('health-value').textContent=p.health+' / '+HEALTH.max;
  updateHealthFish(p.health);
  $('health-box').classList.toggle('low',p.health<=25);
  $('health-box').classList.toggle('hurt',p.invulnerable>0&&!p.dead);
  const hudBelowWater=level.waterY-state.cam.y<90;
  document.querySelector('.game-frame').classList.toggle('underwater',p.wet&&hudBelowWater&&state.mode!=='menu');
  const q=remainingCharge(p),pct=Math.round(q*100);
  $('charge-value').textContent=pct+'%';$('charge-fill').style.width=pct+'%';
  $('charge-meter').setAttribute('aria-valuenow',String(pct));
  const waiting=p.boosting&&p.y-level.waterY-(p.chargeFloor||0)>CONFIG.maxDepth;
  const assisting=p.wet&&p.boosting&&p.energy>0&&!waiting;
  const horizontal=keys.has('KeyA')||keys.has('KeyD')||keys.has('ArrowLeft')||keys.has('ArrowRight');
  const vertical=keys.has('KeyW')||keys.has('KeyS')||keys.has('ArrowUp')||keys.has('ArrowDown')||keys.has('Space');
  const passive=p.wet&&!horizontal&&!vertical;
  $('charge-label').textContent=assisting?'深潜能量 · 助推中':q>=.995?'深潜能量 · 已满':'深潜能量';
  const groundPose=characterMotion(p,state.time,state.mode==='menu').pose;
  $('mode-label').textContent=p.wet?(passive?(p.vy<0?'自然上浮':'惯性漂移'):assisting?'上浮助推':horizontal?'水中推进':'深蓝潜游'):p.grounded?groundMotionLabel(groundPose):'乘风跃起';$('mode-icon').textContent=p.wet?'≋':p.grounded?(groundPose==='idle'?'•':groundPose==='walk'?'↔':'↝'):'↑';
  $('speed').innerHTML=(Math.hypot(p.vx,p.vy)/40).toFixed(1)+' <em>m/s</em>';
  $('mode-icon').setAttribute('aria-label',$('mode-label').textContent);
  $('chapter-number').textContent=`${chapter+1}/${LEVELS.length}`;
  $('stage').textContent=level.title;
  $('retry-label').textContent=p.checkpoint?'回巢重试':'回起点重试';
  const progress=Math.min(100,Math.max(0,(p.x-level.start.x)/(level.goalX-level.start.x)*100));$('route-fill').style.width=progress+'%';$('route-dot').style.left=progress+'%';
  document.querySelector('.route').setAttribute('aria-valuenow',Math.round(progress));
  $('pause').textContent=state.mode==='paused'?'▷':'Ⅱ';$('pause').setAttribute('aria-label',state.mode==='paused'?'继续游戏':'暂停游戏');
  $('pause').disabled=!['playing','paused'].includes(state.mode);
  $('retry').disabled=state.mode!=='playing';
  $('chapters').disabled=!artReady||transitioning||state.mode==='chapters';
}
function resize(){healingFeedback.clear();const dpr=Math.min(window.devicePixelRatio||1,2);const r=canvas.getBoundingClientRect();canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}
new ResizeObserver(resize).observe(canvas);resize();
function frame(timestamp){
  const delta=last?Math.min((timestamp-last)/1000,.05):0;last=timestamp;accumulator+=delta;
  while(accumulator>=1/120){update(1/120);accumulator-=1/120;}
  ctx.setTransform(canvas.width/1280,0,0,canvas.height/720,0,0);ctx.clearRect(0,0,1280,720);ctx.save();
  if(state.shake>0&&!reducedMotion.matches&&state.mode==='playing')ctx.translate(Math.sin(state.time*77)*state.shake*12,Math.cos(state.time*63)*state.shake*8);
  render(ctx,state,movingWorld(p,level));ctx.restore();updateHUD();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
