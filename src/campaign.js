export const PROGRESS_KEY='little-penguin.campaign.v1';
const initial=(version=4)=>({version,current:0,unlocked:0,completed:[],seenStory:[]});
function normalize(value,count,version=4){
  if(!value||value.version!==version)return initial(version);
  const bounded=n=>Number.isInteger(n)?Math.max(0,Math.min(count-1,n)):0;
  const unlocked=bounded(value.unlocked);
  return {version,current:Math.min(bounded(value.current),unlocked),unlocked,
    completed:[...new Set((Array.isArray(value.completed)?value.completed:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<count&&n<=unlocked))].sort((a,b)=>a-b),
    seenStory:[...new Set((Array.isArray(value.seenStory)?value.seenStory:[]).filter(id=>typeof id==='string'))]};
}
export function loadProgress(storage,count=6){
  try{
    let value=JSON.parse(storage?.getItem(PROGRESS_KEY)||'null');
    if(value?.version===1){
      const old=normalize({...value,version:3},5,3),offset=2;
      value={...old,current:old.current+offset,unlocked:old.unlocked+offset,
        completed:[...Array.from({length:offset},(_,i)=>i),...old.completed.map(index=>index+offset)]};
    }else if(value?.version===2){
      const old=normalize({...value,version:3},6,3),insert=true;
      const index=n=>insert&&n>=1?n+1:n;
      value={...old,current:index(old.current),unlocked:index(old.unlocked),
        completed:[...old.completed.map(index),...(insert&&old.unlocked>=1?[1]:[])]};
    }
    if(value?.version===3){
      const old=normalize(value,7,3),merged=n=>n<2?n:n<5?2:3;
      value={version:4,current:merged(old.current),unlocked:merged(old.unlocked),
        completed:old.completed.filter(n=>n<2),
        seenStory:old.seenStory.filter(id=>!id.startsWith('chapter-'))};
    }
    if(count>=5&&value?.version===4&&value.completed?.includes(3)&&value.unlocked===3)value={...value,unlocked:4};
    if(count>=7&&value?.version===4&&value.completed?.includes(5)&&value.unlocked===5)value={...value,unlocked:6};
    if(count>=6&&value?.version===4&&value.completed?.includes(4)&&value.unlocked===4)value={...value,unlocked:5};
    return normalize(value,count);
  }catch{return initial();}
}
export function saveProgress(storage,progress){try{if(!storage)return false;storage.setItem(PROGRESS_KEY,JSON.stringify(progress));return true;}catch{return false;}}
export function selectChapter(progress,index,count=6){
  const p=normalize(progress,count);if(!Number.isInteger(index)||index<0||index>p.unlocked||index>=count)return p;
  return {...p,current:index};
}
export function completeChapter(progress,index,count=6){
  const p=normalize(progress,count);if(!Number.isInteger(index)||index<0||index>p.unlocked||index>=count)return p;
  return {...p,unlocked:Math.max(p.unlocked,Math.min(count-1,index+1)),completed:[...new Set([...p.completed,index])].sort((a,b)=>a-b)};
}
