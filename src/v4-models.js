import * as THREE from 'three';

const mat=(color,roughness=.82,metalness=0,emissive=null,intensity=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive:emissive||'#000000',emissiveIntensity:intensity});
const iron=mat('#596568',.42,.72),darkIron=mat('#263033',.36,.8),leather=mat('#51331f',.9),wood=mat('#513621',.94),skin=mat('#c98e67',.82);
function part(parent,geometry,material,position=[0,0,0],name=''){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.castShadow=mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);return mesh;}
function box(parent,size,material,position,name=''){return part(parent,new THREE.BoxGeometry(...size),material,position,name);}

export function createBram(){
  const root=new THREE.Group(),visual=new THREE.Group();root.add(visual);
  const cloth=mat('#315b50',.94),cloak=mat('#203f3b',.95),hair=mat('#342518',1),boots=mat('#202523',.95);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.22,.8,0);rightLeg.position.set(.22,.8,0);visual.add(leftLeg,rightLeg);
  box(leftLeg,[.28,.72,.34],leather,[0,-.34,0]);box(rightLeg,[.28,.72,.34],leather,[0,-.34,0]);box(leftLeg,[.36,.2,.55],boots,[0,-.75,.1]);box(rightLeg,[.36,.2,.55],boots,[0,-.75,.1]);
  box(visual,[.94,.82,.58],cloth,[0,1.5,0]);box(visual,[1,.17,.62],leather,[0,1.18,0]);box(visual,[.23,.23,.12],iron,[0,1.18,.37]);
  const mantle=part(visual,new THREE.CylinderGeometry(.58,.48,.3,10,1,true),cloak,[0,1.93,0]);
  const head=part(visual,new THREE.SphereGeometry(.33,14,11),skin,[0,2.35,0]);head.scale.set(.9,1.05,.88);part(visual,new THREE.SphereGeometry(.35,14,8,0,Math.PI*2,0,Math.PI*.54),hair,[0,2.45,0]);
  for(const x of [-.12,.12])part(visual,new THREE.SphereGeometry(.034,6,5),darkIron,[x,2.39,.29]);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-.56,1.86,0);rightArm.position.set(.56,1.86,0);visual.add(leftArm,rightArm);
  box(leftArm,[.24,.72,.3],cloth,[0,-.34,0]);box(rightArm,[.24,.72,.3],cloth,[0,-.34,0]);part(leftArm,new THREE.SphereGeometry(.14,9,7),iron);part(rightArm,new THREE.SphereGeometry(.14,9,7),iron);const leftHand=part(leftArm,new THREE.SphereGeometry(.125,9,7),skin,[0,-.73,0]),rightHand=part(rightArm,new THREE.SphereGeometry(.125,9,7),skin,[0,-.73,0]);
  const hammer=new THREE.Group();hammer.position.set(.02,-.71,.03);rightArm.add(hammer);part(hammer,new THREE.CylinderGeometry(.05,.065,1.5,8),leather);box(hammer,[.88,.34,.38],iron,[0,.75,0]);for(const x of [-.52,.52]){const cap=part(hammer,new THREE.CylinderGeometry(.2,.16,.2,9),darkIron,[x,.75,0]);cap.rotation.z=Math.PI/2;}
  root.userData={radius:.58,rig:{visual,leftLeg,rightLeg,leftArm,rightArm,leftHand,rightHand,hammer}};return root;
}

export function createGoblin(seed=0){
  const root=new THREE.Group(),visual=new THREE.Group();root.add(visual);const goblinSkin=mat(seed%2?'#6f8d45':'#5d7b3d',.94),cloth=mat(seed%3?'#66342c':'#51412d',.95);
  box(visual,[.7,.62,.55],cloth,[0,.92,0]);const head=part(visual,new THREE.SphereGeometry(.37,11,9),goblinSkin,[0,1.55,0]);head.scale.set(1.15,.85,.92);
  for(const side of [-1,1]){const ear=part(visual,new THREE.ConeGeometry(.15,.45,6),goblinSkin,[side*.43,1.6,0]);ear.rotation.z=-side*Math.PI/2;part(visual,new THREE.SphereGeometry(.04,6,5),mat('#e0b54f',.55),[side*.13,1.61,.32]);}
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.18,.58,0);rightLeg.position.set(.18,.58,0);visual.add(leftLeg,rightLeg);box(leftLeg,[.18,.5,.22],goblinSkin,[0,-.25,0]);box(rightLeg,[.18,.5,.22],goblinSkin,[0,-.25,0]);
  const weapon=new THREE.Group();weapon.position.set(.48,1.12,0);visual.add(weapon);const shaft=part(weapon,new THREE.CylinderGeometry(.035,.045,.86,6),leather,[0,-.25,0]);shaft.rotation.z=-.5;const blade=part(weapon,new THREE.ConeGeometry(.15,.38,4),darkIron,[.2,-.58,0]);blade.rotation.z=-.5;
  root.userData={radius:.5,rig:{visual,leftLeg,rightLeg,weapon}};return root;
}

export function createOrc(){const root=createGoblin(9);root.scale.setScalar(1.65);root.traverse(o=>{if(o.isMesh&&o.material.color){o.material=o.material.clone();o.material.color.multiply(new THREE.Color('#a6aa73'));}});root.userData.radius=.86;return root;}

export function createBat(){
  const root=new THREE.Group(),body=part(root,new THREE.SphereGeometry(.28,9,7),mat('#302c42',.9),[0,.4,0]),head=part(root,new THREE.SphereGeometry(.19,8,6),mat('#40384f',.88),[0,.55,.18]);body.scale.set(.75,1.25,.72);
  for(const x of [-.08,.08])part(root,new THREE.SphereGeometry(.035,6,5),mat('#e65c70',.4,0,'#ad233e',1.3),[x,.58,.34]);
  const leftWing=new THREE.Group(),rightWing=new THREE.Group();leftWing.position.set(-.18,.46,0);rightWing.position.set(.18,.46,0);root.add(leftWing,rightWing);const wingMat=mat('#252236',.96);const l=part(leftWing,new THREE.ConeGeometry(.48,1.1,3),wingMat,[-.38,0,0]),r=part(rightWing,new THREE.ConeGeometry(.48,1.1,3),wingMat,[.38,0,0]);l.rotation.z=-Math.PI/2;r.rotation.z=Math.PI/2;root.userData={radius:.42,rig:{leftWing,rightWing,body}};return root;
}

export function createRockMonster(){
  const root=new THREE.Group(),stone=mat('#625d57',.96),moss=mat('#48563a',.98);const body=part(root,new THREE.DodecahedronGeometry(.72,0),stone,[0,.9,0]);body.scale.set(1.1,1.2,.8);const head=part(root,new THREE.DodecahedronGeometry(.48,0),stone,[0,1.75,.02]);for(const x of [-.16,.16])part(root,new THREE.BoxGeometry(.08,.07,.05),mat('#e4b855',.35,0,'#bf7b25',1.2),[x,1.78,.43]);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.32,.46,0);rightLeg.position.set(.32,.46,0);root.add(leftLeg,rightLeg);part(leftLeg,new THREE.DodecahedronGeometry(.28,0),stone,[0,-.25,0]);part(rightLeg,new THREE.DodecahedronGeometry(.28,0),stone,[0,-.25,0]);for(const p of [[-.56,1,0],[.56,1,0]])part(root,new THREE.DodecahedronGeometry(.32,0),stone,p);part(root,new THREE.DodecahedronGeometry(.24,0),moss,[.2,1.2,.5]);root.userData={radius:.72,rig:{leftLeg,rightLeg,body}};return root;
}

export function createKnight(){
  const root=new THREE.Group(),visual=new THREE.Group();root.add(visual);const plate=mat('#75868a',.38,.72),trim=mat('#2d3b3e',.4,.66),cloth=mat('#692c39',.94);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.24,.82,0);rightLeg.position.set(.24,.82,0);visual.add(leftLeg,rightLeg);box(leftLeg,[.3,.75,.38],trim,[0,-.35,0]);box(rightLeg,[.3,.75,.38],trim,[0,-.35,0]);box(leftLeg,[.4,.2,.58],plate,[0,-.77,.1]);box(rightLeg,[.4,.2,.58],plate,[0,-.77,.1]);
  const torso=box(visual,[1.05,.94,.62],plate,[0,1.55,0]);for(const y of [1.3,1.6,1.9])box(visual,[.95,.11,.12],trim,[0,y,.38]);const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-.67,1.86,0);rightArm.position.set(.67,1.86,0);visual.add(leftArm,rightArm);for(const arm of [leftArm,rightArm]){part(arm,new THREE.SphereGeometry(.23,10,8),plate);box(arm,[.25,.73,.3],trim,[0,-.37,0]);}
  const helmet=part(visual,new THREE.SphereGeometry(.43,13,10),plate,[0,2.47,0]);helmet.scale.set(.9,1.05,.95);const visor=box(visual,[.72,.22,.15],trim,[0,2.46,.39]);for(const x of [-.2,0,.2])box(visual,[.08,.055,.05],mat('#0f181a'),[x,2.46,.48]);const cape=box(visual,[1.15,1.72,.07],cloth,[0,1.47,-.37]);const plume=part(visual,new THREE.ConeGeometry(.14,.65,7),cloth,[0,3.02,0]);
  const sword=new THREE.Group();sword.position.set(0,-.72,0);rightArm.add(sword);const handle=part(sword,new THREE.CylinderGeometry(.045,.05,.48,7),leather,[0,-.15,0]);const blade=part(sword,new THREE.ConeGeometry(.13,1.15,4),plate,[.18,-.9,0]);blade.rotation.z=-.18;const shield=part(leftArm,new THREE.CylinderGeometry(.5,.5,.13,8),plate,[0,-.45,.27]);shield.rotation.x=Math.PI/2;
  root.userData={radius:.7,rig:{visual,leftLeg,rightLeg,leftArm,rightArm},armor:{torso,helmet,visor,cape,plume,shield}};return root;
}

export function createNecromancer(){const root=createKnight(),visual=root.userData.rig.visual,{helmet,visor,cape,plume,shield,torso}=root.userData.armor;helmet.visible=visor.visible=plume.visible=false;cape.scale.set(.65,.9,1);cape.rotation.z=-.18;shield.scale.set(.65,.78,.75);shield.rotation.z=-.45;root.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(new THREE.Color('#755d7c'));}});const bone=mat('#9ca68f',.92),glow=mat('#263827',.7,0,'#4fce70',1.4),broken=mat('#34373a',.5,.68);const skull=part(visual,new THREE.SphereGeometry(.33,12,9),bone,[0,2.47,0]);skull.scale.set(.85,1,.84);for(const x of [-.12,.12])part(visual,new THREE.SphereGeometry(.05,7,6),glow,[x,2.51,.29]);for(const [x,y,s,r] of [[-.29,2.67,.32,-.4],[.3,2.58,.28,.6],[-.08,2.82,.22,.1]]){const shard=part(visual,new THREE.TetrahedronGeometry(s),broken,[x,y,0]);shard.rotation.z=r;}for(const [x,y,r,l] of [[-.16,1.9,.6,.45],[.12,1.67,-.5,.4],[-.05,1.43,.3,.35]]){const crack=box(visual,[.035,l,.025],glow,[x,y,.36]);crack.rotation.z=r;}torso.rotation.z=-.05;const light=new THREE.PointLight('#55db77',1.2,7);light.position.y=2;root.add(light);return root;}

export function createTree(scale=1,autumn=false){const root=new THREE.Group(),trunk=mat('#49301e',.98),leaf=mat(autumn?'#7e4d2c':'#31543d',1);part(root,new THREE.CylinderGeometry(.28*scale,.48*scale,3.5*scale,8),trunk,[0,1.75*scale,0]);for(const [x,y,z,s] of [[0,4,0,1.4],[-.68,3.7,.1,1],[.7,4,-.2,1.05],[.1,4.75,.05,.85]])part(root,new THREE.IcosahedronGeometry(s*scale,1),leaf,[x*scale,y*scale,z*scale]);root.userData.radius=.58*scale;return root;}
export function createRock(scale=1){const root=new THREE.Group(),r=part(root,new THREE.DodecahedronGeometry(scale,1),mat('#53615e',.94,.04),[0,scale*.55,0]);r.scale.set(1.25,.72,.95);r.rotation.set(.1,.5,.08);root.userData.radius=scale*.9;return root;}

export function createPortal(){const root=new THREE.Group(),stone=mat('#42555a',.86,.1),rune=mat('#7ee5ef',.3,.25,'#2ba8bc',2.6);part(root,new THREE.CylinderGeometry(1.65,2.05,.42,11),stone,[0,.21,0]);const ring=part(root,new THREE.TorusGeometry(1.32,.15,10,42),rune,[0,1.62,0]),core=part(root,new THREE.CircleGeometry(1.12,40),new THREE.MeshBasicMaterial({color:'#2d8aa0',transparent:true,opacity:.42,side:THREE.DoubleSide}),[0,1.62,0]);for(let i=0;i<5;i++){const shard=part(root,new THREE.OctahedronGeometry(.17),rune,[Math.cos(i/5*Math.PI*2)*1.7,.7,Math.sin(i/5*Math.PI*2)*1.7]);shard.userData.orbit=i/5*Math.PI*2;}const light=new THREE.PointLight('#52d4df',0,10);light.position.y=1.6;root.add(light);root.userData={radius:1.8,ring,core,light,active:false};return root;}

export function createAltar(){const root=new THREE.Group(),stone=mat('#43545a',.8,.1),rune=mat('#8ceaff',.28,.1,'#39b9e7',2.2);for(let i=0;i<3;i++){const base=part(root,new THREE.CylinderGeometry(2.1-i*.4,2.35-i*.4,.3,10),stone,[0,i*.27,0]);base.rotation.y=i*.16;}part(root,new THREE.CylinderGeometry(.58,.78,2.35,8),stone,[0,1.5,0]);for(let i=0;i<3;i++){const glyph=part(root,new THREE.TorusGeometry(.34,.05,7,18,Math.PI*1.45),rune,[0,1.05+i*.5,.66]);glyph.rotation.z=i*2;}const crystal=part(root,new THREE.OctahedronGeometry(.5),rune,[0,3,0]),light=new THREE.PointLight('#67dfff',0,11);light.position.y=3;root.add(light);root.userData={radius:2.2,crystal,light,active:false};return root;}

export function createBuilding(type='house',wallColor='#6f6655',roofColor='#394b4e'){
  const root=new THREE.Group(),wall=mat(wallColor,.96),timber=mat('#3c2a20',.94),roof=mat(roofColor,.9,.03),windowMat=mat('#ffc572',.45,0,'#c46b28',1.25),stone=mat('#575f5b',.94);
  box(root,[5.8,.6,4.8],stone,[0,.3,0]);box(root,[5.5,3.4,4.5],wall,[0,1.7,0]);const roofMesh=part(root,new THREE.ConeGeometry(4.25,2.15,4),roof,[0,4.55,0]);roofMesh.rotation.y=Math.PI/4;for(const x of [-2.45,2.45])box(root,[.18,3.25,.2],timber,[x,1.72,2.28]);for(const y of [.65,1.6,2.55])box(root,[5.05,.16,.2],timber,[0,y,2.29]);box(root,[1.12,2.05,.18],timber,[0,1.03,2.31]);for(const x of [-1.45,1.45])box(root,[.72,.72,.13],windowMat,[x,1.83,2.35]);box(root,[.65,1.8,.65],stone,[1.55,5.15,-.55]);const signColor=type==='smith'?'#733326':type==='shop'?'#315e54':'#66502f';box(root,[1.05,.62,.11],mat(signColor,.9),[2.15,2.2,2.5]);root.userData={radius:3.15,type};return root;
}

export function createVillager(kind='merchant'){const root=new THREE.Group(),cloth=mat(kind==='smith'?'#69402e':'#315e68',.94),apron=mat(kind==='smith'?'#3d3027':'#66533d',.94),hair=mat(kind==='smith'?'#34231b':'#69462c',1);box(root,[.78,.85,.55],cloth,[0,1.25,0]);box(root,[.66,.78,.1],apron,[0,1.16,.34]);const head=part(root,new THREE.SphereGeometry(.3,12,9),skin,[0,2.05,0]);part(root,new THREE.SphereGeometry(.31,12,7,0,Math.PI*2,0,Math.PI*.52),hair,[0,2.15,0]);for(const x of [-.48,.48])box(root,[.2,.68,.25],cloth,[x,1.35,0]);if(kind==='smith'){const tool=box(root,[.58,.15,.24],darkIron,[.58,.76,.12]);tool.rotation.z=-.65;}else box(root,[.7,.58,.34],apron,[0,1.15,-.45]);root.userData={radius:.58,npc:kind};return root;}

export function createInterior(type){
  const root=new THREE.Group(),floor=mat(type==='basement'||type==='cave'?'#3c4543':'#4f3a29',.98),wall=mat(type==='basement'?'#4b5552':'#705e49',.96),beam=mat('#38271d',.95);box(root,[18,.25,14],floor,[0,-.12,0]);for(const [x,z,sx,sz] of [[0,-7,18,.3],[-9,0,.3,14],[9,0,.3,14]])box(root,[sx,4,sz],wall,[x,2,z]);if(type!=='cave'){for(const x of [-6,-3,0,3,6])box(root,[.18,4,.22],beam,[x,2,-6.78]);}return root;
}

export {mat,part,box};
