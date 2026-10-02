import { itemArt } from "./item-art.js";
import { createBattleEnvironment, usesTunnelArena, ROCK_HEALTH } from "./battle-environment.js";
import { CAVE_SPAWNS, respawnDelay, caveBandAllowed } from "./cave-encounters.mjs";
import { createQuestDefinitions, createStoryBook } from "./story.js";
import { dressHollow } from "./hollow.js";
import { waveRoster, showFightTutorial } from "./wave-info.mjs";
import { upgradeShops } from "./shops.js";
import { createSaveStore } from "./save-store.mjs";
import { decorateLandscape, fitBattleCamera } from "./presentation.js";
import {
  extensions,
  restore,
  weaponStats,
  altarMultiplier,
  nextAltarPercent,
  enemyLoot, awardSkeleton, SHARD_SUMMON,
  extinguishLantern, vampirePassageOpen,
  VAMPIRE_RIDDLE, advanceVampireRiddle,
  buy,
  affordability,
  craft,
  forge as temperWeapon,
  findEcho,
  claimContract,
  canEnterSentinel,
  awardSentinel,
  SECRETS,
} from "./campaign.mjs";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  createBram,
  setBramWeapon,
  createGoblin,
  createOrc,
  createBat,
  createRockMonster,
  createKnight,
  createOathboundSentinel,
  SENTINEL_HEALTH,
  createNecromancer,
  createTree,
  createRock,
  createPortal,
  createAltar,
  createBuilding,
  createVillager,
  createInterior,
  mat,
  part,
  box,
  tintUnit,
  walkUnit,
  resetUnit,
  attackPose,
  createUndead,
  createSkeletonBoss,
  createVampire,
} from "./models.js";

const $ = (s) => document.querySelector(s),
  canvas = $("#world");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#bddbdf");
scene.fog = null;
const camera = new THREE.PerspectiveCamera(47, 1, 0.1, 140),
  composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());
const sun = new THREE.DirectionalLight("#ffdc9a", 2.6),
  hemi = new THREE.HemisphereLight("#d9ebf5", "#7b8961", 2.1);
sun.position.set(-9, 16, 8);
sun.castShadow = true;
sun.shadow.normalBias = 0.18;
sun.shadow.bias = -0.0001;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = sun.shadow.camera.bottom = -52;
sun.shadow.camera.right = sun.shadow.camera.top = 52;
sun.shadow.camera.far = 110;
scene.add(sun, hemi);
const sky = new THREE.Group();
scene.add(sky);

const rng = (() => {
  let n = 21871;
  return () => ((n = (n * 16807) % 2147483647) - 1) / 2147483646;
})();
const zones = {},
  zoneColliders = {},
  focuses = {};
let currentZone = "meadow";
function zone(name, size, color) {
  const group = new THREE.Group(),
    ground = new THREE.Mesh(
      new THREE.PlaneGeometry(size[0], size[1]),
      mat(color),
    );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);
  group.visible = false;
  scene.add(group);
  zones[name] = group;
  zoneColliders[name] = [];
  return group;
}
function add(group, obj, x, z, r = 0, y = 0) {
  obj.position.set(x, y, z);
  group.add(obj);
  if (r) {
    const zoneName = Object.keys(zones).find((k) => zones[k] === group);
    zoneColliders[zoneName].push({ object: obj, radius: r });
  }
  return obj;
}
function solid(parent, geometry, material, position) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

const meadow = zone("meadow", [118, 118], "#8aab68"),
  town = zone("town", [66, 58], "#a5ad84"),
  smithInterior = zone("smithInterior", [20, 16], "#594938"),
  shopInterior = zone("shopInterior", [20, 16], "#594938"),
  manHouse = zone("manHouse", [20, 16], "#594938"),
  basement = zone("basement", [20, 16], "#4a4c46"),
  cave = zone("cave", [46, 92], "#414640"),
  ossuary = zone("ossuary", [22, 22], "#45404e"),
  vampireCave = zone('vampireCave',[18,20],'#463f50'),
  vampireRuin = zone('vampireRuin',[30,38],'#39323f'),
  battle = zone("battle", [118, 118], "#8aab68");
zones.meadow.visible = true;

for (let i = 0; i < 32; i++) {
  const a = i * 2.4,
    r = 13 + (((i * 19) % 100) / 100) * 21,
    x = Math.cos(a) * r,
    z = Math.sin(a) * r;
  if (Math.hypot(x, z) < 10 || Math.hypot(x, z + 13) < 8) continue;
  add(meadow, createTree(0.85 + (i % 3) * 0.12, i % 9 === 0), x, z, 0.48);
}
for (let i = 0; i < 18; i++) {
  const a = i * 1.83,
    r = 11 + (((i * 23) % 100) / 100) * 26,
    x = Math.cos(a) * r,
    z = Math.sin(a) * r;
  if (Math.hypot(x, z) < 7) continue;
  add(meadow, createRock(0.28 + (i % 4) * 0.12), x, z, 0.35);
}
const mountainColors = ["#667f8b", "#879aa2", "#758d91", "#8faaa3"];
for (let i = 0; i < 52; i++) {
  const angle = (i / 52) * Math.PI * 2,
    radius = 35 + (i % 5) * 0.45,
    x = Math.cos(angle) * radius,
    z = Math.sin(angle) * radius;
  const peak = new THREE.Group(),
    scale = 1.35 + (i % 4) * 0.18,
    height = 2.5 + (i % 5) * 0.28,
    stone = mat(mountainColors[i % mountainColors.length], 0.96);
  const main = part(peak, new THREE.DodecahedronGeometry(2.65, 0), stone, [
    0,
    3.15 * scale,
    0,
  ]);
  main.scale.set(1.4 * scale, height * scale, 1.12 * scale);
  main.rotation.set(0.04, (i * 0.73) % Math.PI, 0.06);
  const shoulder = part(peak, new THREE.DodecahedronGeometry(1.75, 0), stone, [
    Math.sin(i) * 2.7 * scale,
    1.55 * scale,
    Math.cos(i) * 1.25,
  ]);
  shoulder.scale.set(1.25, 1.35 + (i % 3) * 0.2, 1.1);
  shoulder.rotation.y = i * 0.41;
  add(meadow, peak, x, z, 3.15 * scale);
}
const grassGeo = new THREE.ConeGeometry(0.045, 0.42, 4),
  grassMat = mat("#405b43", 1),
  grass = new THREE.InstancedMesh(grassGeo, grassMat, 120),
  grassDummy = new THREE.Object3D();
for (let i = 0; i < 120; i++) {
  grassDummy.position.set((rng() - 0.5) * 96, 0.2, (rng() - 0.5) * 96);
  grassDummy.rotation.y = rng() * 6.28;
  grassDummy.scale.set(
    0.65 + rng() * 0.55,
    0.65 + rng() * 0.55,
    0.65 + rng() * 0.55,
  );
  grassDummy.updateMatrix();
  grass.setMatrixAt(i, grassDummy.matrix);
}
meadow.add(grass);
const roadMat = mat("#817565", 0.98);
for (let i = 0; i < 85; i++) {
  const z = 45 - i * 1.05,
    x = Math.sin(z * 0.14) * 2.8,
    stone = createRock(0.16 + (i % 4) * 0.025);
  stone.traverse((o) => {
    if (o.isMesh) o.material = roadMat;
  });
  stone.position.set(x, 0.02, z);
  stone.scale.y = 0.28;
  meadow.add(stone);
}
const lake = new THREE.Mesh(
  new THREE.CircleGeometry(7.5, 48),
  new THREE.MeshStandardMaterial({
    color: "#2d7080",
    roughness: 0.24,
    metalness: 0.06,
    transparent: true,
    opacity: 0.8,
  }),
);
lake.rotation.x = -Math.PI / 2;
lake.position.set(-23, 0.03, -16);
meadow.add(lake);
const knight = add(meadow, createKnight(), 0, -13, 0.75),
  meadowPortal = add(meadow, createPortal(), 0, 8, 1.9),
  oldAltar = add(meadow, createAltar(), 0, -17, 2.2);
meadowPortal.userData.active = false;
focuses.knight = knight;
focuses.portal = meadowPortal;
focuses.altar = oldAltar;
for (const [x, z] of [
  [20, -20],
  [-21, 20],
  [26, 15],
]) {
  const ruin = new THREE.Group(),
    stone = mat("#4d615f", 0.93);
  box(ruin, [1.1, 4.2, 1.1], stone, [-2, 2.1, 0]);
  box(ruin, [1.1, 4.2, 1.1], stone, [2, 2.1, 0]);
  box(ruin, [5, 1, 1.15], stone, [0, 4.2, 0]);
  add(meadow, ruin, x, z, 2.5);
}

const smithHouse = add(
    town,
    createBuilding("smith", "#765747", "#3b4648"),
    -10,
    -5,
    3.2,
  ),
  shopHouse = add(
    town,
    createBuilding("shop", "#586b61", "#34494d"),
    10,
    -5,
    3.2,
  ),
  thirdHouse = add(
    town,
    createBuilding("man", "#6d5d48", "#443b39"),
    0,
    -16,
    3.2,
  ),
  townAltar = add(town, createAltar(), 0, 4, 2.2),
  townPortal = add(town, createPortal(), 0, 17, 1.9);
townAltar.userData.active = false;
townPortal.userData.active = true;
townPortal.userData.light.intensity = 4;
focuses.townAltar = townAltar;
focuses.townPortal = townPortal;
focuses.smithHouse = smithHouse;
focuses.shopHouse = shopHouse;
focuses.thirdHouse = thirdHouse;
const townWall = mat("#503b2a", 0.94);
for (let i = -30; i <= 30; i += 3) {
  for (const z of [-27, 27])
    solid(town, new THREE.CylinderGeometry(0.13, 0.17, 2, 6), townWall, [
      i,
      1,
      z,
    ]);
}
for (let i = -24; i <= 24; i += 3) {
  for (const x of [-31, 31])
    solid(town, new THREE.CylinderGeometry(0.13, 0.17, 2, 6), townWall, [
      x,
      1,
      i,
    ]);
}
for (const z of [-27, 27]) {
  solid(town, new THREE.BoxGeometry(62, 0.13, 0.14), townWall, [0, 1.35, z]);
  solid(town, new THREE.BoxGeometry(62, 0.13, 0.14), townWall, [0, 0.7, z]);
}
for (const x of [-31, 31]) {
  solid(town, new THREE.BoxGeometry(0.14, 0.13, 54), townWall, [x, 1.35, 0]);
  solid(town, new THREE.BoxGeometry(0.14, 0.13, 54), townWall, [x, 0.7, 0]);
}

smithInterior.add(createInterior("smith"));
shopInterior.add(createInterior("shop"));
manHouse.add(createInterior("house"));
basement.add(createInterior("basement"));
const mira = add(smithInterior, createVillager("smith"), 0, -2, 0.65),
  oren = add(shopInterior, createVillager("merchant"), 0, -2, 0.65);
focuses.mira = mira;
focuses.oren = oren;
const forge = new THREE.Group(),
  forgeStone = mat("#4b4e4b", 0.96),
  fire = mat("#ffb047", 0.4, 0, "#df5b1e", 2.1);
box(forge, [3, 1.2, 1.5], forgeStone, [0, 0.6, 0]);
box(forge, [1.8, 0.12, 0.8], fire, [0, 1.25, 0]);
add(smithInterior, forge, -5, -3, 1.8);
const forgeLight = new THREE.PointLight("#ff9a45", 2.1, 10);
forgeLight.position.set(-5, 2, -3);
smithInterior.add(forgeLight);
for (const [x, z] of [
  [-5, -3],
  [4, -2],
  [5, 2],
])
  box(shopInterior, [2.6, 2.2, 0.55], mat("#4b3424", 0.94), [x, 1.1, z]);
const stairs = add(manHouse, new THREE.Group(), 0, -3, 1.2);
for (let i = 0; i < 6; i++)
  box(stairs, [2, 0.22, 0.55], mat("#92734e", 0.95), [0, -0.12-i * 0.28, -i * 0.48]);
focuses.stairs = stairs;
const basementStairs = add(basement, new THREE.Group(), 0, 4.7, 1.2);
for (let i = 0; i < 6; i++)
  box(basementStairs, [2, 0.22, 0.55], mat("#46514e", 0.96), [
    0,
    i * 0.18,
    i * 0.48,
  ]);
const wallHole = add(basement, new THREE.Group(), 0, -5.7, 1.3);
part(
  wallHole,
  new THREE.TorusGeometry(1.25, 0.42, 8, 13),
  mat("#46524f", 0.98),
  [0, 1.25, 0],
);
part(
  wallHole,
  new THREE.CircleGeometry(1.05, 20),
  mat("#080e10", 1),
  [0, 1.25, 0.04],
);
focuses.wallHole = wallHole;

const cavePath = new THREE.CatmullRomCurve3(
  [
    [0, 18],
    [-5, 11],
    [3, 4],
    [-6, -4],
    [4, -13],
    [-2, -23],
    [-8, -33],
  ].map(([x, z]) => new THREE.Vector3(x, 0.03, z)),
);
const caveWalkPoints = cavePath.getPoints(200);
const caveDistancePoints = cavePath.getSpacedPoints(200);
// A walk-through seam halfway through the tunnel; the wall itself stays opaque.
const secretCenter = cavePath.getPointAt(.52);
const secretTangent = cavePath.getTangentAt(.52);
const secretNormal = new THREE.Vector3(-secretTangent.z, 0, secretTangent.x);
const secretSeam = secretCenter.clone().addScaledVector(secretNormal, 3.25);
const secretRune = add(cave, new THREE.Mesh(new THREE.OctahedronGeometry(.16), new THREE.MeshBasicMaterial({color:'#bf96e8'})), secretSeam.x, secretSeam.z, 0, 1.2);
const cryptDoor = add(ossuary, createPortal(), 0, 8);
const cryptThrone = add(ossuary, createSkeletonBoss(), 0, -5);
for (const side of [-1,1]) {
  const height=side>0?1:5; // Cutaway camera-facing walls keep Bram and the exit visible.
  box(ossuary,[.7,height,22],mat('#34303d'),[side*10.5,height/2,0]);
  box(ossuary,[22,height,.7],mat('#34303d'),[0,height/2,side*10.5]);
  for(let z=-8;z<=6;z+=4) {
    add(ossuary,createRock(.6),side*8,z,.6);
    const light=new THREE.PointLight('#a98cff',3,9);light.position.set(side*7,2,z);ossuary.add(light);
  }
}
box(ossuary,[4,.3,3],mat('#716779'),[0,.15,-5]);
const vampireNPC=add(vampireCave,createVampire(),0,-4, .65);
const vampireExit=add(vampireCave,createPortal(),0,7);
const refugeStone=mat('#38323e');
box(vampireCave,[44,.5,44],refugeStone,[0,-.3,0]);
box(vampireCave,[20,5,2],refugeStone,[0,2.5,-10]);
box(vampireCave,[2,5,20],refugeStone,[-10,2.5,0]);
for(let i=0;i<22;i++) {
  const a=i/22*Math.PI*2, rock=createRock(1.6);
  rock.traverse(o=>{if(o.isMesh)o.material=refugeStone;});
  rock.scale.y=Math.sin(a)>0?.7:2.4;
  add(vampireCave,rock,Math.cos(a)*9,Math.sin(a)*10,1);
}
box(vampireCave,[2,.5,3],mat('#261e30'),[0,.25,-6]);
const vampireGlow=new THREE.PointLight('#d94a70',10,16);vampireGlow.position.set(0,3,-4);vampireCave.add(vampireGlow);
// The existing northern mountain hides the refuge; no separate wall or marker.
const riddleBell=new THREE.Group();
part(riddleBell,new THREE.CylinderGeometry(.3,.65,.7,12,1,true),mat('#bc9956',.5,.5),[0,1.7,0]);
box(riddleBell,[.15,2.4,.15],mat('#49393b'),[-.85,1.2,0]);
box(riddleBell,[1.8,.15,.15],mat('#49393b'),[0,2.35,0]);
add(meadow,riddleBell,-18,5,.6);
riddleBell.visible=false;
const riddleBrazier=new THREE.Group();
part(riddleBrazier,new THREE.CylinderGeometry(.65,.3,.5,10),mat('#726a78'),[0,.9,0]);
const riddleFlame=part(riddleBrazier,new THREE.ConeGeometry(.35,.85,7),mat('#ffb758',1,0,'#ff6329',2),[0,1.55,0]);
const riddleLight=new THREE.PointLight('#ff9550',7,9);riddleLight.position.y=1.8;riddleBrazier.add(riddleLight);
add(ossuary,riddleBrazier,5,0,.6);
riddleBrazier.visible=false;
const riddleChalice=new THREE.Group();
box(riddleChalice,[.9,1,.9],mat('#595160'),[0,.5,0]);
part(riddleChalice,new THREE.CylinderGeometry(.35,.14,.4,12,1,true),mat('#c1a566',.5,.6),[0,1.3,0]);
add(vampireCave,riddleChalice,4,3,.6);
riddleChalice.visible=false;
const riddleClues='The bronze bell waits in the western meadow. Seek the brazier in the Marrow King’s secret skeleton chamber, then return to the chalice in my refuge.';
function syncRiddleObjects() {
  for(const object of [riddleBell,riddleBrazier,riddleChalice]) object.visible=Boolean(game.vampireRiddleStarted);
  riddleFlame.visible=game.vampireRiddleStarted && game.vampireRiddleStep<2;
  riddleLight.intensity=riddleFlame.visible?7:0;
}
focuses.vampire=vampireNPC;
let ruinDescent=0;
const vrykolakas=add(vampireRuin,createVampire(),0,-10,.7);vrykolakas.scale.setScalar(1.25);focuses.vrykolakas=vrykolakas;
const ruinExit=add(vampireRuin,new THREE.Group(),0,13);
for(let i=0;i<8;i++)box(ruinExit,[3,.35+i*.22,.65],mat('#615767'),[0,(.35+i*.22)/2,i*.6-2]);
const ruinStone=mat('#3a3443');
box(vampireRuin,[70,.6,70],ruinStone,[0,-.4,0]);
box(vampireRuin,[32,7,2],ruinStone,[0,3.5,-19]);
box(vampireRuin,[2,7,40],ruinStone,[-16,3.5,0]);
box(vampireRuin,[2,1,40],ruinStone,[16,.5,0]);
for(const x of [-10,10])for(const z of [-12,-4,4,12]) {
  const pillar=new THREE.Group();
  part(pillar,new THREE.CylinderGeometry(.8,1,4.5+(z%3),8),mat('#6a5c70'),[0,2,0]);
  box(pillar,[2.2,.35,2.2],ruinStone,[0,.18,0]);
  add(vampireRuin,pillar,x,z,1.2);
  const glow=new THREE.PointLight('#b64a79',5,12);glow.position.set(x,2,z);vampireRuin.add(glow);
}
for(let i=0;i<5;i++)box(vampireRuin,[2.3,.5,3.2],mat('#615569'),[0,.25,-10-i*1.2]);
for(const x of [-5,5]) {
  const coffin=new THREE.Group();box(coffin,[1.5,.8,3],mat('#352c3a'),[0,.4,0]);
  box(coffin,[1.65,.2,3.15],mat('#8c6d80'),[0,.9,0]);add(vampireRuin,coffin,x,-7,1.5);
}
function crossRuinWall(next) {
  if(currentZone!=='vampireCave' || !game.vampireRiddleSolved || next.x> -8.1 || next.z> -8.1)return false;
  switchZone('vampireRuin',{x:0,z:9},false);
  ruinDescent=1.6;player.position.y=6;state='descent';keys.clear();
  toast('The corner gives way. Below lies an ancient vampire ruin.',5000);return true;
}
function crossVampireWall(next) {
  if(currentZone!=='meadow' || !vampirePassageOpen(game) || Math.abs(next.x)>1.5 || next.z> -29.6 || next.z< -32)return false;
  switchZone('vampireCave',{x:0,z:4},false);toast('Secret discovered · The Crimson Refuge');return true;
}
function crossSecretWall(next) {
  if(currentZone !== 'cave') return false;
  const delta=next.clone().sub(secretCenter);
  if(Math.abs(delta.dot(secretTangent))>1.1 || delta.dot(secretNormal)<2.65 || delta.dot(secretNormal)>4.5) return false;
  switchZone('ossuary',{x:0,z:5},false);
  toast('Secret discovered · The Marrow King’s Ossuary');
  return true;
}
const caveFloor = mat("#465451", 0.98),
  caveWall = mat("#35423f", 0.99);
for (let i = 0; i < 150; i++) {
  const p = cavePath.getPoint(i / 149),
    n = i < 149 ? cavePath.getTangent(i / 149) : cavePath.getTangent(0.99),
    perp = new THREE.Vector3(-n.z, 0, n.x),
    peb = createRock(0.18 + (i % 5) * 0.025);
  peb.traverse((o) => {
    if (o.isMesh) o.material = caveFloor;
  });
  peb.position.copy(p);
  peb.scale.y = 0.25;
  cave.add(peb);
  if (i % 3 === 0)
    for (const side of [-1, 1]) {
      const rock = createRock(1.2 + rng() * 0.9);
      rock.traverse((o) => {
        if (o.isMesh) o.material = caveWall;
      });
      rock.position.copy(p).addScaledVector(perp, side * (4.5 + rng() * 1.2));
      rock.scale.y = 1.8 + rng();
      cave.add(rock);
      zoneColliders.cave.push({ object: rock, radius: 1.2 });
    }
}
const caveTorches = [];
const hollowDetails = dressHollow({ manHouse, basement, cave, cavePath, colliders: zoneColliders });
upgradeShops({ smithInterior, shopInterior, colliders: zoneColliders });
manHouse.children[0].visible = false;
for (const t of [0.08, 0.34, 0.62, 0.88]) {
  const p = cavePath.getPoint(t),
    torch = new THREE.PointLight("#e49a4b", 1.8, 10);
  torch.position.set(p.x, 2.4, p.z);
  cave.add(torch);
  caveTorches.push(torch);
}
for (const [x, z] of [
  [-20, -18],
  [20, -18],
  [-20, 18],
  [20, 18],
]) {
  add(battle, createTree(1), x, z);
  add(battle, createRock(0.8), x + (x > 0 ? -2 : 2), z + (z > 0 ? -2 : 2));
}

const player = createBram();
meadow.add(player);
const playerRig = player.userData.rig;
focuses.player = player;
const keys = new Set(),
  bands = [];
let activeBand = null;
function makeBand(zoneName, id, type, x, z, orc = false) {
  const group = new THREE.Group();
  if (type === "goblin") {
    for (const [dx, dz] of [
      [0, 0],
      [-0.8, 0.5],
      [0.8, 0.45],
    ]) {
      const g = createGoblin(Math.floor(rng() * 8));
      g.scale.setScalar(0.72);
      g.position.set(dx, 0, dz);
      group.add(g);
    }
    if (orc) {
      const o = createOrc();
      o.scale.multiplyScalar(0.8);
      o.position.set(0, 0, -1);
      group.add(o);
    }
  } else if (type === "bat") {
    for (let i = 0; i < 4; i++) {
      const b = createBat();
      b.position.set((i - 1.5) * 0.5, 0.7 + (i % 2) * 0.25, (i % 2) * 0.55);
      group.add(b);
    }
  } else group.add(createRockMonster());
  group.position.set(x, 0, z);
  group.userData = {
    id,
    type,
    orc,
    home: new THREE.Vector3(x, 0, z),
    phase: rng() * 6,
    alive: true,
    zone: zoneName,
  };
  zones[zoneName].add(group);
  bands.push(group);
  return group;
}
makeBand("meadow", "meadow-goblins-1", "goblin", 14, 10, false);
makeBand("meadow", "meadow-goblins-2", "goblin", -15, 13, true);
makeBand("meadow", "meadow-goblins-3", "goblin", 18, -9, false);
for (const spawn of CAVE_SPAWNS) {
  const p = cavePath.getPointAt(spawn.progress);
  makeBand("cave", spawn.id, spawn.type, p.x, p.z);
}

const saveStore = createSaveStore();
const newState = () => ({
  version: 4,
  exp: 0,
  gold: 0,
  goblins: 0,
  materials: {
    "Goblin Bone": 0,
    "Orc Tusk": 0,
    Wood: 0,
    "Bat Wing": 0,
    "Vampire Shard": 0,
  },
  keyItems: [],
  weapons: ["Hammer"],
  equipped: "Hammer",
  upgrades: { damage: 0, range: 0, aoe: 0 },
  quest: "meet_calder",
  tutorial: "move",
  bossDefeated: false,
  location: "meadow",
  position: { x: -4, z: 10 },
  defeatedBands: [],
  visited: {
    smith: false,
    shop: false,
    manHouse: false,
    basement: false,
    cave: false,
  },
  cutscenes: [],
  ...extensions(),
});
let game = newState(),
  state = "title",
  toastTimer = 0,
  menuReturnState = "world",
  moveTime = 0;
let battleReturn = { zone: "meadow", position: { x: -5, z: 8 } };
const questDefs = createQuestDefinitions(() => game);
function zoneLabel(z) {
  return (
    {
      meadow: "Meadow of Cinders",
      town: "Starfall Town",
      smithInterior: "Starfall Smithy",
      shopInterior: "Wayfarer Shop",
      manHouse: "The Third House",
      basement: "Hidden Basement",
      cave: "The Hollow Below",
      ossuary: "The Hidden Ossuary",
      vampireCave: 'The Crimson Refuge',
      vampireRuin: 'Ancient Vampire Ruin',
      battle: "Cinderpath Defense",
    }[z] || z
  );
}
function updateHUD() {
  syncRiddleObjects();
  const q = questDefs[game.quest] || questDefs.complete,
    value = typeof q[2] === "function" ? q[2]() : q[2],
    stats = attackStats(),
    damage = stats.damage,
    range = stats.range,
    aoe = stats.aoe;
  setBramWeapon(player, game.equipped);
  $("#exp").textContent = game.exp.toLocaleString();
  $("#gold").textContent = game.gold.toLocaleString();
  $("#location").textContent = zoneLabel(currentZone);
  $("#questTitle").textContent = q[0];
  $("#questText").textContent = q[1];
  $("#questCount").textContent = `${value} / ${q[3]}`;
  $("#questFill").style.width = `${Math.min(100, (value / q[3]) * 100)}%`;
  $("#damageLevel").textContent = game.upgrades.damage;
  $("#rangeLevel").textContent = game.upgrades.range;
  $("#aoeLevel").textContent = game.upgrades.aoe;
  $("#weaponLine").textContent =
    `${game.equipped} · ${damage} DMG · ${range.toFixed(1)} RNG · ${aoe.toFixed(1)} AOE`;
}
function tutorial(title, text) {
  if (state === "battle" && !showFightTutorial(game)) {
    $("#tutorial").hidden = true;
    return;
  }
  $("#tutorialTitle").textContent = title;
  $("#tutorialText").textContent = text;
  $("#tutorial").hidden = false;
}
function toast(text, duration = 2600) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), duration);
}
let lastSavedPayload = "",
  saveWarningShown = false;
function save() {
  if (state === "title") return;
  try {
    const safe =
      currentZone === "battle"
        ? battleReturn
        : {
            zone: currentZone,
            position: { x: player.position.x, z: player.position.z },
          };
    const stable = JSON.stringify({
      ...game,
      location: safe.zone,
      position: safe.position,
    });
    if (stable === lastSavedPayload) return;
    saveStore.write(JSON.parse(stable));
    lastSavedPayload = stable;
  } catch {
    if (!saveWarningShown) {
      saveWarningShown = true;
      toast(
        "Saving is unavailable. Please keep this window open and export a backup from the journal.",
        7000,
      );
    }
  }
}
function readSave() {
  return saveStore.read();
}

function load(data) {
  game = restore(newState(), data);
  for (const b of bands) {
    b.visible = b.userData.alive = !game.defeatedBands.includes(b.userData.id);
    b.userData.respawn = respawnDelay(b.userData.type);
  }
  const validZone =
    zones[game.location] && game.location !== "battle"
      ? game.location
      : "meadow";
  switchZone(validZone, game.position, false);
  oldAltar.visible = knight.visible = !game.bossDefeated;
  meadowPortal.userData.active = game.bossDefeated;
  meadowPortal.userData.light.intensity = game.bossDefeated ? 4 : 0;
  townAltar.userData.active = game.keyItems.includes("Strange Rune");
  if (game.tutorial === "move")
    tutorial(
      "A road worth walking",
      "WASD or arrows to move. Shift to run. E to investigate. J opens your journal.",
    );
  else if (game.tutorial === "interact")
    tutorial(
      "The knight’s oath",
      "Approach Sir Calder beside the old altar and press E.",
    );
  else $("#tutorial").hidden = true;
  syncDiscoveries();
  updateHUD();
  save();
}

const cutscenes = createStoryBook();
let cutsceneLines = null,
  cutsceneIndex = 0,
  cutsceneCallback = null,
  cutsceneFocus = null,
  cutsceneStyle = "orbit",
  cutsceneTime = 0;
function playCutscene(id, callback) {
  const lines = cutscenes[id];
  if (!lines) {
    callback?.();
    return;
  }
  keys.clear();
  state = "cutscene";
  document.body.dataset.mode = "cutscene";
  $("#prompt").hidden = true;
  $("#tutorial").hidden = true;
  $("#cinematic").hidden = false;
  cutsceneLines = lines;
  cutsceneIndex = 0;
  cutsceneCallback = callback;
  showCutsceneLine();
}
function resolveFocus(name) {
  if (name === "battleBoss")
    return bossEnemy?.model || focuses.battleBoss || player;
  const focus = focuses[name];
  if (!focus) return player;
  let parent = focus;
  while (parent.parent && parent.parent !== scene) parent = parent.parent;
  return parent.visible ? focus : player;
}
function showCutsceneLine() {
  const [speaker, text, focus, style] = cutsceneLines[cutsceneIndex];
  $("#speaker").textContent = speaker;
  $("#dialogue").textContent = text;
  cutsceneFocus = resolveFocus(focus);
  cutsceneStyle = style;
  cutsceneTime = 0;
}
function advanceCutscene() {
  if (!cutsceneLines) return;
  if (++cutsceneIndex >= cutsceneLines.length) endCutscene();
  else showCutsceneLine();
}
function endCutscene() {
  if (!cutsceneLines) return;
  $("#cinematic").hidden = true;
  resetBramPose();
  cutsceneLines = null;
  cutsceneFocus = null;
  const callback = cutsceneCallback;
  cutsceneCallback = null;
  callback?.();
  document.body.dataset.mode = state === "battle" ? "battle" : "world";
  save();
}
$("#nextDialogue").onclick = advanceCutscene;
$("#skipCutscene").onclick = endCutscene;

function switchZone(name, position, withScene = true) {
  for (const [key, group] of Object.entries(zones))
    group.visible = key === name;
  currentZone = name;
  if (player.parent !== zones[name]) zones[name].add(player);
  player.visible = true;
  player.position.set(position.x, 0, position.z);
  player.rotation.y = 0;
  resetBramPose();
  // Find a clear landing spot, including old saves inside portal/building colliders.
  if (blocked(player.position)) {
    const origin = player.position.clone();
    let found = false;
    for (let r = 0.6; r < 12 && !found; r += 0.6)
      for (let i = 0; i < 24; i++) {
        const p = origin
          .clone()
          .add(
            new THREE.Vector3(
              Math.cos((i / 24) * Math.PI * 2) * r,
              0,
              Math.sin((i / 24) * Math.PI * 2) * r,
            ),
          );
        if (!blocked(p)) {
          player.position.copy(p);
          found = true;
          break;
        }
      }
    if (!found)
      player.position.set(
        name === "meadow" ? -4 : 0,
        0,
        name === "meadow" ? 10 : 0,
      );
  }
  state = "world";
  encounterGrace = 3;
  $("#prompt").hidden = true;
  $("#battleHud").hidden = true;
  $("#tutorial").hidden = true;
  document.body.dataset.mode = "world";
  if (name === "town" && game.quest === "use_portal")
    game.quest = "visit_services";
  if (name === "manHouse") {
    game.visited.manHouse = true;
    if (game.quest === "enter_man_cave") game.quest = "find_basement";
  }
  if (name === "cave") {
    game.visited.cave = true;
    if (game.quest === "find_basement") game.quest = "explore_cave";
  }
  updateHUD();
  save();
  if (
    withScene &&
    ["town", "manHouse", "cave"].includes(name) &&
    !game.cutscenes.includes(name)
  ) {
    game.cutscenes.push(name);
    playCutscene(name, () => {
      state = "world";
      save();
    });
  }
}
function interactionList() {
  if (currentZone === "meadow")
    return [
      ["Sir Calder", knight, () => talkCalder()],
      ["Starfall Portal", meadowPortal, () => useMeadowPortal()],
    ];
  if (currentZone === "town")
    return [
      [
        "Enter Smithy",
        { position: new THREE.Vector3(-10, 0, -1.5) },
        () => switchZone("smithInterior", { x: 0, z: 5 }),
      ],
      [
        "Enter Shop",
        { position: new THREE.Vector3(10, 0, -1.5) },
        () => switchZone("shopInterior", { x: 0, z: 5 }),
      ],
      [
        "Enter Third House",
        { position: new THREE.Vector3(0, 0, -12.5) },
        () => enterManHouse(),
      ],
      ["Awakened Altar", townAltar, () => useAltar()],
      [
        "Return Portal",
        townPortal,
        () => switchZone("meadow", { x: 0, z: 12 }),
      ],
    ];
  if (currentZone === "smithInterior")
    return [
      ["Mira", mira, () => talkService("mira")],
      [
        "Exit Smithy",
        { position: new THREE.Vector3(0, 0, 6) },
        () => switchZone("town", { x: -10, z: -0.5 }, false),
      ],
    ];
  if (currentZone === "shopInterior")
    return [
      ["Oren", oren, () => talkService("oren")],
      [
        "Exit Shop",
        { position: new THREE.Vector3(0, 0, 6) },
        () => switchZone("town", { x: 10, z: -0.5 }, false),
      ],
    ];
  if (currentZone === "manHouse")
    return [
      ["Basement Stairs", stairs, () => switchZone("basement", { x: 0, z: 4 })],
      [
        "Exit House",
        { position: new THREE.Vector3(0, 0, 6) },
        () => switchZone("town", { x: 0, z: -11.5 }, false),
      ],
    ];
  if (currentZone === "basement")
    return [
      ["Broken Wall", wallHole, () => switchZone("cave", { x: 0, z: 18 })],
      [
        "Stairs Up",
        basementStairs,
        () => switchZone("manHouse", { x: 0, z: -1.5 }, false),
      ],
    ];
  if (currentZone === "cave")
    return [
      [
        "Return Through Wall",
        { position: new THREE.Vector3(0, 0, 19) },
        () => switchZone("basement", { x: 0, z: -4.2 }, false),
      ],
    ];
  return [];
}
function nearestInteraction() {
  const available = [
    ...interactionList().filter((item) => item[1].visible !== false),
    ...extraInteractions(),
  ];
  let best = null,
    d = Infinity;
  for (const item of available) {
    const dist = player.position.distanceTo(item[1].position);
    if (dist < d) {
      d = dist;
      best = item;
    }
  }
  return d < 3.2 ? best : null;
}
function talkCalder() {
  if (game.bossDefeated) return;
  if (game.quest === "meet_calder")
    playCutscene("calder", () => {
      state = "world";
      game.quest = game.goblins >= 10 ? "return_calder" : "kill_goblins";
      game.tutorial = "battle";
      tutorial(
        "Choose your battle",
        "Touch a roaming band to fight. Large green orcs accompany some groups. Explore glowing objects for hidden stories.",
      );
      updateHUD();
      save();
    });
  else if (game.quest === "kill_goblins")
    story(
      "SIR CALDER",
      `The oath still hungers. ${Math.max(0, 10 - game.goblins)} goblins remain. Bring that hammer back when the meadow is quiet.`,
      "knight",
    );
  else if (["return_calder", "defeat_calder"].includes(game.quest)) {
    game.quest = "defeat_calder";
    save();
    playCutscene("betrayal", () => {
      activeBand = null;
      setupBattle({ type: "boss", id: "calder-boss" });
    });
  }
}
function useMeadowPortal() {
  if (!game.bossDefeated || !game.keyItems.includes("Teleporter Key")) {
    toast("The portal is sealed by a dark oath.");
    return;
  }
  switchZone("town", { x: 0, z: 12 });
}
function enterManHouse() {
  if (!game.keyItems.includes("Key to the Man Cave")) {
    toast("The third house is locked. You need the Key to the Man Cave.");
    return;
  }
  switchZone("manHouse", { x: 0, z: 5 });
}
function useAltar() {
  if (!game.keyItems.includes("Strange Rune")) {
    toast("A rune-shaped hollow waits in the altar.");
    return;
  }
  townAltar.userData.active = true;
  townAltar.userData.light.intensity = 4;
  if (game.quest === "awaken_altar") game.quest = "enter_man_cave";
  openAltar();
  save();
}

function blocked(next) {
  const bounds = {
    meadow: [56, 56],
    town: [29.5, 25.5],
    smithInterior: [8.2, 6.1],
    shopInterior: [8.2, 6.1],
    manHouse: [8.2, 6.1],
    basement: [8.2, 6.1],
    cave: [21, 44],
    ossuary: [9.5,9.5],
    vampireCave: [7,8],
    vampireRuin: [14,17],
  }[currentZone];
  if (!bounds) return false;
  if(currentZone==='meadow' && vampirePassageOpen(game) && Math.abs(next.x)<1.5 && next.z< -24 && next.z> -30) return false;
  if(currentZone==='vampireCave' && game.vampireRiddleSolved && next.x< -4.5 && next.z< -4.5 && next.x> -9 && next.z> -9) return false;
  // Leave a narrow approach to the illusion clear of decorative rock colliders.
  if(currentZone === 'cave') {
    const offset=next.clone().sub(secretCenter), across=offset.dot(secretNormal);
    if(Math.abs(offset.dot(secretTangent))<1.2 && across>=0 && across<2.9) return false;
  }
  if (
    currentZone === "cave" &&
    !caveWalkPoints.some((p) => Math.hypot(p.x - next.x, p.z - next.z) < 3.8)
  )
    return true;
  if (currentZone === "meadow" && Math.hypot(next.x, next.z) > 30.5)
    return true;
  if (Math.abs(next.x) > bounds[0] || Math.abs(next.z) > bounds[1]) return true;
  return zoneColliders[currentZone].some(
    ({ object, radius }) =>
      object.visible &&
      Math.hypot(next.x - object.position.x, next.z - object.position.z) <
        radius + 0.48,
  );
}
function animateWalk(model, time, amount = 0.58) {
  walkUnit(model, time, amount);
}

function movePlayer(dt, time) {
  let dx =
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft")),
    dz =
      Number(keys.has("s") || keys.has("arrowdown")) -
      Number(keys.has("w") || keys.has("arrowup"));
  if (!dx && !dz) {
    resetUnit(player);
    return;
  }
  const len = Math.hypot(dx, dz),
    speed = keys.has("shift") ? 8 : 5.3;
  dx = (dx / len) * speed * dt;
  dz = (dz / len) * speed * dt;
  // Separate axes allow sliding along walls instead of snagging on corners.
  const next = player.position.clone();
  if(crossSecretWall(next.clone().add(new THREE.Vector3(dx,0,dz)))) return;
  if(crossVampireWall(next.clone().add(new THREE.Vector3(dx,0,dz)))) return;
  if(crossRuinWall(next.clone().add(new THREE.Vector3(dx,0,dz)))) return;
  next.x += dx;
  if (!blocked(next)) player.position.x = next.x;
  next.copy(player.position);
  next.z += dz;
  if (!blocked(next)) player.position.z = next.z;
  player.rotation.y = THREE.MathUtils.damp(
    player.rotation.y,
    Math.atan2(dx, dz),
    12,
    dt,
  );
  animateWalk(player, time, 0.48);
  if (game.tutorial === "move") {
    moveTime += dt;
    if (moveTime > 1.2) {
      game.tutorial = "interact";
      tutorial(
        "The knight’s oath",
        "Find Sir Calder near the old altar and press E. J opens your quest journal.",
      );
      save();
    }
  }
}
function updatePrompt() {
  if (state !== "world") {
    $("#prompt").hidden = true;
    return;
  }
  const target = nearestInteraction();
  $("#prompt").hidden = !target;
  if (target) $("#prompt").textContent = `Press E · ${target[0]}`;
}
function interact() {
  if (state !== "world") return;
  nearestInteraction()?.[2]();
}
function updateBands(dt, time) {
  encounterGrace = Math.max(0, encounterGrace - dt);
  for (const band of bands) {
    if (band.userData.zone !== currentZone) continue;
    if (!band.visible) {
      band.userData.respawn = (band.userData.respawn ?? respawnDelay(band.userData.type)) - dt;
      if (
        band.userData.respawn <= 0 &&
        band.userData.home.distanceTo(player.position) > 8
      ) {
        band.visible = band.userData.alive = true;
        band.position.copy(band.userData.home);
        band.userData.respawn = respawnDelay(band.userData.type);
        game.defeatedBands = game.defeatedBands.filter(
          (id) => id !== band.userData.id,
        );
      }
      continue;
    }
    if (band === activeBand) continue;
    const home = band.userData.home,
      old = band.position.clone(),
      near = old.distanceTo(player.position) < 5.5;
    let next =
      near && encounterGrace <= 0
        ? old
            .clone()
            .lerp(
              player.position,
              Math.min(1, dt * (band.userData.type === "rock" ? 0.3 : 0.65)),
            )
        : new THREE.Vector3(
            home.x + Math.cos(time * 0.42 + band.userData.phase) * 1.8,
            0,
            home.z + Math.sin(time * 0.55 + band.userData.phase) * 1.25,
          );
    const occupied = zoneColliders[currentZone].some(
      ({ object, radius }) =>
        object.visible && next.distanceTo(object.position) < radius + 1,
    );
    if (
      !occupied &&
      (currentZone !== "cave" || caveBandAllowed(next, band.userData.type, caveDistancePoints)) &&
      (currentZone !== "meadow" || Math.hypot(next.x, next.z) < 28.5)
    )
      band.position.copy(next);
    band.rotation.y = Math.atan2(
      band.position.x - old.x,
      band.position.z - old.z,
    );
    band.children.forEach((m, i) => animateWalk(m, time + i * 0.35));
    if (
      encounterGrace <= 0 &&
      band.position.distanceTo(player.position) < 1.5 &&
      state === "world"
    ) {
      activeBand = band;
      setupBattle({
        type: band.userData.type,
        id: band.userData.id,
        orc: band.userData.orc,
      });
      break;
    }
  }
}

let encounter = null,
  battleState = "prepare",
  placed = false,
  prep = 20,
  battleSpeed = 1,
  battleElapsed = 0,
  waveClock = 0,
  spawned = 0,
  enemies = [],
  effects = [],
  pathCurve = null,
  pathPoints = [],
  lastAttack = -10,
  attackTime = 0,
  pendingAttack = null,
  bossStage = "",
  bossEnemy = null,
  bossTaunts = new Set(),
  battleDialogueTimer = 0;
const pathVariants = [
  [
    [-20, 15],
    [-10, 9],
    [-13, 0],
    [-3, -5],
    [8, -2],
    [18, -14],
  ],
  [
    [-20, -13],
    [-10, -7],
    [-4, 5],
    [5, 8],
    [11, 1],
    [19, 13],
  ],
  [
    [-19, 8],
    [-8, 12],
    [-2, 1],
    [8, -8],
    [18, -5],
  ],
];
function resetBramPose() {
  resetUnit(player);
  attackTime = 0;
  pendingAttack = null;
}
function clearBattle() {
  for (const e of enemies) disposeEffect(e.model);
  enemies = [];
  bossEnemy = null;
  if (focuses.battleBoss) {
    disposeEffect(focuses.battleBoss);
    delete focuses.battleBoss;
  }
  for (const effect of effects) disposeEffect(effect.mesh);
  effects = [];
  [...battle.children]
    .filter((c) => c.userData.temporary)
    .forEach(disposeEffect);
  $("#bossBar").hidden = true;
  $("#battleDialogue").hidden = true;
  resetBramPose();
  rangeDisc = null;
  guideMarker = null;
}
function buildBattlePath() {
  const points = pathVariants[Math.floor(rng() * pathVariants.length)].map(
    ([x, z]) => new THREE.Vector3(x, 0.06, z),
  );
  pathCurve = new THREE.CatmullRomCurve3(points);
  pathPoints = pathCurve.getPoints(135);
  const positions = [],
    indices = [];
  pathPoints.forEach((p, i) => {
    const tangent = pathCurve.getTangent(i / (pathPoints.length - 1)),
      normal = new THREE.Vector3(-tangent.z, 0, tangent.x);
    for (const side of [-1, 1])
      positions.push(
        p.x + normal.x * side * 0.72,
        0.035,
        p.z + normal.z * side * 0.72,
      );
    if (i < pathPoints.length - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  });
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  ribbon.setIndex(indices);
  ribbon.computeVertexNormals();
  const soil = new THREE.Mesh(
    ribbon,
    new THREE.MeshStandardMaterial({
      color: usesTunnelArena(battleReturn.zone) ? "#718581" : "#75745e",
      roughness: 1,
      side: THREE.DoubleSide,
    }),
  );
  soil.receiveShadow = true;
  soil.userData.temporary = true;
  battle.add(soil);
  const pebbles = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(1, 0),
      mat(usesTunnelArena(battleReturn.zone) ? "#a5b9b8" : "#a2967e", 0.98),
      pathPoints.length * 3,
    ),
    dummy = new THREE.Object3D();
  pathPoints.forEach((p, i) => {
    const t = pathCurve.getTangent(i / (pathPoints.length - 1));
    for (let j = 0; j < 3; j++) {
      const offset = (j - 1) * 0.53 + (rng() - 0.5) * 0.18;
      dummy.position.set(p.x - t.z * offset, 0.065, p.z + t.x * offset);
      const size = 0.08 + rng() * 0.1;
      dummy.scale.set(size, 0.035 + rng() * 0.025, size * 0.8);
      dummy.rotation.y = rng() * 6.28;
      dummy.updateMatrix();
      pebbles.setMatrixAt(i * 3 + j, dummy.matrix);
    }
  });
  pebbles.receiveShadow = true;
  pebbles.userData.temporary = true;
  battle.add(pebbles);
}
function setupBattle(data) {
  if (currentZone !== "battle")
    battleReturn = {
      zone: currentZone,
      position: { x: player.position.x, z: player.position.z },
    };
  clearBattle();
  resumingWave = false;
  battleEnvironment.setTunnel(usesTunnelArena(battleReturn.zone));
  battleEnvironment.syncLanterns(game.extinguishedLanterns);
  encounter = { ...data };
  battleState = "prepare";
  battleElapsed = 0;
  prep = 30;
  placed = false;
  spawned = 0;
  waveClock = 0;
  lastAttack = -10;
  abilityCooldown = 0;
  battleSpeed = 1;
  battleStart = {
    exp: game.exp,
    gold: game.gold,
    materials: { ...game.materials },
  };
  bossStage = data.type === "boss" ? "undead" : "";
  bossTaunts = new Set();
  bossEnemy = null;
  for (const g of Object.values(zones)) g.visible = false;
  battle.visible = true;
  currentZone = "battle";
  battle.add(player);
  player.position.set(0, 0, 16);
  player.visible = false;
  buildBattlePath();
  buildBattleMarkers();
  state = "battle";
  document.body.dataset.mode = "battle";
  $("#prompt").hidden = true;
  $("#battleHud").hidden = false;
  $("#startWave").hidden = false;
  $("#startWave").disabled = true;
  $("#battleLabel").textContent = "PREPARATION";
  $("#battleTimer").textContent = "30";
  $("#battleSpeed").textContent = "Speed 1×";
  $("#battleObjective").textContent =
    data.type === 'skeleton' ? 'Hidden boss · 3,000 HP → 5,000 HP · two phases' : data.type === "boss"
      ? "100 undead → knight → necromancer"
      : data.type === "sentinel"
        ? "Secret boss · the Oathbound Sentinel · 21,000 HP"
        : data.type === "bat"
          ? "8 bats · 200 HP · fast"
          : data.type === "rock"
            ? "1 rock monster · 10,000 HP · slow"
            : data.orc
              ? "6 goblins + 1 orc · orc has 600 HP"
              : "6 goblins · 100 HP each";
  $("#rally").disabled = true;
  $("#waveRoster").innerHTML = waveRoster(data).map(row => `<article><strong>${row.name} <span>×${row.count}</span></strong><p>${row.drops}</p></article>`).join("");
  if (showFightTutorial(game)) tutorial(
    "Hold the road",
    "Click away from the pebbles to place Bram. The blue circle is his reach. Space starts early. Q unleashes Earthshatter during combat.",
  );
  else $("#tutorial").hidden = true;
  camera.position.set(18, 27, 25);
  camera.lookAt(0, 0, 0);
  updateHUD();
  save();
}
function distanceToPath(p) {
  let best = Infinity;
  for (const q of pathPoints)
    best = Math.min(best, Math.hypot(p.x - q.x, p.z - q.z));
  return best;
}
const raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2();
canvas.addEventListener("pointerdown", (event) => {
  if (state !== "battle" || battleState === 'result') return;
  const rect = canvas.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(pointer, camera);
  const lanternId=battleEnvironment.hitLantern(raycaster);
  if(lanternId!==null) {
    if(game.extinguishedLanterns.includes(lanternId)) toast('This lantern is already extinguished.');
    else if(extinguishLantern(game,lanternId)) {
      battleEnvironment.syncLanterns(game.extinguishedLanterns);save();
      toast(vampirePassageOpen(game)?'All four lights are out. Walk into the mountain directly north of the meadow to find the vampire’s refuge.':`Lantern extinguished · ${game.extinguishedLanterns.length}/4`,6000);
    } else toast('You need a Vampire Shard in your inventory to extinguish this lantern.');
    return;
  }
  if(battleState !== 'prepare') return;
  const hit = raycaster.intersectObject(battle.children[0])[0];
  if (!hit) return;
  const p = hit.point;
  if (Math.abs(p.x) > 20 || Math.abs(p.z) > 20 || distanceToPath(p) < 1.8) {
    toast("Place Bram on open ground away from the path.");
    return;
  }
  player.position.set(p.x, 0, p.z);
  player.visible = true;
  placed = true;
  $("#startWave").disabled = false;
  $("#tutorial").hidden = true;
  $("#battleObjective").textContent =
    "Bram is ready. Start the wave now or keep preparing.";
});
function beginWave() {
  if (state !== "battle" || battleState !== "prepare") return;
  if (!placed) {
    toast("Place Bram first.");
    return;
  }
  battleState = "combat";
  $("#startWave").hidden = true;
  $("#tutorial").hidden = true;
  if (resumingWave) {
    resumingWave = false;
    $("#battleLabel").textContent = "WAVE ACTIVE";
    $("#battleObjective").textContent = "Defend the gate · Q Earthshatter";
    return;
  }
  $("#battleLabel").textContent =
    ['boss','sentinel','skeleton'].includes(encounter.type)
      ? "BOSS WAVE"
      : "WAVE ACTIVE";
  $("#battleTimer").textContent = "!";
  $("#battleObjective").textContent =
    "Defend the gate · Q Earthshatter · X reposition once";
  repositionAvailable = true;
  if (encounter.type === "boss") {
    showBattleDialogue(
      "SIR CALDER",
      "Minions! Rise! Let the oath collect its due!",
      6,
    );
    for (let i = 0; i < 100; i++) {
      const e = createEnemy("undead", 1, 2.2);
      e.t = -i * 0.006;
    }
  }
  if (encounter.type === "sentinel") {
    spawned = 1;
    bossEnemy = createEnemy("sentinel", SENTINEL_HEALTH, 0.42);
    bossEnemy.model.scale.setScalar(1.5);
    showBoss(bossEnemy, "THE OATHBOUND SENTINEL");
    showBattleDialogue(
      "THE SENTINEL",
      "Name the oath… or be buried beneath it.",
      6,
    );
  }
  if (encounter.type === 'skeleton') {
    spawned=1;bossStage='marrow';
    bossEnemy=createEnemy('skeleton',3000,.65);
    showBoss(bossEnemy,'THE MARROW KING · PHASE I');
    showBattleDialogue('THE MARROW KING','You walked through my tomb. Now earn the blood-star I guard.',7);
  }
}
$("#startWave").onclick = beginWave;
$("#battleSpeed").onclick = () => {
  battleSpeed = battleSpeed === 1 ? 2 : battleSpeed === 2 ? 3 : 1;
  $("#battleSpeed").textContent = `Speed ${battleSpeed}×`;
  toast(`Battle speed ${battleSpeed}×`);
};
function encounterPlan() {
  if(encounter.type === 'skeleton') return {count:1,kind:'skeleton',hp:3000,speed:.65};
  if (encounter.type === "sentinel")
    return { count: 1, kind: "sentinel", hp: SENTINEL_HEALTH, speed: 0.42 };
  if (encounter.type === "bat")
    return { count: 8, kind: "bat", hp: 200, speed: 4 };
  if (encounter.type === "rock")
    return { count: 1, kind: "rock", hp: ROCK_HEALTH, speed: 0.5 };
  return {
    count: 6 + (encounter.orc ? 1 : 0),
    kind: "goblin",
    hp: 100,
    speed: 2.2,
  };
}
function createEnemy(type, hp, speed) {
  let model =
    ['skeleton','marrow-unbound'].includes(type)
      ? createSkeletonBoss(type === 'marrow-unbound')
      : type === "undead"
      ? createUndead()
      : type === "goblin"
        ? createGoblin()
        : type === "orc"
          ? createOrc()
          : type === "bat"
            ? createBat()
            : type === "sentinel"
              ? createOathboundSentinel()
            : type === "rock"
              ? createRockMonster()
              : type === "knight"
                ? createKnight()
                : createNecromancer();
  if (type === "undead") tintUnit(model, "#a2c7b8");
  if (type === "goblin" || type === "undead") model.scale.setScalar(0.78);
  if (type === "orc") model.scale.multiplyScalar(0.82);
  const health = new THREE.Sprite(
    new THREE.SpriteMaterial({ color: "#86d6b0", depthTest: false }),
  );
  health.scale.set(1.1, 0.07, 1);
  health.position.y = 2.1;
  model.add(health);
  model.visible = false;
  battle.add(model);
  const e = {
    model,
    type,
    hp,
    maxHp: hp,
    speed,
    t: 0,
    health,
    stun: 0,
    hitFlash: 0,
  };
  enemies.push(e);
  return e;
}
function spawnWaveEnemy() {
  const plan = encounterPlan();
  if (spawned >= plan.count) return;
  let kind = plan.kind,
    hp = plan.hp,
    speed = plan.speed;
  if (encounter.type === "goblin" && encounter.orc && spawned === 0) {
    kind = "orc";
    hp = 600;
    speed = 0.7;
  }
  const e = createEnemy(kind, hp, speed);
  e.t = -0.01;
  spawned++;
}
function showBattleDialogue(speaker, text, duration = 5) {
  $("#battleSpeaker").textContent = speaker;
  $("#battleWords").textContent = text;
  $("#battleDialogue").hidden = false;
  battleDialogueTimer = duration;
}
function crackEffect(position, big = false) {
  const group = new THREE.Group(),
    crackMat = new THREE.MeshBasicMaterial({
      color: "#171b1a",
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
  for (let ray = 0; ray < (big ? 10 : 7); ray++) {
    let a = (ray / (big ? 10 : 7)) * 6.28,
      x = 0,
      z = 0;
    for (let s = 0; s < 3; s++) {
      a += (rng() - 0.5) * 0.35;
      const l = 0.35 + rng() * (big ? 0.7 : 0.45),
        seg = new THREE.Mesh(new THREE.BoxGeometry(l, 0.022, 0.045), crackMat);
      seg.position.set(
        x + Math.cos(a) * l * 0.5,
        0.05,
        z + Math.sin(a) * l * 0.5,
      );
      seg.rotation.y = -a;
      group.add(seg);
      x += Math.cos(a) * l;
      z += Math.sin(a) * l;
    }
  }
  group.position.set(position.x, 0, position.z);
  group.userData.temporary = true;
  battle.add(group);
  effects.push({ mesh: group, age: 0 });
}
function attackStats() {
  return weaponStats(game);
}
function startAttack(time) {
  const stats = attackStats();
  if (attackTime > 0 || time - lastAttack < stats.cooldown) return;
  const targets = enemies.filter(
    (e) =>
      e.t >= 0 &&
      e.model.visible &&
      e.model.position.distanceTo(player.position) < stats.range,
  );
  if (!targets.length) return;
  const mode = $("#targeting").value,
    target =
      mode === "strong"
        ? targets.reduce((a, b) => (a.hp > b.hp ? a : b))
        : mode === "last"
          ? targets.reduce((a, b) => (a.t < b.t ? a : b))
          : targets.reduce((a, b) => (a.t > b.t ? a : b));
  lastAttack = time;
  pendingAttack = {
    target,
    position: target.model.position.clone(),
    stats,
    applied: false,
  };
  player.rotation.y = Math.atan2(
    target.model.position.x - player.position.x,
    target.model.position.z - player.position.z,
  );
  attackTime = 0.001;
}
function updateAttack(dt) {
  if (attackTime <= 0 || !pendingAttack) return;
  attackTime += dt;
  const p = Math.min(1, attackTime / pendingAttack.stats.animation),
    axe = game.equipped === "Woodcutter Axe";
  attackPose(player, p, axe);
  if (p >= 0.58 && !pendingAttack.applied) {
    pendingAttack.applied = true;
    const impact = enemies.includes(pendingAttack.target)
      ? pendingAttack.target.model.position.clone()
      : pendingAttack.position;
    for (const enemy of enemies)
      if (
        enemy.t >= 0 &&
        enemy.model.visible &&
        enemy.model.position.distanceTo(impact) < pendingAttack.stats.aoe
      ) {
        enemy.hp -= pendingAttack.stats.damage;
        enemy.hitFlash = 0.12;
      }
    if (axe) slashEffect(impact);
    else crackEffect(impact, pendingAttack.stats.aoe > 4);
    impactDust(impact, axe ? "#dce9cf" : "#d2ad74", axe ? 8 : 20);
    playSound(axe ? "slash" : "hit");
  }
  if (p >= 1) resetBramPose();
}
function killEnemy(enemy) {
  const preserveKnight = enemy === bossEnemy && bossStage === "knight";
  if (preserveKnight) {
    focuses.battleBoss = enemy.model;
    enemy.model.rotation.z = -0.32;
  } else disposeEffect(enemy.model);
  enemies.splice(enemies.indexOf(enemy), 1);
  const reward = enemyLoot(game, enemy.type);
  if(reward.summonConsumed) toast('Summoning Sigil consumed · Vampire Shard guaranteed');
  game.exp += reward.exp;
  for (const [item, n] of Object.entries(reward.items)) {
    game.materials[item] = (game.materials[item] || 0) + n;
    toast(`${item} +${n}`);
  }
  if (enemy.type === "goblin") game.goblins++;
  if (enemy.type === "bat") game.stats.bats++;
  if (enemy.type === "rock") game.stats.rocks++;
  if (enemy.type === "orc") game.stats.orcs++;
  if (enemy === bossEnemy) bossEnemy = null;
  if (game.quest === "kill_goblins" && game.goblins >= 10)
    game.quest = "return_calder";
  updateHUD();
  save();
}
function leak() {
  if (battleState === "result") return;
  const loss = Math.ceil(game.gold * 0.05);
  game.gold = Math.max(0, game.gold - loss);
  battleState = "result";
  resetBramPose();
  save();
  showResult(
    false,
    "Gate broken",
    `An enemy slipped through. Lost ${loss} gold. Your collected EXP and items are safe. Try a bend in the road, a different weapon, or use Q to stun the pack.`,
  );
}
function finishEncounter() {
  if (battleState === "result") return;
  const secret = encounter.type === "sentinel";
  if (activeBand) {
    activeBand.visible = activeBand.userData.alive = false;
    activeBand.userData.respawn = respawnDelay(activeBand.userData.type);
  }
  if (!game.defeatedBands.includes(encounter.id))
    game.defeatedBands.push(encounter.id);
  const reward = secret
    ? 750
    : encounter.type === "bat"
      ? 40
      : encounter.type === "rock"
        ? 180
        : 50;
  if (encounter.type === 'skeleton') awardSkeleton(game);
  else if (secret) awardSentinel(game);
  else game.gold += reward;
  game.wins++;
  game.tutorial = "done";
  $("#tutorial").hidden = true;
  if (
    game.quest === "explore_cave" &&
    game.stats.bats > 0 &&
    game.stats.rocks > 0
  )
    game.quest = "complete";
  battleState = "result";
  save();
  showResult(
    true,
    encounter.type === 'skeleton' ? 'The Marrow King falls' : secret ? "The oath remembered" : "Road defended",
    encounter.type === 'skeleton'
      ? 'Summoning Sigil acquired. Carry it to guarantee a Vampire Shard from your next bat kill. The sigil is consumed once the shard drops.'
      : secret
      ? "The Sentinel kneels. The breach is sealed, and Bram’s father can finally rest. Permanent blessing: +1 AOE altar level."
      : `+${reward} gold · +${Math.max(0, game.exp - battleStart.exp)} EXP. Every three victories earn a supply contract from Oren.`,
  );
}
function showBoss(enemy, name) {
  bossEnemy = enemy;
  $("#bossBar").hidden = false;
  $("#bossName").textContent = name;
  $("#bossFill").style.width =
    `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`;
  $("#bossHp").textContent = `${Math.ceil(enemy.hp)} / ${enemy.maxHp}`;
}
function updateBoss(dt) {
  if (bossEnemy)
    showBoss(
      bossEnemy,
      bossEnemy.type === "necro"
        ? "CALDER, THE NECROMANCER"
        : "THE FALLEN KNIGHT",
    );
  if (
    bossStage === "undead" &&
    enemies.length < 55 &&
    !bossTaunts.has("half")
  ) {
    bossTaunts.add("half");
    showBattleDialogue(
      "SIR CALDER",
      "The dead remember every strike you gave them!",
      5,
    );
  }
  if (bossStage === "undead" && !enemies.length) {
    bossStage = "knight";
    bossEnemy = createEnemy("knight", 200, 0.7);
    showBoss(bossEnemy, "THE FALLEN KNIGHT");
    showBattleDialogue("SIR CALDER", "Enough. I will break you myself.", 5);
  } else if (bossStage === "knight" && !bossEnemy && !enemies.length) {
    bossStage = "transition";
    playCutscene("transform", () => {
      if (focuses.battleBoss) {
        battle.remove(focuses.battleBoss);
        delete focuses.battleBoss;
      }
      state = "battle";
      battleState = "combat";
      bossStage = "necro";
      bossEnemy = createEnemy("necro", 400, 0.58);
      showBoss(bossEnemy, "CALDER, THE NECROMANCER");
    });
  } else if (bossStage === "necro" && bossEnemy) {
    bossEnemy.hp = Math.min(bossEnemy.maxHp, bossEnemy.hp + 5 * dt);
  } else if (bossStage === "necro" && !bossEnemy && !enemies.length) {
    game.bossDefeated = true;
    game.exp += 1500;
    game.gold += 1000;
    game.wins++;
    game.tutorial = "done";
    if (!game.keyItems.includes("Teleporter Key"))
      game.keyItems.push("Teleporter Key");
    game.quest = "use_portal";
    knight.visible = oldAltar.visible = false;
    meadowPortal.userData.active = true;
    meadowPortal.userData.light.intensity = 4;
    clearBattle();
    $("#battleHud").hidden = true;
    switchZone("meadow", { x: 0, z: 4 }, false);
    playCutscene("victory", () => {
      state = "world";
      updateHUD();
      save();
    });
  }
}
function updateBattle(dt, time) {
  if (battleState === "result") return;
  updateRange();
  if (battleState === "prepare") {
    if (placed) {
      prep -= dt;
      $("#battleTimer").textContent = Math.max(0, Math.ceil(prep));
      if (prep <= 0) beginWave();
    }
    return;
  }
  abilityCooldown = Math.max(0, abilityCooldown - dt);
  $("#rally").disabled = abilityCooldown > 0 || !placed;
  $("#rally").textContent =
    abilityCooldown > 0
      ? `Q · ${Math.ceil(abilityCooldown)}s`
      : "Q · Earthshatter";
  if (battleDialogueTimer > 0) {
    battleDialogueTimer -= dt;
    if (battleDialogueTimer <= 0) $("#battleDialogue").hidden = true;
  }
  if (!["boss", "sentinel", "skeleton"].includes(encounter.type)) {
    const plan = encounterPlan();
    waveClock -= dt;
    if (waveClock <= 0 && spawned < plan.count) {
      waveClock = 0.65;
      spawnWaveEnemy();
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.hp <= 0) {
      killEnemy(e);
      continue;
    }
    e.stun = Math.max(0, e.stun - dt);
    if (e.stun <= 0) e.t += 0.012 * e.speed * dt;
    if (e.t >= 1) {
      leak();
      return;
    }
    if (e.t < 0) {
      e.model.visible = false;
      continue;
    }
    e.model.visible = true;
    const p = pathCurve.getPointAt(Math.min(0.999, e.t)),
      look = pathCurve.getPointAt(Math.min(0.999, e.t + 0.01));
    e.model.position.copy(p);
    e.model.rotation.y = Math.atan2(look.x - p.x, look.z - p.z);
    animateWalk(e.model, time + i * 0.3);
    e.health.scale.x = 1.1 * Math.max(0, e.hp / e.maxHp);
    e.health.visible = e.hp < e.maxHp || e.type === "orc";
    e.hitFlash = Math.max(0, e.hitFlash - dt);
    e.model.userData.rig.visual.scale.setScalar(e.hitFlash > 0 ? 1.08 : 1);
  }
  if (placed) {
    startAttack(time);
    updateAttack(dt);
  }
  updateEffects(dt);
  if(encounter.type === 'skeleton') {
    if(!enemies.length && bossStage === 'marrow') {
      bossStage='unbound';
      bossEnemy=createEnemy('marrow-unbound',5000,.85);
      showBattleDialogue('THE MARROW KING','Bone breaks. The hunger beneath it does not. RISE AGAIN!',7);
    } else if(!enemies.length && bossStage === 'unbound') finishEncounter();
    if(bossEnemy) showBoss(bossEnemy,bossStage==='marrow'?'THE MARROW KING · PHASE I':'THE MARROW KING, UNBOUND · PHASE II');
  }
  if (encounter.type === "boss") updateBoss(dt);
  else if (encounter.type === "sentinel" && bossEnemy)
    showBoss(bossEnemy, "THE OATHBOUND SENTINEL");
  if (
    !['boss','skeleton'].includes(encounter.type) &&
    spawned >= encounterPlan().count &&
    !enemies.length
  )
    finishEncounter();
}

function openMenu(id) {
  if (state !== "menu") menuReturnState = state;
  state = "menu";
  $(id).hidden = false;
}
function closeMenu(id) {
  $(id).hidden = true;
  state = menuReturnState === "cutscene" ? "world" : menuReturnState;
}

document
  .querySelectorAll("[data-close]")
  .forEach(
    (button) => (button.onclick = () => closeMenu("#" + button.dataset.close)),
  );

let inventoryTab = "weapons";
function openInventory() {
  if (!["world", "battle"].includes(state)) return;
  keys.clear();
  openMenu("#inventoryMenu");
  renderInventory();
}
function renderInventory() {
  const combat = menuReturnState === "battle" && battleState !== "prepare";
  $("#inventoryHint").textContent = combat
    ? "Battle paused. You can inspect items; equip weapons during preparation or outside battle."
    : "Select a weapon to equip it. Your equipment and items are saved automatically.";
  document.querySelectorAll("[data-inventory-tab]").forEach(b => b.classList.toggle("active", b.dataset.inventoryTab === inventoryTab));
  const items = inventoryTab === "weapons" ? game.weapons.map(name=>[name,1])
    : inventoryTab === "materials" ? Object.entries(game.materials).filter(([,n])=>n>0)
    : game.keyItems.map(name=>[name,1]);
  const grid=$("#inventoryGrid"); grid.replaceChildren();
  if (!items.length) { const p=document.createElement("p");p.textContent="Nothing collected yet.";grid.append(p); }
  for(const [name,count] of items) {
    const cell=document.createElement("button");cell.className="inventory-item";
    cell.title=name;cell.setAttribute("aria-label",name);
    const img=document.createElement("img");img.src=itemArt(name);img.alt=name;
    img.width=img.height=name==="Vampire Shard"?128:120;
    const label=document.createElement("strong");label.textContent=name;
    const quantity=document.createElement("span");
    quantity.textContent=inventoryTab==="weapons" ? (game.equipped===name?"Equipped":combat?"Equip during preparation":"Equip") : "×"+count;
    if(name===SHARD_SUMMON) quantity.textContent='Next bat: 100% Vampire Shard · consumed on drop';
    cell.append(img,label,quantity);grid.append(cell);
    cell.classList.toggle("equipped",inventoryTab==="weapons"&&game.equipped===name);
    cell.onclick=()=>{
      if(inventoryTab!=="weapons" || combat || !game.weapons.includes(name)) return;
      game.equipped=name;resetBramPose();updateHUD();updateRange();save();renderInventory();
    };
  }
}
$("#inventoryButton").onclick=openInventory;
$("#battleInventory").onclick=openInventory;
document.querySelectorAll("[data-inventory-tab]").forEach(b=>b.onclick=()=>{
  inventoryTab=b.dataset.inventoryTab;renderInventory();
});

function service(title, type, tabs, content) {
  $("#serviceTitle").textContent = title;
  $("#serviceType").textContent = type;
  $("#serviceStatus").textContent = `Purse: ${game.gold.toLocaleString()} gold`;
  $("#serviceTabs").innerHTML = tabs
    .map(
      (t, i) =>
        `<button class="tab ${i ? "" : "active"}" data-service-tab="${t.id}">${t.name}</button>`,
    )
    .join("");
  const render = (id) => {
    serviceTab = id;
    document
      .querySelectorAll("[data-service-tab]")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.serviceTab === id),
      );
    $("#serviceContent").innerHTML = content[id]();
    bindServiceButtons();
  };
  document
    .querySelectorAll("[data-service-tab]")
    .forEach((b) => (b.onclick = () => render(b.dataset.serviceTab)));
  render(content[serviceTab] ? serviceTab : tabs[0].id);
  openMenu("#serviceMenu");
}
function card(name, text, button, id, disabled = false) {
  const icons = {buyWood:'Wood',buyBone:'Goblin Bone',buyTusk:'Orc Tusk',buyRune:'Strange Rune',buyKey:'Key to the Man Cave',craftAxe:'Woodcutter Axe',craftClub:'Orc War Club',contractVampire:'Bat Wing'};
  const available=affordability(game,id);
  disabled ||= available.owned || available.short;
  const message=available.short ? `You do not have enough to ${available.verb} this item` : '';
  return `<article class="service-card ${disabled ? "locked" : ""}"><div class="merch-icon" aria-hidden="true"><img src="${itemArt(icons[id] || 'Hammer')}" alt="" /></div><h3>${name}</h3><p>${text}</p>${message ? `<p class="purchase-warning" role="status">${message}</p>` : ''}<button data-action="${id}" ${disabled ? "disabled" : ""} title="${message}">${button}</button></article>`;
}
function bindServiceButtons() {
  document
    .querySelectorAll("[data-action]")
    .forEach((b) => (b.onclick = () => serviceAction(b.dataset.action)));
}
function openShop() {
  game.visited.shop = true;
  if (game.quest === "visit_services" && game.visited.smith)
    game.quest = "awaken_altar";
  updateHUD();
  save();
  service(
    "Oren’s Wayfarer Shop",
    "“Trade keeps the lights on. Stories keep us here.”",
    [
      { id: "materials", name: "Materials" },
      { id: "tools", name: "Tools" },
      { id: "contracts", name: "Contracts" },
    ],
    {
      materials: () =>
        card(
          "Wood",
          `Sturdy crafting log. Carrying ${game.materials.Wood}.`,
          "Buy · 10 Gold",
          "buyWood",
        ) +
        card(
          "Goblin Bone",
          `Monster material. Carrying ${game.materials["Goblin Bone"]}.`,
          "Buy · 40 Gold",
          "buyBone",
        ) +
        card(
          "Orc Tusk",
          `Orc material. Carrying ${game.materials["Orc Tusk"]}.`,
          "Buy · 500 Gold",
          "buyTusk",
        ),
      tools: () =>
        card(
          "Strange Rune",
          "A strange item that locals say has the power to awaken the strange altar.",
          game.keyItems.includes("Strange Rune") ? "Owned" : "Buy · 1 Gold",
          "buyRune",
          game.keyItems.includes("Strange Rune"),
        ) +
        card(
          "Key to the Man Cave",
          "Unlocks the third house, its cellar, and the Hollow below.",
          game.keyItems.includes("Key to the Man Cave")
            ? "Owned"
            : "Buy · 1,000 Gold",
          "buyKey",
          game.keyItems.includes("Key to the Man Cave"),
        ),
      contracts: () =>
        card(
          "Keep the roads safe",
          `${Math.min(3, Math.max(0, game.wins - game.contracts * 3))} / 3 victories. Reward: 180 gold, 5 Goblin Bones and 2 Orc Tusks. Repeatable; old wins are never wasted.`,
          "Collect supplies",
          "contract",
          game.wins < (game.contracts + 1) * 3,
        ) +
        (game.vampireRiddleSolved ? card(
          'Supplies of the old blood',
          'Alternative reward: 180 gold, 3 Bat Wings and 8 Wood only. Costs the same three victories; choose one reward per contract.',
          'Collect night supplies','contractVampire',game.wins < (game.contracts+1)*3,
        ) : '') +
        card(
          "Oren’s secret",
          "Five memories lie scattered from the meadow to the Hollow. Find three to awaken the sealed Sentinel. The journal keeps their clues.",
          "Written in journal",
          "none",
          true,
        ),
    },
  );
}
function talkService(person) {
  const service = person === "mira" ? openBlacksmith : openShop;
  if (game.seenStories.includes(person)) {
    service();
    return;
  }
  game.seenStories.push(person);
  save();
  if (person === "mira")
    story(
      "MIRA",
      "Your father left me his tools, Bram. Said he only needed his hammer for one last watch. I should have made him stay. If you’re going below, let me make sure your weapon comes home in one piece.",
      "mira",
      service,
    );
  else
    story(
      "OREN",
      "I kept a lantern lit for him. Still do. The key to his house is here, and there’s a strange rune the altar might recognize. Keep the roads safe and I’ll find you supplies—three victories at a time.",
      "oren",
      service,
    );
}
function openBlacksmith() {
  game.visited.smith = true;
  if (game.quest === "visit_services" && game.visited.shop)
    game.quest = "awaken_altar";
  updateHUD();
  save();
  service(
    "Mira’s Ember Anvil",
    "“A good weapon gives you choices. A good oath gives you a reason.”",
    [
      { id: "upgrade", name: "Upgrade & Equip" },
      { id: "craft", name: "Craft Weapon" },
    ],
    {
      upgrade: () =>
        card(
          "Temper weapons",
          `Forge rank ${game.forgeLevel}/10. +8 damage to every weapon per rank. You carry ${game.materials.Wood} wood.`,
          `${80 + game.forgeLevel * 60} Gold · ${2 + game.forgeLevel} Wood`,
          "forge",
          game.forgeLevel >= 10,
        ) +
        game.weapons
          .map((w) =>
            card(
              w,
              w === "Woodcutter Axe"
                ? "Quick slashes and tree harvesting."
                : w === "Orc War Club"
                  ? "Slow, devastating strikes. 200 base damage and 6 AOE."
                  : "Balanced reach and wide ground-smashing strikes.",
              w === game.equipped ? "Equipped" : "Select in inventory · I",
              "viewInventory",
              w === game.equipped,
            ),
          )
          .join(""),
      craft: () =>
        card(
          "Woodcutter Axe",
          "Fast slashes. Approach marked meadow trees and press E to harvest one wood. Trees regrow after 45 seconds.",
          game.weapons.includes("Woodcutter Axe") ? "Owned" : "5 Goblin Bones",
          "craftAxe",
          game.weapons.includes("Woodcutter Axe"),
        ) +
        card(
          "Orc War Club",
          "200 base damage · 3 range · 6 AOE. Earn tusks reliably from Oren’s three-victory contracts.",
          game.weapons.includes("Orc War Club")
            ? "Owned"
            : "25 Bones · 10 Tusks",
          "craftClub",
          game.weapons.includes("Orc War Club"),
        ),
    },
  );
}

function serviceAction(id) {
  if(id === "viewInventory") { closeMenu("#serviceMenu");openInventory();return; }
  let ok = false;
  if (id.startsWith("buy")) ok = buy(game, id);
  else if (id.startsWith("craft")) ok = craft(game, id);
  else if (id === "forge") ok = temperWeapon(game);
  else if (id === "contract") ok = claimContract(game);
  else if (id === 'contractVampire') ok = claimContract(game,'vampire');
  else if (id.startsWith("equip-")) {
    const weapon = id.slice(6);
    if (game.weapons.includes(weapon)) {
      game.equipped = weapon;
      ok = true;
    }
  }
  if (!ok) {
    toast(id.startsWith("buy") ? "You do not have enough to buy this item" : id.startsWith("craft") || id === "forge" ? "You do not have enough to craft this item" : "Check your gold, materials, or contract progress.");
    return;
  }
  playSound("reward");
  toast(
    id.startsWith("equip-")
      ? "Weapon equipped."
      : id==='contractVampire' ? 'Night supplies · +180 Gold · +3 Bat Wings · +8 Wood' : "Saved · purchase or upgrade complete.",
  );
  updateHUD();
  save();
  if (currentZone === "shopInterior") openShop();
  else openBlacksmith();
}
function upgradeCost() {
  return (
    100 * (game.upgrades.damage + game.upgrades.range + game.upgrades.aoe + 1)
  );
}
function openAltar() {
  const cost = upgradeCost(),
    choices = [
      ["damage", "Might", "damage"],
      ["range", "Reach", "range"],
      ["aoe", "Resonance", "AOE"],
    ];
  $("#altarIntro").textContent =
    `The altar remembers every road you defended. You have ${game.exp.toLocaleString()} EXP. Choose your own Stoneguard.`;
  $("#altarChoices").innerHTML = choices
    .map(([id, name, text]) =>
      card(name, `Level ${game.upgrades[id]} · Total +${Math.round((altarMultiplier(game.upgrades[id])-1)*100)}% ${text}. Next: +${nextAltarPercent(game.upgrades[id])}% of each weapon’s base ${text}. Bonus per level drops by 1 percentage point every 10 levels of this stat, to a minimum of 1%.`, `Offer ${cost} EXP`, `level-${id}`, game.exp < cost),
    )
    .join("");
  document.querySelectorAll('[data-action^="level-"]').forEach(
    (b) =>
      (b.onclick = () => {
        const c = upgradeCost(),
          kind = b.dataset.action.slice(6);
        if (game.exp < c) return;
        game.exp -= c;
        game.upgrades[kind]++;
        playSound("reward");
        updateHUD();
        save();
        openAltar();
      }),
  );
  openMenu("#altarMenu");
}

function newGame() {
  if (
    readSave() &&
    !window.confirm(
      "Start a new journey? Your current save will be replaced. Export it from the journal first if you want to keep it.",
    )
  )
    return;
  clearBattle();
  game = newState();
  lastSavedPayload = "";
  activeBand = null;
  for (const b of bands) {
    b.visible = b.userData.alive = true;
    b.userData.respawn = respawnDelay(b.userData.type);
  }
  knight.visible = oldAltar.visible = true;
  meadowPortal.userData.active = false;
  $("#titleScreen").hidden = true;
  document.body.dataset.mode = "world";
  syncDiscoveries();
  switchZone("meadow", { x: -4, z: 10 }, false);
  playCutscene("intro", () => {
    state = "world";
    tutorial(
      "A road worth walking",
      "WASD or arrows move. Shift runs. E interacts. J opens your journal and save backups.",
    );
    save();
  });
  updateHUD();
  save();
  $("#continueGame").disabled = false;
}
$("#newGame").onclick = newGame;
$("#continueGame").disabled = !readSave();
$("#continueGame").onclick = () => {
  const data = readSave();
  if (!data) return newGame();
  $("#titleScreen").hidden = true;
  load(data);
  toast("Journey restored.");
};
window.addEventListener("keydown", (e) => {
  if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
  const key = e.key.toLowerCase();
  keys.add(key);
  if (
    ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(key) &&
    e.target.tagName !== "SELECT"
  )
    e.preventDefault();
  if (e.repeat || e.target.tagName === "SELECT") return;
  if (key === "e") interact();
  if (key === "q") earthshatter();
  if (key === "x") reposition();
  if (key === "j" && state === "world") openJournal();
  if (key === "i") { if (!$("#inventoryMenu").hidden) closeMenu("#inventoryMenu"); else openInventory(); }
  if (key === " " && state === "battle") beginWave();
  if (key === "escape" && state === "menu") {
    for (const id of ["journal", "serviceMenu", "altarMenu", "inventoryMenu"])
      if (!$("#" + id).hidden) closeMenu("#" + id);
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
window.addEventListener("pagehide", save);
window.addEventListener("beforeunload", save);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") save();
});

/* Echoes of Starfall: exploration, battle agency, journal, and discovery. */
let encounterGrace = 3,
  abilityCooldown = 0,
  repositionAvailable = true,
  battleStart = { exp: 0, gold: 0, materials: {} },
  serviceTab = "";
let rangeDisc = null,
  guideMarker = null,
  previewPosition = null,
  previewValid = false;
const discoveries = [],
  harvestTrees = [],
  worldMotes = [];
let soundEnabled = true,
  audioContext = null;
try {
  soundEnabled = localStorage.getItem("bram-sound") !== "off";
} catch {}
const sentinelSeal = new THREE.Group();
function playSound(kind) {
  if (!soundEnabled) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    const o = audioContext.createOscillator(),
      g = audioContext.createGain(),
      now = audioContext.currentTime;
    o.type = kind === "reward" ? "sine" : "triangle";
    o.frequency.setValueAtTime(
      kind === "reward" ? 520 : kind === "slash" ? 240 : 95,
      now,
    );
    o.frequency.exponentialRampToValueAtTime(
      kind === "reward" ? 920 : 45,
      now + 0.16,
    );
    g.gain.setValueAtTime(0.055, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    o.connect(g);
    g.connect(audioContext.destination);
    o.start(now);
    o.stop(now + 0.25);
  } catch {}
}
function story(speaker, text, focus = "player", done = () => {}) {
  cutscenes.conversation = [[speaker, text, focus, "push"]];
  playCutscene("conversation", () => {
    state = "world";
    done();
    updateHUD();
    save();
  });
}
function initializeAdventure() {
  // Surround the town with terrain so it sits in the landscape, not in the sky.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(180, 180),
    mat("#455644", 1),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.04;
  town.add(ground);
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2,
      r = 39 + (i % 4) * 4;
    const tree = createTree(1 + (i % 3) * 0.3);
    add(town, tree, Math.cos(a) * r, Math.sin(a) * r);
  }
  // Village square, walkways, warm lanterns, market props.
  const pavingMatrices = [],
    paver = new THREE.Object3D();
  for (let z = -22; z < 24; z += 0.9)
    for (let x = -3; x <= 3; x += 1.05) {
      paver.position.set(x, 0.025, z);
      paver.rotation.y = (rng() - 0.5) * 0.025;
      paver.updateMatrix();
      pavingMatrices.push(paver.matrix.clone());
    }
  const paving = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.91, 0.04, 0.78),
    mat("#847c69", 0.95),
    pavingMatrices.length,
  );
  pavingMatrices.forEach((m, i) => {
    paving.setMatrixAt(i, m);
    paving.setColorAt(i, new THREE.Color(i % 3 ? "#c3c0ab" : "#eee0c0"));
  });
  paving.receiveShadow = true;
  town.add(paving);
  for (const x of [-10, 10])
    for (let z = -1; z < 8; z += 0.9) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 0.045, 0.75),
        roadMat,
      );
      p.position.set(x, 0.035, z);
      town.add(p);
    }
  for (const [x, z] of [
    [-6, 9],
    [6, 9],
    [-6, -11],
    [6, -11],
  ]) {
    const lamp = new THREE.Group();
    box(lamp, [0.15, 2.8, 0.15], mat("#48382b"), [0, 1.4, 0]);
    box(
      lamp,
      [0.4, 0.55, 0.4],
      mat("#c5a370", 0.5, 0, "#ffc783", 1.2),
      [0, 2.55, 0],
    );
    add(town, lamp, x, z, 0.3);
    const light = new THREE.PointLight("#ffd29a", 1, 7);
    light.position.set(x, 2.5, z);
    town.add(light);
  }
  for (const [building, label] of [
    [smithHouse, "MIRA · BLACKSMITH"],
    [shopHouse, "OREN · WAYFARER SHOP"],
    [thirdHouse, "STONEGUARD HOUSE"],
  ]) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#273b37";
    ctx.fillRect(0, 0, 512, 96);
    ctx.strokeStyle = "#baa476";
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 502, 86);
    ctx.fillStyle = "#f2dba5";
    ctx.textAlign = "center";
    ctx.font = "bold 26px Georgia";
    ctx.fillText(label, 256, 59);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 0.65),
      new THREE.MeshBasicMaterial({ map: texture }),
    );
    sign.position.set(0, 2.6, 1.98);
    building.add(sign);
  }
  for (const [x, z] of [
    [-14, -2],
    [-14, 1],
    [14, 0],
    [14, 2],
  ]) {
    const barrel = new THREE.Group();
    part(
      barrel,
      new THREE.CylinderGeometry(0.45, 0.42, 0.9, 8),
      mat("#765334"),
      [0, 0.45, 0],
    );
    for (const y of [0.18, 0.72])
      part(barrel, new THREE.TorusGeometry(0.45, 0.035, 4, 8), mat("#444c43"), [
        0,
        y,
        0,
      ]).rotation.x = Math.PI / 2;
    add(town, barrel, x, z, 0.5);
  }
  for (const [x, z] of [
    [-5, -3],
    [4, -2],
    [5, 2],
  ])
    zoneColliders.shopInterior.push({
      object: { position: new THREE.Vector3(x, 0, z), visible: true },
      radius: 1.4,
    });
  for (const zoneName of ["meadow", "town", "cave"]) {
    const geometry = new THREE.BufferGeometry(),
      coords = new Float32Array(90 * 3);
    for (let i = 0; i < 90; i++) {
      coords[i * 3] = (rng() - 0.5) * 48;
      coords[i * 3 + 1] = 0.8 + rng() * 5;
      coords[i * 3 + 2] = (rng() - 0.5) * 48;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(coords, 3));
    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        color: zoneName === "cave" ? "#81b9c0" : "#eadcb3",
        size: 0.065,
        transparent: true,
        opacity: 0.6,
        depthWrite: false,
      }),
    );
    zones[zoneName].add(points);
    worldMotes.push(points);
  }
  for (const secret of SECRETS) {
    const marker = new THREE.Group();
    part(
      marker,
      new THREE.CylinderGeometry(0.5, 0.65, 0.25, 8),
      mat("#667263"),
      [0, 0.12, 0],
    );
    const crystal = part(
      marker,
      new THREE.OctahedronGeometry(0.26),
      mat("#9ce1d6", 0.5, 0.1, "#50aaa8", 0.7),
      [0, 1.1, 0],
    );
    marker.userData.crystal = crystal;
    add(zones[secret.zone], marker, secret.x, secret.z);
    focuses["echo-" + secret.id] = marker;
    discoveries.push({ ...secret, marker });
  }
  for (const [x, z] of [
    [7, 13],
    [9, 16],
    [-9, 6],
    [-12, 4],
    [15, -3],
  ]) {
    const tree = add(meadow, createTree(0.9), x, z, 0.6);
    tree.userData.treeId = "tree-" + x + "-" + z;
    harvestTrees.push(tree);
    const stump = new THREE.Group();
    part(
      stump,
      new THREE.CylinderGeometry(0.3, 0.38, 0.32, 8),
      mat("#795536"),
      [0, 0.16, 0],
    );
    add(meadow, stump, x, z);
    tree.userData.stump = stump;
  }
  part(
    sentinelSeal,
    new THREE.TorusGeometry(1.2, 0.15, 6, 16),
    mat("#7cbfc1", 0.6, 0.2, "#3e747d", 0.4),
    [0, 1.5, 0],
  );
  part(
    sentinelSeal,
    new THREE.OctahedronGeometry(0.5),
    mat("#dfce89", 0.7, 0.1, "#81713d", 0.4),
    [0, 1.5, 0],
  );
  add(cave, sentinelSeal, -8, -33);
  focuses.sentinel = sentinelSeal;
  // Lake collision: the bank is walkable; Bram cannot run across the water.
  zoneColliders.meadow.push({ object: lake, radius: 7 });
  // Battle mountains use the same silhouettes and palette as the meadow.
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2,
      rock = createRock(3.5 + (i % 3) * 0.5);
    rock.scale.y = 2.8;
    add(battle, rock, Math.cos(a) * 36, Math.sin(a) * 36);
  }
  $("#journalButton").onclick = () => {
    if (state === "world") openJournal();
  };
  $("#soundButton").onclick = () => {
    soundEnabled = !soundEnabled;
    try {
      localStorage.setItem("bram-sound", soundEnabled ? "on" : "off");
    } catch {}
    $("#soundButton").textContent = soundEnabled ? "Sound on" : "Sound off";
    playSound("reward");
  };
  $("#soundButton").textContent = soundEnabled ? "Sound on" : "Sound off";
  $("#rally").onclick = earthshatter;
  $("#retreat").onclick = () => {
    if (
      state === "battle" &&
      window.confirm("Leave this battle? Collected EXP and items stay saved.")
    )
      returnFromBattle();
  };
  $("#exportSave").onclick = () => {
    save();
    const blob = new Blob(
      [
        JSON.stringify(
          {
            ...game,
            location: currentZone,
            position: { x: player.position.x, z: player.position.z },
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "bram-journey-backup.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  $("#importSave").onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data?.version !== 4) throw Error("format");
      if (!window.confirm("Replace this journey with the selected backup?"))
        return;
      $("#journal").hidden = true;
      load(data);
      toast("Backup restored.");
    } catch {
      toast(
        "That is not a valid Bram save. Your current journey was not changed.",
      );
    }
    event.target.value = "";
  };
  canvas.addEventListener("pointermove", (event) => {
    if (state !== "battle" || battleState !== "prepare") return;
    const r = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(battle.children[0])[0];
    previewPosition = hit?.point || null;
    previewValid =
      !!previewPosition &&
      Math.abs(previewPosition.x) <= 20 &&
      Math.abs(previewPosition.z) <= 20 &&
      distanceToPath(previewPosition) >= 1.8;
  });
  canvas.addEventListener("pointerleave", () => (previewPosition = null));
  syncDiscoveries();
}
function syncDiscoveries() {
  for (const d of discoveries) d.marker.visible = !game.echoes.includes(d.id);
  for (const tree of harvestTrees) {
    const down = (game.harvested[tree.userData.treeId] || 0) > Date.now();
    tree.visible = !down;
    tree.userData.stump.visible = down;
  }
  sentinelSeal.visible = !game.secretBossDefeated;
}
function riddleInteractions() {
  if(!game.vampireRiddleStarted) return [];
  return [['Ring the bronze bell',riddleBell,'bell'],['Extinguish the brazier',riddleBrazier,'brazier'],['Touch the empty chalice',riddleChalice,'chalice']]
    .filter(([,obj])=>obj.visible && obj.parent===zones[currentZone])
    .map(([label,obj,action])=>[label,obj,()=>{
      const result=advanceVampireRiddle(game,action);syncRiddleObjects();save();
      if(result==='solved') {
        playSound('reward');
        story('THE VAMPIRE','You remembered the order. Oren’s contracts now offer night supplies: only gold, Bat Wings, and Wood. Walk through the far-left corner behind me, where the walls meet. Seek Vrykólakas in the ruin below.','vampire');
      } else toast(result==='wrong'?'The rite rejects the order. The brazier rekindles; begin again with the bell.':result==='complete'?'The rite is complete. The refuge’s far-left corner is open.':`The rite answers · ${game.vampireRiddleStep}/3`,5000);
      if(action==='bell' && result==='correct') playSound('reward');
    }]);
}
function extraInteractions() {
  if(currentZone==='vampireRuin') return [
    ['Climb back to the refuge',ruinExit,()=>switchZone('vampireCave',{x:-4,z:-5},false)],
    ['Speak to Vrykólakas',vrykolakas,()=>{game.metVrykolakas=true;save();story('VRYKÓLAKAS','I am Vrykólakas, keeper of the first night. You silenced the lanterns, remembered our rite, and passed through stone. These halls were ancient before Starfall had a name. Rest, Bram. The old blood has been waiting for you.','vrykolakas');}],
  ];
  if(currentZone==='vampireCave') return [
    ...riddleInteractions(),
    ['Return to the meadow',vampireExit,()=>switchZone('meadow',{x:0,z:-25},false)],
    ['Speak to the vampire',vampireNPC,()=>{
      game.vampireRiddleStarted=true;syncRiddleObjects();save();
      story('THE VAMPIRE',game.vampireRiddleSolved?'The rite is complete. Oren now offers night supplies: gold, Bat Wings, and Wood. Walk through the far-left corner behind me, where the two old walls meet. Vrykólakas waits below.':VAMPIRE_RIDDLE+' '+riddleClues+' A mistake begins the rite anew.','vampire');
    }],
  ];
  if(currentZone === 'ossuary') return [
    ...riddleInteractions(),
    ['Return through the false wall',cryptDoor,()=>switchZone('cave',{x:secretCenter.x,z:secretCenter.z},false)],
    ...(game.skeletonBossDefeated?[]:[['Challenge the Marrow King',cryptThrone,()=>{activeBand=null;setupBattle({type:'skeleton',id:'hidden-marrow-king'});}]]),
  ];
  const list = discoveries
    .filter((d) => d.zone === currentZone && d.marker.visible)
    .map((d) => [
      "Investigate " + d.title,
      d.marker,
      () => {
        if (!findEcho(game, d.id)) return;
        syncDiscoveries();
        playSound("reward");
        save();
        story("ECHO · " + d.title.toUpperCase(), d.text, "echo-" + d.id, () =>
          toast(
            "Memory found · +" + d.gold + " gold · +" + d.exp + " EXP",
            4000,
          ),
        );
      },
    ]);
  list.push(...riddleInteractions());
  if (currentZone === "meadow" && game.weapons.includes("Woodcutter Axe"))
    for (const tree of harvestTrees)
      if (tree.visible)
        list.push([
          "Chop tree · +1 Wood",
          tree,
          () => {
            game.materials.Wood++;
            game.harvested[tree.userData.treeId] = Date.now() + 45000;
            tree.visible = false;
            tree.userData.stump.visible = true;
            playSound("hit");
            toast("Wood +1");
            save();
          },
        ]);
  if (currentZone === "cave" && !game.secretBossDefeated)
    list.push([
      "The sealed Sentinel",
      sentinelSeal,
      () => {
        if (!canEnterSentinel(game)) {
          story(
            "THE SEALED SENTINEL",
            "Three memories are needed to remind the stone of its oath. Follow the clues in your journal.",
            "sentinel",
          );
          return;
        }
        activeBand = null;
        playCutscene("sentinel", () =>
          setupBattle({ type: "sentinel", id: "secret-sentinel" }),
        );
      },
    ]);
  return list;
}
function openJournal() {
  const q = questDefs[game.quest] || questDefs.complete;
  $("#journalQuest").textContent = q[0] + " — " + q[1];
  if(game.vampireRiddleStarted) $('#journalQuest').textContent += game.vampireRiddleSolved ? '\nThe old blood’s rite: complete. Night supplies unlocked at Oren’s shop. Walk through the refuge’s far-left rear corner to find Vrykólakas.' : '\nThe vampire’s riddle: '+VAMPIRE_RIDDLE+' '+riddleClues+` (${game.vampireRiddleStep}/3 actions completed.)`;
  $("#journalContract").textContent =
    Math.min(3, Math.max(0, game.wins - game.contracts * 3)) +
    " / 3 victories for Oren’s next supply contract. Claim inside his shop.";
  $("#journalEchoes").innerHTML = SECRETS.map(
    (s) =>
      `<article class="lore-card ${game.echoes.includes(s.id) ? "found" : ""}"><small>${game.echoes.includes(s.id) ? "MEMORY RECOVERED" : "UNDISCOVERED"}</small><h3>${game.echoes.includes(s.id) ? s.title : "A fading echo"}</h3><p>${game.echoes.includes(s.id) ? s.text : s.hint}</p></article>`,
  ).join("");
  $("#journalEnding").textContent = game.secretBossDefeated
    ? "The Sentinel is at peace. Starfall remembers."
    : `${game.echoes.length} / 5 memories found. Three memories open a secret trial at the deepest point of the cave.`;
  openMenu("#journal");
}
function buildBattleMarkers() {
  previewPosition = null;
  rangeDisc = new THREE.Mesh(
    new THREE.RingGeometry(0.97, 1, 64),
    new THREE.MeshBasicMaterial({
      color: "#92d8da",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    }),
  );
  rangeDisc.rotation.x = -Math.PI / 2;
  rangeDisc.userData.temporary = true;
  battle.add(rangeDisc);
  guideMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.46, 24),
    new THREE.MeshBasicMaterial({
      color: "#ace2ba",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    }),
  );
  guideMarker.rotation.x = -Math.PI / 2;
  guideMarker.userData.temporary = true;
  battle.add(guideMarker);
  const finish = pathCurve.getPointAt(1),
    entry = pathCurve.getPointAt(0);
  for (const [point, color] of [
    [entry, "#bb6252"],
    [finish, "#68c5ba"],
  ]) {
    const marker = new THREE.Group();
    box(marker, [0.3, 2.3, 0.3], mat(color), [-1.3, 1.15, 0]);
    box(marker, [0.3, 2.3, 0.3], mat(color), [1.3, 1.15, 0]);
    box(marker, [2.9, 0.25, 0.35], mat(color), [0, 2.3, 0]);
    marker.position.copy(point);
    marker.userData.temporary = true;
    battle.add(marker);
  }
  rangeDisc.visible = false;
  guideMarker.visible = false;
}
function updateRange() {
  if (!rangeDisc) return;
  rangeDisc.visible = state === "battle" && placed && battleState !== "result";
  rangeDisc.position.set(player.position.x, 0.09, player.position.z);
  rangeDisc.scale.setScalar(attackStats().range);
  guideMarker.visible = battleState === "prepare" && !!previewPosition;
  if (previewPosition) {
    guideMarker.position.set(previewPosition.x, 0.1, previewPosition.z);
    guideMarker.material.color.set(previewValid ? "#a6edb9" : "#ef7466");
  }
}
function reposition() {
  if (state !== "battle" || battleState !== "combat" || !repositionAvailable)
    return;
  repositionAvailable = false;
  battleState = "prepare";
  prep = 10;
  resetBramPose();
  $("#startWave").hidden = false;
  $("#battleLabel").textContent = "REPOSITION";
  $("#battleObjective").textContent =
    "Wave paused · move Bram, then press Start Wave";
  // beginWave must resume instead of creating another boss army.
  resumingWave = true;
  toast("One tactical reposition per battle. Enemies are paused.");
}
let resumingWave = false;
function earthshatter() {
  if (
    state !== "battle" ||
    battleState !== "combat" ||
    !placed ||
    abilityCooldown > 0
  )
    return;
  const targets = enemies.filter((e) => e.t >= 0 && e.model.visible);
  if (!targets.length) {
    toast("Wait until enemies arrive.");
    return;
  }
  // A strategic rescue: strike the leading enemy anywhere along the road.
  const target = targets.reduce((a, b) => (a.t > b.t ? a : b)),
    impact = target.model.position.clone();
  for (const enemy of targets)
    if (enemy.model.position.distanceTo(impact) < 5) {
      enemy.hp -= 120 * altarMultiplier(game.upgrades.damage);
      enemy.stun = 2.5;
      enemy.hitFlash = 0.15;
    }
  abilityCooldown = 14;
  crackEffect(impact, true);
  impactDust(impact, "#a2e2d9", 32);
  playSound("hit");
  toast("Earthshatter · leading pack stunned");
}
function slashEffect(position) {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(1.1, 1.45, 24, 1, 0, Math.PI * 1.25),
    new THREE.MeshBasicMaterial({
      color: "#edf3d9",
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = rng() * Math.PI;
  mesh.position.set(position.x, 0.2, position.z);
  battle.add(mesh);
  effects.push({ mesh, age: 0, lifetime: 0.3 });
}
function impactDust(position, color, count) {
  const group = new THREE.Group(),
    m = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
  for (let i = 0; i < count; i++) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), m);
    mesh.position.set((rng() - 0.5) * 0.8, 0.05, (rng() - 0.5) * 0.8);
    mesh.userData.velocity = new THREE.Vector3(
      (rng() - 0.5) * 3,
      1 + rng() * 3,
      (rng() - 0.5) * 3,
    );
    group.add(mesh);
  }
  group.position.copy(position);
  battle.add(group);
  effects.push({ mesh: group, age: 0, lifetime: 0.6, particles: true });
}
function updateEffects(dt) {
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.age += dt;
    const life = e.lifetime || 1.3;
    e.mesh.traverse((o) => {
      if (o.material) o.material.opacity = Math.max(0, 1 - e.age / life);
      if (o.userData.velocity) {
        o.position.addScaledVector(o.userData.velocity, dt);
        o.userData.velocity.y -= 6 * dt;
      }
    });
    if (e.age > life) {
      disposeEffect(e.mesh);
      effects.splice(i, 1);
    }
  }
}
function disposeEffect(mesh) {
  mesh.removeFromParent();
  const geometries = new Set(),
    materials = new Set();
  mesh.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) materials.add(o.material);
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
function showResult(won, title, text) {
  $("#resultTitle").textContent = title;
  $("#resultText").textContent = text;
  const drops = Object.entries(game.materials)
    .filter(([key, n]) => n > (battleStart.materials[key] || 0))
    .map(([key, n]) => key + " +" + (n - (battleStart.materials[key] || 0)));
  $("#resultLoot").textContent = drops.length
    ? drops.join(" · ")
    : won
      ? "The road is safe. Explore, improve your equipment, or seek the next challenge."
      : "No items were lost.";
  $("#resultRetry").hidden = won;
  $("#battleResult").hidden = false;
  $("#resultRetry").onclick = () => {
    $("#battleResult").hidden = true;
    resumingWave = false;
    setupBattle(encounter);
  };
  $("#resultContinue").onclick = () => {
    const ending = encounter?.type === "sentinel" && won;
    $("#battleResult").hidden = true;
    returnFromBattle();
    if (ending)
      playCutscene("trueEnding", () => {
        state = "world";
        game.journeyComplete = true;
        game.quest = "epilogue";
        updateHUD();
        save();
        toast("Echoes of Starfall complete. Thank you for playing!", 6000);
      });
  };
  $("#tutorial").hidden = true;
  $("#battleDialogue").hidden = true;
  $("#rally").disabled = true;
  updateHUD();
  playSound(won ? "reward" : "hit");
}
function returnFromBattle() {
  const safe = {
    zone: battleReturn.zone,
    position: { ...battleReturn.position },
  };
  clearBattle();
  $("#battleResult").hidden = true;
  $("#battleHud").hidden = true;
  activeBand = null;
  resumingWave = false;
  switchZone(safe.zone, safe.position, false);
  encounterGrace = 5;
  save();
}
function tickAdventure(dt, time) {
  if(ruinDescent>0) {
    ruinDescent=Math.max(0,ruinDescent-dt);
    player.position.y=6*(ruinDescent/1.6)**2;
    if(ruinDescent===0) {state='world';player.position.y=0;save();}
  }
  syncRiddleObjects();
  for (const p of worldMotes) {
    p.position.y = Math.sin(time * 0.2) * 0.25;
    p.rotation.y = Math.sin(time * 0.04) * 0.04;
  }
  for (const d of discoveries)
    if (d.marker.visible) {
      d.marker.userData.crystal.rotation.y = time * 0.9;
      d.marker.userData.crystal.position.y =
        1.1 + Math.sin(time * 2 + d.x) * 0.15;
    }
  if (state === "world")
    for (const tree of harvestTrees)
      if (
        !tree.visible &&
        (game.harvested[tree.userData.treeId] || 0) <= Date.now()
      ) {
        tree.visible = true;
        tree.userData.stump.visible = false;
      }
  sentinelSeal.rotation.y = Math.sin(time * 0.3) * 0.1;
  for (let i = 0; i < hollowDetails.flames.length; i++) {
    hollowDetails.flames[i].scale.y = 1 + Math.sin(time * 4 + i * 2.3) * 0.06;
  }
  cryptThrone.visible = !game.skeletonBossDefeated;
  const dim=currentZone==='battle' && usesTunnelArena(battleReturn.zone) ? 1-game.extinguishedLanterns.length*.15 : 1;
  sun.intensity=2.6*dim;
  const underground = ["cave", "basement", "ossuary", "vampireCave", "vampireRuin"].includes(currentZone) || (currentZone === "battle" && usesTunnelArena(battleReturn.zone));
  const goalColor = new THREE.Color(['vampireCave','vampireRuin'].includes(currentZone) ? '#211d29' : underground ? "#395965" : "#a7dfea");
  scene.background.lerp(goalColor, Math.min(1, dt * 2));
  hemi.intensity = THREE.MathUtils.damp(
    hemi.intensity,
    underground ? 1.65*dim : 2.5,
    3,
    dt,
  );
  $("#journalButton").disabled = state !== "world";
  $("#inventoryButton").disabled = !["world", "battle"].includes(state);
}

let cameraGoal = new THREE.Vector3(),
  saveClock = 0;
const clock = new THREE.Clock();
function updateCamera(dt) {
  const fieldOfView = currentZone === "cave" ? 78 : 47;
  if(camera.fov !== fieldOfView) { camera.fov = fieldOfView; camera.updateProjectionMatrix(); }
  if (currentZone === "cave") {
    const focus = state === "cutscene" && cutsceneFocus ? cutsceneFocus : player;
    const p = focus.getWorldPosition(new THREE.Vector3());
    camera.position.set(p.x, 5.4, Math.max(-32.5, Math.min(17.5, p.z + 0.2)));
    camera.lookAt(p.x, .7, p.z);
    return;
  }
  if (state === "cutscene" && cutsceneFocus) {
    cutsceneTime += dt;
    const p = cutsceneFocus.getWorldPosition(new THREE.Vector3()),
      angle = cutsceneStyle === "orbit" ? cutsceneTime * 0.12 : 0.65,
      distance =
        cutsceneStyle === "push" ? 5.8 : cutsceneStyle === "rise" ? 8 : 7,
      height = cutsceneStyle === "rise" ? 5.4 : 3.8;
    cameraGoal.set(
      p.x + Math.cos(angle) * distance,
      p.y + height,
      p.z + Math.sin(angle) * distance,
    );
    camera.position.lerp(cameraGoal, 1 - Math.exp(-dt * 2.6));
    camera.lookAt(p.x, p.y + 1.15, p.z);
    const rig = cutsceneFocus.userData.rig;
    if (rig) {
      rig.visual.position.y = Math.sin(cutsceneTime * 2.2) * 0.025;
      rig.visual.rotation.y = Math.sin(cutsceneTime * 2) * 0.065;
    }
    if (cutsceneLines === cutscenes.transform && focuses.battleBoss) {
      focuses.battleBoss.userData.rig.visual.rotation.z =
        Math.sin(cutsceneTime * 16) * 0.08;
    }
    return;
  }
  if (currentZone === "battle") {
    const view = fitBattleCamera(
      pathPoints,
      camera.aspect,
      canvas.clientHeight,
    );
    camera.position.lerp(view.position, 1 - Math.exp(-dt * 4));
    camera.lookAt(view.target);
    return;
  }
  const p = player.getWorldPosition(new THREE.Vector3());
  cameraGoal.set(p.x + 8, p.y + 10, p.z + 12);
  camera.position.lerp(cameraGoal, 1 - Math.exp(-dt * 4.5));
  camera.lookAt(p.x, p.y + 1.1, p.z);
}
function animateMagic(obj, time) {
  if (!obj?.userData.ring) return;
  obj.userData.ring.rotation.z = time * 0.55;
  obj.children.forEach((c) => {
    if (c.userData.orbit !== undefined) {
      const a = c.userData.orbit + time * 0.52;
      c.position.x = Math.cos(a) * 1.7;
      c.position.z = Math.sin(a) * 1.7;
    }
  });
  obj.userData.light.intensity = obj.userData.active
    ? 3.7 + Math.sin(time * 2) * 0.55
    : 0;
  obj.userData.core.material.opacity = obj.userData.active ? 0.48 : 0.06;
}
function resize() {
  const w = canvas.clientWidth,
    h = canvas.clientHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();
function loop() {
  const dt = document.hidden ? 0 : Math.min(0.04, clock.getDelta()),
    time = clock.elapsedTime;
  sky.position.copy(camera.position);
  animateMagic(meadowPortal, time);
  animateMagic(townPortal, time);
  oldAltar.userData.crystal.rotation.y = time * 0.55;
  townAltar.userData.crystal.rotation.y = time * 0.55;
  townAltar.userData.light.intensity = townAltar.userData.active
    ? 3.5 + Math.sin(time * 2) * 0.4
    : 0;
  caveTorches.forEach(
    (l, i) => (l.intensity = 1.55 + Math.sin(time * 8 + i) * 0.25),
  );
  tickAdventure(dt, time);
  if (!testPaused && state === "world") {
    movePlayer(dt, time);
    updateBands(dt, time);
    updatePrompt();
  }
  if (!testPaused && state === "battle") {
    const scaled = dt * battleSpeed;
    battleElapsed += scaled;
    updateBattle(scaled, battleElapsed);
  }
  if (state === "cutscene" && currentZone === "battle") updateEffects(dt);
  updateCamera(dt);
  saveClock += dt;
  if (saveClock > 2) {
    saveClock = 0;
    save();
  }
  composer.render();
  requestAnimationFrame(loop);
}
let testPaused = false;
// Development-only regression controls. Vite removes this branch from releases.
if (import.meta.env.DEV && new URLSearchParams(location.search).has("test"))
  window.__bramTest = {
    snapshot: () => ({
      game: JSON.parse(JSON.stringify(game)),
      state,
      zone: currentZone,
      battleState,
      placed,
      bossStage,
      environment: battle.userData.environment,
      enemies: enemies.map((e) => ({ type: e.type, hp: e.hp, t: e.t })),
      position: { x: player.position.x, z: player.position.z },
      blocked: blocked(player.position),
      battleReturn,
      stats: attackStats(),
      repositionAvailable,
      abilityCooldown,
    }),
    load: (data) => {
      $("#titleScreen").hidden = true;
      load({ ...newState(), ...data });
    },
    zone: (name, x, z) => switchZone(name, { x, z }, false),
    secretWall: () => ({center:{x:secretCenter.x,z:secretCenter.z},normal:{x:secretNormal.x,z:secretNormal.z}}),
    riddleObjects: () => [riddleBell,riddleBrazier,riddleChalice].map(o=>({visible:o.visible,x:o.position.x,z:o.position.z,zone:Object.keys(zones).find(k=>zones[k]===o.parent)})),
    lanterns: () => battleEnvironment.lanterns.map(l=>{const p=l.getWorldPosition(new THREE.Vector3()).project(camera),r=canvas.getBoundingClientRect();return {id:l.userData.lanternId,x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height,intensity:l.userData.light.intensity};}),
    walk: (dx,dz) => {keys.clear();if(dx>0)keys.add('d');if(dx<0)keys.add('a');if(dz>0)keys.add('s');if(dz<0)keys.add('w');movePlayer(.04,0);keys.clear();},
    battle: (data) => {
      activeBand = null;
      setupBattle(data);
    },
    place: (x, z) => {
      if (distanceToPath(new THREE.Vector3(x, 0, z)) < 1.8) return false;
      player.position.set(x, 0, z);
      placed = true;
      player.visible = true;
      $("#startWave").disabled = false;
      return true;
    },
    begin: beginWave,
    ability: earthshatter,
    reposition,
    skip: endCutscene,
    interact,
    pause: (value) => (testPaused = value),
    step: (seconds) => {
      for (let t = 0; t < seconds; t += 0.04) {
        if (state !== "battle" || battleState === "result") break;
        battleElapsed += 0.04;
        updateBattle(0.04, battleElapsed);
      }
    },
    kill: () => {
      for (const e of enemies) e.hp = 0;
    },
    leak: () => {
      if (enemies.length) enemies[0].t = 0.9999;
    },
    path: () => pathPoints.map((p) => ({ x: p.x, z: p.z })),
    project: (x, z) => {
      const p = new THREE.Vector3(x, 0, z).project(camera),
        r = canvas.getBoundingClientRect();
      return {
        x: r.left + ((p.x + 1) / 2) * r.width,
        y: r.top + ((1 - p.y) / 2) * r.height,
      };
    },
    clear: () => {
      clearBattle();
      $("#battleResult").hidden = true;
    },
    save,
    readSave,
  };
initializeAdventure();
decorateLandscape(zones);
const battleEnvironment = createBattleEnvironment(battle);
player.position.set(-4, 0, 10);
camera.position.set(10, 12, 23);
document.body.dataset.mode = "title";
updateHUD();
loop();
