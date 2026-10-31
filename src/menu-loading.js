export function loadOnceAfterCover(coverReady,prepare){
 let task;
 return ()=>{
  if(!task)task=Promise.resolve().then(coverReady).then(prepare).catch(error=>{task=null;throw error;});
  return task;
 };
}
