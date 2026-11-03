// Slow, bounded movement about each school's own position, like ambient bubbles.
export function fishDrift(x,y,time,seed=0){
 const phase=x*.031+y*.017+seed*2.399;
 return {x:Math.sin(time*.65+phase)*6,y:Math.sin(time*.9+phase*1.7)*6};
}
