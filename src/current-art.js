import {waterCurrentAt} from './currents.js';
import {drawSprite} from './art.js';
const mod=(value,range)=>(value%range+range)%range;

export function drawCurrents(c,art,level,cam,time){
  c.save();c.strokeStyle='#557579';c.lineWidth=1.3;
  for(const flow of level.currents||[]){
    if(flow.x2<cam.x||flow.x1>cam.x+1280)continue;
    const width=flow.x2-flow.x1,direction=Math.sign(flow.speed);
    for(let row=0;row<3;row++)for(let i=0;i<Math.ceil(width/105);i++){
      const x=flow.x1+mod(i*105+row*31+time*flow.speed*.38,width);
      const y=flow.y1+(row+1)*(flow.y2-flow.y1)/4+Math.sin(time*.7+i)*4;
      const weight=Math.abs(waterCurrentAt(level,x,y)/flow.speed);
      c.globalAlpha=.42*weight;const sx=x-cam.x,sy=y-cam.y;
      c.beginPath();c.moveTo(sx-20*direction,sy+1);c.quadraticCurveTo(sx-8*direction,sy-2,sx+17*direction,sy);
      c.moveTo(sx+10*direction,sy-4);c.lineTo(sx+17*direction,sy);c.lineTo(sx+10*direction,sy+4);c.stroke();
      c.globalAlpha=.25*weight;c.beginPath();c.arc(sx-26*direction,sy+3,1.7,0,Math.PI*2);c.stroke();
    }
  }
  for(const path of level.flowFish||[]){
    const length=Math.hypot(path.x2-path.x1,path.y2-path.y1);
    for(let i=0;i<2;i++){
      const t=mod(time*path.speed/length+i*.43,1),x=path.x1+(path.x2-path.x1)*t,y=path.y1+(path.y2-path.y1)*t;
      if(x<cam.x-100||x>cam.x+1380)continue;
      c.globalAlpha=.48*Math.min(1,t*8,(1-t)*8);
      drawSprite(c,art,'fish-school-02',x-cam.x-32,y-cam.y-12,64,26);
    }
  }
  c.restore();
}
