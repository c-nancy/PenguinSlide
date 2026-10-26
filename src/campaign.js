export const PROGRESS_KEY='little-penguin.campaign.v1';
const initial=()=>({version:3,current:0,unlocked:0,completed:[],seenStory:[]});
function normalize(value,count){
  if(!value||value.version!==3)return initial();
  const bounded=n=>Number.isInteger(n)?Math.max(0,Math.min(count-1,n)):0;
  const unlocked=bounded(value.unlocked);
  return {version:3,current:Math.min(bounded(value.current),unlocked),unlocked,
    completed:[...new Set((Array.isArray(value.completed)?value.completed:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<count&&n<=unlocked))].sort((a,b)=>a-b),
    seenStory:[...new Set((Array.isArray(value.seenStory)?value.seenStory:[]).filter(id=>typeof id==='string'))]};
}
export function loadProgress(storage,count=7){
  try{
    let value=JSON.parse(storage?.getItem(PROGRESS_KEY)||'null');
    if(value?.version===1){
      const old=normalize({...value,version:3},5),offset=Math.max(0,Math.min(2,count-5));
      value={...old,current:old.current+offset,unlocked:old.unlocked+offset,
        completed:[...Array.from({length:offset},(_,i)=>i),...old.completed.map(index=>index+offset)]};
    }else if(value?.version===2){
      const old=normalize({...value,version:3},6),insert=count>=7;
      const index=n=>insert&&n>=1?n+1:n;
      value={...old,current:index(old.current),unlocked:index(old.unlocked),
        completed:[...old.completed.map(index),...(insert&&old.unlocked>=1?[1]:[])]};
    }
    return normalize(value,count);
  }catch{return initial();}
}
export function saveProgress(storage,progress){try{if(!storage)return false;storage.setItem(PROGRESS_KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function selectChapter(progress,index,count=7){
  const p=normalize(progress,count);if(!Number.isInteger(index)||index<0||index>p.unlocked||index>=count)return p;
  return {...p,current:index};
}
export function completeChapter(progress,index,count=7){
  const p=normalize(progress,count);if(!Number.isInteger(index)||index<0||index>p.unlocked||index>=count)return p;
  return {...p,unlocked:Math.max(p.unlocked,Math.min(count-1,index+1)),completed:[...new Set([...p.completed,index])].sort((a,b)=>a-b)};
}
