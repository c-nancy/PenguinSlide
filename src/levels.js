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
},{id:'tutorial-1',tutorial:true,depthCharge:false,bottom:550,cameraY:-128,
  keyHints:[{key:'right',x:350,y:210,untilX:620},{key:'up',x:2250,y:320,fromX:2180,when:'water'},
    {id:'shore-forward',key:'right',anchor:'player',dx:90,dy:-60,fromX:2180,untilX:2470,when:'air',onlyWhenVisible:true}],
  rocks:[],goal:{x:3130,y:350,kind:'shore'},decorations:[]});

export const SECOND_TUTORIAL=chapter(0,'在巢边歇一歇','bay',[
  block(-100,1200,300),block(1200,1500,300,380,'ramp'),
  block(2000,2450,320,340,'floe',580),
  block(2900,3300,340,390,'ramp'),block(4800,5700,260,320,'finish')
],[[1500,2900],[3300,4800]],[900],5500,{
  entry:'在巢边歇一歇，再往深一点的海里去。',mid:'有人留在岸边，也有人想去更远的地方。',
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
  chapter(1,'浮冰远行','ridge',[
    block(-100,660,260,380),block(1040,1250,322,322,'floe',480),
    block(1750,2200,300,300,'checkpoint'),
    block(2200,3000,300,360,'ramp'),block(3000,3300,360,300,'ridge'),block(3300,3550,300,380,'ramp'),
    block(5000,5450,260,300,'checkpoint'),block(6100,6500,240,280,'floe',430),
    block(6850,7250,330,380,'ramp'),block(7250,7600,380,330,'finish')
  ],[[660,1750],[3550,5000],[5450,6850]],[1980,5230],7300,{
    entry:'它主动离开了企鹅群，想去看看大海的另一边。',
    mid:'岸边有人守着巢。歇一歇，再把水里的速度交给脚下的冰。',
    exit:'越过浮冰和山口，灯塔出现在远处。',transition:'前面的海路，藏在冰层下面。'
  },{goal:{x:7330,y:surfaceAt(block(7250,7600,380,330),7330),kind:'shore'},
    decorations:[{kind:'signpost',x:300,y:315,w:65,h:60}]}),
  chapter(2,'穿冰见光','cave',[
    block(-100,600,300,380),block(780,1760,200,200,'tunnel',650),
    block(2300,2780,280,320,'checkpoint'),block(3060,3650,190,190,'tunnel',670),
    block(4150,4400,720,720,'shelf'),block(4300,4650,240,240,'floe',460),
    block(5100,5580,300,340,'checkpoint'),
    block(6680,7730,240,330,'ramp'),block(7730,8080,330,300,'ridge'),
    block(8680,9200,330,380,'ramp'),block(9200,9980,380,300,'finish')
  ],[[600,2300],[2780,5100],[5580,6680],[8080,8680]],[2520,5340],9660,{
    entry:'灯暂时看不见了。顺着冰层下的水路，寻找透进来的光。',
    mid:'看不见灯的时候，路也没有消失。巢边的脚印仍然朝前。',
    exit:'灯塔就在岸边，大海还伸向看不见的地方。',transition:'沿着清晨的海湾，继续向前。'
  },{goal:{x:9690,y:surfaceAt(block(9200,9980,380,300),9690),kind:'lighthouse'},
    openSeaFrom:5580,decorations:[{kind:'cave-arch',x:650,y:370,w:140,h:190},
      {kind:'ice-cracks',x:3550,y:370,w:100,h:140},{kind:'buoy',x:5780,y:380,w:55,h:74}]}),
  chapter(3,'顺流而下','bay',[
    block(-100,350,300),block(350,700,300,395,'ramp'),
    block(2600,3050,395,350,'ramp'),block(3050,3250,350,350,'checkpoint'),block(3250,3400,350,395,'ramp'),
    block(5400,5850,395,350,'ramp'),block(5850,6150,350,350,'checkpoint'),block(6150,6300,350,395,'ramp'),
    block(8600,9050,395,350,'ramp'),block(9050,9350,350,350,'checkpoint'),block(9350,9500,350,395,'ramp'),
    block(12000,12650,395,330,'ramp'),block(12650,13200,330,330,'finish')
  ],[[700,2600],[3400,5400],[6300,8600],[9500,12000]],[3150,6000,9200],12900,{
    entry:'灯塔留在身后，大海的另一边还在前方。',mid:'原来，海水也会送你一程。',
    exit:'海湾留在身后，更远的海仍在前方。',transition:''
  },{bottom:1040,goal:{x:12930,y:330,kind:'lighthouse'},
    currents:[
      {x1:1000,x2:1700,y1:430,y2:600,speed:220,blend:65},
      {x1:3650,x2:4450,y1:430,y2:590,speed:320,blend:65},
      {x1:6800,x2:7600,y1:400,y2:620,speed:-400,blend:65},
      {x1:9900,x2:10900,y1:430,y2:590,speed:380,blend:65}
    ],
    flowFish:[{x1:870,x2:1900,y1:515,y2:515,speed:75},
      {x1:6500,x2:6750,y1:520,y2:730,speed:45},
      {x1:6750,x2:7850,y1:730,y2:730,speed:70},
      {x1:7850,x2:8100,y1:730,y2:520,speed:45}],
    storyNotices:[{id:'chapter-3:departure',x1:0,x2:450,text:'大海的另一边，还在前方。'},
      {id:'chapter-3:current',x1:3050,x2:3240,text:'原来，海水也会送你一程。'}],
    decorations:[{kind:'buoy',x:820,y:380,w:55,h:74}]}),
  chapter(4,'漂移冰原','bay',[
    block(-100,600,330),block(600,800,330,395,'ramp'),
    block(2200,2650,395,350,'ramp'),block(2650,3050,350,350,'checkpoint'),block(3050,3250,350,395,'ramp'),
    block(5200,5650,395,350,'ramp'),block(5650,6050,350,350,'checkpoint'),block(6050,6250,350,395,'ramp'),
    block(8600,9050,395,350,'ramp'),block(9050,9450,350,350,'checkpoint'),block(9450,9650,350,395,'ramp'),
    block(12000,12650,395,330,'ramp'),block(12650,13200,330,330,'finish')
  ],[[800,2200],[3250,5200],[6250,8600],[9650,12000]],[2850,5850,9250],12900,
    {entry:'',mid:'',exit:'',transition:''},
    {bottom:1040,goal:{x:12930,y:330,kind:'lighthouse'},
      currents:[{x1:3400,x2:4650,y1:400,y2:650,speed:360,blend:75},
        {x1:7200,x2:8200,y1:400,y2:650,speed:380,blend:75},
        {x1:9800,x2:11600,y1:400,y2:650,speed:380,blend:75}],
      movingIce:[
        {id:'lesson-slow',x1:1100,x2:1540,y1:350,y2:350,bottom:540,kind:'floe',floeVariant:'floe-original-flat',motion:'slow',amplitude:180,period:25},
        {id:'current-ride',x1:3500,x2:3920,y1:350,y2:350,bottom:580,kind:'floe',floeVariant:'floe-original-flat',motion:'current',end:4500,trigger:3500},
        {id:'transfer-slow',x1:6620,x2:7020,y1:350,y2:350,bottom:540,kind:'floe',floeVariant:'floe-shallow',motion:'slow',amplitude:150,period:24},
        {id:'transfer-fast',x1:7330,x2:7710,y1:350,y2:350,bottom:580,kind:'floe',floeVariant:'floe-original-flat',motion:'current',end:7880,trigger:7100},
        {id:'final-first',x1:9850,x2:10230,y1:350,y2:350,bottom:580,kind:'floe',floeVariant:'floe-original-flat',motion:'current',end:10600,trigger:9550},
        {id:'final-second',x1:11100,x2:11480,y1:350,y2:350,bottom:580,kind:'floe',floeVariant:'floe-shallow',motion:'current',end:11460,trigger:10850}
      ]})
];
const shuttle=(id,a,b,w,period)=>({id,x1:(a+b)/2,x2:(a+b)/2+w,y1:350,y2:350,bottom:490,kind:'floe',floeVariant:'floe-shallow',motion:'slow',amplitude:(b-a)/2,period,phase:-Math.PI/2});
STORY_LEVELS[3].goal.kind='shore';
STORY_LEVELS.push(chapter(5,'浮冰远行·2','bay',[block(-100,500,350),block(1500,2100,350,350,'checkpoint'),block(4200,4800,350,350,'checkpoint'),block(7100,7800,350,350,'finish')],[[500,1500],[2100,4200],[4800,7100]],[1750,4450],7550,{entry:'',mid:'',exit:'',transition:''},{bottom:1040,movingIce:[shuttle('safe',520,1080,400,26),shuttle('pair-a',2120,2850,390,28),shuttle('pair-b',3260,3790,390,30),shuttle('triple-a',4820,5500,380,27),shuttle('triple-b',5900,6200,380,29),shuttle('triple-c',6600,6700,380,25)],seals:[{species:'fur',left:650,right:1350,x:1000,y:650,range:380},{species:'leopard',left:2200,right:4080,x:3300,y:650,range:850},{species:'fur',left:4900,right:5800,x:5400,y:650,range:450},{species:'leopard',left:5900,right:6980,x:6500,y:650,range:850}]}));
export const LEVELS=[TUTORIAL,SECOND_TUTORIAL,...STORY_LEVELS];

// Wildlife stays clear of nests and the cave interior.
const birdPerches=[
  [[460,'petrel',25],[3110,'skua',29],[7050,'albatross',34]],
  [[380,'petrel',25],[7470,'skua',29],[9130,'albatross',34]],
  [[320,'petrel',25],[5750,'skua',29],[12700,'albatross',34]],
  [[340,'petrel',25],[12700,'albatross',34]],
  [[250,'petrel',25],[7400,'albatross',34]]
];
STORY_LEVELS.forEach((level,index)=>{
  level.birds=(birdPerches[index]||[]).map(([x,species,height])=>{
    const ground=level.solids.find(s=>x>=s.x1&&x<=s.x2);
    return {x,y:surfaceAt(ground,x),species,height};
  });
});

// Fixed selection keeps visual silhouettes and alpha collision in agreement.
const floeVariants=['floe-original-pointed','floe-offset','floe-original-flat','floe-double-point','floe-shallow'];
let floeIndex=0;
for(const level of LEVELS)for(const solid of level.solids)if(solid.kind==='floe')solid.floeVariant=floeVariants[floeIndex++%floeVariants.length];
