const block=(id,x1,x2,y,kind='shore',bottom=1280)=>({id,x1,x2,y1:y,y2:y,bottom,kind});

// A shallow pool leads to a small exposed platform, then an open deep pool.
// Only the short section beside the high shore is covered with breakable ice.
export const BENEATH_THIN_ICE_LEVEL={
 id:'chapter-15',chapter:15,title:'薄冰之下',theme:'cave',
 width:4700,waterY:380,bottom:1040,start:{x:150,y:328},
 overviewY:50,cameraLead:100,
 solids:[
  block('thin-well-start',-100,440,350),
  block('thin-well-shallow-bed',440,1020,560),
  block('thin-well-approach-platform',1020,1140,350),
  block('thin-well-high-shore',1900,2500,180,'checkpoint'),
  // A small gap above the plug is too low to slide through. Its submerged
  // base still seals the floor edge until the player breaks the ice.
  block('thin-cave-floor',3500,3950,460),
  {...block('thin-cave-roof',3500,4020,-400,'shore',355),roughBottom:{height:8}},
  {...block('thin-cave-exit-ramp',3950,4300,460,'ramp'),y2:350},
  block('thin-cave-exit-shore',4300,4700,350,'finish')
 ],
 waters:[[440,1020],[1140,1900],[2500,4300]],
 thinIce:[
  {...block('thin-well-lid',1700,1900,350,'floe',410),floeVariant:'floe-original-flat'},
  {...block('thin-cave-plug',3260,3500,370,'floe',470),floeVariant:'floe-original-flat'}
 ],
 checkpoints:[{id:'thin-cave-nest',x:2250,y:158,label:'企鹅巢 A'}],
 goalX:4500,goal:{x:4530,y:350,kind:'lighthouse'},
 story:{entry:'',mid:'',exit:'',transition:''},storyPoint:{x:2180},
 signs:[],decorations:[],birds:[],rocks:[]
};
