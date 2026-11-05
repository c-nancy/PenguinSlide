import {reefBlock} from './reefs.js';

const block=(x1,x2,y1,y2=y1,kind='shore',bottom=1280)=>({x1,x2,y1,y2,bottom,kind});
// Rendering and the ceiling solver both consume this same flat underside.
const caveRoof=(x1,x2,bottom)=>({...block(x1,x2,-400,-400,'tunnel',bottom),caveRoof:true});

export function balanceReefLevels(levels){
 const intro=levels.find(l=>l.id==='chapter-11');
 if(intro){
  intro.solids=[
   block(-100,500,330),block(500,750,330,395,'ramp'),
   caveRoof(900,1800,500),reefBlock(1200,350,'ice-block-01'),reefBlock(1800,360,'reef-01'),
   block(2200,2400,395,350,'ramp'),block(2400,2700,350,350,'checkpoint'),block(2700,2800,350,395,'ramp'),
   // First descend beneath the roof, then rise over the offset low ridge.
   // The final 150 px of open water lets the swimmer brake before the shore.
   caveRoof(3000,3300,850),reefBlock(3450,800,'ice-block-02'),
   block(4400,4600,395,350,'ramp'),block(4600,4900,350,350,'checkpoint'),block(4900,5000,350,395,'ramp'),
   caveRoof(5300,6000,470),reefBlock(5450,200,'ice-block-03'),reefBlock(6100,350,'reef-03'),
   block(6700,6900,395,330,'ramp'),block(6900,7400,330,330,'finish')
  ];
 }
 const sequel=levels.find(l=>l.id==='chapter-12');
 if(!sequel)return;
 sequel.solids=[
  block(-100,500,330),block(500,750,330,395,'ramp'),
  // One wide passage over the iceberg, rather than a second deep fold.
  caveRoof(900,1700,500),reefBlock(1100,330,'reef-01'),reefBlock(1450,450,'ice-block-01'),
  block(2050,2250,395,350,'ramp'),block(2250,2550,350,350,'checkpoint'),block(2550,2650,350,395,'ramp'),
  // A suspended long ridge has a broad lower lane. Its transparent artwork
  // and SDF remain the ordinary reefBlock profile, including its underside.
  caveRoof(2800,4100,470),reefBlock(3000,900,'ice-block-02',760),
  block(4350,4950,280,280,'checkpoint'),
  // The only full low-to-high S in the sequel, with room between its gates.
  caveRoof(5100,5500,730),reefBlock(5200,330,'reef-01'),
  reefBlock(5750,650,'reef-02'),caveRoof(5850,6300,430),
  block(6650,6950,395,330,'ramp'),block(6950,7450,330,330,'checkpoint'),
  // A single narrow angled column gives the last section a different shape.
  caveRoof(7600,8000,600),reefBlock(8150,220,'ice-block-03'),reefBlock(8500,350,'reef-03'),
  block(9100,9400,395,330,'ramp'),block(9400,9900,330,330,'finish')
 ];
 sequel.waters=[[750,2050],[2650,4350],[4950,6650],[7450,9100]];
 sequel.width=9900;sequel.goalX=9650;
 sequel.goal={...sequel.goal,x:9680,y:330,kind:'shore'};
 const positions=[[2290,328],[4650,258],[7030,308]];
 sequel.checkpoints=sequel.checkpoints.map((cp,i)=>({...cp,x:positions[i][0],y:positions[i][1]}));
 sequel.storyPoint={...sequel.storyPoint,x:2290};
 // Also support application after wildlife placement (for tooling/reloads).
 if(sequel.birds)sequel.birds=sequel.birds.map(b=>b.x>sequel.width?{...b,x:9705,y:330}:b);
}
