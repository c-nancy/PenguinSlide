export const isJumpKey=code=>code==='KeyW'||code==='ArrowUp';
export function keyboardAxes(keys){
 return {
  x:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),
  y:Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))
 };
}
