// Native-resolution pixel art, drawn on a small integer grid and scaled nearest-neighbor.
const cache = new Map();
export function itemArt(name) {
  if(cache.has(name)) return cache.get(name);
  const shard=name==='Vampire Shard',size=shard?128:120,grid=shard?32:30;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const c=canvas.getContext('2d');c.scale(4,4);c.imageSmoothingEnabled=false;
  const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const poly=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  if(name==='Vampire Shard Summoning Sigil') {
    poly([[15,2],[27,9],[27,22],[15,29],[3,22],[3,9]],'#694894');
    poly([[15,5],[24,11],[24,20],[15,26],[6,20],[6,11]],'#241d3b');
    poly([[15,8],[20,15],[15,23],[11,15]],'#ee4366');
    rect(14,11,2,7,'#ffb8b3');
    for(const [x,y] of [[6,8],[23,8],[5,21],[24,21]]) {rect(x,y,1,3,'#ebceff');rect(x-1,y+1,3,1,'#ebceff');}
  } else if(shard){
    for(let i=0;i<5;i++){c.globalAlpha=.07+i*.02;rect(5+i,3+i,22-i*2,26-i*2,'#ff285a');}c.globalAlpha=1;
    poly([[17,4],[23,14],[19,24],[13,29],[9,17],[12,9]],'#630e34');
    poly([[17,4],[19,16],[13,29],[10,17]],'#e32e56');
    poly([[17,4],[23,14],[19,16]],'#ff8391');
    poly([[19,16],[19,24],[13,29]],'#a80f3b');rect(14,10,2,8,'#ffc3bc');
    for(const [x,y] of [[3,7],[23,5],[22,23]]) {
      poly([[x,y],[x+3,y+2],[x+5,y],[x+8,y-1],[x+7,y+3],[x+5,y+2],[x+4,y+5],[x+2,y+2],[x,y+3]],'#271c43');
      rect(x+3,y+1,2,2,'#634474');rect(x+3,y+1,1,1,'#fc8694');
    }
    rect(6,23,1,3,'#ffbfbd');rect(5,24,3,1,'#ffbfbd');
  } else if(name==='Vampire Sword') {
    poly([[15,1],[19,7],[17,21],[13,21],[11,7]],'#b9ccdb');
    poly([[15,1],[15,20],[12,20],[11,7]],'#f2e7ed');
    rect(14,7,2,14,'#ef3461');rect(7,20,16,3,'#695474');
    rect(13,23,4,5,'#342437');rect(13,27,4,2,'#ed3763');
  } else if(name==='Wood') {
    poly([[5,8],[23,5],[27,20],[10,25]],'#674126');poly([[5,8],[10,25],[6,23],[2,11]],'#a76634');
    poly([[6,9],[22,6],[24,10],[8,14]],'#b78144');
    for(let i=0;i<3;i++) rect(10+i*4,12-i,2,7,'#80502c');
    poly([[10,20],[24,16],[27,20],[23,25],[12,27],[8,24]],'#e7b875');rect(13,22,9,2,'#9c6635');rect(16,21,4,4,'#bc864d');
  } else if(name==='Goblin Bone') {
    poly([[6,5],[10,5],[11,9],[22,19],[25,18],[28,21],[26,25],[22,26],[20,22],[9,12],[5,12],[3,8]],'#a5b0a1');
    poly([[6,5],[9,5],[10,10],[23,20],[26,20],[26,23],[22,24],[20,20],[8,11],[5,10]],'#f3ead0');
  } else if(name==='Orc Tusk') {
    poly([[8,4],[17,5],[20,10],[19,17],[14,23],[5,27],[11,19],[13,12]],'#b9a783');
    poly([[9,4],[15,5],[17,10],[15,17],[5,27],[12,17],[13,10]],'#fff1cb');rect(8,4,9,3,'#8c7155');
  } else if(name==='Bat Wing') {
    poly([[4,25],[7,10],[14,4],[25,6],[21,10],[26,18],[19,15],[17,23],[12,19]],'#332747');
    poly([[7,22],[9,11],[15,7],[22,7],[17,11],[22,16],[17,14],[15,19],[11,16]],'#9862ac');
    poly([[7,22],[13,10],[20,8],[14,13]],'#c28bbb');
  } else if(['Hammer','Woodcutter Axe','Orc War Club'].includes(name)) {
    rect(13,7,4,20,'#583627');rect(13,7,2,18,'#bd8a50');
    for(const y of [18,21,24]) rect(12,y,6,2,'#3a3944');
    if(name==='Hammer') {rect(4,4,22,8,'#354959');rect(6,4,18,6,'#9eb9c7');rect(5,4,3,8,'#d2e7e6');rect(22,4,3,8,'#647d92');rect(8,4,14,2,'#e3eded');}
    if(name==='Woodcutter Axe') {poly([[13,4],[19,3],[21,9],[28,13],[25,20],[17,15],[15,10]],'#466078');poly([[18,4],[19,10],[26,14],[24,18],[18,14],[16,8]],'#96b8c5');poly([[26,13],[28,13],[25,20],[23,18]],'#e2f7ef');}
    if(name==='Orc War Club') {poly([[9,3],[19,3],[23,7],[20,16],[12,17],[7,10]],'#71442c');rect(10,5,8,8,'#a47440');rect(8,11,13,3,'#465362');for(const [x,y] of [[7,4],[20,5],[5,10],[20,14]]) poly([[x,y],[x+4,y+2],[x+1,y+5]],'#d3d9c6');rect(9,11,2,2,'#d2d7c2');rect(17,11,2,2,'#d2d7c2');}
  } else if(name.includes('Key')) {
    rect(12,12,4,15,'#d9a747');rect(16,22,7,3,'#f9d984');rect(20,19,3,4,'#bd7e35');
    rect(8,3,13,11,'#f9d984');rect(11,6,7,5,'#665681');rect(9,4,2,8,'#fff0b5');
  } else {
    poly([[15,3],[24,13],[20,25],[9,25],[5,13]],'#466480');poly([[15,5],[21,14],[18,22],[11,22],[8,14]],'#94e0d6');rect(14,9,3,11,'#e5fff0');rect(11,13,9,3,'#e5fff0');
  }
  const url=canvas.toDataURL('image/png');cache.set(name,url);return url;
}
