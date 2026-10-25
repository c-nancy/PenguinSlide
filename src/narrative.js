// Readable time advances only when a story can be shown on safe ground.
export function createNotices(onStoryShown=()=>{}) {
  const rank={story:0,tutorial:1,injury:2};
  let active=null,queue=[];
  return {
    add(text,kind='tutorial',id=null) {
      if(!text||id&&(active?.id===id||queue.some(item=>item.id===id)))return;
      const item={text,kind,id,remaining:kind==='story'?5:3.5,started:false};
      if(active&&rank[kind]>rank[active.kind]){queue.unshift(active);active=null;}
      // Several impacts in one collision should report the newest injury.
      if(kind==='injury') {queue=queue.filter(item=>item.kind!=='injury');if(active?.kind==='injury')active=null;}
      queue.push(item);queue.sort((a,b)=>rank[b.kind]-rank[a.kind]);
    },
    update(dt,safe) {
      if(!active)active=queue.shift()||null;
      if(!active||active.kind==='story'&&!safe)return null;
      if(!active.started){active.started=true;if(active.kind==='story')onStoryShown(active.id);}
      active.remaining-=dt;
      if(active.remaining<=0){active=null;return null;}
      return active;
    },
    clear(){active=null;queue=[];}
  };
}
