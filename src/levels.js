import {surfaceAt} from './level.js';

const block=(x1,x2,y1,y2=y1,kind='shore',bottom=1280)=>({x1,x2,y1,y2,bottom,kind});
function chapter(number,title,theme,solids,waters,checkpointXs,goalX,story,extra={}){
  const ground=x=>solids.find(s=>x>=s.x1&&x<=s.x2&&s.kind!=='tunnel');
  const checkpoints=checkpointXs.map((x,i)=>({id:`chapter-${number}-flag-${i+1}`,x,y:surfaceAt(ground(x),x)-22,label:`企鹅巢 ${String.fromCharCode(65+i)}`}));
  const goalGround=solids.at(-1);
  return {id:`chapter-${number}`,chapter:number,title,theme,width:goalGround.x2,waterY:380,bottom:1160,
    start:{x:150,y:surfaceAt(solids[0],150)-22},solids,waters,checkpoints,goalX,
    goal:{x:goalX+30,y:surfaceAt(goalGround,goalX+30),kind:number===5?'lighthouse':number===2?'shore':number===4?'cave-exit':'beacon'},
    story,storyPoint:{x:checkpoints[0]?.x??goalX/2},signs:[],...extra,
    decorations:[...(extra.decorations||[]).filter(item=>item.kind!=='footprints'),
      {kind:'footprints',x:65,y:surfaceAt(solids[0],65),w:110,h:20}]};
}
export const TUTORIAL=chapter(0,'启程练习','coast',[
  block(-100,550,300),block(550,1100,300,380,'ramp'),block(1100,1500,380),
  block(2400,2850,395,350,'ramp'),block(2850,3300,350,350,'finish')
],[[1500,2400]],[],3100,{
  entry:'出发之前，先沿着岸边走一走。',mid:'从这里入海，再回到那边的岸上。',
  exit:'脚下的冰和眼前的水，都熟悉了一点。',transition:'前面的路，从海湾开始。'
},{id:'tutorial-1',tutorial:true,depthCharge:false,bottom:550,cameraY:-57,
  keyHints:[{key:'right',x:350,y:210,untilX:620},{key:'up',x:2250,y:320,fromX:2180,when:'water'},
    {id:'shore-forward',key:'right',anchor:'player',dx:90,dy:-60,fromX:2180,untilX:2470,when:'air',onlyWhenVisible:true}],
  rocks:[],goal:{x:3130,y:350,kind:'shore'},decorations:[]});

export const SECOND_TUTORIAL=chapter(0,'在巢边歇一歇','bay',[
  block(-100,1200,300),block(1200,1500,300,380,'ramp'),
  block(2000,2450,320,340,'floe',580),
  block(2900,3300,340,390,'ramp'),block(4800,5700,260,320,'finish')
],[[1500,2900],[3300,4800]],[900],5500,{
  entry:'在巢边歇一歇，再往深一点的海里去。',mid:'有人守着岸边，也有人等你回来。',
  exit:'原来，向下的路也能把你送得更高。',transition:'现在，沿着海湾出发。'
},{id:'tutorial-2',tutorial:true,initialHealth:60,bottom:1040,checkpointActivationBefore:0,
  keyHints:[
    {id:'ice-dive',key:'down',x:1810,y:430,fromX:1600,untilX:2000,maxY:620,when:'water',onlyWhenVisible:true},
    {id:'ice-forward',key:'right',anchor:'player',dx:100,dy:0,fromX:1600,untilX:2540,minY:620,when:'water',onlyWhenVisible:true},
    {id:'charge-dive',key:'down',anchor:'player',dx:80,dy:60,fromX:4650,untilX:4800,maxDepth:300,when:'water',onlyWhenVisible:true},
    {id:'charge-ascent',key:'up',anchor:'player',dx:50,dy:-100,fromX:4650,minDepth:300,minY:510,when:'water',onlyWhenVisible:true},
    {id:'charge-flight',key:'right',anchor:'player',dx:100,dy:-60,fromX:4650,untilX:5200,maxY:510,minCharge:.5,when:'rising',onlyWhenVisible:true}
  ],goal:{x:5530,y:309,kind:'shore'},decorations:[]
});

export const STORY_LEVELS=[
  chapter(1,'向海而行','coast',[
    block(-100,660,260,380),block(1040,1250,322,322,'floe',480),
    block(1750,2200,300,300,'checkpoint'),block(3500,4800,220,310,'finish')
  ],[[660,1750],[2200,3500]],[1980],4500,{
    entry:'入冬前，把这封信送到海湾那头。',mid:'第一盏灯，照着离岸的路。',
    exit:'岬角信标亮着。海湾就在脚下。',transition:'沿着海湾，下一盏灯还很远。'
  },{decorations:[{kind:'signpost',x:300,y:323,w:65,h:60}]}),
  chapter(2,'浮冰之间','bay',[
    block(-100,600,260,380),block(950,1200,320,320,'floe',520),block(1460,1690,410,410,'floe',610),
    block(2200,2640,300,300,'checkpoint'),block(2900,3630,250,250,'tunnel',560),
    block(4200,4650,300,300,'checkpoint'),block(5100,5600,470,470,'tunnel',700),block(6300,7200,320,300,'finish')
  ],[[600,2200],[2640,4200],[4650,6300]],[2400,4420],6920,{
    entry:'浮冰之间，留着一条熟悉的水路。',mid:'这些路标，每年都会有人扶正。',
    exit:'石滩上，有一串小小的脚印。',transition:'岸上的脚印，朝山口去了。'
  },{decorations:[{kind:'buoy',x:730,y:379,w:55,h:74},{kind:'signpost',x:2480,y:300,w:60,h:55}]}),
  chapter(3,'顺着冰走','ridge',[
    block(-100,560,250,380),block(1900,2800,230,340,'ramp'),block(2800,3250,340,270,'ridge'),block(3250,3550,270,310,'ridge'),
    block(5000,5450,260,300,'checkpoint'),block(6100,6500,240,280,'floe',430),block(6850,7600,330,300,'finish')
  ],[[560,1900],[3550,5000],[5450,6850]],[2620,5230],7300,{
    entry:'把水里的力气，交给脚下的冰。',mid:'有些路，顺着走就会轻一点。',
    exit:'山口之外，终于看见那座灯塔。',transition:'从冰层下面，绕过去。'
  },{decorations:[]}),
  chapter(4,'冰层之下','cave',[
    block(-100,600,300,380),block(780,1760,200,200,'tunnel',650),block(2300,2780,280,280,'checkpoint'),
    block(3060,3650,190,190,'tunnel',670),block(4150,4400,720,720,'shelf'),block(4300,4650,240,240,'floe',460),
    block(5100,5580,300,300,'checkpoint'),block(5850,6380,210,210,'tunnel',670),block(7200,8400,220,320,'finish')
  ],[[600,2300],[2780,5100],[5580,7200]],[2520,5340],8100,{
    entry:'灯暂时看不见了，路还在冰层下面。',mid:'看不见灯的时候，路也没有消失。',
    exit:'从冰缝跃出，海面重新铺开。',transition:'这一次，灯就在前面。'
  },{decorations:[{kind:'cave-arch',x:650,y:370,w:140,h:190},{kind:'ice-cracks',x:3550,y:370,w:100,h:140}]}),
  chapter(5,'灯塔来信','home',[
    block(-100,700,260,380),block(1250,1470,350,350,'floe',510),block(2400,2900,300,300,'checkpoint'),
    block(3900,4180,320,320,'floe',610),block(4700,5750,240,330,'ramp'),block(5750,6100,330,300,'ridge'),
    block(6700,8000,330,260,'finish')
  ],[[700,2400],[2900,4700],[6100,6700]],[2610,5530],7680,{
    entry:'那扇亮着灯的门，已经能看清了。',mid:'这一段，脚下的路已经很熟悉。',
    exit:'我到了。一路上，灯都还亮着。',transition:''
  },{decorations:[{kind:'buoy',x:890,y:380,w:55,h:74},{kind:'signpost',x:5700,y:321,w:64,h:58}]})
];
export const LEVELS=[TUTORIAL,SECOND_TUTORIAL,...STORY_LEVELS];

// Shore wildlife is kept out of tutorials and the cave interior.
const birdPerches=[
  [[460,'petrel',25],[1150,'skua',29],[3950,'albatross',34]],
  [[1060,'petrel',25],[6530,'petrel',25]],
  [[2200,'albatross',34],[3110,'skua',29],[7050,'petrel',25]],
  [[380,'petrel',25],[7660,'skua',29]],
  [[410,'skua',29],[1350,'petrel',25],[4930,'albatross',34],[7140,'albatross',34]]
];
STORY_LEVELS.forEach((level,index)=>{
  level.birds=birdPerches[index].map(([x,species,height])=>{
    const ground=level.solids.find(s=>x>=s.x1&&x<=s.x2);
    return {x,y:surfaceAt(ground,x),species,height};
  });
});

// Fixed selection keeps visual silhouettes and alpha collision in agreement.
const floeVariants=['floe-original-pointed','floe-offset','floe-original-flat','floe-double-point','floe-shallow'];
let floeIndex=0;
for(const level of LEVELS)for(const solid of level.solids)if(solid.kind==='floe')solid.floeVariant=floeVariants[floeIndex++%floeVariants.length];
