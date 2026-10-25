import {drawSprite} from './art.js';

const variants=[{id:'crack-long',aspect:.22,opacity:.85},{id:'crack-diagonal',aspect:1.23,opacity:.85},{id:'crack-cross',aspect:.70,opacity:.52}];
const layouts=new WeakMap();
export function wallCrackLayout(s){
  if(layouts.has(s))return layouts.get(s);
  const width=s.x2-s.x1,height=s.bottom-Math.max(s.y1,s.y2),innerW=width-48,innerH=height-84;
  if(innerW<100||innerH<90)return [];
  let seed=2166136261;
  for(const ch of [s.x1,s.x2,s.y1,s.y2,s.bottom].join(':'))seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
  const random=()=>{seed=(seed+0x6d2b79f5)>>>0;let n=seed;n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);return ((n^(n>>>14))>>>0)/4294967296;};
  const cols=Math.max(1,Math.floor(innerW/300)),rows=Math.max(1,Math.floor(innerH/300)),cw=innerW/cols,ch=innerH/rows,result=[];
  const add=(col,row)=>{
    const v=variants[Math.floor(random()*variants.length)],angle=(random()-.5)*.65;
    let h=Math.min(230,ch*.7)*(.72+random()*.28),w=h*v.aspect;
    const ex=()=>Math.abs(Math.cos(angle))*w/2+Math.abs(Math.sin(angle))*h/2;
    const ey=()=>Math.abs(Math.sin(angle))*w/2+Math.abs(Math.cos(angle))*h/2;
    const fit=Math.min(1,(cw*.8)/(ex()*2),(ch*.8)/(ey()*2));w*=fit;h*=fit;
    const x=Math.max(24+ex(),Math.min(width-24-ex(),24+(col+.5+(random()-.5)*.45)*cw));
    const y=Math.max(64+ey(),Math.min(height-20-ey(),64+(row+.5+(random()-.5)*.45)*ch));
    result.push({id:v.id,x,y,w,h,angle,opacity:v.opacity*(.82+random()*.18)});
  };
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++)if(random()>.35)add(col,row);
  if(!result.length)add(0,0);
  layouts.set(s,result);return result;
}

export function drawWallCracks(c,art,s,cam){
  if(!art.sprites.has('crack-long'))return;
  const slope=(s.y2-s.y1)/(s.x2-s.x1);
  c.save();c.beginPath();
  c.moveTo(s.x1-cam.x,s.y1+64-cam.y);c.lineTo(s.x2-cam.x,s.y2+64-cam.y);
  c.lineTo(s.x2-cam.x,s.bottom-16-cam.y);c.lineTo(s.x1-cam.x,s.bottom-16-cam.y);c.closePath();c.clip();
  c.transform(1,slope,0,1,s.x1-cam.x,s.y1-cam.y);
  for(const crack of wallCrackLayout(s)){
    const worldX=s.x1+crack.x,worldY=s.y1+slope*crack.x+crack.y;
    if(worldX+crack.h<cam.x||worldX-crack.h>cam.x+1280||worldY+crack.h<cam.y||worldY-crack.h>cam.y+720)continue;
    c.save();c.translate(crack.x,crack.y);c.rotate(crack.angle);c.globalAlpha*=crack.opacity;
    drawSprite(c,art,crack.id,-crack.w/2,-crack.h/2,crack.w,crack.h);c.restore();
  }
  c.restore();
}
