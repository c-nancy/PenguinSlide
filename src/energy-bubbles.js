const count=16,ringRadius=52;

export function energyBubbleLayout(charge,x=0,y=0){
  const q=Math.max(0,Math.min(1,Number.isFinite(charge)?charge:0));
  return Array.from({length:count},(_,index)=>{
    const angle=-Math.PI/2+index*Math.PI*2/count;
    return {x:x+Math.cos(angle)*ringRadius,y:y+Math.sin(angle)*ringRadius,
      radius:[4.8,5.3,4.5,5][index%4],fill:Math.max(0,Math.min(1,q*count-index)),seed:index*.73};
  });
}

export function drawEnergyBubbles(c,charge,x,y){
  for(const bubble of energyBubbleLayout(charge,x,y)){
    c.save();c.globalAlpha=.14+.86*bubble.fill;c.lineWidth=1.15;c.strokeStyle='#68695f';c.fillStyle='#faf7ed';c.lineJoin='round';
    c.beginPath();
    // A stable, imperfect pencil contour: no random regeneration or flicker.
    for(let i=0;i<22;i++){
      const angle=i*Math.PI*2/22;
      const radius=bubble.radius*(1+.055*Math.sin(angle*3+bubble.seed)+.035*Math.cos(angle*5-bubble.seed));
      const px=bubble.x+Math.cos(angle)*radius,py=bubble.y+Math.sin(angle)*radius*.95;
      if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
    }
    c.closePath();c.fill();c.stroke();
    // A short second pencil pass gives each bubble a lightly sketched rim.
    c.globalAlpha*=.48;c.lineWidth=.7;c.beginPath();
    for(let i=0;i<7;i++){
      const angle=-2.6+i*.22,radius=bubble.radius+.65;
      const px=bubble.x+Math.cos(angle)*radius,py=bubble.y+Math.sin(angle)*radius*.95;
      if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
    }
    c.stroke();c.restore();
  }
}
