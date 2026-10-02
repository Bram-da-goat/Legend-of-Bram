import * as THREE from 'three';
import { box, part, mat } from './models.js';

// Set dressing stays outside the central interaction routes. No save state here.
export function dressHollow({ manHouse, basement, cave, cavePath, colliders }) {
  const wood = mat('#674832'), oak = mat('#a47b50'), iron = mat('#394b50');
  const stone = mat('#65757a'), pale = mat('#96a5a2'), moss = mat('#486962');
  const amber = mat('#ffd398', 1, 0, '#ff9b43', 0.65);
  const crystal = mat('#8ce4df', 1, 0, '#39a7b4', 0.7);
  const flames = [];
  const names = new Map([[manHouse, 'manHouse'], [basement, 'basement'], [cave, 'cave']]);
  function prop(zone, x, z, radius = 0) {
    const g = new THREE.Group(); g.position.set(x, 0, z); zone.add(g);
    if (radius) colliders[names.get(zone)].push({ object: g, radius });
    return g;
  }
  function lantern(zone, x, z, y = 2) {
    const g = prop(zone, x, z);
    box(g, [.4,.6,.4], iron, [0,y,0]);
    const glow = box(g, [.29,.4,.43], amber, [0,y,0]);
    box(g, [.45,.07,.45], oak, [0,y+.34,0]);
    flames.push(glow);
    return g;
  }
  function barrel(zone,x,z) {
    const g=prop(zone,x,z,.62);
    part(g,new THREE.CylinderGeometry(.48,.55,1.15,12),oak,[0,.58,0]);
    for(const y of [.2,.93]) part(g,new THREE.TorusGeometry(.52,.045,6,16),iron,[0,y,0]).rotation.x=Math.PI/2;
  }
  // Explorer's hideout: warm wood, field maps, a hearth, and a forgotten bed.
  for(let x=-8.5;x<9;x+=.65) {
    if(Math.abs(x)<1.55) {
      box(manHouse,[.61,.035,9.4],oak,[x,.035,2]);
      box(manHouse,[.61,.035,.8],oak,[x,.035,-6.5]);
    } else box(manHouse,[.61,.035,13.7],x%2>0?wood:oak,[x,.035,0]);
  }
  box(manHouse,[5,.035,5.8],mat('#385d67'),[0,.08,1.6]);
  for(const x of [-2.3,2.3]) box(manHouse,[.09,.01,5.5],mat('#d2b16b'),[x,.105,1.6]);
  const desk=prop(manHouse,-4,-2,1.5);
  box(desk,[2.7,.2,1.7],oak,[0,1.1,0]);
  for(const x of [-1.1,1.1]) for(const z of [-.6,.6]) box(desk,[.15,1.1,.15],wood,[x,.55,z]);
  box(desk,[1.9,.025,1.2],mat('#dbc89e'),[0,1.22,0]);
  for(let i=0;i<5;i++) box(desk,[.06,.01,.7],mat('#7a8c76'),[-.65+i*.3,1.24,Math.sin(i)*.2]).rotation.y=i*.7;
  part(desk,new THREE.TorusGeometry(.16,.025,6,16),iron,[.7,1.26,.2]).rotation.x=Math.PI/2;
  const bed=prop(manHouse,5,-3,1.7);
  box(bed,[2.2,.5,3.2],wood,[0,.25,0]);
  box(bed,[2,.3,2.9],mat('#b9b39a'),[0,.64,0]);
  box(bed,[2.02,.12,1.9],mat('#4b7281'),[0,.85,.48]);
  box(bed,[1.5,.23,.6],mat('#e1d7b9'),[0,.91,-.95]);
  const hearth=prop(manHouse,-6,3,1.25);
  box(hearth,[2.3,1.8,1.2],stone,[0,.9,0]);
  box(hearth,[1.5,.9,.1],iron,[0,.65,.66]);
  for(const x of [-.4,0,.4]) part(hearth,new THREE.ConeGeometry(.18,.6,7),amber,[x,.5,.75]);
  box(hearth,[2.6,.2,1.4],oak,[0,1.85,0]);
  for(let i=0;i<7;i++) box(manHouse,[.25,.5+(i%3)*.12,.55],mat(['#6b7f85','#9c6555','#bd9c64'][i%3]),[-5+i*.32,2,-6.45]);
  box(manHouse,[3,.14,.85],wood,[-4,1.7,-6.5]);
  lantern(manHouse,-1.7,-3.5); lantern(manHouse,6,3);
  barrel(manHouse,7,1);
  // Supply cellar: masonry, braced supports, old stores and seepage.
  for(let row=0;row<5;row++) for(let col=0;col<12;col++) {
    const x=-8.25+col*1.5+(row%2)*.35;
    box(basement,[1.43,.57,.18],(row+col)%3?stone:pale,[x,.32+row*.62,-6.8]);
  }
  for(const x of [-6.8,6.8]) for(const z of [-4,2.5]) {
    const post=prop(basement,x,z,.4);
    box(post,[.45,3.6,.45],wood,[0,1.8,0]);
    box(post,[1.5,.28,.55],wood,[0,3.15,0]);
  }
  for(const [x,z] of [[-5,-3],[-6,-2],[-5,1],[6,2],[6,3.3]]) barrel(basement,x,z);
  for(const [x,z] of [[-6,4],[6,-4]]) {
    const crate=prop(basement,x,z,.95);
    box(crate,[1.5,1.3,1.4],wood,[0,.65,0]);
    for(const side of [-.6,.6]) box(crate,[.12,1.4,1.45],oak,[side,.7,0]);
    box(crate,[1.8,.12,.1],oak,[0,.7,.73]).rotation.z=.6;
  }
  for(const [x,z] of [[-3,-4],[6,0],[-7,5]]) {
    const pool=part(basement,new THREE.CircleGeometry(1,24),mat('#375b60'),[x,.045,z]);
    pool.rotation.x=-Math.PI/2;pool.scale.set(1.4,.6,1);
  }
  lantern(basement,-2,4,2.3);lantern(basement,2,-5.8,2.2);
  // Jagged breach framing, rather than a perfect circular hole.
  for(let i=0;i<9;i++) {
    const a=i/8*Math.PI;
    const block=box(basement,[.6,.68,.8],i%2?stone:pale,[Math.cos(a)*1.65,.3+Math.sin(a)*2.6,-5.8]);
    block.rotation.z=a-.5;
  }
  // A continuous, irregular stone passage follows the existing walkable curve.
  const points=cavePath.getPoints(180), positions=[], indices=[];
  points.forEach((p,i)=>{
    const tangent=cavePath.getTangent(i/180), normal=new THREE.Vector3(-tangent.z,0,tangent.x);
    const width=4.15+Math.sin(i*.67)*.16;
    for(const side of [-1,1]) positions.push(p.x+normal.x*width*side,.065,p.z+normal.z*width*side);
    if(i<180){const v=i*2;indices.push(v,v+1,v+2,v+1,v+3,v+2);}
  });
  // Tight inside bends can reverse a strip triangle; keep every face upward.
  for(let i=0;i<indices.length;i+=3) {
    const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
    const up=(positions[b+2]-positions[a+2])*(positions[c]-positions[a])-(positions[b]-positions[a])*(positions[c+2]-positions[a+2]);
    if(up<0) [indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  }
  const floor=new THREE.BufferGeometry();floor.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));floor.setIndex(indices);floor.computeVertexNormals();
  part(cave,floor,mat('#586865'));
  // Opaque tunnel shell. Its interior is visible from the below-roof camera.
  const shellPositions=[], shellIndices=[];
  const section=[[-4.3,0],[-4.3,6],[-3,6.8],[0,7],[3,6.8],[4.3,6],[4.3,0]];
  points.forEach((p,i)=>{
    const n=cavePath.getTangent(i/180);
    for(const [side,y] of section) shellPositions.push(p.x-n.z*side,y,p.z+n.x*side);
    if(i<180) for(let j=0;j<6;j++) {
      const a=i*7+j,b=a+7;shellIndices.push(a,b,a+1,a+1,b,b+1);
    }
  });
  const shellGeometry=new THREE.BufferGeometry();
  shellGeometry.setAttribute('position',new THREE.Float32BufferAttribute(shellPositions,3));shellGeometry.setIndex(shellIndices);shellGeometry.computeVertexNormals();
  const shellMaterial=mat('#526975');shellMaterial.side=THREE.DoubleSide;
  const shell=part(cave,shellGeometry,shellMaterial);shell.castShadow=false;
  // Close both distant ends; zone exits remain E interactions inside the shell.
  for(const t of [0,1]) {
    const p=cavePath.getPoint(t),n=cavePath.getTangent(t);
    const cap=box(cave,[8.6,7,.3],shellMaterial,[p.x,3.5,p.z]);cap.rotation.y=Math.atan2(n.x,n.z);cap.castShadow=false;
  }
  for(let i=0;i<24;i++) {
    const t=i/23, p=cavePath.getPoint(t), n=cavePath.getTangent(t), side=i%2?1:-1;
    const x=p.x-n.z*3.55*side,z=p.z+n.x*3.55*side;
    const cluster=prop(cave,x,z,.34);
    for(let j=0;j<3;j++) {
      const shard=part(cluster,new THREE.ConeGeometry(.16+j*.04,.65+j*.28,5),i%3?crystal:moss,[(j-1)*.24,.38+j*.12,0]);
      shard.rotation.z=(j-1)*.28;
    }
    if(i%4===0) lantern(cave,x,z,1.7);
  }
  for(const t of [.19,.47,.75]) {
    const p=cavePath.getPoint(t), n=cavePath.getTangent(t);
    for(const side of [-1,1]) {
      const g=prop(cave,p.x-n.z*4.5*side,p.z+n.x*4.5*side,.45);
      box(g,[.7,3.5,.7],wood,[0,1.75,0]);
      box(g,[1.25,.25,1],iron,[0,2.7,0]);
    }
  }
  // An ancient seal dais, kept low so Bram can approach from every side.
  part(cave,new THREE.CylinderGeometry(3,3.25,.18,32),stone,[-8,.1,-33]);
  const ring=part(cave,new THREE.TorusGeometry(2.6,.055,6,40),crystal,[-8,.22,-33]);ring.rotation.x=Math.PI/2;
  for(let i=0;i<10;i++) {
    const a=i/10*Math.PI*2;
    const rune=box(cave,[.13,.03,.38],crystal,[-8+Math.cos(a)*2.6,.25,-33+Math.sin(a)*2.6]);rune.rotation.y=-a;
  }
  return { flames };
}
