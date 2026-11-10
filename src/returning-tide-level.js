import {reefBlock} from './reefs.js';
const block=(x1,x2,y,kind='shore',bottom=1280)=>({x1,x2,y1:y,y2:y,bottom,kind});

// The source stays connected to the sea. Only the right chamber rises when
// the single weak wall opens; the nest records that chamber's gate state.
export const RETURNING_TIDE_LEVEL={
 id:'chapter-14',chapter:14,title:'回潮冰室',theme:'cave',
 width:5600,waterY:380,bottom:1040,start:{x:1000,y:258},
 overviewY:80,cameraLead:130,
 checkpointGateState:true,
 solids:[
  {...block(650,1400,280,'shore',650),roughBottom:{start:900,height:16}},
  {...block(650,900,950),wallSection:true},
  reefBlock(2180,700,'reef-01'),
  block(2410,2900,300,'checkpoint'),
  // One continuous platform leaves the underwater route open. The authored
  // ice block rests on its snow surface and uses its painted collision mask.
  {...block(3000,3800,290,'shore',760),id:'returning-tide-underpass-ledge',roughBottom:{height:12}},
  {...reefBlock(3320,280,'ice-block-01',270),id:'returning-tide-underpass-barrier'},
  {...block(4020,4260,300),id:'returning-tide-rest-shore'},
  {...block(4320,4480,285,'shore',760),id:'returning-tide-hop-step',roughBottom:{height:12}},
  {...block(4540,5000,-400,'tunnel',620),id:'returning-tide-low-roof',caveRoof:true},
  {...reefBlock(4500,900,'reef-01'),id:'returning-tide-low-reef'},
  block(5260,5600,270,'finish')
 ],
 waters:[[0,2410],[2900,4020],[4260,4320],[4480,5260]],
 basins:[
  {left:0,right:775,initial:380},
  {left:775,right:5600,initial:650,target:380,feed:0}
 ],
 gates:[{id:'returning-tide-wall',x1:650,x2:900,y1:650,y2:650,bottom:950,kind:'weak-wall'}],
 thinIce:[{id:'returning-tide-thin',x1:1600,x2:2000,y1:620,y2:620,bottom:710,
  kind:'floe',floeVariant:'floe-original-flat',motion:'water',basin:1,freeboard:-30}],
 // X stays fixed. Keep a visible 30-pixel shore gap and a vertical side;
 // the 25-pixel rise still requires a ground jump without a sloped water exit.
 movingIce:[{id:'returning-tide-floe',x1:2000,x2:2380,y1:595,y2:595,bottom:815,
  kind:'tunnel',floeVariant:'floe-original-flat',motion:'water',basin:1,freeboard:-55}],
 checkpoints:[{id:'chapter-14-flag-1',x:2670,y:278,label:'企鹅巢 A'}],
 goalX:5500,goal:{x:5530,y:270,kind:'lighthouse'},
 story:{entry:'',mid:'',exit:'',transition:''},storyPoint:{x:2670},
 signs:[],decorations:[],birds:[],rocks:[]
};
