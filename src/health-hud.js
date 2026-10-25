const fishURL=new URL('../assets/ui/health-fish.png',import.meta.url).href;

export function healthFishFills(health){
  const value=Math.max(0,Math.min(100,Number.isFinite(health)?health:0));
  return Array.from({length:5},(_,index)=>Math.max(0,Math.min(1,(value-index*20)/20)));
}

export function createHealthHUD(meter){
  const fish=Array.from({length:5},()=>{
    const slot=meter.ownerDocument.createElement('span');slot.className='health-fish';slot.setAttribute('aria-hidden','true');
    for(const name of ['fish-empty','fish-fill']){
      const image=meter.ownerDocument.createElement('img');image.className=name;image.src=fishURL;image.alt='';image.draggable=false;slot.append(image);
    }
    meter.append(slot);return slot;
  });
  let previous;
  return health=>{
    const value=Math.max(0,Math.min(100,Number.isFinite(health)?health:0));
    if(value===previous)return;previous=value;
    healthFishFills(value).forEach((fill,index)=>fish[index].style.setProperty('--fish-fill',`${fill*100}%`));
    meter.setAttribute('aria-valuenow',String(value));
  };
}
