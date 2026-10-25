export const LEVEL = {
  width: 5000, waterY: 380, bottom: 1020,
  start: {x:150,y:238}, checkpoint: {x:1990,y:278}, goalX:4650,
  waters: [[640,1800],[2160,3800]],
  solids: [
    {x1:-100,x2:640,y1:260,y2:380,bottom:1120,kind:'shore'},
    {x1:1110,x2:1310,y1:322,y2:322,bottom:450,kind:'floe'},
    {x1:1800,x2:2160,y1:300,y2:300,bottom:1120,kind:'checkpoint'},
    {x1:2700,x2:3100,y1:500,y2:500,bottom:640,kind:'tunnel'},
    {x1:3800,x2:5000,y1:70,y2:240,bottom:1120,kind:'finish'}
  ],
  signs: [
    {x:330,y:235,title:'向海而行',sub:'A / D 移动 · 空格跳跃'},
    {x:850,y:250,title:'入海后，游得更快',sub:'先 ↓ 下潜到浮冰下方，再 → 加速通过'},
    {x:1920,y:180,title:'企鹅巢 · 检查点',sub:'失误后按 R 回到这里'},
    {x:2390,y:240,title:'更深一点，更高一点',sub:'绕过冰层下方，积蓄一次大跳'},
    {x:3300,y:800,title:'深蓝蓄力区',sub:'留出距离向上冲，破水后再朝高台前进'},
    {x:4080,y:0,title:'把海留在身后',sub:'沿着冰坡，滑向灯塔'}
  ]
};
export function surfaceAt(s,x) { return s.y1+(s.y2-s.y1)*Math.max(0,Math.min(1,(x-s.x1)/(s.x2-s.x1))); }
