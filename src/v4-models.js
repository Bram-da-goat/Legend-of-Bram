import * as THREE from 'three';

// V4 deliberately uses V1's visual grammar: 32px character art standing in a
// quiet, rough low-poly world. Keeping this module small makes that look stay
// consistent across the meadow, town, interiors, cave, and battles.
const mat=(color,roughness=.9,metalness=0,emissive=null,intensity=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness,emissive:emissive||'#000000',emissiveIntensity:intensity});
function part(parent,geometry,material,position=[0,0,0],name=''){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.castShadow=mesh.receiveShadow=true;mesh.name=name;parent.add(mesh);return mesh;}
function box(parent,size,material,position,name=''){return part(parent,new THREE.BoxGeometry(...size),material,position,name);}

const textures=new Map();
function pixelTexture(kind){
  if(textures.has(kind))return textures.get(kind);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=32;
  const p=canvas.getContext('2d');p.imageSmoothingEnabled=false;
  const fill=(color,x,y,w,h)=>{p.fillStyle=color;p.fillRect(x,y,w,h);};
  if(kind.startsWith('bram')){
    fill('#27372d',8,17,16,10);fill('#52765d',9,12,14,11);fill('#efc698',11,5,10,9);
    if(kind==='bram-axe'){fill('#6e4327',24,11,4,18);fill('#535d5b',19,6,12,7);fill('#b7c0bc',18,7,3,5);fill('#b7c0bc',20,12,2,2);}
    else if(kind==='bram-club'){fill('#643817',25,12,4,17);fill('#272b29',24,18,6,2);fill('#272b29',24,24,6,2);fill('#7e4720',21,5,11,7);fill('#7e4720',22,3,9,2);fill('#7e4720',23,12,7,2);fill('#343837',21,7,11,2);fill('#343837',22,11,9,2);fill('#aeb7b4',19,6,2,2);fill('#aeb7b4',18,10,4,2);fill('#aeb7b4',23,1,2,3);fill('#aeb7b4',28,1,2,3);fill('#aeb7b4',22,13,2,2);fill('#aeb7b4',29,13,2,2);fill('#aeb7b4',26,29,2,2);}
    else{fill('#63452c',24,10,4,18);fill('#4d5452',18,4,13,8);fill('#8d9690',19,5,11,3);fill('#343a3a',18,11,13,2);}
  }else if(kind==='goblin'){
    fill('#293526',8,17,16,10);fill('#617f3e',8,13,16,13);fill('#91b157',10,5,12,11);fill('#91b157',4,8,6,4);fill('#91b157',22,8,6,4);
    fill('#1c241c',11,9,3,2);fill('#1c241c',19,9,3,2);fill('#79442e',23,14,3,14);fill('#a7aca5',21,12,7,4);
  }else if(kind==='orc'){
    fill('#252d22',7,17,18,11);fill('#546b36',6,12,20,15);fill('#7e9d4e',8,4,16,12);fill('#7e9d4e',2,7,7,5);fill('#7e9d4e',23,7,7,5);
    fill('#191e18',10,8,4,3);fill('#191e18',19,8,4,3);fill('#e5d3a2',8,13,3,4);fill('#e5d3a2',21,13,3,4);fill('#50331f',24,13,5,16);fill('#343b39',21,6,10,8);
  }else if(kind==='knight'||kind==='necro'){
    const cursed=kind==='necro';fill(cursed?'#302838':'#3a4250',8,16,16,11);fill(cursed?'#69705f':'#a8b5c3',8,6,16,12);
    fill(cursed?'#3d3344':'#697686',3,17,6,8);fill(cursed?'#3d3344':'#697686',23,17,6,8);fill(cursed?'#101713':'#202630',10,9,12,4);
    fill(cursed?'#746b5b':'#d8b77a',22,12,7,12);fill(cursed?'#46483f':'#707b89',23,10,6,5);
    if(cursed){fill('#83da78',11,8,3,2);fill('#83da78',19,8,3,2);fill('#171a18',8,6,4,3);fill('#171a18',20,13,4,3);fill('#83da78',14,17,2,5);}
  }else if(kind==='smith'||kind==='merchant'){
    const smith=kind==='smith';fill(smith?'#503628':'#263f40',8,17,16,10);fill(smith?'#875138':'#41716e',9,12,14,11);fill('#e7b98d',11,5,10,9);fill(smith?'#332218':'#765031',10,3,12,4);
    fill(smith?'#6a6d69':'#795f3e',24,12,4,15);if(smith)fill('#aab1ad',20,10,10,5);
  }else if(kind==='bat'){
    fill('#282433',12,11,8,14);fill('#393146',12,6,8,8);fill('#282433',2,9,11,4);fill('#282433',19,9,11,4);fill('#282433',4,13,8,4);fill('#282433',20,13,8,4);fill('#d65d6e',13,9,2,2);fill('#d65d6e',18,9,2,2);
  }else if(kind==='rock'){
    fill('#4a4e49',7,14,18,12);fill('#66645e',9,8,14,10);fill('#74716a',12,4,8,7);fill('#dbad52',11,12,3,2);fill('#dbad52',19,12,3,2);fill('#3b4936',19,6,5,4);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;textures.set(kind,texture);return texture;
}
function pixelUnit(kind,size=1.8){const root=new THREE.Group(),visual=new THREE.Group(),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:pixelTexture(kind),transparent:true,depthWrite:false}));sprite.scale.set(size,size,1);sprite.center.set(.5,.12);visual.add(sprite);root.add(visual);const leftLeg=new THREE.Group(),rightLeg=new THREE.Group(),leftArm=new THREE.Group(),rightArm=new THREE.Group(),hammer=new THREE.Group();root.userData={radius:size*.3,pixel:true,rig:{visual,leftLeg,rightLeg,leftArm,rightArm,hammer,sprite}};return root;}

export function createBram(){const root=pixelUnit('bram',1.8);root.userData.weapon='Hammer';return root;}
export function setBramWeapon(root,weapon){if(!root?.userData?.rig?.sprite)return;const kind=weapon==='Woodcutter Axe'?'bram-axe':weapon==='Orc War Club'?'bram-club':'bram';root.userData.rig.sprite.material.map=pixelTexture(kind);root.userData.rig.sprite.material.needsUpdate=true;root.userData.weapon=weapon;}
export function createGoblin(){return pixelUnit('goblin',1.3);}
export function createOrc(){const root=pixelUnit('orc',2);root.userData.radius=.72;return root;}
export function createBat(){const root=pixelUnit('bat',1.35),leftWing=new THREE.Group(),rightWing=new THREE.Group();root.userData.rig.leftWing=leftWing;root.userData.rig.rightWing=rightWing;root.add(leftWing,rightWing);root.userData.radius=.42;return root;}
export function createRockMonster(){const root=pixelUnit('rock',1.85);root.userData.radius=.7;return root;}
export function createKnight(){const root=pixelUnit('knight',2.15);root.userData.radius=.72;return root;}
export function createNecromancer(){const root=pixelUnit('necro',2.25);root.userData.radius=.72;const glow=new THREE.PointLight('#78d66f',1.1,6);glow.position.y=1.2;root.add(glow);return root;}
export function createVillager(kind='merchant'){const root=pixelUnit(kind==='smith'?'smith':'merchant',1.85);root.userData.npc=kind;root.userData.radius=.58;return root;}

export function createTree(scale=1,autumn=false){const root=new THREE.Group(),trunk=mat('#4a3929'),leaf=mat(autumn?'#6d5135':'#354e3b');part(root,new THREE.CylinderGeometry(.13*scale,.24*scale,1.8*scale,8),trunk,[0,.9*scale,0]);const crown=part(root,new THREE.SphereGeometry(.9*scale,12,9),leaf,[0,2.1*scale,0]);crown.scale.set(.75,1.35,.75);root.userData.radius=.42*scale;return root;}
export function createRock(scale=1){const root=new THREE.Group(),rock=part(root,new THREE.DodecahedronGeometry(scale,0),mat('#68706a'),[0,scale*.42,0]);rock.scale.set(1.25,.62,.92);rock.rotation.y=.45;root.userData.radius=scale*.85;return root;}
export function createPortal(){const root=new THREE.Group(),portalMat=new THREE.MeshBasicMaterial({color:'#7ae7ff',transparent:true,opacity:.78}),ring=part(root,new THREE.TorusGeometry(1.15,.16,10,32),portalMat,[0,.25,0]),core=part(root,new THREE.CircleGeometry(.94,32),new THREE.MeshBasicMaterial({color:'#3557df',transparent:true,opacity:.6,side:THREE.DoubleSide}),[0,.27,0]);ring.rotation.x=core.rotation.x=-Math.PI/2;for(let i=0;i<4;i++){const a=i*Math.PI/2,shard=part(root,new THREE.OctahedronGeometry(.17),portalMat,[Math.cos(a)*1.25,.58,Math.sin(a)*1.25]);shard.userData.orbit=a;}const light=new THREE.PointLight('#7ae7ff',0,8);light.position.y=.5;root.add(light);root.userData={radius:1.5,ring,core,light,active:false};return root;}
export function createAltar(){const root=new THREE.Group(),stone=mat('#7a746c'),rune=new THREE.MeshBasicMaterial({color:'#68d9ff'});part(root,new THREE.CylinderGeometry(1.7,2.15,.55,8),stone,[0,.3,0]);part(root,new THREE.BoxGeometry(1.2,2.2,1.2),mat('#d6c9ad'),[0,1.35,0]);const crystal=part(root,new THREE.SphereGeometry(.42,12,8),rune,[0,2.7,0]),light=new THREE.PointLight('#68d9ff',0,8);light.position.y=2.7;root.add(light);root.userData={radius:2.05,crystal,light,active:false};return root;}
export function createBuilding(type='house',wallColor='#756353',roofColor='#6b5548'){const root=new THREE.Group(),walls=box(root,[5.2,2.8,3.8],mat(wallColor),[0,1.4,0]),roof=part(root,new THREE.ConeGeometry(3.8,1.7,4),mat(roofColor),[0,3.65,0]);roof.rotation.y=Math.PI/4;box(root,[1,1.9,.12],mat('#4b3527'),[0,.95,1.96]);for(const x of [-1.45,1.45])box(root,[.72,.68,.1],new THREE.MeshBasicMaterial({color:'#efbd6b'}),[x,1.65,1.97]);root.userData={radius:3.05,type};return root;}
export function createInterior(type){const root=new THREE.Group(),dark=type==='basement'||type==='cave',floor=mat(dark?'#4a4c46':'#594938'),wall=mat(dark?'#595b55':'#756353'),beam=mat('#443224');box(root,[18,.25,14],floor,[0,-.12,0]);for(const [x,z,sx,sz] of [[0,-7,18,.3],[-9,0,.3,14],[9,0,.3,14]])box(root,[sx,3.6,sz],wall,[x,1.8,z]);for(const x of [-6,-3,0,3,6])box(root,[.18,3.6,.22],beam,[x,1.8,-6.78]);return root;}

export {mat,part,box};
