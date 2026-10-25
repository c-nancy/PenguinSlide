export const PROGRESS_KEY='little-penguin.campaign.v1';
const initial=()=>({version:1,current:0,unlocked:0,completed:[],seenStory:[]});
function normalize(value,count){
  if(!value||value.version!==1)return initial();
  const bounded=n=>Number.isInteger(n)?Math.max(0,Math.min(count-1,n)):0;
  const unlocked=bounded(value.unlocked);
  return {version:1,current:Math.min(bounded(value.current),unlocked),unlocked,
    completed:[...new Set((Array.isArray(value.completed)?value.completed:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<count&&n<=unlocked))].sort((a,b)=>a-b),
    seenStory:[...new Set((Array.isArray(value.seenStory)?value.seenStory:[]).filter(id=>typeof id==='string'))]};
}
export function loadProgress(storage,count=5){try{return normalize(JSON.parse(storage?.getItem(PROGRESS_KEY)||'null'),count);}catch{return initial();}}
export function saveProgress(storage,progress){try{if(!storage)return false;storage.setItem(PROGRESS_KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function selectChapter(progress,index,count=5){
  const p=normalize(progress,count);if(!Number.isInteger(index)||index<0||index>p.unlocked||index>=count)return p;
  return {...p,current:index};
}
export function completeChapter(progress,index,count=5){
  const p=normalize(progress,count);if(!Number.isInteger(index)||index<0||index>p.unlocked||index>=count)return p;
  return {...p,unlocked:Math.max(p.unlocked,Math.min(count-1,index+1)),completed:[...new Set([...p.completed,index])].sort((a,b)=>a-b)};
}
