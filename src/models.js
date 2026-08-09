import * as THREE from 'three';

const standard = (color, roughness = 0.72, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const armor = new THREE.MeshStandardMaterial({ color: '#53666a', roughness: 0.34, metalness: 0.72 });
const darkMetal = new THREE.MeshStandardMaterial({ color: '#20292c', roughness: 0.28, metalness: 0.82 });

function mesh(geometry, material, parent, position = [0, 0, 0]) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(...position);
  object.castShadow = object.receiveShadow = true;
  parent.add(object);
  return object;
}

export function createBram() {
  const root = new THREE.Group();
  const visual = new THREE.Group();
  root.add(visual);
  const bootMat = standard('#17201d', 0.92), leather = standard('#4a3020', 0.85), cloth = standard('#365e4e', 0.92), skin = standard('#c98e67', 0.8), hair = standard('#382719', 1);
  const leftLeg = new THREE.Group(), rightLeg = new THREE.Group();
  leftLeg.position.set(-0.23, 0.82, 0); rightLeg.position.set(0.23, 0.82, 0); visual.add(leftLeg, rightLeg);
  mesh(new THREE.CapsuleGeometry(.14, .55, 5, 9), leather, leftLeg, [0, -.35, 0]);
  mesh(new THREE.CapsuleGeometry(.14, .55, 5, 9), leather, rightLeg, [0, -.35, 0]);
  mesh(new THREE.BoxGeometry(.33, .2, .55), bootMat, leftLeg, [0, -.72, .1]);
  mesh(new THREE.BoxGeometry(.33, .2, .55), bootMat, rightLeg, [0, -.72, .1]);
  const torso = mesh(new THREE.CapsuleGeometry(.48, .72, 7, 12), cloth, visual, [0, 1.52, 0]);
  torso.scale.set(1, 1, .72);
  const belt = mesh(new THREE.CylinderGeometry(.47, .49, .18, 14), leather, visual, [0, 1.17, 0]);
  mesh(new THREE.BoxGeometry(.25, .25, .13), armor, belt, [0, 0, .47]);
  const mantle = mesh(new THREE.CylinderGeometry(.58, .49, .34, 14, 1, true, 0, Math.PI * 1.45), standard('#233d35'), visual, [0, 1.88, 0]);
  mantle.rotation.y = -.72;
  const head = mesh(new THREE.SphereGeometry(.34, 18, 14), skin, visual, [0, 2.35, 0]);
  head.scale.set(.9, 1.05, .88);
  const hairCap = mesh(new THREE.SphereGeometry(.35, 16, 10, 0, Math.PI * 2, 0, Math.PI * .54), hair, visual, [0, 2.45, 0]);
  hairCap.rotation.x = -.08;
  for (const x of [-.13, .13]) mesh(new THREE.SphereGeometry(.035, 7, 6), darkMetal, visual, [x, 2.39, .3]);
  const nose = mesh(new THREE.ConeGeometry(.055, .16, 7), skin, visual, [0, 2.31, .35]); nose.rotation.x = Math.PI / 2;
  const leftArm = new THREE.Group(), rightArm = new THREE.Group();
  leftArm.position.set(-.55, 1.86, 0); rightArm.position.set(.55, 1.86, 0); visual.add(leftArm, rightArm);
  mesh(new THREE.CapsuleGeometry(.12, .55, 5, 8), cloth, leftArm, [0, -.3, 0]);
  mesh(new THREE.CapsuleGeometry(.12, .55, 5, 8), cloth, rightArm, [0, -.3, 0]);
  mesh(new THREE.SphereGeometry(.15, 10, 8), armor, leftArm, [0, 0, 0]);
  mesh(new THREE.SphereGeometry(.15, 10, 8), armor, rightArm, [0, 0, 0]);
  const leftHand=mesh(new THREE.SphereGeometry(.13,12,9),skin,leftArm,[0,-.64,.02]);
  const rightHand=mesh(new THREE.SphereGeometry(.13,12,9),skin,rightArm,[0,-.64,.02]);
  const hammer = new THREE.Group(); hammer.position.set(.03, -.62, .06); rightArm.add(hammer);
  const handle = mesh(new THREE.CylinderGeometry(.055, .065, 1.45, 10), leather, hammer, [0, 0, 0]);
  handle.rotation.z = .04;
  const hammerHead = mesh(new THREE.BoxGeometry(.78, .33, .38), armor, hammer, [.03, .72, 0]);
  hammerHead.geometry.translate(0, 0, 0);
  for (const x of [-.47, .53]) mesh(new THREE.CylinderGeometry(.22, .17, .18, 10), darkMetal, hammer, [x, .72, 0]).rotation.z = Math.PI / 2;
  root.userData.rig = { visual, leftLeg, rightLeg, leftArm, rightArm, leftHand, rightHand, hammer };
  root.userData.radius = .58;
  return root;
}

export function createGoblin(seed = 0) {
  const root = new THREE.Group(), visual = new THREE.Group(); root.add(visual);
  const skin = standard(seed % 2 ? '#718f46' : '#63823d', .9), leather = standard('#3a2820', .94), cloth = standard(seed % 3 ? '#602f29' : '#4f3b28', .92);
  const body = mesh(new THREE.CapsuleGeometry(.38, .48, 6, 10), cloth, visual, [0, .92, 0]); body.scale.z = .75;
  const head = mesh(new THREE.SphereGeometry(.38, 14, 11), skin, visual, [0, 1.62, .03]); head.scale.set(1.18, .88, .9);
  for (const side of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(.16, .48, 7), skin, visual, [side * .43, 1.68, .02]); ear.rotation.z = -side * Math.PI / 2;
    mesh(new THREE.SphereGeometry(.045, 7, 6), standard('#e9b84a', .5), visual, [side * .14, 1.68, .34]);
  }
  const jaw = mesh(new THREE.BoxGeometry(.35, .13, .18), skin, visual, [0, 1.45, .29]); jaw.rotation.x = -.12;
  for (const x of [-.11, .11]) { const fang = mesh(new THREE.ConeGeometry(.035, .16, 6), standard('#ddd2a5'), visual, [x, 1.4, .39]); fang.rotation.x = Math.PI; }
  const leftLeg = new THREE.Group(), rightLeg = new THREE.Group(); leftLeg.position.set(-.19,.64,0);rightLeg.position.set(.19,.64,0);visual.add(leftLeg,rightLeg);
  mesh(new THREE.CapsuleGeometry(.1,.38,4,7),skin,leftLeg,[0,-.28,0]);mesh(new THREE.CapsuleGeometry(.1,.38,4,7),skin,rightLeg,[0,-.28,0]);
  const weapon = new THREE.Group(); weapon.position.set(.5,1.15,0); visual.add(weapon);
  const shaft=mesh(new THREE.CylinderGeometry(.035,.045,.9,7),leather,weapon,[0,-.25,0]);shaft.rotation.z=-.5;
  const blade=mesh(new THREE.ConeGeometry(.16,.42,4),darkMetal,weapon,[.2,-.62,0]);blade.rotation.z=-.5;
  root.userData.rig={visual,leftLeg,rightLeg,weapon};root.userData.radius=.52;
  return root;
}

export function createAltar() {
  const root = new THREE.Group(), stone = standard('#43545a', .72, .12), rune = new THREE.MeshStandardMaterial({ color:'#8ceaff', emissive:'#39b9e7', emissiveIntensity:2.2, roughness:.3 });
  for(let i=0;i<3;i++){const ring=mesh(new THREE.CylinderGeometry(2.3-i*.42,2.55-i*.42,.34,10),stone,root,[0,i*.29,0]);ring.rotation.y=i*.17;}
  const pillar=mesh(new THREE.CylinderGeometry(.62,.82,2.5,8),stone,root,[0,1.55,0]);pillar.rotation.y=.2;
  for(let i=0;i<3;i++){const glyph=mesh(new THREE.TorusGeometry(.36,.055,8,20,Math.PI*1.45),rune,root,[0,1.1+i*.52,.67]);glyph.rotation.z=i*2.05;}
  const crystal=mesh(new THREE.OctahedronGeometry(.55,0),rune,root,[0,3.15,0]);
  const light=new THREE.PointLight('#67dfff',0,12,2);light.position.y=3.15;root.add(light);
  root.userData={crystal,light,rune,radius:2.45,awake:false};
  return root;
}

export function createTree(scale = 1, autumn = false) {
  const root=new THREE.Group(), trunk=standard('#3a2e24'), leaf=standard(autumn?'#765238':'#294b38',.98);
  mesh(new THREE.CylinderGeometry(.28*scale,.48*scale,3.5*scale,9),trunk,root,[0,1.75*scale,0]);
  for(const [x,y,z,s] of [[0,4,0,1.45],[-.7,3.7,.1,1],[.72,4.05,-.2,1.05],[.1,4.8,.05,.9]]){const crown=mesh(new THREE.IcosahedronGeometry(s*scale,1),leaf,root,[x*scale,y*scale,z*scale]);crown.scale.y=1.15;}
  root.userData.radius=.58*scale;return root;
}

export function createRock(scale = 1) {
  const root=new THREE.Group(), rock=mesh(new THREE.DodecahedronGeometry(scale,1),standard('#47514d',.88,.08),root,[0,scale*.55,0]);rock.scale.set(1.25,.72,.95);rock.rotation.set(.1,.5,.08);root.userData.radius=scale*.9;return root;
}

export function createKnight() {
  const root=new THREE.Group(), visual=new THREE.Group();root.add(visual);
  const plate=standard('#78858b',.28,.82), trim=standard('#313b40',.3,.76), cloth=standard('#581f2d',.9), leather=standard('#35271f',.88);
  const leftLeg=new THREE.Group(),rightLeg=new THREE.Group();leftLeg.position.set(-.25,.84,0);rightLeg.position.set(.25,.84,0);visual.add(leftLeg,rightLeg);
  for(const leg of [leftLeg,rightLeg]){mesh(new THREE.CapsuleGeometry(.15,.58,5,9),trim,leg,[0,-.34,0]);mesh(new THREE.BoxGeometry(.36,.22,.64),plate,leg,[0,-.73,.12]);}
  const torso=mesh(new THREE.CapsuleGeometry(.54,.84,7,12),plate,visual,[0,1.58,0]);torso.scale.z=.78;
  mesh(new THREE.BoxGeometry(1.08,.18,.62),trim,visual,[0,1.18,0]);
  for(const y of [1.42,1.72,2.02])mesh(new THREE.BoxGeometry(.94,.2,.14),trim,visual,[0,y,.48]);
  const leftArm=new THREE.Group(),rightArm=new THREE.Group();leftArm.position.set(-.66,1.9,0);rightArm.position.set(.66,1.9,0);visual.add(leftArm,rightArm);
  for(const arm of [leftArm,rightArm]){mesh(new THREE.SphereGeometry(.23,12,9),plate,arm);mesh(new THREE.CapsuleGeometry(.13,.62,5,8),trim,arm,[0,-.36,0]);}
  const helmet=mesh(new THREE.SphereGeometry(.43,16,12),plate,visual,[0,2.5,0]);helmet.scale.set(.92,1.08,.96);
  mesh(new THREE.BoxGeometry(.72,.22,.17),trim,visual,[0,2.48,.39]);
  for(const x of [-.2,0,.2])mesh(new THREE.BoxGeometry(.08,.06,.05),standard('#10181b',.5,.2),visual,[x,2.48,.49]);
  const neckGuard=mesh(new THREE.CylinderGeometry(.46,.56,.34,12),trim,visual,[0,2.18,0]);neckGuard.scale.z=.82;
  const cape=mesh(new THREE.PlaneGeometry(1.28,1.95),cloth,visual,[0,1.45,-.44]);cape.rotation.x=.08;
  const plume=mesh(new THREE.ConeGeometry(.16,.78,8),cloth,visual,[0,3.04,-.04]);plume.rotation.z=-.2;
  const sword=new THREE.Group();sword.position.set(.04,-.72,.02);rightArm.add(sword);
  const grip=mesh(new THREE.CylinderGeometry(.045,.05,.55,8),leather,sword,[0,-.18,0]);grip.rotation.z=-.16;
  const guard=mesh(new THREE.BoxGeometry(.58,.09,.13),standard('#a79562',.34,.72),sword,[.08,-.47,0]);guard.rotation.z=-.16;
  const blade=mesh(new THREE.ConeGeometry(.13,1.32,4),plate,sword,[.28,-1.06,0]);blade.rotation.z=-.16;
  const shield=new THREE.Group();shield.position.set(-.04,-.42,.22);leftArm.add(shield);
  const shieldFace=mesh(new THREE.CylinderGeometry(.5,.5,.13,8),plate,shield,[0,-.3,.16]);shieldFace.rotation.x=Math.PI/2;shieldFace.scale.y=1.18;
  mesh(new THREE.CylinderGeometry(.14,.14,.18,10),standard('#a79562',.32,.75),shield,[0,-.3,.25]).rotation.x=Math.PI/2;
  const aura=new THREE.PointLight('#a9c9ff',.32,5);aura.position.y=2;root.add(aura);
  root.userData.rig={visual,leftLeg,rightLeg,leftArm,rightArm};root.userData.npc='Sir Calder';root.userData.radius=.72;return root;
}

export function createVillager(kind='merchant') {
  const root=new THREE.Group(),cloth=standard(kind==='smith'?'#603829':'#31596a',.9),apron=standard(kind==='smith'?'#422f25':'#665038',.88),skin=standard('#b97b58',.8),hair=standard(kind==='smith'?'#35241c':'#69462c',1);
  const body=mesh(new THREE.CapsuleGeometry(.42,.72,7,12),cloth,root,[0,1.25,0]);body.scale.z=.75;
  mesh(new THREE.BoxGeometry(.7,.78,.12),apron,root,[0,1.12,.34]);
  const head=mesh(new THREE.SphereGeometry(.31,16,12),skin,root,[0,2.05,0]);head.scale.set(.9,1.05,.88);
  mesh(new THREE.SphereGeometry(.32,15,9,0,Math.PI*2,0,Math.PI*.52),hair,root,[0,2.15,0]);
  for(const x of [-.46,.46]){const arm=mesh(new THREE.CapsuleGeometry(.1,.55,5,8),cloth,root,[x,1.35,0]);arm.rotation.z=x>0?-.12:.12;}
  if(kind==='smith'){const tool=mesh(new THREE.BoxGeometry(.6,.16,.25),darkMetal,root,[.58,.76,.12]);tool.rotation.z=-.65;}
  else{const pack=mesh(new THREE.BoxGeometry(.72,.6,.36),apron,root,[0,1.15,-.47]);pack.rotation.x=.06;}
  root.userData.npc=kind==='smith'?'Mira':'Oren';root.userData.radius=.58;return root;
}

export function createOrc() {
  const root=createGoblin(9);root.scale.setScalar(1.65);root.traverse(object=>{if(object.isMesh&&object.material.color){object.material=object.material.clone();object.material.color.multiply(new THREE.Color('#9ab06c'));}});
  root.userData.radius=.85;return root;
}

export function createPortal() {
  const root=new THREE.Group(),glow=new THREE.MeshStandardMaterial({color:'#75e9ff',emissive:'#2dbddd',emissiveIntensity:3,roughness:.18,metalness:.3});
  const base=mesh(new THREE.CylinderGeometry(1.65,2.05,.42,12),standard('#3e4d50',.72,.16),root,[0,.21,0]);
  const ring=mesh(new THREE.TorusGeometry(1.35,.16,12,48),glow,root,[0,1.65,0]);
  const core=mesh(new THREE.CircleGeometry(1.16,48),new THREE.MeshBasicMaterial({color:'#318ab9',transparent:true,opacity:.5,side:THREE.DoubleSide}),root,[0,1.65,0]);
  for(let i=0;i<5;i++){const shard=mesh(new THREE.OctahedronGeometry(.18),glow,root,[Math.cos(i/5*Math.PI*2)*1.7,.7+Math.sin(i)*.25,Math.sin(i/5*Math.PI*2)*1.7]);shard.userData.orbit=i/5*Math.PI*2;}
  const light=new THREE.PointLight('#4acfee',0,11,2);light.position.y=1.5;root.add(light);root.userData={ring,core,light,radius:1.75,active:false};return root;
}

export function createBuilding(type='house',wallColor='#6b5c4b',roofColor='#3e4544') {
  const root=new THREE.Group(),wall=standard(wallColor,.94),timber=standard('#3b2b22',.9),roof=standard(roofColor,.86,.05),windowMat=new THREE.MeshStandardMaterial({color:'#ffc572',emissive:'#d47a31',emissiveIntensity:1.6,roughness:.45});
  mesh(new THREE.BoxGeometry(5.5,3.4,4.5),wall,root,[0,1.7,0]);
  const roofMesh=mesh(new THREE.ConeGeometry(4.25,2.15,4),roof,root,[0,4.55,0]);roofMesh.rotation.y=Math.PI/4;
  for(const x of [-2.45,2.45])mesh(new THREE.BoxGeometry(.18,3.25,.2),timber,root,[x,1.72,2.28]);
  for(const y of [.65,1.6,2.55])mesh(new THREE.BoxGeometry(5.05,.16,.2),timber,root,[0,y,2.29]);
  const door=mesh(new THREE.BoxGeometry(1.12,2.05,.18),timber,root,[0,1.03,2.31]);
  for(const x of [-1.45,1.45])mesh(new THREE.BoxGeometry(.72,.72,.13),windowMat,root,[x,1.83,2.35]);
  const chimney=mesh(new THREE.BoxGeometry(.65,1.8,.65),standard('#55483e'),root,[1.55,5.15,-.55]);
  root.userData={radius:3.15,type};return root;
}
