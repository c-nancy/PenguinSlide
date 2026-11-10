import {surfaceAt} from './level.js';
import {reefBlock} from './reefs.js';
import {placeBirds} from './bird-perches.js';
import {balanceEarlyLevels} from './level-balance-early.js';
import {balanceWaterLevels} from './level-balance-water.js';
import {balanceThinLevels} from './level-balance-thin.js';
import {balanceReefLevels} from './level-balance-reefs.js';
import {RETURNING_TIDE_LEVEL} from './returning-tide-level.js';

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
  {...block(1850,2400,120,120,'tunnel',660),highSlab:true},block(2700,3100,395,380,'ramp'),
  block(3600,4050,320,340,'floe',580),
  block(4500,4900,340,390,'ramp'),block(6400,7300,260,320,'finish')
],[[1500,2700],[3100,4500],[4900,6400]],[900],7100,{
  entry:'在巢边歇一歇，再往深一点的海里去。',mid:'有人留在岸边，也有人想去更远的地方。',
  exit:'原来，向下的路也能把你送得更高。',transition:'现在，沿着海湾出发。'
},{id:'tutorial-2',tutorial:true,initialHealth:60,bottom:1040,checkpointActivationBefore:0,
  keyHints:[
    {id:'ice-dive',key:'down',x:1700,y:430,fromX:1550,untilX:1850,maxY:700,when:'water',onlyWhenVisible:true},
    {id:'ice-forward',key:'right',anchor:'player',dx:100,dy:0,fromX:1550,untilX:2500,minY:700,when:'water',onlyWhenVisible:true},
    {id:'charge-dive',key:'down',anchor:'player',dx:80,dy:60,fromX:6250,untilX:6400,maxDepth:300,when:'water',onlyWhenVisible:true},
    {id:'charge-ascent',key:'up',anchor:'player',dx:50,dy:-100,fromX:6250,minDepth:300,minY:510,when:'water',onlyWhenVisible:true},
    {id:'charge-flight',key:'right',anchor:'player',dx:100,dy:-60,fromX:6250,untilX:6800,maxY:510,minCharge:.5,when:'rising',onlyWhenVisible:true}
  ],goal:{x:7130,y:309,kind:'shore'},decorations:[]
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
  ],[[700,2600],[3400,5400],[6300,8600],[9500,12000]],[3100,6000,9200],12900,{
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
STORY_LEVELS.push(chapter(5,'漂移冰原·2','bay',[block(-100,500,350),block(1500,2100,350,350,'checkpoint'),block(4200,4800,350,350,'checkpoint'),block(7100,7800,350,350,'finish')],[[500,1500],[2100,4200],[4800,7100]],[1750,4450],7550,{entry:'',mid:'',exit:'',transition:''},{bottom:1040,movingIce:[shuttle('safe',520,1080,400,26),shuttle('pair-a',2120,2850,390,28),shuttle('pair-b',3260,3790,390,30),shuttle('triple-a',4820,5500,380,27),shuttle('triple-b',5900,6200,380,29),shuttle('triple-c',6600,6700,380,25)],seals:[{species:'fur',left:650,right:1350,x:1000,y:650,range:380},{species:'leopard',left:2200,right:4080,x:3300,y:650,range:850},{species:'fur',left:4900,right:5800,x:5400,y:650,range:450},{species:'leopard',left:5900,right:6980,x:6500,y:650,range:850}]}));
const thin=(id,x1,x2)=>({id,x1,x2,y1:350,y2:350,bottom:440,kind:'floe',floeVariant:'floe-shallow'});
const restIce=(x1,x2,y)=>({...block(x1,x2,y,y,'floe',480),floeVariant:'floe-shallow'});
STORY_LEVELS[4].goal.kind='shore';
STORY_LEVELS.push(chapter(6,'薄冰小径','bay',[block(-100,500,350),block(1400,2000,395,350,'ramp'),block(3400,4000,395,350,'checkpoint'),block(4500,4850,180,180,'tunnel',620),block(5200,5800,395,350,'checkpoint'),block(7500,8200,395,330,'finish')],[[500,1400],[2000,3400],[4000,5200],[5800,7500]],[3750,5550],7950,{entry:'',mid:'',exit:'',transition:''},{bottom:1040,goal:{x:7980,y:350,kind:'lighthouse'},thinIce:[thin('first',520,920),...Array.from({length:5},(_,i)=>thin('run-'+i,2020+i*272,2292+i*272-(i===4?100:0))),thin('dive-a',4020,4220),thin('dive-b',4360,4500),...Array.from({length:6},(_,i)=>thin('choice-'+i,5820+i*277,6097+i*277-(i===5?102:0)))]}));
// Replace uniform runs with readable water gaps and a raised landing.
STORY_LEVELS[5].solids.splice(2,0,restIce(2790,3060,330));
STORY_LEVELS[5].thinIce=STORY_LEVELS[5].thinIce.filter(s=>!s.id.startsWith('run-'));
STORY_LEVELS[5].thinIce.push(thin('run-a',2020,2350),thin('run-b',2400,2740),thin('run-c',3110,3300));
STORY_LEVELS[5].thinIce.filter(s=>s.id.startsWith('choice-')).forEach((s,i)=>{if(i<5)s.x2-=80;});
STORY_LEVELS[5].thinIce.filter(s=>s.id.startsWith('choice-')).forEach((s,i)=>{
 const top=[350,330,350,320,340,350][i];s.y1=s.y2=top;s.bottom=top+90;
});
STORY_LEVELS[5].goal.kind='shore';
STORY_LEVELS[5].seals=[{species:'fur',left:6100,right:7250,x:6650,y:620,range:420}];
STORY_LEVELS.push(chapter(7,'薄冰小径·2','bay',[
 block(-100,500,350),block(1400,2000,395,350,'checkpoint'),
 block(2540,2810,350,350,'floe',490),block(3400,4000,395,350,'checkpoint'),
 block(5200,5800,395,350,'shore'),
 {...block(6651,6928,350,350,'floe',440),floeVariant:'floe-shallow'},
 {...block(7482,7759,350,350,'floe',440),floeVariant:'floe-shallow'},
 block(8331,9031,395,330,'finish')
],[[500,1400],[2000,3400],[4000,5200],[5800,8331]],[1750,3750],8781,{entry:'',mid:'',exit:'',transition:''},
 {bottom:1040,goal:{x:8811,y:350,kind:'lighthouse'},
 thinIce:[thin('review',520,920),thin('fur-a',2020,2280),thin('fur-b',2280,2540),thin('fur-c',2810,3300),
 ...Array.from({length:4},(_,i)=>thin('leopard-'+i,4020+i*272,4292+i*272-(i===3?8:0))),
 ...Array.from({length:9},(_,i)=>thin('last-'+i,5820+i*277,6097+i*277-(i===8?102:0))).filter((_,i)=>i!==3&&i!==6)],
 seals:[{species:'fur',left:2130,right:3240,x:2520,y:600,range:420},
 {species:'leopard',left:4130,right:5060,x:4540,y:620,range:700},
 {species:'fur',left:6000,right:7100,x:6550,y:600,range:420},
 {species:'leopard',left:7200,right:8200,x:7700,y:620,range:700}]}));
STORY_LEVELS[6].thinIce.filter(s=>s.id.startsWith('last-')).forEach((s,i)=>{
 if(i<6)s.x2-=80;
 s.y1=s.y2=[350,330,350,340,350,340,350][i];s.bottom=s.y1+90;
});
STORY_LEVELS[6].thinIce.filter(s=>s.id.startsWith('leopard-')).forEach((s,i)=>{
 if(i<3)s.x2-=80;s.y1=s.y2=i%2?330:350;s.bottom=s.y1+90;
});
for(const s of STORY_LEVELS[6].solids)if(s.x1===6651||s.x1===7482)s.y1=s.y2=330;
STORY_LEVELS[6].thinIce.find(s=>s.id==='fur-a').x2-=60;
STORY_LEVELS[6].thinIce.find(s=>s.id==='fur-b').x1+=20;
const furStep=STORY_LEVELS[6].thinIce.find(s=>s.id==='fur-b');furStep.y1=furStep.y2=330;furStep.bottom=420;
STORY_LEVELS[6].thinIce.find(s=>s.id==='fur-c').x1+=80;
STORY_LEVELS[6].goal.kind='shore';
const highIce=(id,x)=>({id,x1:x,x2:x+500,y1:260,y2:260,bottom:900,kind:'tunnel',motion:'slow',amplitude:100,period:16});
STORY_LEVELS.push(chapter(8,'高冰逐浪','bay',[
 block(-100,600,330),block(600,800,330,395,'ramp'),
 block(1850,2650,395,350,'ramp'),block(2650,3050,350,350,'checkpoint'),block(3050,3250,350,395,'ramp'),
 block(3550,3750,180,180,'tunnel',600),
 block(5200,5650,395,350,'ramp'),block(5650,6050,350,350,'checkpoint'),block(6050,6250,350,395,'ramp'),
 block(8600,9250,395,330,'ramp'),block(9250,9800,330,330,'finish')
],[[800,1850],[3250,5200],[6250,8600]],[2850,5850],9500,{entry:'',mid:'',exit:'',transition:''},
 {bottom:1040,goal:{x:9530,y:330,kind:'lighthouse'},movingIce:[highIce('high-first',1150),highIce('high-window',4150),highIce('high-choice',6750)]}));
STORY_LEVELS[7].goal.kind='shore';
STORY_LEVELS.push(chapter(9,'潮汐海湾','bay',[
 block(-100,500,280),block(500,800,280,420,'ramp'),
 block(1600,1900,435),block(1900,2400,435,280,'ramp'),block(2400,2800,280,280,'checkpoint'),block(2800,3100,280,420,'ramp'),
 block(3650,4000,390,390,'floe',570),
 block(5100,5500,180,180,'checkpoint'),block(5500,5800,180,420,'ramp'),
 block(6400,6800,400,400,'floe',570),block(7100,7450,295,295,'floe',540),
 block(8600,9300,180,180,'finish')
],[[800,1600],[3100,5100],[5800,8600]],[2600,5300],9050,{entry:'',mid:'',exit:'',transition:''},
 {bottom:1040,tide:{amplitude:70,period:24,hold:1.4},goal:{x:9080,y:180,kind:'lighthouse'},decorations:[{kind:'buoy',x:1100,y:380,w:55,h:74},{kind:'buoy',x:6000,y:380,w:55,h:74}]}));
STORY_LEVELS[8].goal.kind='shore';
STORY_LEVELS.push(chapter(10,'开冰引潮','bay',[
 block(-100,500,280),block(500,800,280,395,'ramp'),
 block(2200,2500,280,280,'checkpoint',650),
 {...block(2200,2500,950,950,'shore',1280),wallSection:true},
 block(3900,4300,240,240,'checkpoint',650),
 {...block(3900,4300,950,950,'shore',1280),wallSection:true},
 block(6500,7600,240,240,'finish')
],[[800,2200],[2500,3900],[4300,6500]],[2290,4090],7350,{entry:'',mid:'',exit:'',transition:''},
 {waterY:380,bottom:1040,basins:[{left:-100,right:2350,initial:380},{left:2350,right:4100,initial:650,target:380,feed:0},{left:4100,right:7600,initial:650,target:380,feed:1}],
 gates:[{id:'weak-wall',x1:2200,x2:2500,y1:650,y2:650,bottom:950,kind:'weak-wall'},{id:'weak-wall-2',x1:3900,x2:4300,y1:650,y2:650,bottom:950,kind:'weak-wall'}],movingIce:[{id:'rising-rest',x1:3100,x2:3480,y1:620,y2:620,bottom:790,kind:'floe',floeVariant:'floe-original-flat',motion:'water',basin:1,freeboard:-30}],goal:{x:7380,y:240,kind:'lighthouse'}}));
STORY_LEVELS[9].goal.kind='shore';
const caveRoof=(x1,x2,bottom)=>({...block(x1,x2,-400,-400,'tunnel',bottom),caveRoof:true});
STORY_LEVELS.push(chapter(11,'冰洞暗礁','cave',[
 block(-100,500,330),block(500,750,330,395,'ramp'),
 caveRoof(900,1800,500),caveRoof(1800,2400,760),
 reefBlock(1100,650,'reef-01'),reefBlock(2050,400,'reef-03'),
 block(2700,2900,395,350,'ramp'),block(2900,3100,350,350,'checkpoint'),block(3100,3300,350,395,'ramp'),
 caveRoof(3500,4400,440),caveRoof(4700,5300,780),caveRoof(5600,6200,430),
 reefBlock(3650,650,'reef-02'),reefBlock(4800,550,'reef-01'),reefBlock(5650,650,'reef-02'),
 block(6500,7100,280,280,'checkpoint'),
 caveRoof(7300,7900,760),caveRoof(8250,9000,430),caveRoof(9150,9500,760),
 reefBlock(7450,550,'reef-01'),reefBlock(8250,650,'reef-02'),reefBlock(9800,500,'reef-02'),
 block(10300,10600,395,330,'ramp'),block(10600,11100,330,330,'finish')
],[[750,2700],[3300,6500],[7100,10300]],[2940,6800],10850,
 {entry:'',mid:'',exit:'',transition:''},{bottom:1040,goal:{x:10880,y:330,kind:'lighthouse'}}));
// The original cave becomes the longer second chapter; keep both routes explicit.
const reefSequel=STORY_LEVELS.at(-1);
reefSequel.id='chapter-12';reefSequel.chapter=12;reefSequel.title='冰洞暗礁·2';
reefSequel.solids.at(-1).kind='checkpoint';
reefSequel.checkpoints.forEach((cp,i)=>cp.id=`chapter-12-flag-${i+1}`);
reefSequel.checkpoints.push({id:'chapter-12-flag-3',x:10680,y:308,label:'企鹅巢 C'});
reefSequel.solids.push(caveRoof(11300,12150,470),reefBlock(11600,500,'ice-block-01'),
 caveRoof(12150,12500,760),reefBlock(12180,550,'ice-block-02'),
 caveRoof(12500,13500,430),reefBlock(12700,220,'ice-block-03'),
 block(13900,14200,395,330,'ramp'),block(14200,14700,330,330,'finish'));
reefSequel.waters.push([11100,13900]);reefSequel.width=14700;reefSequel.goalX=14450;
reefSequel.goal={x:14480,y:330,kind:'lighthouse'};
const reefIntro=chapter(11,'冰洞暗礁','cave',[
 block(-100,500,330),block(500,750,330,395,'ramp'),
 caveRoof(900,1800,500),reefBlock(1200,350,'ice-block-01'),reefBlock(1800,360,'reef-01'),
 block(2200,2400,395,350,'ramp'),block(2400,2700,350,350,'checkpoint'),block(2700,2800,350,395,'ramp'),
 caveRoof(3000,3800,650),reefBlock(3200,550,'ice-block-02'),
 block(4400,4600,395,350,'ramp'),block(4600,4900,350,350,'checkpoint'),block(4900,5000,350,395,'ramp'),
 caveRoof(5300,6000,470),reefBlock(5450,200,'ice-block-03'),reefBlock(6100,350,'reef-03'),
 block(6700,6900,395,330,'ramp'),block(6900,7400,330,330,'finish')
],[[750,2200],[2800,4400],[5000,6700]],[2480,4680],7150,
 {entry:'',mid:'',exit:'',transition:''},{bottom:1040,goal:{x:7180,y:330,kind:'shore'}});
STORY_LEVELS.splice(10,0,reefIntro);
STORY_LEVELS.at(-1).goal.kind='shore';
STORY_LEVELS.push(chapter(13,'跃入冰隙','cave',[
 block(-100,650,330),
 caveRoof(1500,2100,200),block(1500,1580,390,370,'ramp'),block(1580,2100,370),
 reefBlock(2320,440,'reef-01'),reefBlock(2940,400,'reef-03'),
 caveRoof(3700,4450,160),block(3700,4450,280,280,'checkpoint'),
 reefBlock(4880,440,'reef-02'),
 caveRoof(5900,6600,60),block(5900,6600,310),
 reefBlock(6820,440,'reef-01'),reefBlock(7490,400,'reef-02'),
 caveRoof(8200,9100,150),block(8200,9100,270,270,'checkpoint'),block(9100,9400,270),
 reefBlock(9770,470,'reef-03'),
 caveRoof(10800,11400,40),block(10800,11400,290),
 reefBlock(11550,380,'reef-01'),reefBlock(12080,300,'reef-02'),
 caveRoof(12800,13600,130),block(12800,13600,250),block(13600,14500,250,250,'finish')
],[[650,1500],[2100,3700],[4450,5900],[6600,8200],[9400,10800],[11400,12800]],[4170,8750],14250,
 {entry:'',mid:'',exit:'',transition:''},{bottom:1040,
 openings:[{left:1500,right:2100,floor:370},{left:3700,right:4450,floor:280},{left:5900,right:6600,floor:310},{left:8200,right:9100,floor:270},{left:10800,right:11400,floor:290},{left:12800,right:13600,floor:250}],
 goal:{x:14280,y:250,kind:'lighthouse'}}));
STORY_LEVELS.find(level=>level.id==='chapter-13').goal.kind='shore';
STORY_LEVELS.push(RETURNING_TIDE_LEVEL);
// Assign existing silhouettes before adding new floes. Later chapters retain
// their original artwork even when another chapter gains a receiving platform.
const floeVariants=['floe-original-pointed','floe-offset','floe-original-flat','floe-double-point','floe-shallow'];
let floeIndex=0;
for(const level of [TUTORIAL,SECOND_TUTORIAL,...STORY_LEVELS])for(const solid of level.solids)
 if(solid.kind==='floe'&&!solid.floeVariant)solid.floeVariant=floeVariants[floeIndex++%floeVariants.length];
balanceEarlyLevels(STORY_LEVELS);
balanceWaterLevels(STORY_LEVELS);
balanceThinLevels(STORY_LEVELS);
balanceReefLevels(STORY_LEVELS);
export const LEVELS=[TUTORIAL,SECOND_TUTORIAL,...STORY_LEVELS];

// Wildlife stays clear of nests and the cave interior.
const birdPerches=[
  [[460,'petrel',25],[3110,'skua',29],[7050,'albatross',34]],
  [[380,'petrel',25],[7470,'skua',29],[9130,'albatross',34]],
  [[320,'petrel',25],[5750,'skua',29],[12700,'albatross',34]],
  [[340,'petrel',25],[12700,'albatross',34]],
  [[250,'petrel',25],[7400,'albatross',34]],
  [[250,'petrel',25],[7900,'albatross',34]],
  [[250,'petrel',25],[8731,'albatross',34]],
  [[300,'petrel',25],[9500,'albatross',34]],
  [[300,'petrel',25],[8900,'albatross',34]],
  [[250,'petrel',25],[7200,'albatross',34]],
  [[250,'petrel',25],[7300,'albatross',34]],
  [[250,'petrel',25],[14500,'albatross',34]],
  [[250,'skua',46]]
];
STORY_LEVELS.forEach((level,index)=>{
  if(level.id==='chapter-14'){level.birds=[];return;}
  level.birds=placeBirds(level,birdPerches[index]||[[250,'petrel'],[7200,'albatross']]);
});


