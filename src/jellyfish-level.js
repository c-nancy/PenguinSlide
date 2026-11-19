import {reefBlock} from './reefs.js';
const block=(id,x1,x2,y,kind='shore')=>({id,x1,x2,y1:y,y2:y,bottom:1280,kind});
export const JELLYFISH_LEVEL={
 id:'chapter-16',chapter:16,title:'伞影之间',theme:'bay',width:6400,waterY:380,bottom:1040,
 start:{x:150,y:328},overviewY:80,cameraLead:100,
 solids:[block('jelly-start',-100,500,350),
  {...block('jelly-first-ramp',1800,2000,460,'ramp'),y2:350},block('jelly-first-rest',2000,2450,350,'checkpoint'),
  reefBlock(3100,260,'reef-01'),reefBlock(3500,350,'reef-02'),
  {...block('jelly-second-ramp',4100,4300,460,'ramp'),y2:350},block('jelly-second-rest',4300,4750,350,'checkpoint'),
  block('jelly-high-shore',5900,6400,180,'finish')],
 waters:[[500,2000],[2450,4300],[4750,5900]],
 jellyfish:[
  {id:'jelly-intro',x:1100,y:610,dy:120,period:14,width:170},
  {id:'jelly-pair-a',x:2900,y:560,dy:110,period:18,width:170},
  {id:'jelly-pair-b',x:3700,y:560,dy:110,period:18,phase:.5,width:170},
  {id:'jelly-launch',x:5600,y:560,dy:100,period:16,width:180}
 ],
 checkpoints:[{id:'jelly-nest-a',x:2180,y:328,label:'企鹅巢 A'},{id:'jelly-nest-b',x:4480,y:328,label:'企鹅巢 B'}],
 goalX:6250,goal:{x:6280,y:180,kind:'lighthouse'},
 story:{entry:'',mid:'',exit:'',transition:''},storyPoint:{x:2180},signs:[],decorations:[],birds:[],rocks:[]
};
