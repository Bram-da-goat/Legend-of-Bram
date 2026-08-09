import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createTerrainMaterial, createWaterMaterial, createSkyMaterial, terrainHeight } from './shaders.js';
import { createBram, createGoblin, createAltar, createTree, createRock } from './models.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#world');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2('#132327', .018);
const camera = new THREE.PerspectiveCamera(48, 1, .1, 240);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), .42, .62, .82);
composer.addPass(bloom);
composer.addPass(new OutputPass());

const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 20), createSkyMaterial());
scene.add(sky);
const hemi = new THREE.HemisphereLight('#b9d9dd', '#182019', 1.7);
const sun = new THREE.DirectionalLight('#ffd3a0', 4.2);
sun.position.set(-28, 42, -24);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -42;
sun.shadow.camera.right = sun.shadow.camera.top = 42;
sun.shadow.camera.near = 4; sun.shadow.camera.far = 105;
sun.shadow.bias = -.0002;
scene.add(hemi, sun);

const terrainMaterial = createTerrainMaterial();
const terrainGeometry = new THREE.PlaneGeometry(126, 126, 180, 180);
terrainGeometry.rotateX(-Math.PI / 2);
const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
terrain.receiveShadow = true;
scene.add(terrain);

const waterMaterial = createWaterMaterial();
const lakeGeometry = new THREE.CircleGeometry(7.8, 64, 0, Math.PI * 2);
lakeGeometry.rotateX(-Math.PI / 2);
const lake = new THREE.Mesh(lakeGeometry, waterMaterial);
lake.position.set(-22, -.42, -13);
scene.add(lake);
for (const [x, z, scale] of [[-28,-8,.6],[-17,-18,.48],[-26,-20,.38]]) {
  const pool = new THREE.Mesh(lakeGeometry, waterMaterial); pool.scale.setScalar(scale); pool.position.set(x,-.36,z); scene.add(pool);
}

const rand = (() => { let seed = 71823; return () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646; })();
const colliders = [];
const environment = new THREE.Group();
scene.add(environment);
function place(object, x, z, radius = object.userData.radius || .5) {
  object.position.set(x, terrainHeight(x, z), z);
  environment.add(object);
  if (radius) colliders.push({ object, radius });
  return object;
}

for (let i = 0; i < 62; i++) {
  const angle = rand() * Math.PI * 2, radius = 10 + rand() * 48, x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
  if (Math.hypot(x + 22, z + 13) < 10 || Math.hypot(x, z) < 7) continue;
  const tree = createTree(.72 + rand() * .62, rand() > .82); tree.rotation.y = rand() * Math.PI * 2; place(tree, x, z);
}
for (let i = 0; i < 42; i++) {
  const angle = rand() * Math.PI * 2, radius = 7 + rand() * 48, x = Math.cos(angle) * radius, z = Math.sin(angle) * radius;
  if (Math.hypot(x, z) < 5) continue;
  const rock = createRock(.25 + rand() * .72); rock.rotation.y = rand() * 6; place(rock, x, z);
}

const grassGeo = new THREE.ConeGeometry(.055, .52, 4), grassMat = new THREE.MeshStandardMaterial({ color: '#315b3d', roughness: 1 });
const grass = new THREE.InstancedMesh(grassGeo, grassMat, 950);
grass.castShadow = false;
const dummy = new THREE.Object3D();
for (let i = 0; i < 950; i++) {
  const x = (rand() - .5) * 112, z = (rand() - .5) * 112;
  dummy.position.set(x, terrainHeight(x,z)+.24, z); dummy.rotation.y = rand()*6; dummy.scale.set(.6+rand()*.8,.6+rand()*.9,.6+rand()*.8); dummy.updateMatrix(); grass.setMatrixAt(i,dummy.matrix);
}
environment.add(grass);

const ruinStone = new THREE.MeshStandardMaterial({ color:'#49534f', roughness:.84, metalness:.05 });
function shadowMesh(geometry, material = ruinStone) { const m=new THREE.Mesh(geometry,material);m.castShadow=m.receiveShadow=true;return m; }
function createRuin(x,z,rotation=0) {
  const ruin = new THREE.Group();
  const left=shadowMesh(new THREE.BoxGeometry(1.25,4.4,1.2)),right=left.clone(),cap=shadowMesh(new THREE.BoxGeometry(5.3,1.05,1.25));
  left.position.set(-2,2.2,0);right.position.set(2,2.2,0);cap.position.set(0,4.45,0);cap.rotation.z=.03;
  const runeMat=new THREE.MeshStandardMaterial({color:'#6db9c1',emissive:'#318b9b',emissiveIntensity:1.8,roughness:.4});
  const rune=shadowMesh(new THREE.TorusGeometry(.48,.07,8,22,Math.PI*1.65),runeMat);rune.position.set(0,3.65,.68);rune.rotation.z=.4;
  ruin.add(left,right,cap,rune);ruin.position.set(x,terrainHeight(x,z),z);ruin.rotation.y=rotation;environment.add(ruin);colliders.push({object:ruin,radius:2.5});
}
createRuin(16,-17,.38);createRuin(-18,21,-.7);createRuin(24,18,1.8);

const altar = createAltar();
altar.position.set(0, terrainHeight(0,0), 0);
scene.add(altar);
colliders.push({ object: altar, radius: altar.userData.radius });

const moonwell = new THREE.Group();
const wellStone = new THREE.MeshStandardMaterial({color:'#394a4a',roughness:.65,metalness:.12});
for(let i=0;i<12;i++){const stone=shadowMesh(new THREE.BoxGeometry(.7,.5,1.1),wellStone);const a=i/12*Math.PI*2;stone.position.set(Math.cos(a)*2,.25,Math.sin(a)*2);stone.rotation.y=-a;moonwell.add(stone);}
const wellGlow=new THREE.Mesh(new THREE.CircleGeometry(1.65,40),new THREE.MeshBasicMaterial({color:'#62d4dc',transparent:true,opacity:.62}));wellGlow.rotation.x=-Math.PI/2;wellGlow.position.y=.14;moonwell.add(wellGlow);
moonwell.position.set(0,terrainHeight(0,10),10);scene.add(moonwell);

const player = createBram();
scene.add(player);
const rig = player.userData.rig;
const enemies = [], drops = [], effects = [];
const enemySpawns = [[15,10],[-16,-4],[10,-22]];
function healthBar() {
  const group=new THREE.Group(),back=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.13),new THREE.MeshBasicMaterial({color:'#15120f'})),fill=new THREE.Mesh(new THREE.PlaneGeometry(1.28,.075),new THREE.MeshBasicMaterial({color:'#9cca68'}));
  back.position.y=2.48;fill.position.set(0,2.48,.01);group.add(back,fill);group.userData.fill=fill;return group;
}
enemySpawns.forEach(([x,z],index)=>{const model=createGoblin(index);model.position.set(x,terrainHeight(x,z),z);const bar=healthBar();model.add(bar);scene.add(model);enemies.push({index,model,bar,hp:100,alive:true,home:new THREE.Vector3(x,0,z),attackAt:0,phase:rand()*6});});

const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(190*3);
for(let i=0;i<190;i++){particlePositions[i*3]=(rand()-.5)*100;particlePositions[i*3+1]=2+rand()*15;particlePositions[i*3+2]=(rand()-.5)*100;}
particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
const motes=new THREE.Points(particleGeo,new THREE.PointsMaterial({color:'#8fdac7',size:.08,transparent:true,opacity:.66,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(motes);

const keys = new Set();
let playing=false, health=100, shards=0, completed=false, attackStart=-10, attackCooldown=0, toastTimer=0, saveTimer=0;
const saveKey='legend-of-bram-v2-save';
const titleScreen=$('#titleScreen'),deathScreen=$('#deathScreen'),victoryScreen=$('#victoryScreen'),continueButton=$('#continueGame'),prompt=$('#prompt'),toast=$('#toast');

function showToast(text){toast.textContent=text;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,2400);}
function updateHUD(){
  $('#healthText').textContent=Math.max(0,Math.ceil(health));$('#healthFill').style.width=`${Math.max(0,health)}%`;$('#shards').textContent=shards;
  $('#progress').textContent=completed?'Altar awakened':`${shards} / 3 recovered`;
  $('#objective').textContent=completed?'Explore the Moonfall Wilds':shards>=3?'Return to the ancient altar':'Recover the fallen Star Shards';
}
function saveGame(){if(!playing)return;localStorage.setItem(saveKey,JSON.stringify({x:player.position.x,z:player.position.z,health,shards,completed,defeated:enemies.filter(e=>!e.alive).map(e=>e.index)}));}
function resetEnemy(enemy){enemy.alive=true;enemy.hp=100;enemy.model.visible=true;enemy.model.position.set(enemy.home.x,terrainHeight(enemy.home.x,enemy.home.z),enemy.home.z);enemy.bar.userData.fill.scale.x=1;}
function begin(data=null){
  playing=true;titleScreen.hidden=true;deathScreen.hidden=true;victoryScreen.hidden=true;health=data?.health??100;shards=data?.shards??0;completed=Boolean(data?.completed);
  const x=data?.x??0,z=data?.z??10;player.position.set(x,terrainHeight(x,z),z);
  enemies.forEach(enemy=>{resetEnemy(enemy);if(data?.defeated?.includes(enemy.index)){enemy.alive=false;enemy.model.visible=false;}});
  updateHUD();showToast(data?'Journey restored':'Welcome to the Moonfall Wilds');
}
function newJourney(){localStorage.removeItem(saveKey);begin();}
$('#newGame').onclick=newJourney;
continueButton.disabled=!localStorage.getItem(saveKey);
continueButton.onclick=()=>{try{begin(JSON.parse(localStorage.getItem(saveKey)));}catch{newJourney();}};
$('#retry').onclick=()=>begin({x:0,z:10,health:100,shards,completed,defeated:enemies.filter(e=>!e.alive).map(e=>e.index)});
$('#keepExploring').onclick=()=>{victoryScreen.hidden=true;playing=true;};

function collisionAt(position){
  if(Math.hypot(position.x,position.z)>56)return true;
  return colliders.some(({object,radius})=>object.visible&&Math.hypot(position.x-object.position.x,position.z-object.position.z)<radius+player.userData.radius);
}
function movePlayer(dt,time){
  let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  const moving=dx||dz;
  if(moving){const length=Math.hypot(dx,dz);dx/=length;dz/=length;const speed=5.4*dt,next=player.position.clone();next.x+=dx*speed;next.z+=dz*speed;
    if(!collisionAt(next)){player.position.x=next.x;player.position.z=next.z;}else{next.set(player.position.x+dx*speed,0,player.position.z);if(!collisionAt(next))player.position.x=next.x;next.set(player.position.x,0,player.position.z+dz*speed);if(!collisionAt(next))player.position.z=next.z;}
    player.rotation.y=THREE.MathUtils.damp(player.rotation.y,Math.atan2(dx,dz),14,dt);
  }
  player.position.y=terrainHeight(player.position.x,player.position.z);
  const stride=moving?Math.sin(time*10):0;rig.leftLeg.rotation.x=stride*.5;rig.rightLeg.rotation.x=-stride*.5;rig.leftArm.rotation.x=-stride*.2;
  rig.visual.position.y=THREE.MathUtils.damp(rig.visual.position.y,moving?Math.abs(Math.sin(time*10))*.08:0,12,dt);
}
function spawnShockwave(){
  const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.8,48),new THREE.MeshBasicMaterial({color:'#d8f2bf',transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  ring.rotation.x=-Math.PI/2;ring.position.copy(player.position);ring.position.y+=.12;scene.add(ring);effects.push({mesh:ring,age:0,duration:.48});
}
function attack(){if(!playing||attackCooldown>0)return;attackCooldown=.72;attackStart=performance.now()/1000;spawnShockwave();enemies.forEach(enemy=>{if(enemy.alive&&enemy.model.position.distanceTo(player.position)<3.4){enemy.hp-=55;enemy.bar.userData.fill.scale.x=Math.max(0,enemy.hp/100);enemy.bar.userData.fill.position.x=-(1-enemy.hp/100)*.64;if(enemy.hp<=0)defeatEnemy(enemy);}});}
function defeatEnemy(enemy){
  enemy.alive=false;enemy.model.visible=false;const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.34),new THREE.MeshStandardMaterial({color:'#9ce8ff',emissive:'#44bde9',emissiveIntensity:3,roughness:.2,metalness:.25}));
  shard.position.copy(enemy.model.position);shard.position.y+=.8;scene.add(shard);const light=new THREE.PointLight('#64d8ff',2.8,5);shard.add(light);drops.push({mesh:shard,baseY:shard.position.y});showToast('Corruption broken — a Star Shard appeared');
}
function animateAttack(time){const elapsed=time-attackStart;if(elapsed<.58){const p=elapsed/.58,wind=Math.min(1,p/.28),strike=Math.max(0,(p-.28)/.72);rig.rightArm.rotation.x=p<.28?-wind*1.35:-1.35+strike*3.05;rig.rightArm.rotation.z=-.22+Math.sin(p*Math.PI)*.35;}else{rig.rightArm.rotation.x=THREE.MathUtils.lerp(rig.rightArm.rotation.x,0,.18);rig.rightArm.rotation.z=THREE.MathUtils.lerp(rig.rightArm.rotation.z,0,.18);}}
function updateEnemies(dt,time){
  enemies.forEach(enemy=>{if(!enemy.alive)return;const distance=enemy.model.position.distanceTo(player.position),dir=new THREE.Vector3().subVectors(player.position,enemy.model.position);dir.y=0;
    if(distance<10&&distance>1.25){dir.normalize();const next=enemy.model.position.clone().addScaledVector(dir,dt*(distance<4?2.5:1.7));if(!collisionAt(next)){enemy.model.position.x=next.x;enemy.model.position.z=next.z;}enemy.model.rotation.y=THREE.MathUtils.damp(enemy.model.rotation.y,Math.atan2(dir.x,dir.z),10,dt);}
    else if(distance>=10){enemy.model.position.x+=Math.sin(time*.7+enemy.phase)*dt*.25;enemy.model.position.z+=Math.cos(time*.55+enemy.phase)*dt*.2;}
    enemy.model.position.y=terrainHeight(enemy.model.position.x,enemy.model.position.z);const walk=Math.sin(time*8+enemy.phase)*(distance<10?.48:.16);enemy.model.userData.rig.leftLeg.rotation.x=walk;enemy.model.userData.rig.rightLeg.rotation.x=-walk;
    enemy.model.children.forEach(child=>{if(child.userData.fill)child.quaternion.copy(camera.quaternion);});
    if(distance<1.45&&time>enemy.attackAt){enemy.attackAt=time+1.15;health-=12;updateHUD();showToast('Bram took 12 damage');if(health<=0){playing=false;deathScreen.hidden=false;saveGame();}}
  });
}
function updateDrops(dt,time){for(let i=drops.length-1;i>=0;i--){const drop=drops[i];drop.mesh.rotation.y+=dt*2.4;drop.mesh.position.y=drop.baseY+Math.sin(time*3+i)*.18;if(drop.mesh.position.distanceTo(player.position)<1.45){scene.remove(drop.mesh);drops.splice(i,1);shards=Math.min(3,shards+1);updateHUD();showToast(`Star Shard recovered · ${shards}/3`);saveGame();}}}
function updateAltar(time){altar.userData.crystal.rotation.y=time*.7;altar.userData.crystal.position.y=3.15+Math.sin(time*1.7)*.14;const near=player.position.distanceTo(altar.position)<4.4;prompt.hidden=!(playing&&near);if(near)prompt.textContent=shards>=3?'Press E to awaken the Starfall Altar':`The altar needs ${3-shards} more Star Shard${3-shards===1?'':'s'}`;altar.userData.light.intensity=altar.userData.awake?7:.35+Math.sin(time*2)*.2;}
function awaken(){if(!playing||shards<3||player.position.distanceTo(altar.position)>=4.4||completed)return;completed=true;altar.userData.awake=true;bloom.strength=.75;updateHUD();saveGame();playing=false;victoryScreen.hidden=false;}

window.addEventListener('keydown',event=>{const key=event.key.toLowerCase();keys.add(key);if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(key))event.preventDefault();if(key===' '&&!event.repeat)attack();if(key==='e'&&!event.repeat)awaken();});
window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());

const cameraTarget=new THREE.Vector3();
function resize(){const width=canvas.clientWidth,height=canvas.clientHeight;renderer.setSize(width,height,false);composer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}
window.addEventListener('resize',resize);resize();
const clock=new THREE.Clock();
function loop(){requestAnimationFrame(loop);const dt=Math.min(.04,clock.getDelta()),time=clock.elapsedTime;terrainMaterial.uniforms.uTime.value=time;waterMaterial.uniforms.uTime.value=time;motes.rotation.y=time*.008;sky.position.copy(camera.position);attackCooldown=Math.max(0,attackCooldown-dt);
  if(playing){movePlayer(dt,time);updateEnemies(dt,time);updateDrops(dt,time);saveTimer+=dt;if(saveTimer>2){saveTimer=0;saveGame();}}
  animateAttack(time);updateAltar(time);effects.forEach((effect,index)=>{effect.age+=dt;const p=effect.age/effect.duration;effect.mesh.scale.setScalar(1+p*5);effect.mesh.material.opacity=1-p;if(p>=1){scene.remove(effect.mesh);effects.splice(index,1);}});
  cameraTarget.set(player.position.x+8.8,player.position.y+10.5,player.position.z+12.5);camera.position.lerp(cameraTarget,1-Math.exp(-dt*4.5));camera.lookAt(player.position.x,player.position.y+1.1,player.position.z);composer.render();
}
player.position.set(0,terrainHeight(0,10),10);camera.position.set(9,11,23);updateHUD();loop();
