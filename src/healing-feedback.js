const fishURL=new URL('../assets/ui/health-fish.png',import.meta.url).href;

export function shouldShowHealingFish(before,player){
  return player.event==='checkpoint'&&player.health>before;
}

export function healingFlight(player,cam,canvas,meter){
  const width=Math.min(44,44*canvas.width/1280),height=width*131/320;
  const start={x:canvas.left+(player.x-cam.x)*canvas.width/1280,
    y:canvas.top+(player.y-cam.y-43)*canvas.height/720};
  const end={x:meter.left+meter.width/2,y:meter.top+meter.height/2};
  const transform=(point,scale)=>`translate(${point.x-width/2}px, ${point.y-height/2}px) scale(${scale})`;
  return {start,end,width,height,frames:[
    {offset:0,transform:transform(start,.85),opacity:0},
    {offset:.16,transform:transform({x:start.x,y:start.y-8},1.1),opacity:1},
    {offset:.85,transform:transform(end,.35),opacity:1},
    {offset:1,transform:transform(end,.15),opacity:0}
  ]};
}

export function createHealingFeedback(canvas,meter,reducedMotion=()=>false){
  let active=null;
  function clear(){
    if(!active)return;
    const previous=active;active=null;previous.animation.cancel();previous.fish.remove();
  }
  return {clear,play(player,cam,beforeHealth){
    clear();
    if(!Number.isFinite(beforeHealth)||!shouldShowHealingFish(beforeHealth,player))return;
    const canvasRect=canvas.getBoundingClientRect(),meterRect=meter.getBoundingClientRect();
    if(canvasRect.width<=0||meterRect.width<=0)return;
    const flight=healingFlight(player,cam,canvasRect,meterRect),document=canvas.ownerDocument;
    const fish=document.createElement('img');fish.className='healing-fish-flight';fish.src=fishURL;fish.alt='';fish.draggable=false;
    fish.setAttribute('aria-hidden','true');fish.style.width=`${flight.width}px`;fish.style.height=`${flight.height}px`;
    const reduced=reducedMotion(),frames=reduced?[
      {transform:flight.frames.at(-1).transform,opacity:1},
      {transform:flight.frames.at(-1).transform,opacity:0}
    ]:flight.frames;
    document.body.append(fish);
    const animation=fish.animate(frames,{duration:reduced?180:900,easing:'ease-in-out',fill:'both'});
    active={fish,animation};
    const cleanup=()=>{fish.remove();if(active?.fish===fish)active=null;};
    animation.finished.then(cleanup,cleanup);
  }};
}
