import * as T from "three";
const permanentSaveKeys = [
  "emberfall-bram-save-v1",
  "legend-of-bram-rewards-v1",
  "legend-of-bram-inventory-v1",
  "legend-of-bram-equipment-v1"
];
const permanentSave = window.bramSave?.load?.();
if (permanentSave?.entries) {
  let localSaveTime = 0;
  for (const key of permanentSaveKeys) {
    try {
      localSaveTime = Math.max(localSaveTime, JSON.parse(localStorage.getItem(key))?.savedAt || 0);
    } catch {
    }
  }
  const restoreWholeSnapshot = Number(permanentSave.savedAt || 0) > localSaveTime;
  for (const key of permanentSaveKeys) {
    const savedValue = permanentSave.entries[key];
    if (typeof savedValue === "string" && (restoreWholeSnapshot || localStorage.getItem(key) === null)) {
      localStorage.setItem(key, savedValue);
    }
  }
}
function writePermanentSave() {
  if (!window.bramSave?.write) return;
  const entries = {};
  for (const key of permanentSaveKeys) {
    const value = localStorage.getItem(key);
    if (value !== null) entries[key] = value;
  }
  window.bramSave.write({ version: 1, savedAt: Date.now(), entries });
}
const c = document.querySelector("#gameCanvas"), r = new T.WebGLRenderer({ canvas: c, antialias: true });
r.setPixelRatio(Math.min(devicePixelRatio, 2));
r.shadowMap.enabled = true;
r.shadowMap.type = T.PCFSoftShadowMap;
r.outputColorSpace = T.SRGBColorSpace;
const s = new T.Scene();
s.background = new T.Color("#9cadb0");
s.fog = new T.FogExp2("#9cadb0", 0.023);
const cam = new T.PerspectiveCamera(47, 1, 0.1, 100);
const sun = new T.DirectionalLight("#ffe5c0", 3);
sun.position.set(-9, 16, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
s.add(new T.HemisphereLight("#dbe6df", "#1b2521", 1.4), sun);
const world = new T.Group(), battle = new T.Group();
s.add(world, battle);
battle.visible = false;
const mat = (x) => new T.MeshStandardMaterial({ color: x, roughness: 0.9 });
function ground(size, color) {
  const m = new T.Mesh(new T.PlaneGeometry(size, size), mat(color));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}
world.add(ground(42, "#546b52"));
battle.add(ground(42, "#546b52"));
for (let i = 0; i < 32; i++) {
  let a = i * 2.4, d = 7 + i * 19 % 100 / 100 * 14, g = new T.Group(), tr = new T.Mesh(new T.CylinderGeometry(0.13, 0.24, 1.8, 8), mat("#4a3929")), le = new T.Mesh(new T.SphereGeometry(0.9 + i % 3 * 0.18, 12, 9), mat("#354e3b"));
  tr.position.y = 0.9;
  le.position.y = 2.1;
  le.scale.set(0.75, 1.35, 0.75);
  tr.castShadow = le.castShadow = true;
  g.add(tr, le);
  g.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
  g.userData.solidRadius = 0.48;
  world.add(g);
}
for (const [x, z, h] of [[-13, -8, 4], [11, -11, 5], [-14, 9, 3], [13, 10, 6]]) {
  const m = new T.Mesh(new T.CylinderGeometry(0.8, 1.1, h, 9), mat("#62635a"));
  m.position.set(x, h / 2, z);
  m.castShadow = true;
  m.userData.solidRadius = 1.05;
  world.add(m);
}
function tex(kind) {
  let q = document.createElement("canvas");
  q.width = q.height = 32;
  let x = q.getContext("2d");
  if (kind === "bram") {
    x.fillStyle = "#2b392e";
    x.fillRect(8, 17, 16, 10);
    x.fillStyle = "#587d63";
    x.fillRect(9, 12, 14, 11);
    x.fillStyle = "#f1ca9e";
    x.fillRect(11, 5, 10, 9);
    x.fillStyle = "#63452c";
    x.fillRect(24, 10, 4, 18);
    x.fillStyle = "#4d5452";
    x.fillRect(18, 4, 13, 8);
    x.fillStyle = "#8d9690";
    x.fillRect(19, 5, 11, 3);
    x.fillStyle = "#343a3a";
    x.fillRect(18, 11, 13, 2);
  } else {
    x.fillStyle = "#617f3e";
    x.fillRect(8, 13, 16, 13);
    x.fillStyle = "#91b157";
    x.fillRect(7, 6, 18, 10);
    x.fillStyle = "#273323";
    x.fillRect(10, 9, 3, 3);
    x.fillRect(19, 9, 3, 3);
    x.fillStyle = "#c8df77";
    x.fillRect(4, 7, 4, 7);
    x.fillRect(24, 7, 4, 7);
  }
  let t = new T.CanvasTexture(q);
  t.magFilter = T.NearestFilter;
  t.minFilter = T.NearestFilter;
  return t;
}
function unit(k, z) {
  let u = new T.Sprite(new T.SpriteMaterial({ map: tex(k), transparent: true, depthWrite: false }));
  u.scale.set(z, z, 1);
  u.center.set(0.5, 0.12);
  return u;
}
const bram = unit("bram", 1.8);
bram.position.set(-9, 0, 8);
world.add(bram);
const pack = new T.Group();
for (const [x, z] of [[0, 0], [-1, 0.4], [1, 0.25]]) {
  let g = unit("goblin", 1.25);
  g.position.set(x, 0, z);
  pack.add(g);
}
pack.position.set(5, 0, -5);
world.add(pack);
const pathSets = [[[-13, -8], [-8, 4], [-3, 1], [2, -5], [7, -1], [13, 7]], [[-13, -8], [-10, -1], [-5, -5], [-1, 4], [6, 3], [13, 7]], [[-13, -8], [-7, -7], [-4, 3], [1, 1], [4, 6], [13, 7]]].map((path) => path.map(([x, z]) => new T.Vector3(x, 0, z)));
let route, pebblePath;
function buildPath(points) {
  if (pebblePath) battle.remove(pebblePath);
  route = new T.CatmullRomCurve3(points);
  pebblePath = new T.Group();
  const pebbleMat = [mat("#9a8469"), mat("#756d5e"), mat("#b2a080")];
  for (let i = 0; i < 180; i++) {
    const t = i / 179, p = route.getPoint(t), side = new T.Vector3(-route.getTangent(t).z, 0, route.getTangent(t).x).normalize();
    const spread = (i * 47 % 100 / 100 - 0.5) * 1.5, rock = new T.Mesh(new T.DodecahedronGeometry(0.09 + i % 4 * 0.025, 0), pebbleMat[i % 3]);
    rock.position.copy(p).addScaledVector(side, spread);
    rock.position.y = 0.07;
    rock.scale.y = 0.45;
    rock.rotation.set(i * 0.7, i * 0.31, 0);
    rock.castShadow = true;
    pebblePath.add(rock);
  }
  battle.add(pebblePath);
}
buildPath(pathSets[0]);
for (const x of [-1, 1]) {
  let p = new T.Mesh(new T.BoxGeometry(0.8, 3, 0.8), mat("#5b5a51"));
  p.position.set(13 + x, 1.5, 7);
  p.castShadow = true;
  battle.add(p);
}
let state = "world", lives = 10, prep = 30, placed = false, spawn = 0, clock = 0, attack = 0, last = performance.now(), hit = 0, cameraYaw = 0, cameraMode = 1;
const cameraOffsets = [new T.Vector3(7, 8, 9), new T.Vector3(10, 12, 13), new T.Vector3(16, 20, 21)], enemies = [], effects = [], keys = {};
const $ = (x) => document.querySelector(x), msg = $("#message"), st = $("#state"), loc = $("#location"), life = $("#lives"), start = $("#startWave"), back = $("#returnWorld"), targeting = $("#targeting");
function label(v) {
  state = v;
  st.textContent = v === "world" ? "Explore" : v === "prepare" ? "Prepare" : "Defend";
}
function follow(p) {
  const offset = cameraOffsets[cameraMode].clone().applyAxisAngle(new T.Vector3(0, 1, 0), cameraYaw);
  cam.position.lerp(p.clone().add(offset), 0.1);
  cam.lookAt(p.x, 0, p.z);
}
function worldMode() {
  battle.visible = false;
  world.visible = true;
  if (bram.parent !== world) {
    battle.remove(bram);
    world.add(bram);
  }
  bram.position.set(-9, 0, 8);
  label("world");
  loc.textContent = "Meadow of Cinders";
  msg.textContent = "A goblin warband roams the highlands.";
  start.hidden = back.hidden = true;
  enemies.splice(0).forEach((e) => battle.remove(e.m));
  effects.splice(0).forEach((e) => battle.remove(e.m));
  follow(bram.position);
}
function battleMode() {
  world.visible = false;
  battle.visible = true;
  buildPath(pathSets[Math.floor(Math.random() * pathSets.length)]);
  label("prepare");
  loc.textContent = "Goblin Ambush";
  prep = 30;
  lives = 10;
  life.textContent = 10;
  spawn = 0;
  placed = false;
  cam.position.set(15, 17, 18);
  cam.lookAt(0, 0, 0);
  msg.textContent = "A new pebble route has formed. Place Bram off the path.";
  start.hidden = false;
  back.hidden = true;
}
function onMap(p) {
  for (let i = 0; i < 100; i++) if (p.distanceTo(route.getPoint(i / 100)) < 1.35) return true;
  return false;
}
const ray = new T.Raycaster(), mouse = new T.Vector2();
c.addEventListener("pointerdown", (e) => {
  if (state !== "prepare" || placed) return;
  let b = c.getBoundingClientRect();
  mouse.set((e.clientX - b.left) / b.width * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
  ray.setFromCamera(mouse, cam);
  let h = ray.intersectObject(battle.children[0])[0];
  if (!h) return;
  if (onMap(h.point)) {
    msg.textContent = "Choose open ground; Bram cannot stand on the route.";
    return;
  }
  world.remove(bram);
  battle.add(bram);
  bram.position.copy(h.point);
  bram.position.y = 0;
  placed = true;
  msg.textContent = "Bram is ready. Start the wave.";
});
function goblin() {
  let m = unit("goblin", 1.3);
  battle.add(m);
  enemies.push({ m, h: 100, t: 0, v: 0.058 + Math.random() * 0.013 });
}
function slam() {
  const inRange = enemies.filter((e) => e.m.position.distanceTo(bram.position) < 4.8);
  if (!inRange.length) return;
  let q;
  if (targeting.value === "last") q = inRange.reduce((last2, enemy) => enemy.t < last2.t ? enemy : last2);
  else if (targeting.value === "strong") q = inRange.reduce((strong, enemy) => enemy.h > strong.h ? enemy : strong);
  else q = inRange.reduce((first, enemy) => enemy.t > first.t ? enemy : first);
  let p = q.m.position.clone();
  enemies.forEach((e) => {
    if (e.m.position.distanceTo(p) < 3.2) e.h -= 65;
  });
  let m = new T.Mesh(new T.RingGeometry(0.25, 0.48, 32), new T.MeshBasicMaterial({ color: "#f7d98a", transparent: true, side: T.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.position.copy(p);
  m.position.y = 0.1;
  battle.add(m);
  effects.push({ m, t: 0 });
}
function combat(d) {
  if (state === "prepare") {
    prep -= d;
    msg.textContent = placed ? `Prepare: ${Math.ceil(prep)} seconds` : "Place Bram anywhere off the route.";
    if (prep <= 0) go();
    return;
  }
  clock -= d;
  if (spawn < 8 && clock <= 0) {
    goblin();
    spawn++;
    clock = 0.95;
  }
  attack -= d;
  if (placed && attack <= 0) {
    slam();
    attack = 0.82;
  }
  for (let i = effects.length - 1; i >= 0; i--) {
    let e = effects[i];
    e.t += d;
    e.m.scale.setScalar(1 + e.t * 7);
    e.m.material.opacity = 1 - e.t * 2;
    if (e.t > 0.5) {
      battle.remove(e.m);
      effects.splice(i, 1);
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (e.h <= 0) {
      battle.remove(e.m);
      enemies.splice(i, 1);
      continue;
    }
    e.t += e.v * d;
    e.m.position.copy(route.getPoint(Math.min(1, e.t)));
    if (e.t >= 1) {
      battle.remove(e.m);
      enemies.splice(i, 1);
      life.textContent = --lives;
      if (!lives) end(false);
    }
  }
  if (spawn === 8 && !enemies.length) end(true);
}
function go() {
  if (state === "prepare") {
    label("combat");
    clock = 0;
    start.hidden = true;
    msg.textContent = "Defend the old gate!";
  }
}
function end(w) {
  label("ended");
  msg.textContent = w ? "The goblin warband is scattered." : "The old gate has fallen.";
  back.hidden = false;
}
function move(d) {
  let x = 0, z = 0, v = 6 * d;
  if (keys.w || keys.ArrowUp) z -= v;
  if (keys.s || keys.ArrowDown) z += v;
  if (keys.a || keys.ArrowLeft) x -= v;
  if (keys.d || keys.ArrowRight) x += v;
  if (x || z) {
    bram.position.x = Math.max(-17, Math.min(17, bram.position.x + x));
    bram.position.z = Math.max(-17, Math.min(17, bram.position.z + z));
    follow(bram.position);
  }
  let a = last * 27e-5;
  pack.position.set(5 + Math.cos(a) * 3, 0, -5 + Math.sin(a * 1.7) * 2);
  let dist = bram.position.distanceTo(pack.position);
  if (dist < 4) {
    pack.position.lerp(bram.position, d * 0.62);
    msg.textContent = "The goblin warband is closing in!";
  }
  if (dist < 1.25) {
    if ((hit += d) > 0.55) battleMode();
  } else hit = 0;
}
function resize() {
  let b = c.getBoundingClientRect();
  cam.aspect = b.width / b.height;
  cam.updateProjectionMatrix();
  r.setSize(b.width, b.height, false);
}
window.addEventListener("resize", resize);
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === " ") go();
});
window.addEventListener("keyup", (e) => keys[e.key] = false);
start.onclick = go;
back.onclick = worldMode;
resize();
worldMode();
function loop(n) {
  let d = Math.min(0.05, (n - last) / 1e3);
  last = n;
  if (state === "world") move(d);
  else if (state === "prepare" || state === "combat") combat(d);
  r.render(s, cam);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
const battleOverworld = new T.Group();
for (let i = 0; i < 32; i++) {
  let a = i * 2.4, d = 7 + i * 19 % 100 / 100 * 14, g = new T.Group(), tr = new T.Mesh(new T.CylinderGeometry(0.13, 0.24, 1.8, 8), mat("#4a3929")), le = new T.Mesh(new T.SphereGeometry(0.9 + i % 3 * 0.18, 12, 9), mat("#354e3b"));
  tr.position.y = 0.9;
  le.position.y = 2.1;
  le.scale.set(0.75, 1.35, 0.75);
  tr.castShadow = le.castShadow = true;
  g.add(tr, le);
  g.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
  battleOverworld.add(g);
}
for (const [x, z, h] of [[-13, -8, 4], [11, -11, 5], [-14, 9, 3], [13, 10, 6]]) {
  const m = new T.Mesh(new T.CylinderGeometry(0.8, 1.1, h, 9), mat("#62635a"));
  m.position.set(x, h / 2, z);
  m.castShadow = true;
  battleOverworld.add(m);
}
for (let i = 0; i < 18; i++) {
  const a = i / 18 * Math.PI * 2, mountain = new T.Mesh(new T.ConeGeometry(5.5 + i % 3 * 1.3, 14 + i % 4 * 3, 8), mat(i % 2 ? "#53605c" : "#495451"));
  mountain.position.set(Math.cos(a) * 21, 7, Math.sin(a) * 21);
  mountain.castShadow = true;
  battleOverworld.add(mountain);
}
battle.add(battleOverworld);
const battleMeadow = new T.Group(), battleGrassMat = mat("#3e6041"), battleFlowerMat = mat("#c99b58");
for (const [x, z] of [[-13, -11], [-11, -4], [-12, 8], [-7, 12], [0, -12], [7, -11], [12, -7], [12, 3], [10, 11], [3, 12], [-4, 11], [-8, -10]]) {
  const tuft = new T.Mesh(new T.ConeGeometry(0.16, 0.52, 5), battleGrassMat);
  tuft.position.set(x, 0.26, z);
  tuft.scale.set(1, 0.8 + Math.abs(x + z) % 3 * 0.25, 1);
  const flower = new T.Mesh(new T.SphereGeometry(0.1, 6, 5), battleFlowerMat);
  flower.position.set(x + 0.18, 0.55, z - 0.1);
  battleMeadow.add(tuft, flower);
}
battle.add(battleMeadow);
const bands = [pack];
for (const [x, z] of [[9, 7], [-8, -6]]) {
  const band = pack.clone();
  band.position.set(x, 0, z);
  world.add(band);
  bands.push(band);
}
bands.forEach((band, i) => {
  band.userData = { home: band.position.clone(), orc: Math.random() < 0.42 };
  if (band.userData.orc) {
    const orc = unit("goblin", 2.05);
    orc.material = orc.material.clone();
    orc.material.color.set("#a7bf71");
    orc.position.set(0, 0, -0.9);
    band.add(orc);
  }
});
let activeBand = bands[0], orcBattle = false, orcSpawned = false;
function goblinBattleMode() {
  activeBand = activeBand || bands[0];
  world.visible = false;
  battle.visible = true;
  buildPath(pathSets[Math.floor(Math.random() * pathSets.length)]);
  label("prepare");
  loc.textContent = activeBand.userData.orc ? "Orc-led Ambush" : "Goblin Ambush";
  prep = 30;
  lives = 10;
  life.textContent = 10;
  spawn = 0;
  placed = false;
  orcBattle = activeBand.userData.orc;
  orcSpawned = false;
  cam.position.set(15, 17, 18);
  cam.lookAt(0, 0, 0);
  msg.textContent = orcBattle ? "An orc leads this band: 600 HP, but very slow." : "A new pebble route has formed. Place Bram off the path.";
  start.hidden = false;
  back.hidden = true;
}
function goblinSpawn() {
  if (orcBattle && !orcSpawned) {
    const m2 = unit("goblin", 2.1);
    m2.material = m2.material.clone();
    m2.material.color.set("#a7bf71");
    battle.add(m2);
    enemies.push({ m: m2, h: 600, t: 0, v: 0.017, type: "orc" });
    orcSpawned = true;
  }
  let m = unit("goblin", 1.3);
  battle.add(m);
  enemies.push({ m, h: 100, t: 0, v: 0.058 + Math.random() * 0.013, type: "goblin" });
}
function goblinMove(d) {
  let x = 0, z = 0, v = 6 * d;
  if (keys.w || keys.ArrowUp) z -= v;
  if (keys.s || keys.ArrowDown) z += v;
  if (keys.a || keys.ArrowLeft) x -= v;
  if (keys.d || keys.ArrowRight) x += v;
  if (x || z) {
    const next = new T.Vector3(bram.position.x + x, 0, bram.position.z + z);
    if (next.length() > 15) next.setLength(15);
    bram.position.x = next.x;
    bram.position.z = next.z;
    follow(bram.position);
  }
  let closest = null, dist = Infinity;
  bands.filter((band) => band.visible).forEach((band, i) => {
    const a = last * 27e-5 + i * 2.1;
    band.position.x = band.userData.home.x + Math.cos(a) * 2.4;
    band.position.z = band.userData.home.z + Math.sin(a * 1.6) * 1.8;
    const distance = bram.position.distanceTo(band.position);
    if (distance < dist) {
      dist = distance;
      closest = band;
    }
  });
  activeBand = closest;
  if (activeBand && dist < 4) {
    activeBand.position.lerp(bram.position, d * 0.62);
    msg.textContent = `A group of goblins have appeared in the ${loc.textContent}.`;
  }
  if (activeBand && dist < 1.25) {
    if ((hit += d) > 0.55) battleMode();
  } else hit = 0;
}
battleMode = goblinBattleMode;
goblin = goblinSpawn;
move = goblinMove;
const saveKey = "emberfall-bram-save-v1", profileKey = "legend-of-bram-rewards-v1", startScreen = document.querySelector("#startScreen"), newGameButton = document.querySelector("#newGame"), loadGameButton = document.querySelector("#loadGame"), saveStatus = document.querySelector("#saveStatus");
function rewardProfile() {
  try {
    return JSON.parse(localStorage.getItem(profileKey)) || {};
  } catch {
    return {};
  }
}
function saveRewards() {
  localStorage.setItem(profileKey, JSON.stringify({ exp: bramXp, gold: bramGold, savedAt: Date.now() }));
}
function saveJourney() {
  if (!startScreen.classList.contains("hidden")) return;
  saveRewards();
  localStorage.setItem(saveKey, JSON.stringify({ x: bram.position.x, z: bram.position.z, exp: bramXp, gold: bramGold, goblinsKilled, cinderHollow, bossDefeated, savedAt: Date.now() }));
  writePermanentSave();
}
function showSaveStatus() {
  const raw = localStorage.getItem(saveKey);
  if (!raw) {
    saveStatus.textContent = "No saved journey yet.";
    loadGameButton.disabled = true;
    return;
  }
  const data = JSON.parse(raw), time = new Date(data.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  saveStatus.textContent = `Autosave available from ${time}.`;
  loadGameButton.disabled = false;
}
newGameButton.onclick = () => {
  localStorage.removeItem(saveKey);
  localStorage.removeItem(profileKey);
  bramXp = 0;
  bramGold = 0;
  goblinsKilled = 0;
  cinderHollow = false;
  bossDefeated = false;
  caveKnight.visible = true;
  teleporter.visible = true;
  cinderTown.visible = false;
  s.background.set("#9cadb0");
  s.fog.color.set("#9cadb0");
  s.fog.density = 0.023;
  updateRewards();
  worldMode();
  startScreen.classList.add("hidden");
  saveJourney();
};
loadGameButton.onclick = () => {
  startScreen.classList.add("hidden");
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(saveKey)) || {};
  } catch {
  }
  const profile = rewardProfile();
  worldMode();
  bram.position.set(Number.isFinite(data.x) ? data.x : -9, 0, Number.isFinite(data.z) ? data.z : 8);
  bramXp = Math.max(data.exp || 0, profile.exp || 0);
  bramGold = Math.max(data.gold || 0, profile.gold || 0);
  goblinsKilled = data.goblinsKilled || 0;
  cinderHollow = Boolean(data.cinderHollow);
  bossDefeated = Boolean(data.bossDefeated || cinderHollow);
  caveKnight.visible = !bossDefeated;
  teleporter.visible = true;
  cinderTown.visible = cinderHollow;
  if (cinderHollow) {
    bram.position.set(100, 0, 106);
    s.background.set("#45404a");
    s.fog.color.set("#45404a");
    s.fog.density = 0.04;
    loc.textContent = "Cinder Hollow";
  }
  updateRewards();
  follow(bram.position);
  saveJourney();
};
setInterval(saveJourney, 2500);
window.addEventListener("pagehide", saveJourney);
window.addEventListener("beforeunload", saveJourney);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveJourney();
});
showSaveStatus();
let bramXp = 0, bramGold = 0;
const xpLabel = document.querySelector("#xp"), goldLabel = document.querySelector("#gold");
let orcTaken = false;
bands.forEach((band) => {
  if (band.userData.orc) {
    if (orcTaken) {
      band.remove(band.children[band.children.length - 1]);
      band.userData.orc = false;
    } else orcTaken = true;
  }
});
function updateRewards() {
  xpLabel.textContent = bramXp;
  goldLabel.textContent = bramGold;
  if (startScreen.classList.contains("hidden")) saveRewards();
}
function rewardCombat(d) {
  if (state === "prepare") {
    prep -= d;
    msg.textContent = placed ? `Prepare: ${Math.ceil(prep)} seconds` : "Place Bram anywhere off the route.";
    if (prep <= 0) go();
    return;
  }
  clock -= d;
  if (spawn < 8 && clock <= 0) {
    goblin();
    spawn++;
    clock = 0.95;
  }
  attack -= d;
  if (placed && attack <= 0) {
    slam();
    attack = 0.82;
  }
  for (let i = effects.length - 1; i >= 0; i--) {
    let e = effects[i];
    e.t += d;
    e.m.scale.setScalar(1 + e.t * 7);
    e.m.material.opacity = 1 - e.t * 2;
    if (e.t > 0.5) {
      battle.remove(e.m);
      effects.splice(i, 1);
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (e.h <= 0) {
      battle.remove(e.m);
      enemies.splice(i, 1);
      bramXp += e.type === "orc" ? 100 : 10;
      goblinsKilled++;
      if (e.type === "orc" ? Math.random() < 0.25 : Math.random() < 0.1) addMaterial(e.type === "orc" ? "Orc Tusk" : "Goblin Bone");
      updateRewards();
      continue;
    }
    e.t += e.v * d;
    e.m.position.copy(route.getPoint(Math.min(1, e.t)));
    if (e.t >= 1) {
      battle.remove(e.m);
      enemies.splice(i, 1);
      life.textContent = --lives;
      if (!lives) end(false);
    }
  }
  if (spawn === 8 && !enemies.length) end(true);
}
const baseEnd = end;
function rewardedEnd(win) {
  if (win) {
    bramGold += 50;
    updateRewards();
    if (activeBand) activeBand.visible = false;
  }
  baseEnd(win);
}
function animatePixelWalk(now) {
  const bramWalking = state === "world" && (keys.w || keys.a || keys.s || keys.d || keys.ArrowUp || keys.ArrowDown || keys.ArrowLeft || keys.ArrowRight);
  bram.position.y = bramWalking || state === "combat" ? Math.abs(Math.sin(now * 0.012)) * 0.13 : 0;
  bands.forEach((band, i) => band.traverse((o) => {
    if (o.isSprite) o.position.y = Math.abs(Math.sin(now * 0.01 + i)) * 0.1;
  }));
  enemies.forEach((enemy, i) => enemy.m.position.y = Math.abs(Math.sin(now * 0.012 + i)) * 0.1);
  if (teleporter?.visible) {
    teleporter.rotation.y = now * 1e-3;
    teleporter.position.y = Math.sin(now * 4e-3) * 0.12;
  }
  requestAnimationFrame(animatePixelWalk);
}
combat = rewardCombat;
end = rewardedEnd;
updateRewards();
requestAnimationFrame(animatePixelWalk);
const fourthBand = pack.clone();
fourthBand.position.set(-12, 0, 11);
fourthBand.userData = { home: fourthBand.position.clone(), orc: false };
world.add(fourthBand);
bands.push(fourthBand);
function announceBand() {
}
bands.forEach((band) => band.visible = false);
function spawnGoblinBand() {
  const visibleBands = bands.filter((b) => b.visible).length, candidate = bands.find((b) => !b.visible);
  if (!candidate || visibleBands >= 4) return;
  candidate.position.set((Math.random() - 0.5) * 28, 0, (Math.random() - 0.5) * 28);
  candidate.userData.home.copy(candidate.position);
  candidate.userData.orc = Math.random() < 0.35;
  candidate.visible = true;
  announceBand();
}
setInterval(() => {
  if (state !== "world" || cinderHollow || !startScreen.classList.contains("hidden")) return;
  const visibleBands = bands.filter((b) => b.visible).length;
  if (!visibleBands || Math.random() < 0.15) spawnGoblinBand();
}, 1e3);
for (let i = 0; i < 18; i++) {
  const a = i / 18 * Math.PI * 2, mountain = new T.Mesh(new T.ConeGeometry(5.5 + i % 3 * 1.3, 14 + i % 4 * 3, 8), mat(i % 2 ? "#53605c" : "#495451"));
  mountain.position.set(Math.cos(a) * 21, 7, Math.sin(a) * 21);
  mountain.castShadow = true;
  world.add(mountain);
}
const caveMountain = new T.Mesh(new T.ConeGeometry(7.5, 18, 9), mat("#454b48"));
caveMountain.position.set(0, 9, -20);
caveMountain.castShadow = true;
world.add(caveMountain);
const caveDoor = new T.Mesh(new T.PlaneGeometry(2.5, 3.1), new T.MeshBasicMaterial({ color: "#101515" }));
caveDoor.position.set(0, 1.6, -14.65);
world.add(caveDoor);
const caveRim = new T.Group(), gateStone = mat("#48504c");
for (const [x, y, s2] of [[-1.55, 1.6, [0.55, 3.4, 0.65]], [1.55, 1.6, [0.55, 3.4, 0.65]], [0, 3.15, [3.65, 0.52, 0.72]]]) {
  const part = new T.Mesh(new T.BoxGeometry(...s2), gateStone);
  part.position.set(x, y, -14.58);
  part.castShadow = true;
  if (x) part.userData.solidBox = { halfX: 0.46, halfZ: 0.52 };
  caveRim.add(part);
}
world.add(caveRim);
const knight = unit("bram", 2);
knight.material = knight.material.clone();
knight.material.color.set("#9da7c7");
knight.position.set(0, 0, -11.8);
world.add(knight);
let goblinsKilled = 0;
const npcDialogue = document.querySelector("#npcDialogue");
function updateKnightDialogue() {
  const remaining = Math.max(0, 100 - goblinsKilled);
  npcDialogue.textContent = remaining ? `Knight: yo bruh kill ${remaining} goblins` : "Knight: fire job bruh";
}
function knightCheck() {
  if (bossActive || bossDefeated) {
    npcDialogue.hidden = true;
    return;
  }
  const near = state === "world" && bram.position.distanceTo(knight.position) < 3.2;
  npcDialogue.hidden = !near;
  if (near) updateKnightDialogue();
}
setInterval(knightCheck, 100);
knight.visible = false;
function knightSprite() {
  const q = document.createElement("canvas");
  q.width = q.height = 32;
  const x = q.getContext("2d");
  x.fillStyle = "#3a4250";
  x.fillRect(8, 16, 16, 11);
  x.fillStyle = "#a8b5c3";
  x.fillRect(8, 6, 16, 12);
  x.fillStyle = "#697686";
  x.fillRect(3, 17, 6, 8);
  x.fillRect(23, 17, 6, 8);
  x.fillStyle = "#202630";
  x.fillRect(10, 9, 12, 4);
  x.fillStyle = "#d8b77a";
  x.fillRect(22, 12, 7, 12);
  x.fillStyle = "#707b89";
  x.fillRect(23, 10, 6, 5);
  const t = new T.CanvasTexture(q);
  t.magFilter = T.NearestFilter;
  t.minFilter = T.NearestFilter;
  const sprite = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  sprite.scale.set(2.15, 2.15, 1);
  sprite.center.set(0.5, 0.12);
  return sprite;
}
const caveKnight = knightSprite();
caveKnight.position.copy(knight.position);
caveKnight.userData.solidRadius = 0.72;
world.add(caveKnight);
const teleporter = new T.Group(), portalMat = new T.MeshBasicMaterial({ color: "#7ae7ff", transparent: true, opacity: 0.78 }), portalRing = new T.Mesh(new T.TorusGeometry(1.15, 0.16, 10, 32), portalMat), portalCore = new T.Mesh(new T.CircleGeometry(0.94, 32), new T.MeshBasicMaterial({ color: "#3557df", transparent: true, opacity: 0.6 }));
portalRing.rotation.x = portalCore.rotation.x = -Math.PI / 2;
portalRing.position.y = 0.25;
portalCore.position.y = 0.27;
teleporter.add(portalCore, portalRing);
for (let i = 0; i < 4; i++) {
  const shard = new T.Mesh(new T.OctahedronGeometry(0.17), portalMat);
  const a = i * Math.PI / 2;
  shard.position.set(Math.cos(a) * 1.25, 0.58, Math.sin(a) * 1.25);
  teleporter.add(shard);
}
teleporter.position.copy(knight.position);
teleporter.visible = false;
world.add(teleporter);
let cinderHollow = false;
function canEnterCinderHollow() {
  return state === "world" && bram.position.distanceTo(caveDoor.position) <= 7;
}
function enterCinderHollow() {
  if (!canEnterCinderHollow()) return;
  caveKnight.visible = false;
  cinderHollow = true;
  bossDefeated = true;
  cinderTown.visible = true;
  bram.position.set(100, 0, 106);
  scene.background.set("#45404a");
  scene.fog.color.set("#45404a");
  scene.fog.density = 0.04;
  loc.textContent = "Cinder Hollow";
  msg.textContent = "Bram enters Cinder Hollow beyond the mountain cave.";
  msg.classList.remove("band-alert");
  follow(bram.position);
  saveJourney();
}
setInterval(() => {
  if (canEnterCinderHollow()) {
    msg.textContent = "Press E to enter Cinder Hollow.";
    msg.classList.add("band-alert");
  } else msg.classList.remove("band-alert");
}, 100);
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "e") enterCinderHollow();
});
caveMountain.visible = false;
for (const [x, y, z, s2] of [[-5.2, 4, -19, 5], [5.2, 4, -19, 5], [0, 10.5, -19, 4.5]]) {
  const rock = new T.Mesh(new T.DodecahedronGeometry(s2, 1), mat("#454b48"));
  rock.position.set(x, y, z);
  rock.scale.set(1, 0.9, 1);
  rock.castShadow = true;
  world.add(rock);
}
const cinderTown = new T.Group();
cinderTown.position.set(100, 0, 100);
cinderTown.visible = false;
const townGround = ground(100, "#4b4640");
townGround.position.set(0, 0.015, 8);
cinderTown.add(townGround);
function townLabel(text, x, z) {
  const q = document.createElement("canvas");
  q.width = 256;
  q.height = 64;
  const g = q.getContext("2d");
  g.fillStyle = "#171313";
  g.fillRect(0, 0, 256, 64);
  g.strokeStyle = "#d8a952";
  g.lineWidth = 4;
  g.strokeRect(2, 2, 252, 60);
  g.fillStyle = "#ffe6a6";
  g.font = "bold 25px serif";
  g.textAlign = "center";
  g.fillText(text, 128, 40);
  const texture = new T.CanvasTexture(q);
  texture.magFilter = T.NearestFilter;
  const sign = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sign.scale.set(3.2, 0.8, 1);
  sign.position.set(x, 3.6, z);
  cinderTown.add(sign);
}
function townBuilding(x, z, w, roof, label2) {
  const walls = new T.Mesh(new T.BoxGeometry(w, 2.8, 3.2), mat("#756353"));
  walls.position.set(x, 1.4, z);
  walls.castShadow = true;
  const top = new T.Mesh(new T.ConeGeometry(w * 0.95, 1.7, 4), mat(roof));
  top.position.set(x, 3.65, z);
  top.rotation.y = Math.PI / 4;
  top.castShadow = true;
  cinderTown.add(walls, top);
  townLabel(label2, x, z - 1.85);
}
townBuilding(-5, 9, 3.6, "#9a543e", "BLACKSMITH");
townBuilding(5, 9, 3.6, "#416f68", "SHOP");
townBuilding(-22, 18, 4.2, "#635879", "INN");
townBuilding(22, 18, 4.2, "#6c7452", "MARKET");
townBuilding(-12, -3, 3.7, "#7c5145", "HOMESTEAD");
townBuilding(18, -4, 3.7, "#4d6680", "HALL");
townBuilding(-15, 34, 3.5, "#83594b", "FORGE ROW");
townBuilding(15, 34, 3.5, "#526b63", "TRADER ROW");
const fenceMat = mat("#503b2a"), fence = new T.Group(), fencePost = (x, z) => {
  const p = new T.Mesh(new T.CylinderGeometry(0.13, 0.17, 2, 6), fenceMat);
  p.position.set(x, 1, z);
  p.castShadow = true;
  fence.add(p);
}, fenceRail = (x, z, w, d) => {
  const rail = new T.Mesh(new T.BoxGeometry(w, 0.13, d), fenceMat);
  rail.position.set(x, 1.35, z);
  fence.add(rail);
  const rail2 = rail.clone();
  rail2.position.y = 0.7;
  fence.add(rail2);
};
for (let x = -34; x <= 34; x += 3) {
  fencePost(x, -20);
  fencePost(x, 42);
}
for (let z = -17; z <= 39; z += 3) {
  fencePost(-34, z);
  fencePost(34, z);
}
fenceRail(0, 42, 68, 0.14);
fenceRail(-34, 11, 0.14, 62);
fenceRail(34, 11, 0.14, 62);
fenceRail(-23, -20, 22, 0.14);
fenceRail(23, -20, 22, 0.14);
const townGate = new T.Group();
for (const x of [-4, 4]) {
  const p = new T.Mesh(new T.BoxGeometry(0.42, 2.8, 0.42), fenceMat);
  p.position.set(x, 1.4, -20);
  townGate.add(p);
}
const gateBar = new T.Mesh(new T.BoxGeometry(7.6, 0.22, 0.22), fenceMat);
gateBar.position.set(0, 1.5, -20);
townGate.add(gateBar);
cinderTown.add(fence, townGate);
townLabel("TOWN GATE", 0, -17.8);
const altarBase = new T.Mesh(new T.CylinderGeometry(1.7, 2.15, 0.55, 8), mat("#7a746c"));
altarBase.position.set(0, 0.3, 14);
altarBase.castShadow = true;
const altarStone = new T.Mesh(new T.BoxGeometry(1.2, 2.2, 1.2), mat("#d6c9ad"));
altarStone.position.set(0, 1.35, 14);
altarStone.castShadow = true;
const altarFlame = new T.Mesh(new T.SphereGeometry(0.42, 12, 8), new T.MeshBasicMaterial({ color: "#68d9ff" }));
altarFlame.position.set(0, 2.7, 14);
cinderTown.add(altarBase, altarStone, altarFlame);
townLabel("ALTAR OF STEVE", 0, 11.9);
world.add(cinderTown);
let zombieBattle = false;
function zombieUnit(size) {
  const q = document.createElement("canvas");
  q.width = 32;
  q.height = 48;
  const g = q.getContext("2d");
  g.fillStyle = "#243126";
  g.fillRect(8, 24, 16, 17);
  g.fillStyle = "#60765b";
  g.fillRect(7, 16, 18, 15);
  g.fillStyle = "#8ea17a";
  g.fillRect(9, 5, 14, 14);
  g.fillStyle = "#182018";
  g.fillRect(10, 10, 3, 3);
  g.fillRect(19, 10, 3, 3);
  g.fillStyle = "#d7e78d";
  g.fillRect(11, 10, 2, 2);
  g.fillRect(20, 10, 2, 2);
  g.fillStyle = "#5d7055";
  g.fillRect(4, 22, 5, 17);
  g.fillRect(23, 22, 5, 17);
  g.fillStyle = "#374535";
  g.fillRect(9, 40, 5, 7);
  g.fillRect(18, 40, 5, 7);
  const texture = new T.CanvasTexture(q);
  texture.magFilter = T.NearestFilter;
  texture.minFilter = T.NearestFilter;
  const sprite = new T.Sprite(new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(size, size * 1.65, 1);
  sprite.center.set(0.5, 0.1);
  return sprite;
}
const zombiePack = new T.Group();
zombiePack.position.set(0, 0, -29);
for (const x of [-1.5, 0, 1.5]) {
  const zombie = zombieUnit(1.35);
  zombie.position.set(x, 0, 0);
  zombiePack.add(zombie);
}
cinderTown.add(zombiePack);
townLabel("RESTLESS DEAD", 0, -27);
function zombieBattleMode() {
  zombieBattle = true;
  world.visible = false;
  battle.visible = true;
  buildPath(pathSets[Math.floor(Math.random() * pathSets.length)]);
  label("prepare");
  loc.textContent = "Outside the Town Gate";
  prep = 30;
  lives = 10;
  life.textContent = 10;
  spawn = 8;
  placed = false;
  cam.position.set(15, 17, 18);
  cam.lookAt(0, 0, 0);
  for (let i = 0; i < 3; i++) {
    const m = zombieUnit(1.45);
    battle.add(m);
    enemies.push({ m, h: 100, t: i * 0.04, v: 0.04, type: "zombie", down: false, revived: false });
  }
  msg.textContent = "Restless zombies: strike each body once to force its resurrection.";
  start.hidden = false;
  back.hidden = true;
}
function townMove(d) {
  let x = 0, z = 0, v = 6 * d;
  if (keys.w || keys.ArrowUp) z -= v;
  if (keys.s || keys.ArrowDown) z += v;
  if (keys.a || keys.ArrowLeft) x -= v;
  if (keys.d || keys.ArrowRight) x += v;
  if (x || z) {
    const next = new T.Vector3(bram.position.x + x, 0, bram.position.z + z), localX = next.x - 100, localZ = next.z - 100, inside = localX > -34 && localX < 34 && localZ > -20 && localZ < 42, throughGate = localX > -4 && localX < 4 && localZ <= -20;
    if (!inside && !throughGate) return;
    bram.position.copy(next);
    follow(bram.position);
  }
  if (zombiePack.visible && bram.position.distanceTo(zombiePack.getWorldPosition(new T.Vector3())) < 2.1) zombieBattleMode();
}
move = (d) => {
  if (cinderHollow) townMove(d);
  else goblinMove(d);
};
back.onclick = () => {
  if (cinderHollow) {
    world.visible = true;
    battle.visible = false;
    bram.position.set(100, 0, 106);
    label("world");
    loc.textContent = "Cinder Hollow";
    start.hidden = back.hidden = true;
    follow(bram.position);
  } else worldMode();
};
let bossActive = false, bossStage = "", bossSpawned = 0, bossDefeated = false;
function bossUnit(kind, hp, speed) {
  const m = kind === "knight" ? knightSprite() : unit(kind === "necro" ? "bram" : "goblin", kind === "necro" ? 2.4 : 2.1);
  m.material = m.material.clone();
  if (kind === "necro") m.material.color.set("#a65ac2");
  battle.add(m);
  enemies.push({ m, h: hp, maxHp: hp, t: 0, v: speed, type: kind });
}
function beginBetrayal() {
  bossActive = true;
  npcDialogue.hidden = false;
  npcDialogue.textContent = "Knight: ha ha i fooled you into killing all those goblinsss now they can rise from the dead!";
  setTimeout(() => {
    bossStage = "undead";
    bossSpawned = 0;
    world.visible = false;
    battle.visible = true;
    buildPath(pathSets[Math.floor(Math.random() * pathSets.length)]);
    label("prepare");
    loc.textContent = "Knight's Betrayal";
    prep = 30;
    placed = false;
    cam.position.set(15, 17, 18);
    cam.lookAt(0, 0, 0);
    npcDialogue.textContent = "Knight: minions! RISE!";
    start.hidden = false;
    back.hidden = true;
  }, 7e3);
}
function applyNecroArena() {
}
function bossCombat(d) {
  if (!bossActive) {
    rewardCombat(d);
    return;
  }
  if (state === "prepare") {
    prep -= d;
    if (prep <= 0) {
      npcDialogue.hidden = false;
      npcDialogue.textContent = "The False Knight: MINIONS! RISE!";
      go();
    }
    return;
  }
  clock -= d;
  if (bossStage === "undead" && bossSpawned < 100 && clock <= 0) {
    bossUnit("undead", 1, 0.06);
    bossSpawned++;
    clock = 0.055;
  }
  attack -= d;
  if (placed && attack <= 0) {
    slam();
    attack = 0.55;
  }
  for (let i = effects.length - 1; i >= 0; i--) {
    let e = effects[i];
    e.t += d;
    e.m.scale.setScalar(1 + e.t * 7);
    e.m.material.opacity = 1 - e.t * 2;
    if (e.t > 0.5) {
      battle.remove(e.m);
      effects.splice(i, 1);
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (e.type === "necro") e.h = Math.min(e.maxHp, e.h + 5 * d);
    if (e.h <= 0) {
      battle.remove(e.m);
      enemies.splice(i, 1);
      if (e.type === "knight") {
        bossStage = "necro";
        applyNecroArena();
        npcDialogue.textContent = "Knight: why do i always have to do things myself..";
        bossUnit("necro", 400, 0.023);
      } else if (e.type === "necro") {
        bossDefeated = true;
        bossActive = false;
        caveKnight.visible = false;
        teleporter.visible = true;
        bramXp += 1500;
        bramGold += 1e3;
        updateRewards();
        saveJourney();
        label("ended");
        npcDialogue.textContent = "More coming soon! Thank you for playing the beta release.";
        back.hidden = false;
      }
      continue;
    }
    e.t += e.v * d;
    e.m.position.copy(route.getPoint(Math.min(1, e.t)));
    if (e.t >= 1) {
      battle.remove(e.m);
      enemies.splice(i, 1);
      life.textContent = --lives;
      if (!lives) end(false);
    }
  }
  if (bossStage === "undead" && bossSpawned === 100 && !enemies.length) {
    bossStage = "knight";
    npcDialogue.textContent = "Knight: minions! RISE!";
    bossUnit("knight", 200, 0.028);
  }
}
setInterval(() => {
  if (!bossActive && !bossDefeated && state === "world" && goblinsKilled >= 100 && bram.position.distanceTo(knight.position) < 3.2) beginBetrayal();
}, 100);
combat = bossCombat;
const immediateBossUnit = bossUnit;
bossUnit = (kind, hp, speed) => {
  if (kind !== "necro") {
    immediateBossUnit(kind, hp, speed);
    return;
  }
  bossStage = "necroDialogue";
  setTimeout(() => {
    if (bossActive && bossStage === "necroDialogue") {
      bossStage = "necro";
      immediateBossUnit(kind, hp, speed);
    }
  }, 8e3);
};
const bossBar = document.querySelector("#bossBar"), bossName = document.querySelector("#bossName"), bossFill = document.querySelector("#bossFill");
setInterval(() => {
  const boss = enemies.find((enemy) => enemy.type === "knight" || enemy.type === "necro");
  if (!boss) {
    bossBar.hidden = true;
    return;
  }
  bossBar.hidden = false;
  bossName.textContent = boss.type === "knight" ? "The False Knight" : "The Necromancer";
  bossFill.style.width = `${Math.max(0, boss.h / boss.maxHp * 100)}%`;
  bossFill.style.background = boss.type === "knight" ? "linear-gradient(90deg,#bf4e58,#ef9a71)" : "linear-gradient(90deg,#6b3f9b,#d17be8)";
}, 50);
function restartBattle() {
  const lost = Math.ceil(bramGold * 0.05);
  bramGold = Math.max(0, bramGold - lost);
  updateRewards();
  enemies.splice(0).forEach((enemy) => battle.remove(enemy.m));
  effects.splice(0).forEach((effect) => battle.remove(effect.m));
  lives = 10;
  life.textContent = "10";
  spawn = 0;
  clock = 0;
  attack = 0;
  placed = false;
  if (bram.parent === battle) {
    battle.remove(bram);
    world.add(bram);
  }
  if (bossActive) {
    bossStage = "undead";
    bossSpawned = 0;
    orcSpawned = false;
  }
  label("prepare");
  prep = 30;
  start.hidden = false;
  back.hidden = true;
  bossBar.hidden = true;
  msg.textContent = `GATE BROKEN! Lost ${lost} gold.`;
  msg.classList.add("band-alert");
  setTimeout(() => msg.classList.remove("band-alert"), 5e3);
}
const completedEnd = end;
end = (win) => win ? completedEnd(true) : restartBattle();
setInterval(() => {
  if ((state === "combat" || state === "prepare") && lives < 10) restartBattle();
}, 25);
let dialogueTimeout;
new MutationObserver(() => {
  if (!bossActive) return;
  clearTimeout(dialogueTimeout);
  dialogueTimeout = setTimeout(() => {
    npcDialogue.hidden = true;
  }, 9e3);
}).observe(npcDialogue, { childList: true, characterData: true, subtree: true });
world.remove(cinderTown);
caveDoor.visible = false;
caveRim.visible = false;
caveKnight.visible = false;
cinderHollow = false;
canEnterCinderHollow = () => false;
const loadWithoutCinder = loadGameButton.onclick;
loadGameButton.onclick = () => {
  loadWithoutCinder();
  cinderHollow = false;
  cinderTown.visible = false;
  if (bram.position.length() > 30) {
    bram.position.set(-9, 0, 8);
    s.background.set("#9cadb0");
    s.fog.color.set("#9cadb0");
    s.fog.density = 0.023;
    loc.textContent = "Meadow of Cinders";
    follow(bram.position);
  }
  saveJourney();
};
function setBandOrc(band, hasOrc) {
  band.children.filter((child) => child.isSprite && child.scale.x > 1.8).forEach((child) => band.remove(child));
  band.userData.orc = hasOrc;
  const marker = unit("goblin", 2.05);
  marker.material = marker.material.clone();
  marker.material.color.set("#a7bf71");
  marker.position.set(0, 0, -0.9);
  marker.userData.orcMarker = true;
  marker.visible = hasOrc;
  band.add(marker);
  band.userData.orcMarker = marker;
}
bands.forEach((band) => setBandOrc(band, Boolean(band.userData.orc)));
spawnGoblinBand = () => {
  const visibleBands = bands.filter((band) => band.visible).length, candidate = bands.find((band) => !band.visible);
  if (!candidate || visibleBands >= 4) return;
  candidate.position.set((Math.random() - 0.5) * 28, 0, (Math.random() - 0.5) * 28);
  candidate.userData.home.copy(candidate.position);
  setBandOrc(candidate, Math.random() < 0.35);
  candidate.visible = true;
  announceBand();
};
(() => {
  s.background.set("#7899a6");
  s.fog.color.set("#7899a6");
  s.fog.density = 0.018;
  const fill = new T.HemisphereLight("#dcefff", "#182b26", 1.15), rim = new T.DirectionalLight("#ffc98c", 1.15);
  rim.position.set(12, 8, -16);
  s.add(fill, rim);
  const vegetation = new T.Group(), grassGeo = new T.ConeGeometry(0.035, 0.42, 4), grassMat = mat("#416a45"), flowerColors = ["#dcae62", "#c76d6b", "#d9d3a6"];
  for (let i = 0; i < 420; i++) {
    const angle = i * 2.39996, radius = 2.5 + i * 37 % 100 / 100 * 15, x = Math.cos(angle) * radius, z = Math.sin(angle) * radius, blade = new T.Mesh(grassGeo, grassMat);
    blade.position.set(x, 0.2, z);
    blade.rotation.y = i * 0.71;
    blade.scale.y = 0.65 + i % 5 * 0.12;
    vegetation.add(blade);
    if (i % 17 === 0) {
      const bloom = new T.Mesh(new T.SphereGeometry(0.075, 6, 5), mat(flowerColors[i % flowerColors.length]));
      bloom.position.set(x + 0.12, 0.45, z - 0.08);
      vegetation.add(bloom);
    }
  }
  for (let i = 0; i < 38; i++) {
    const angle = i * 2.4, radius = 4 + i * 11 % 100 / 100 * 13, rock = new T.Mesh(new T.DodecahedronGeometry(0.16 + i % 4 * 0.08, 0), mat(i % 2 ? "#69716a" : "#59645c"));
    rock.position.set(Math.cos(angle) * radius, 0.1, Math.sin(angle) * radius);
    rock.scale.y = 0.55;
    rock.rotation.set(i * 0.42, i * 0.7, 0);
    rock.castShadow = true;
    vegetation.add(rock);
  }
  world.add(vegetation);
})();
(() => {
  const teleporterTown = new T.Group();
  teleporterTown.position.set(100, 0, 100);
  teleporterTown.visible = false;
  teleporterTown.add(ground(42, "#6a6254"));
  function townBuilding2(x, z, wall, roof) {
    const building = new T.Group(), base = new T.Mesh(new T.BoxGeometry(5, 3.2, 4.2), mat(wall)), top = new T.Mesh(new T.ConeGeometry(3.8, 2, 4), mat(roof)), door = new T.Mesh(new T.PlaneGeometry(1.05, 1.8), new T.MeshBasicMaterial({ color: "#241a15" }));
    base.position.y = 1.6;
    top.position.y = 4.2;
    top.rotation.y = Math.PI / 4;
    door.position.set(0, 0.95, 2.11);
    building.add(base, top, door);
    building.position.set(x, 0, z);
    building.userData.solidBox = { halfX: 2.7, halfZ: 2.3 };
    building.traverse((object) => {
      if (object.isMesh) object.castShadow = true;
    });
    teleporterTown.add(building);
  }
  townBuilding2(-7, 3, "#765849", "#9a523d");
  townBuilding2(7, 3, "#527069", "#3e6670");
  townBuilding2(0, -7, "#786953", "#5d4b3e");
  const altarBase2 = new T.Mesh(new T.CylinderGeometry(2.1, 2.5, 0.7, 8), mat("#79756b")), altarStone2 = new T.Mesh(new T.BoxGeometry(1.2, 2.4, 1.2), mat("#c7bca3")), altarFlame2 = new T.Mesh(new T.SphereGeometry(0.42, 12, 8), new T.MeshBasicMaterial({ color: "#6cdbff" }));
  altarBase2.position.y = 0.35;
  altarStone2.position.y = 1.5;
  altarFlame2.position.y = 2.95;
  altarBase2.userData.solidRadius = 2.35;
  teleporterTown.add(altarBase2, altarStone2, altarFlame2);
  const townReturnPortal = new T.Mesh(new T.TorusGeometry(1.2, 0.16, 10, 32), new T.MeshBasicMaterial({ color: "#7ae7ff" }));
  townReturnPortal.rotation.x = -Math.PI / 2;
  townReturnPortal.position.set(0, 0.18, 14);
  teleporterTown.add(townReturnPortal);
  world.add(teleporterTown);
  let inTeleporterTown2 = false, townInteriorOpen = false;
  const townInterior = $("#townInterior"), townInteriorType = $("#townInteriorType"), townInteriorTitle = $("#townInteriorTitle"), townInteriorText = $("#townInteriorText"), leaveTownInterior = $("#leaveTownInterior");
  const blacksmithSpot = new T.Vector3(93, 0, 103), shopSpot = new T.Vector3(107, 0, 103), returnSpot = new T.Vector3(100, 0, 114);
  function openTownInterior(type, title, text) {
    townInteriorOpen = true;
    townInteriorType.textContent = type;
    townInteriorTitle.textContent = title;
    townInteriorText.textContent = text;
    townInterior.hidden = false;
  }
  function closeTownInterior() {
    townInteriorOpen = false;
    townInterior.hidden = true;
  }
  leaveTownInterior.onclick = closeTownInterior;
  function enterTeleporterTown() {
    inTeleporterTown2 = true;
    teleporterTown.visible = true;
    bram.position.set(100, 0, 112);
    loc.textContent = "Starfall Town";
    msg.textContent = "Starfall Town — visit the blacksmith, the shop, or the altar.";
    msg.classList.add("band-alert");
    follow(bram.position);
  }
  function leaveTeleporterTown() {
    inTeleporterTown2 = false;
    teleporterTown.visible = false;
    bram.position.set(0, 0, 3);
    loc.textContent = "Meadow of Cinders";
    msg.textContent = "Bram returns to the Meadow of Cinders.";
    follow(bram.position);
  }
  function townMove2(d) {
    if (townInteriorOpen) return;
    let x = 0, z = 0, v = 6 * d;
    if (keys.w || keys.ArrowUp) z -= v;
    if (keys.s || keys.ArrowDown) z += v;
    if (keys.a || keys.ArrowLeft) x -= v;
    if (keys.d || keys.ArrowRight) x += v;
    if (x || z) {
      bram.position.x = Math.max(82, Math.min(118, bram.position.x + x));
      bram.position.z = Math.max(82, Math.min(118, bram.position.z + z));
      follow(bram.position);
    }
    if (bram.position.distanceTo(blacksmithSpot) < 3) msg.textContent = "Press E to enter the Blacksmith.";
    else if (bram.position.distanceTo(shopSpot) < 3) msg.textContent = "Press E to enter the Shop.";
    else if (bram.position.distanceTo(returnSpot) < 3) msg.textContent = "Press E to return to the Meadow of Cinders.";
  }
  const meadowMovement = move;
  move = (d) => {
    if (inTeleporterTown2) townMove2(d);
    else meadowMovement(d);
  };
  const originalTeleporterUse = useTeleporter;
  useTeleporter = () => {
    if (state === "world" && bram.position.distanceTo(teleporter.position) <= 2.7 && hasTeleporterKey()) {
      enterTeleporterTown();
      return;
    }
    originalTeleporterUse();
  };
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "e" || !inTeleporterTown2) return;
    if (townInteriorOpen) {
      closeTownInterior();
      return;
    }
    if (bram.position.distanceTo(blacksmithSpot) < 3) openTownInterior("STARFALL BLACKSMITH", "The Ember Anvil", "The forge is hot and ready for future weapon upgrades.");
    else if (bram.position.distanceTo(shopSpot) < 3) openTownInterior("STARFALL SHOP", "The Wayfarer Store", "Trade your gold for crafting materials and rare tools.");
    else if (bram.position.distanceTo(returnSpot) < 3) leaveTeleporterTown();
  });
  const cobbleMaterials = [mat("#716d62"), mat("#827b6c"), mat("#5d625b"), mat("#917f69")], cobbleStreet = new T.Group();
  for (let row = -16; row <= 16; row++) {
    for (let col = -5; col <= 5; col++) {
      const offset = row % 2 * 0.22, stone = new T.Mesh(new T.BoxGeometry(0.42 + Math.abs(row * col) % 3 * 0.06, 0.07, 0.38 + Math.abs(row + col) % 3 * 0.05), cobbleMaterials[Math.abs(row * 7 + col * 3) % cobbleMaterials.length]);
      stone.position.set(col * 0.48 + offset, 0.045, row * 0.48);
      stone.rotation.y = (row * 13 + col * 7) % 7 * 0.045;
      stone.castShadow = true;
      stone.receiveShadow = true;
      cobbleStreet.add(stone);
    }
  }
  teleporterTown.add(cobbleStreet);
  const puddleMaterial = new T.MeshPhysicalMaterial({ color: "#4b6570", roughness: 0.18, metalness: 0.28, transparent: true, opacity: 0.72 });
  for (const [x, z, s2] of [[-1.8, 6, 0.8], [2.2, -3, 0.55], [-2, -8, 0.65], [3, 10, 0.5]]) {
    const puddle = new T.Mesh(new T.CircleGeometry(s2, 18), puddleMaterial);
    puddle.rotation.x = -Math.PI / 2;
    puddle.position.set(x, 0.09, z);
    teleporterTown.add(puddle);
  }
  for (const [x, z] of [[-7, 3], [7, 3], [0, -7]]) {
    for (let row = 0; row < 4; row++) {
      for (let col = -3; col <= 3; col++) {
        if ((row + col) % 2 === 0) {
          const brick = new T.Mesh(new T.BoxGeometry(0.58, 0.24, 0.09), mat(row % 2 ? "#865948" : "#68473d"));
          brick.position.set(x + col * 0.62, 0.55 + row * 0.27, z + 2.16);
          teleporterTown.add(brick);
        }
      }
    }
    for (let vine = 0; vine < 5; vine++) {
      const leaf = new T.Mesh(new T.SphereGeometry(0.17, 7, 5), mat("#405d3c"));
      leaf.position.set(x - 2.18, 0.9 + vine * 0.42, z + 1.9 + vine % 2 * 0.08);
      teleporterTown.add(leaf);
    }
  }
  for (const [x, z] of [[-4, 7], [4, 7], [0, -2]]) {
    const lamp = new T.PointLight("#ffbd72", 4, 11, 2);
    lamp.position.set(x, 4, z);
    teleporterTown.add(lamp);
  }
  r.toneMapping = T.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.18;
  sun.color.set("#ffd7a0");
  sun.intensity = 3.25;
  const timberMat = mat("#3d2a1f"), slateMat = mat("#34383b"), windowMat = new T.MeshStandardMaterial({ color: "#f5b867", emissive: "#d67a2d", emissiveIntensity: 1.5, roughness: 0.55 });
  for (const [x, z] of [[-7, 3], [7, 3], [0, -7]]) {
    for (const side of [-2.35, 2.35]) {
      const beam = new T.Mesh(new T.BoxGeometry(0.18, 3.1, 0.18), timberMat);
      beam.position.set(x + side, 1.6, z + 2.2);
      teleporterTown.add(beam);
    }
    for (const y of [0.65, 1.45, 2.25]) {
      const beam = new T.Mesh(new T.BoxGeometry(4.75, 0.14, 0.16), timberMat);
      beam.position.set(x, y, z + 2.22);
      teleporterTown.add(beam);
    }
    for (const side of [-1.25, 1.25]) {
      const window2 = new T.Mesh(new T.BoxGeometry(0.72, 0.72, 0.08), windowMat);
      window2.position.set(x + side, 1.75, z + 2.25);
      teleporterTown.add(window2);
    }
    for (let slate = -3; slate <= 3; slate++) {
      const roofSlate = new T.Mesh(new T.BoxGeometry(0.62, 0.08, 3.5), slateMat);
      roofSlate.position.set(x + slate * 0.62, 4.15, z);
      roofSlate.rotation.z = slate < 0 ? 0.62 : -0.62;
      teleporterTown.add(roofSlate);
    }
    const chimney = new T.Mesh(new T.BoxGeometry(0.58, 1.6, 0.58), mat("#57443b"));
    chimney.position.set(x + 1.6, 5.15, z - 0.4);
    teleporterTown.add(chimney);
  }
  for (const [x, z] of [[-4, 7], [4, 7], [0, -2]]) {
    const post = new T.Mesh(new T.CylinderGeometry(0.1, 0.14, 3.2, 8), mat("#37291f")), lampGlow = new T.Mesh(new T.SphereGeometry(0.24, 12, 8), windowMat);
    post.position.set(x, 1.6, z);
    lampGlow.position.set(x, 3.25, z);
    post.userData.solidRadius = 0.28;
    teleporterTown.add(post, lampGlow);
  }
  for (const [x, z] of [[-3, 2], [3, -4], [-8, -1], [8, 7]]) {
    const crate = new T.Mesh(new T.BoxGeometry(0.75, 0.75, 0.75), mat("#755039"));
    crate.position.set(x, 0.38, z);
    crate.rotation.y = (x + z) * 0.18;
    crate.castShadow = true;
    crate.userData.solidRadius = 0.62;
    teleporterTown.add(crate);
  }
  const townMist = new T.Mesh(new T.PlaneGeometry(40, 8), new T.MeshBasicMaterial({ color: "#d6c5a8", transparent: true, opacity: 0.055, depthWrite: false }));
  townMist.position.set(0, 3, -15);
  teleporterTown.add(townMist);
  window.__legendTown = teleporterTown;
})();
(() => {
  const town = window.__legendTown;
  if (!town) return;
  const cutStone = mat("#4e514d"), mortar = mat("#6c675d"), iron = mat("#24292a"), canvasMat = mat("#6d2f27"), wood = mat("#57402d");
  for (let i = -17; i <= 17; i++) {
    for (const side of [-17, 17]) {
      const wall = new T.Mesh(new T.BoxGeometry(1.05, 1.15, 0.65), i % 3 ? cutStone : mortar);
      wall.position.set(i, 0.58, side);
      wall.castShadow = wall.receiveShadow = true;
      town.add(wall);
    }
    if (Math.abs(i) > 3) for (const side of [-17, 17]) {
      const wall = new T.Mesh(new T.BoxGeometry(0.65, 1.15, 1.05), i % 3 ? cutStone : mortar);
      wall.position.set(side, 0.58, i);
      wall.castShadow = wall.receiveShadow = true;
      town.add(wall);
    }
  }
  for (const [x, z, ry] of [[-10, 9, 0], [10, 9, 0], [-11, -4, Math.PI / 2], [11, -4, Math.PI / 2]]) {
    const bench = new T.Group(), seat = new T.Mesh(new T.BoxGeometry(3, 0.24, 0.7), wood), legA = new T.Mesh(new T.BoxGeometry(0.2, 0.65, 0.5), iron), legB = legA.clone();
    seat.position.y = 0.75;
    legA.position.set(-1, 0.35, 0);
    legB.position.set(1, 0.35, 0);
    bench.add(seat, legA, legB);
    bench.position.set(x, 0, z);
    bench.rotation.y = ry;
    bench.userData.solidRadius = 1.65;
    town.add(bench);
  }
  const market = new T.Group(), marketTop = new T.Mesh(new T.BoxGeometry(5, 0.16, 3), canvasMat);
  marketTop.position.y = 3.15;
  for (const x of [-2.25, 2.25]) for (const z of [-1.25, 1.25]) {
    const pole = new T.Mesh(new T.CylinderGeometry(0.07, 0.1, 3.1, 8), wood);
    pole.position.set(x, 1.55, z);
    market.add(pole);
  }
  market.add(marketTop);
  for (let i = 0; i < 6; i++) {
    const sack = new T.Mesh(new T.SphereGeometry(0.42, 10, 7), mat(i % 2 ? "#9c805b" : "#6f7352"));
    sack.scale.set(1, 0.72, 1);
    sack.position.set(-1.6 + i * 0.65, 0.32, 0);
    market.add(sack);
  }
  market.position.set(-10, 0, -9);
  market.userData.solidRadius = 2.75;
  town.add(market);
  for (const [x, z] of [[-14, 12], [14, 12], [-14, -12], [14, -12]]) {
    const post = new T.Mesh(new T.CylinderGeometry(0.11, 0.16, 4.2, 10), iron), glowMat = new T.MeshStandardMaterial({ color: "#f5b867", emissive: "#d67a2d", emissiveIntensity: 2 }), glow = new T.Mesh(new T.SphereGeometry(0.3, 12, 8), glowMat), light = new T.PointLight("#ffb765", 3.4, 10, 2);
    post.position.set(x, 2.1, z);
    glow.position.set(x, 3.75, z);
    light.position.copy(glow.position);
    post.userData.solidRadius = 0.3;
    town.add(post, glow, light);
  }
  for (const [x, z] of [[-12, 4], [12, 5], [-10, -13], [9, -12]]) {
    const barrel = new T.Mesh(new T.CylinderGeometry(0.48, 0.52, 1.05, 14), mat("#64462f"));
    barrel.position.set(x, 0.53, z);
    barrel.castShadow = true;
    barrel.userData.solidRadius = 0.62;
    town.add(barrel);
  }
})();
const townMovementWithoutCollision = move, townBuildingBounds = [[93, 103], [107, 103], [100, 93]];
move = (d) => {
  const beforeMove = bram.position.clone();
  townMovementWithoutCollision(d);
  if (loc.textContent !== "Starfall Town") return;
  const blocked = townBuildingBounds.some(([x, z]) => Math.abs(bram.position.x - x) < 2.7 && Math.abs(bram.position.z - z) < 2.3);
  if (blocked) {
    bram.position.copy(beforeMove);
    follow(bram.position);
  }
};
function keepBandInMeadow(band) {
  const meadowRadius = 13.5;
  if (band.userData.home.length() > meadowRadius) band.userData.home.setLength(meadowRadius);
  if (band.position.length() > meadowRadius) band.position.setLength(meadowRadius);
}
const originalGoblinMove = goblinMove;
goblinMove = (d) => {
  originalGoblinMove(d);
  bands.filter((band) => band.visible).forEach(keepBandInMeadow);
};
const originalBandSpawn = spawnGoblinBand;
spawnGoblinBand = () => {
  originalBandSpawn();
  bands.filter((band) => band.visible).forEach(keepBandInMeadow);
};
var inTeleporterTown = false;
const teleporterPrompt = $("#teleporterPrompt");
setInterval(() => {
  const nearTeleporter = state === "world" && !inTeleporterTown && bram.position.distanceTo(teleporter.position) <= 2.7;
  teleporterPrompt.hidden = !nearTeleporter;
  if (nearTeleporter) teleporterPrompt.textContent = hasTeleporterKey() ? "Press E to enter Starfall Town." : "Teleporter locked — requires the Teleporter Key.";
  msg.classList.remove("band-alert");
}, 100);
const quietGoblinMove = goblinMove;
goblinMove = (d) => {
  quietGoblinMove(d);
  if (msg.textContent.startsWith("A group of goblins have appeared")) msg.textContent = "";
};
const gameFrame = document.querySelector(".game-frame");
setInterval(() => {
  const nearMainTeleporter = state === "world" && loc.textContent === "Meadow of Cinders" && bram.position.distanceTo(teleporter.position) <= 2.7;
  gameFrame.classList.toggle("teleporter-near", nearMainTeleporter);
}, 80);
setTimeout(() => {
  const keyRenderInventory = renderInventory;
  renderInventory = () => {
    keyRenderInventory();
    const hammerIcon = weaponList.querySelector(".item-icon");
    if (hammerIcon) {
      hammerIcon.textContent = "";
      hammerIcon.classList.add("sledge-icon");
    }
  };
  renderInventory();
}, 20);
setTimeout(() => {
  const iconRenderInventory = renderInventory;
  renderInventory = () => {
    iconRenderInventory();
    keyItemList.querySelectorAll("li:not(.empty-item)").forEach((item) => {
      item.dataset.tooltip = item.dataset.tooltip.replace(" — Quest", "");
      item.querySelector(".item-amount")?.remove();
    });
  };
  renderInventory();
}, 10);
setTimeout(() => {
  const baseRenderInventory = renderInventory;
  renderInventory = () => {
    baseRenderInventory();
    const icons = { Hammer: "🔨", "Goblin Bone": "🦴", "Orc Tusk": "🦷", "Teleporter Key": "🗝️", "Strange Rune": "✦", "Key to the Man Cave": "🔑" };
    const descriptions = { "Strange Rune": "A strange item that locals say has the power to awaken the strange altar.", "Key to the Man Cave": "A key made for the mysterious Man Cave." };
    [weaponList, materialList, keyItemList].forEach((list) => list.querySelectorAll("li:not(.empty-item)").forEach((item) => {
      const name = item.firstChild.textContent, amount = item.querySelector("span")?.textContent || "", icon = document.createElement("span"), count = document.createElement("span");
      icon.className = "item-icon";
      icon.textContent = icons[name] || "✦";
      count.className = "item-amount";
      count.textContent = amount;
      item.dataset.tooltip = descriptions[name] || `${name}${amount ? ` — ${amount}` : ""}`;
      item.setAttribute("aria-label", item.dataset.tooltip);
      item.replaceChildren(icon, count);
    }));
  };
  renderInventory();
}, 0);
setTimeout(() => {
  const equipmentKey = "legend-of-bram-equipment-v1", weaponDefs = { Hammer: { damage: 65, range: 4.8, aoe: 3.2, cooldown: 0.82, icon: "hammer" }, "Woodcutter Axe": { damage: 85, range: 3.8, aoe: 1.8, cooldown: 0.9, icon: "🪓", harvest: true }, "Orc War Club": { damage: 200, range: 3, aoe: 3, cooldown: 1.65, icon: "🪵" } };
  let equipment = { owned: ["Hammer"], equipped: "Hammer" };
  try {
    const saved = JSON.parse(localStorage.getItem(equipmentKey));
    if (saved && Array.isArray(saved.owned)) {
      equipment.owned = [.../* @__PURE__ */ new Set(["Hammer", ...saved.owned.filter((name) => weaponDefs[name])])];
      equipment.equipped = weaponDefs[saved.equipped] ? saved.equipped : "Hammer";
    }
  } catch {
  }
  const blacksmithMenu = $("#blacksmithMenu"), shopMenu = $("#shopMenu"), upgradeTab = $("#upgradeTab"), craftTab = $("#craftTab"), upgradePage = $("#upgradePage"), craftPage = $("#craftPage"), smithStatus = $("#smithStatus"), craftAxe = $("#craftAxe"), craftOrcClub = $("#craftOrcClub"), equippedCard = $("#equippedWeaponCard"), townInterior = $("#townInterior"), townInteriorTitle = $("#townInteriorTitle"), actionPrompt = $("#actionPrompt"), heroStats = document.querySelectorAll(".hero-stats dd"), shopMaterialsTab = $("#shopMaterialsTab"), shopToolsTab = $("#shopToolsTab"), shopMaterialsPage = $("#shopMaterialsPage"), shopToolsPage = $("#shopToolsPage"), shopGold = $("#shopGold"), shopStatus = $("#shopStatus"), buyWood = $("#buyWood"), buyGoblinBone = $("#buyGoblinBone"), buyOrcTusk = $("#buyOrcTusk"), buyStrangeRune = $("#buyStrangeRune"), buyManCaveKey = $("#buyManCaveKey");
  function saveEquipment() {
    localStorage.setItem(equipmentKey, JSON.stringify(equipment));
    writePermanentSave();
  }
  function materialCount(name) {
    return Number(inventory.materials[name] || 0);
  }
  function canAfford(cost) {
    return Object.entries(cost).every(([name, count]) => materialCount(name) >= count);
  }
  function updateWeaponUI() {
    const weapon = weaponDefs[equipment.equipped];
    if (heroStats[0]) heroStats[0].textContent = equipment.equipped;
    if (heroStats[1]) heroStats[1].textContent = `${weapon.damage} damage · ${weapon.range} range`;
    if (equippedCard) equippedCard.innerHTML = `<strong>${equipment.equipped}</strong><span>${weapon.damage} damage · ${weapon.range} range · ${weapon.aoe} AOE</span>`;
    if (craftAxe) {
      craftAxe.disabled = equipment.owned.includes("Woodcutter Axe") || !canAfford({ "Goblin Bone": 5 });
      craftAxe.textContent = equipment.owned.includes("Woodcutter Axe") ? "Owned" : "Craft Axe";
    }
    if (craftOrcClub) {
      craftOrcClub.disabled = equipment.owned.includes("Orc War Club") || !canAfford({ "Goblin Bone": 25, "Orc Tusk": 10 });
      craftOrcClub.textContent = equipment.owned.includes("Orc War Club") ? "Owned" : "Craft Club";
    }
  }
  function equipWeapon(name) {
    if (!equipment.owned.includes(name)) return;
    equipment.equipped = name;
    saveEquipment();
    renderInventory();
    updateWeaponUI();
    smithStatus.textContent = `${name} equipped.`;
  }
  const renderedInventory = renderInventory;
  renderInventory = () => {
    renderedInventory();
    weaponList.replaceChildren();
    equipment.owned.forEach((name) => {
      const item = document.createElement("li"), icon = document.createElement("span"), badge = document.createElement("span"), weapon = weaponDefs[name];
      icon.className = "item-icon";
      if (weapon.icon === "hammer") icon.classList.add("sledge-icon");
      else icon.textContent = weapon.icon;
      badge.className = "item-amount";
      badge.textContent = name === equipment.equipped ? "Equipped" : "Equip";
      item.dataset.tooltip = `${name} — ${weapon.damage} damage, ${weapon.range} range, ${weapon.aoe} AOE`;
      item.setAttribute("aria-label", item.dataset.tooltip);
      item.tabIndex = 0;
      item.replaceChildren(icon, badge);
      item.onclick = () => equipWeapon(name);
      item.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          equipWeapon(name);
        }
      };
      weaponList.append(item);
    });
    updateWeaponUI();
  };
  function craftWeapon(name, cost) {
    if (equipment.owned.includes(name)) {
      equipWeapon(name);
      return;
    }
    if (!canAfford(cost)) {
      smithStatus.textContent = "You do not have enough materials.";
      return;
    }
    Object.entries(cost).forEach(([material, count]) => {
      inventory.materials[material] -= count;
      if (inventory.materials[material] <= 0) delete inventory.materials[material];
    });
    equipment.owned.push(name);
    equipment.equipped = name;
    saveInventory();
    saveEquipment();
    renderInventory();
    smithStatus.textContent = `Crafted and equipped: ${name}.`;
  }
  craftAxe.onclick = () => craftWeapon("Woodcutter Axe", { "Goblin Bone": 5 });
  craftOrcClub.onclick = () => craftWeapon("Orc War Club", { "Goblin Bone": 25, "Orc Tusk": 10 });
  function showSmithPage(crafting) {
    upgradeTab.classList.toggle("active", !crafting);
    craftTab.classList.toggle("active", crafting);
    upgradePage.hidden = crafting;
    craftPage.hidden = !crafting;
    smithStatus.textContent = "";
  }
  upgradeTab.onclick = () => showSmithPage(false);
  craftTab.onclick = () => showSmithPage(true);
  function showShopPage(tools) {
    shopMaterialsTab.classList.toggle("active", !tools);
    shopToolsTab.classList.toggle("active", tools);
    shopMaterialsPage.hidden = tools;
    shopToolsPage.hidden = !tools;
    shopStatus.textContent = "";
  }
  function updateShopUI() {
    shopGold.textContent = bramGold.toLocaleString();
    buyWood.disabled = bramGold < 10;
    buyGoblinBone.disabled = bramGold < 40;
    buyOrcTusk.disabled = bramGold < 500;
    const ownsRune = inventory.keyItems.includes("Strange Rune");
    const ownsManCaveKey = inventory.keyItems.includes("Key to the Man Cave");
    buyStrangeRune.disabled = ownsRune || bramGold < 1;
    buyManCaveKey.disabled = ownsManCaveKey || bramGold < 1000;
    buyStrangeRune.textContent = ownsRune ? "Owned" : "Buy · 1 Gold";
    buyManCaveKey.textContent = ownsManCaveKey ? "Owned" : "Buy · 1,000 Gold";
  }
  function buyMaterial(name, price) {
    if (bramGold < price) {
      shopStatus.textContent = "You do not have enough gold.";
      return;
    }
    bramGold -= price;
    addMaterial(name);
    updateRewards();
    writePermanentSave();
    updateShopUI();
    shopStatus.textContent = `Purchased 1 ${name}.`;
  }
  function buyTool(name, price) {
    if (inventory.keyItems.includes(name)) {
      shopStatus.textContent = `${name} is already owned.`;
      return;
    }
    if (bramGold < price) {
      shopStatus.textContent = "You do not have enough gold.";
      return;
    }
    bramGold -= price;
    addKeyItem(name);
    updateRewards();
    writePermanentSave();
    updateShopUI();
    shopStatus.textContent = `Purchased ${name}.`;
  }
  shopMaterialsTab.onclick = () => showShopPage(false);
  shopToolsTab.onclick = () => showShopPage(true);
  buyWood.onclick = () => buyMaterial("Wood", 10);
  buyGoblinBone.onclick = () => buyMaterial("Goblin Bone", 40);
  buyOrcTusk.onclick = () => buyMaterial("Orc Tusk", 500);
  buyStrangeRune.onclick = () => buyTool("Strange Rune", 1);
  buyManCaveKey.onclick = () => buyTool("Key to the Man Cave", 1000);
  setInterval(() => {
    if (townInterior.hidden) {
      blacksmithMenu.hidden = shopMenu.hidden = true;
      return;
    }
    const smith = townInteriorTitle.textContent === "The Ember Anvil";
    blacksmithMenu.hidden = !smith;
    shopMenu.hidden = smith;
    updateWeaponUI();
    if (!smith) updateShopUI();
  }, 120);
  let lastWeaponAttack = 0;
  slam = () => {
    const weapon = weaponDefs[equipment.equipped], now = performance.now();
    if (now - lastWeaponAttack < weapon.cooldown * 1e3) return;
    const inRange = enemies.filter((enemy) => enemy.m.position.distanceTo(bram.position) < weapon.range);
    if (!inRange.length) return;
    lastWeaponAttack = now;
    let target;
    if (targeting.value === "last") target = inRange.reduce((best, enemy) => enemy.t < best.t ? enemy : best);
    else if (targeting.value === "strong") target = inRange.reduce((best, enemy) => enemy.h > best.h ? enemy : best);
    else target = inRange.reduce((best, enemy) => enemy.t > best.t ? enemy : best);
    const point = target.m.position.clone();
    enemies.forEach((enemy) => {
      if (enemy.m.position.distanceTo(point) < weapon.aoe) enemy.h -= weapon.damage;
    });
    const ring = new T.Mesh(new T.RingGeometry(0.25, 0.55, 36), new T.MeshBasicMaterial({ color: equipment.equipped === "Orc War Club" ? "#9bd06a" : "#f7d98a", transparent: true, side: T.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(point);
    ring.position.y = 0.1;
    battle.add(ring);
    effects.push({ m: ring, t: 0 });
  };
  const harvestTrees = [], treePositions = [[-11, 3], [-8, -10], [4, -12], [11, -5], [12, 7], [5, 13], [-5, 12]];
  for (const [x, z] of treePositions) {
    const tree = new T.Group(), trunk = new T.Mesh(new T.CylinderGeometry(0.22, 0.42, 3.1, 10), mat("#4a3424")), crownA = new T.Mesh(new T.IcosahedronGeometry(1.25, 2), mat("#2f5738")), crownB = new T.Mesh(new T.IcosahedronGeometry(0.95, 2), mat("#3d6842"));
    trunk.position.y = 1.55;
    crownA.position.set(0, 3.45, 0);
    crownB.position.set(0.55, 4.05, 0.1);
    trunk.castShadow = crownA.castShadow = crownB.castShadow = true;
    tree.add(trunk, crownA, crownB);
    tree.position.set(x, 0, z);
    tree.userData.ready = true;
    tree.userData.solidRadius = 0.62;
    world.add(tree);
    harvestTrees.push(tree);
  }
  function nearestTree() {
    let closest = null, distance = Infinity;
    harvestTrees.filter((tree) => tree.visible && tree.userData.ready).forEach((tree) => {
      const d = bram.position.distanceTo(tree.position);
      if (d < distance) {
        closest = tree;
        distance = d;
      }
    });
    return { tree: closest, distance };
  }
  setInterval(() => {
    const near = state === "world" && loc.textContent === "Meadow of Cinders" ? nearestTree() : { tree: null, distance: Infinity };
    actionPrompt.hidden = near.distance > 2.4;
    if (!actionPrompt.hidden) actionPrompt.textContent = weaponDefs[equipment.equipped].harvest ? "Press E to chop tree" : "Equip the Woodcutter Axe to chop this tree";
  }, 100);
  window.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "e" || event.repeat || state !== "world" || loc.textContent !== "Meadow of Cinders") return;
    const { tree, distance } = nearestTree();
    if (!tree || distance > 2.4 || !weaponDefs[equipment.equipped].harvest) return;
    tree.userData.ready = false;
    tree.visible = false;
    addMaterial("Wood");
    actionPrompt.hidden = true;
    msg.textContent = "Tree chopped: +1 Wood. It will grow back soon.";
    setTimeout(() => {
      tree.visible = true;
      tree.userData.ready = true;
    }, 15e3);
  });
  const priorReset = resetInventory;
  resetInventory = () => {
    priorReset();
    equipment = { owned: ["Hammer"], equipped: "Hammer" };
    localStorage.removeItem(equipmentKey);
    renderInventory();
  };
  renderInventory();
  saveEquipment();
}, 80);
setTimeout(() => {
  const itemToast = $("#itemToast"), pickupQueue = [];
  let pickupShowing = false;
  function showNextPickup() {
    if (pickupShowing || !pickupQueue.length) return;
    pickupShowing = true;
    itemToast.textContent = pickupQueue.shift();
    itemToast.hidden = false;
    itemToast.classList.remove("leaving");
    setTimeout(() => {
      itemToast.classList.add("leaving");
      setTimeout(() => {
        itemToast.hidden = true;
        pickupShowing = false;
        showNextPickup();
      }, 230);
    }, 1900);
  }
  function announcePickup(text) {
    pickupQueue.push(text);
    showNextPickup();
  }
  const addMaterialWithoutToast = addMaterial;
  addMaterial = (name) => {
    addMaterialWithoutToast(name);
    announcePickup(`${name} +1`);
  };
  const addKeyItemWithoutToast = addKeyItem;
  addKeyItem = (name) => {
    const alreadyOwned = inventory.keyItems.includes(name);
    addKeyItemWithoutToast(name);
    if (!alreadyOwned) announcePickup(`${name} +1`);
  };
  const renderWithoutWoodIcon = renderInventory;
  renderInventory = () => {
    renderWithoutWoodIcon();
    materialList.querySelectorAll("li:not(.empty-item)").forEach((item) => {
      if (item.dataset.tooltip?.startsWith("Wood")) {
        const icon = item.querySelector(".item-icon");
        if (icon) icon.textContent = "🪵";
      }
    });
  };
  renderInventory();
}, 140);
setTimeout(() => {
  const clubIconUrl = new URL("../assets/orc-war-club.png", import.meta.url).href, weaponTextureCache = {};
  function weaponTexture(name) {
    if (weaponTextureCache[name]) return weaponTextureCache[name];
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 48;
    const paint = canvas.getContext("2d");
    paint.imageSmoothingEnabled = false;
    paint.fillStyle = "#27372d";
    paint.fillRect(12, 28, 20, 12);
    paint.fillStyle = "#52765d";
    paint.fillRect(13, 20, 18, 12);
    paint.fillStyle = "#efc698";
    paint.fillRect(16, 10, 13, 12);
    paint.fillStyle = "#4a5250";
    paint.fillRect(14, 7, 22, 7);
    paint.fillStyle = "#89938d";
    paint.fillRect(15, 8, 20, 3);
    paint.fillStyle = "#303736";
    paint.fillRect(14, 17, 21, 3);
    paint.fillStyle = "#263229";
    paint.fillRect(14, 39, 7, 7);
    paint.fillRect(25, 39, 7, 7);
    paint.fillStyle = "#efc698";
    paint.fillRect(30, 25, 6, 6);
    if (name === "Woodcutter Axe") {
      paint.save();
      paint.translate(35, 27);
      paint.rotate(-0.34);
      paint.fillStyle = "#704522";
      paint.fillRect(-2, -17, 4, 24);
      paint.fillStyle = "#aeb8b5";
      paint.fillRect(-8, -19, 13, 7);
      paint.fillStyle = "#59625f";
      paint.fillRect(-9, -18, 3, 6);
      paint.restore();
    } else if (name === "Orc War Club") {
      paint.save();
      paint.translate(35, 29);
      paint.rotate(-0.28);
      paint.fillStyle = "#75451f";
      paint.fillRect(-3, -18, 6, 25);
      paint.fillStyle = "#353736";
      paint.fillRect(-4, -8, 8, 4);
      paint.fillRect(-4, 3, 8, 3);
      paint.fillStyle = "#8b5429";
      paint.fillRect(-7, -23, 14, 9);
      paint.fillStyle = "#4a2d18";
      for (const [x, y] of [[-8, -21], [7, -21], [-5, -26], [3, -26]]) paint.fillRect(x, y, 4, 5);
      paint.fillStyle = "#9ba0a1";
      paint.fillRect(-4, -18, 3, 3);
      paint.fillRect(2, -21, 3, 3);
      paint.restore();
    } else {
      paint.fillStyle = "#67421f";
      paint.fillRect(34, 12, 5, 26);
      paint.fillStyle = "#6d7774";
      paint.fillRect(28, 8, 17, 8);
      paint.fillStyle = "#353d3b";
      paint.fillRect(28, 14, 17, 3);
    }
    const texture = new T.CanvasTexture(canvas);
    texture.magFilter = T.NearestFilter;
    texture.minFilter = T.NearestFilter;
    texture.colorSpace = T.SRGBColorSpace;
    weaponTextureCache[name] = texture;
    return texture;
  }
  function equippedName() {
    return document.querySelector(".hero-stats dd")?.textContent || "Hammer";
  }
  function updateBramWeapon() {
    const name = equippedName();
    bram.material.map = weaponTexture(name);
    bram.material.needsUpdate = true;
    bram.userData.equippedWeapon = name;
  }
  const inventoryWithWeaponArt = renderInventory;
  renderInventory = () => {
    inventoryWithWeaponArt();
    weaponList.querySelectorAll("li:not(.empty-item)").forEach((item) => {
      if (item.dataset.tooltip?.startsWith("Orc War Club")) {
        const oldIcon = item.querySelector(".item-icon"), image = document.createElement("img");
        image.className = "item-icon weapon-image";
        image.src = clubIconUrl;
        image.alt = "Spiked Orc War Club";
        oldIcon?.replaceWith(image);
      }
    });
    updateBramWeapon();
  };
  let swing = null;
  function beginWeaponSwing() {
    const name = equippedName(), settings = name === "Orc War Club" ? { duration: 700, arc: 1.05, lift: 0.1 } : name === "Woodcutter Axe" ? { duration: 390, arc: 0.92, lift: 0.26 } : { duration: 480, arc: 0.72, lift: 0.18 };
    swing = { start: performance.now(), ...settings };
  }
  function animateWeaponSwing(now) {
    if (swing) {
      const progress = Math.min(1, (now - swing.start) / swing.duration), windup = Math.min(1, progress / 0.3), strike = Math.max(0, (progress - 0.3) / 0.7), smoothStrike = strike * strike * (3 - 2 * strike), angle = progress < 0.3 ? -swing.arc * 0.48 * windup : -swing.arc * 0.48 + swing.arc * 1.48 * smoothStrike;
      bram.material.rotation = angle;
      bram.position.y = Math.sin(Math.PI * progress) * swing.lift;
      const squash = Math.sin(Math.PI * progress) * (equippedName() === "Orc War Club" ? 0.13 : 0.07);
      bram.scale.set(1.8 * (1 + squash), 1.8 * (1 - squash), 1);
      if (progress >= 1) {
        bram.material.rotation = 0;
        bram.position.y = 0;
        bram.scale.set(1.8, 1.8, 1);
        swing = null;
      }
    }
    requestAnimationFrame(animateWeaponSwing);
  }
  requestAnimationFrame(animateWeaponSwing);
  const slamWithoutAnimation = slam;
  slam = () => {
    const effectCount = effects.length;
    slamWithoutAnimation();
    if (effects.length > effectCount) beginWeaponSwing();
  };
  renderInventory();
}, 180);
setTimeout(() => {
  const oldStyleTextures = {};
  function oldStyleBramTexture(name) {
    if (oldStyleTextures[name]) return oldStyleTextures[name];
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const paint = canvas.getContext("2d");
    paint.imageSmoothingEnabled = false;
    paint.fillStyle = "#2b392e";
    paint.fillRect(8, 17, 16, 10);
    paint.fillStyle = "#587d63";
    paint.fillRect(9, 12, 14, 11);
    paint.fillStyle = "#f1ca9e";
    paint.fillRect(11, 5, 10, 9);
    paint.fillStyle = "#263229";
    paint.fillRect(9, 27, 6, 4);
    paint.fillRect(18, 27, 6, 4);
    paint.fillStyle = "#f1ca9e";
    paint.fillRect(21, 16, 5, 5);
    if (name === "Woodcutter Axe") {
      paint.save();
      paint.translate(25, 21);
      paint.rotate(-0.38);
      paint.fillStyle = "#6e4327";
      paint.fillRect(-2, -13, 4, 19);
      paint.fillStyle = "#aeb8b5";
      paint.fillRect(-7, -15, 11, 6);
      paint.fillStyle = "#535d5b";
      paint.fillRect(-8, -14, 3, 5);
      paint.restore();
    } else if (name === "Orc War Club") {
      paint.save();
      paint.translate(25, 22);
      paint.rotate(-0.3);
      paint.fillStyle = "#75451f";
      paint.fillRect(-2, -13, 5, 19);
      paint.fillStyle = "#343635";
      paint.fillRect(-3, -6, 7, 3);
      paint.fillRect(-3, 3, 7, 2);
      paint.fillStyle = "#8b5429";
      paint.fillRect(-5, -18, 11, 7);
      paint.fillStyle = "#4a2d18";
      paint.fillRect(-7, -17, 3, 4);
      paint.fillRect(5, -17, 3, 4);
      paint.fillRect(-4, -21, 3, 4);
      paint.fillRect(2, -21, 3, 4);
      paint.fillStyle = "#a0a3a3";
      paint.fillRect(-2, -15, 2, 2);
      paint.fillRect(2, -17, 2, 2);
      paint.restore();
    } else {
      paint.fillStyle = "#63452c";
      paint.fillRect(24, 10, 4, 18);
      paint.fillStyle = "#4d5452";
      paint.fillRect(18, 4, 13, 8);
      paint.fillStyle = "#8d9690";
      paint.fillRect(19, 5, 11, 3);
      paint.fillStyle = "#343a3a";
      paint.fillRect(18, 11, 13, 2);
    }
    const texture = new T.CanvasTexture(canvas);
    texture.magFilter = T.NearestFilter;
    texture.minFilter = T.NearestFilter;
    texture.colorSpace = T.SRGBColorSpace;
    oldStyleTextures[name] = texture;
    return texture;
  }
  function currentWeapon() {
    return document.querySelector(".hero-stats dd")?.textContent || "Hammer";
  }
  function applyOldBram() {
    const name = currentWeapon();
    bram.material.map = oldStyleBramTexture(name);
    bram.material.needsUpdate = true;
  }
  const renderWithOldBram = renderInventory;
  renderInventory = () => {
    renderWithOldBram();
    applyOldBram();
    weaponList.querySelectorAll("li:not(.empty-item)").forEach((item) => {
      if (item.dataset.tooltip?.startsWith("Orc War Club")) item.dataset.tooltip = item.dataset.tooltip.replace("3 AOE", "6 AOE");
    });
  };
  let attackReadyAt = 0, axeFollowupPending = false, weaponMotion = null;
  function targetEnemy(range) {
    const available = enemies.filter((enemy) => enemy.m.position.distanceTo(bram.position) < range);
    if (!available.length) return null;
    if (targeting.value === "last") return available.reduce((best, enemy) => enemy.t < best.t ? enemy : best);
    if (targeting.value === "strong") return available.reduce((best, enemy) => enemy.h > best.h ? enemy : best);
    return available.reduce((best, enemy) => enemy.t > best.t ? enemy : best);
  }
  function animateSlash(point) {
    const slash = new T.Mesh(new T.RingGeometry(0.65, 1.15, 40, 1, -1.15, 2.3), new T.MeshBasicMaterial({ color: "#e9f1d1", transparent: true, side: T.DoubleSide }));
    slash.rotation.x = -Math.PI / 2;
    slash.rotation.z = -0.8;
    slash.position.copy(point);
    slash.position.y = 0.22;
    battle.add(slash);
    const started = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - started) / 230), smooth = progress * progress * (3 - 2 * progress);
      slash.rotation.z = -0.8 + smooth * 1.65;
      slash.scale.setScalar(0.72 + smooth * 0.7);
      slash.material.opacity = 1 - progress;
      if (progress < 1) requestAnimationFrame(frame);
      else battle.remove(slash);
    }
    requestAnimationFrame(frame);
  }
  function beginMotion(name) {
    weaponMotion = { start: performance.now(), duration: name === "Woodcutter Axe" ? 250 : name === "Orc War Club" ? 700 : 480, arc: name === "Woodcutter Axe" ? 1.08 : name === "Orc War Club" ? 1.05 : 0.72, lift: name === "Woodcutter Axe" ? 0.22 : name === "Orc War Club" ? 0.1 : 0.18, name };
  }
  function motionFrame(now) {
    if (weaponMotion) {
      const motion = weaponMotion, progress = Math.min(1, (now - motion.start) / motion.duration), windup = Math.min(1, progress / 0.26), strike = Math.max(0, (progress - 0.26) / 0.74), smooth = strike * strike * (3 - 2 * strike);
      bram.material.rotation = progress < 0.26 ? -motion.arc * 0.42 * windup : -motion.arc * 0.42 + motion.arc * 1.42 * smooth;
      bram.position.y = Math.sin(Math.PI * progress) * motion.lift;
      const squash = Math.sin(Math.PI * progress) * (motion.name === "Orc War Club" ? 0.13 : 0.06);
      bram.scale.set(1.8 * (1 + squash), 1.8 * (1 - squash), 1);
      if (progress >= 1) {
        bram.material.rotation = 0;
        bram.position.y = 0;
        bram.scale.set(1.8, 1.8, 1);
        weaponMotion = null;
      }
    }
    requestAnimationFrame(motionFrame);
  }
  requestAnimationFrame(motionFrame);
  function performWeaponAttack(force = false) {
    const name = currentWeapon(), stats = name === "Woodcutter Axe" ? { damage: 85, range: 3.8, aoe: 1.8, cooldown: 360 } : name === "Orc War Club" ? { damage: 200, range: 3, aoe: 6, cooldown: 1650 } : { damage: 65, range: 4.8, aoe: 3.2, cooldown: 820 }, now = performance.now();
    if (!force && now < attackReadyAt) return false;
    const target = targetEnemy(stats.range);
    if (!target) return false;
    attackReadyAt = now + stats.cooldown;
    const point = target.m.position.clone();
    enemies.forEach((enemy) => {
      if (enemy.m.position.distanceTo(point) < stats.aoe) enemy.h -= stats.damage;
    });
    if (name === "Woodcutter Axe") animateSlash(point);
    else {
      const outer = name === "Orc War Club" ? 1.35 : 0.55, inner = name === "Orc War Club" ? 0.85 : 0.25, ring = new T.Mesh(new T.RingGeometry(inner, outer, 40), new T.MeshBasicMaterial({ color: name === "Orc War Club" ? "#9bd06a" : "#f7d98a", transparent: true, side: T.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(point);
      ring.position.y = 0.1;
      battle.add(ring);
      effects.push({ m: ring, t: 0 });
    }
    beginMotion(name);
    if (name === "Woodcutter Axe" && !force && !axeFollowupPending) {
      axeFollowupPending = true;
      setTimeout(() => {
        axeFollowupPending = false;
        if (state === "combat" && currentWeapon() === "Woodcutter Axe") performWeaponAttack(true);
      }, 340);
    }
    return true;
  }
  slam = () => performWeaponAttack(false);
  setInterval(() => {
    const card = $("#equippedWeaponCard");
    if (currentWeapon() === "Orc War Club" && card) card.innerHTML = "<strong>Orc War Club</strong><span>200 damage · 3 range · 6 AOE</span>";
  }, 200);
  renderInventory();
}, 240);
setTimeout(() => {
  const originalBramTextures = {};
  function originalBramTexture(weapon) {
    if (originalBramTextures[weapon]) return originalBramTextures[weapon];
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const paint = canvas.getContext("2d");
    paint.imageSmoothingEnabled = false;

    // Bram's alternate charcoal, sage, and warm-skin palette on the compact silhouette.
    paint.fillStyle = "#27372d";
    paint.fillRect(8, 17, 16, 10);
    paint.fillStyle = "#52765d";
    paint.fillRect(9, 12, 14, 11);
    paint.fillStyle = "#efc698";
    paint.fillRect(11, 5, 10, 9);

    if (weapon === "Woodcutter Axe") {
      paint.fillStyle = "#6e4327";
      paint.fillRect(24, 11, 4, 18);
      paint.fillStyle = "#535d5b";
      paint.fillRect(19, 6, 12, 7);
      paint.fillStyle = "#b7c0bc";
      paint.fillRect(18, 7, 3, 5);
      paint.fillRect(20, 12, 2, 2);
    } else if (weapon === "Orc War Club") {
      // Original pixel-art club: tapered head, iron bands, upper and lower
      // spikes, wrapped handle, and a pointed pommel.
      paint.fillStyle = "#643817";
      paint.fillRect(25, 12, 4, 17);
      paint.fillStyle = "#272b29";
      paint.fillRect(24, 18, 6, 2);
      paint.fillRect(24, 24, 6, 2);
      paint.fillStyle = "#7e4720";
      paint.fillRect(21, 5, 11, 7);
      paint.fillRect(22, 3, 9, 2);
      paint.fillRect(23, 12, 7, 2);
      paint.fillStyle = "#343837";
      paint.fillRect(21, 7, 11, 2);
      paint.fillRect(22, 11, 9, 2);
      paint.fillStyle = "#aeb7b4";
      paint.fillRect(19, 6, 2, 2);
      paint.fillRect(18, 10, 4, 2);
      paint.fillRect(31, 5, 1, 2);
      paint.fillRect(31, 9, 1, 2);
      paint.fillRect(23, 1, 2, 3);
      paint.fillRect(28, 1, 2, 3);
      paint.fillRect(22, 13, 2, 2);
      paint.fillRect(29, 13, 2, 2);
      paint.fillRect(26, 29, 2, 2);
    } else {
      // Original hammer pixels from Bram's launch sprite.
      paint.fillStyle = "#63452c";
      paint.fillRect(24, 10, 4, 18);
      paint.fillStyle = "#4d5452";
      paint.fillRect(18, 4, 13, 8);
      paint.fillStyle = "#8d9690";
      paint.fillRect(19, 5, 11, 3);
      paint.fillStyle = "#343a3a";
      paint.fillRect(18, 11, 13, 2);
    }
    const texture = new T.CanvasTexture(canvas);
    texture.magFilter = T.NearestFilter;
    texture.minFilter = T.NearestFilter;
    texture.colorSpace = T.SRGBColorSpace;
    originalBramTextures[weapon] = texture;
    return texture;
  }
  const currentBramWeapon = () => document.querySelector(".hero-stats dd")?.textContent || "Hammer";
  const applyOriginalBram = () => {
    const weapon = currentBramWeapon();
    bram.material.map = originalBramTexture(weapon);
    bram.material.needsUpdate = true;
    bram.userData.equippedWeapon = weapon;
    bram.scale.set(1.8, 1.8, 1);
  };
  const renderWithOriginalBram = renderInventory;
  renderInventory = () => {
    renderWithOriginalBram();
    applyOriginalBram();
  };
  applyOriginalBram();
}, 400);
const inventoryKey = "legend-of-bram-inventory-v1", inventoryButton = $("#inventoryButton"), inventoryPanel = $("#inventoryPanel"), closeInventory = $("#closeInventory"), weaponList = $("#weaponList"), materialList = $("#materialList"), keyItemList = $("#keyItemList");
let inventory = { materials: {}, keyItems: [] };
try {
  const savedInventory = JSON.parse(localStorage.getItem(inventoryKey));
  if (savedInventory && typeof savedInventory === "object") inventory = { materials: savedInventory.materials || {}, keyItems: Array.isArray(savedInventory.keyItems) ? savedInventory.keyItems : [] };
} catch {
}
function saveInventory() {
  localStorage.setItem(inventoryKey, JSON.stringify(inventory));
  writePermanentSave();
}
function inventoryRows(list, items) {
  list.replaceChildren();
  if (!items.length) {
    const item = document.createElement("li");
    item.className = "empty-item";
    item.textContent = "Nothing here yet.";
    list.append(item);
    return;
  }
  items.forEach(([name, count]) => {
    const item = document.createElement("li"), amount = document.createElement("span");
    item.textContent = name;
    amount.textContent = count;
    item.append(amount);
    list.append(item);
  });
}
function renderInventory() {
  inventoryRows(weaponList, [["Hammer", "Equipped"]]);
  inventoryRows(materialList, Object.entries(inventory.materials));
  inventoryRows(keyItemList, inventory.keyItems.map((item) => [item, "Quest"]));
}
function addMaterial(name) {
  inventory.materials[name] = (inventory.materials[name] || 0) + 1;
  saveInventory();
  renderInventory();
}
function addKeyItem(name) {
  if (!inventory.keyItems.includes(name)) {
    inventory.keyItems.push(name);
    saveInventory();
    renderInventory();
  }
}
function resetInventory() {
  inventory = { materials: {}, keyItems: [] };
  localStorage.removeItem(inventoryKey);
  renderInventory();
}
function toggleInventory(open = !inventoryPanel.hidden) {
  inventoryPanel.hidden = !open;
}
inventoryButton.onclick = () => toggleInventory(true);
closeInventory.onclick = () => toggleInventory(false);
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "i" && !event.repeat) {
    event.preventDefault();
    toggleInventory();
  }
});
const priorNewGame = newGameButton.onclick;
newGameButton.onclick = () => {
  priorNewGame();
  resetInventory();
};
teleporter.position.set(0, 0, 0);
teleporter.visible = true;
if (inventory.keyItems.includes("Necromancer Sigil")) {
  inventory.keyItems = inventory.keyItems.map((item) => item === "Necromancer Sigil" ? "Teleporter Key" : item);
  saveInventory();
}
setInterval(() => {
  if (bossDefeated) addKeyItem("Teleporter Key");
}, 500);
function hasTeleporterKey() {
  return inventory.keyItems.includes("Teleporter Key");
}
function useTeleporter() {
  if (state !== "world" || bram.position.distanceTo(teleporter.position) > 2.7) return;
  if (!hasTeleporterKey()) {
    msg.textContent = "The meadow teleporter is locked. It requires the Teleporter Key.";
    msg.classList.add("band-alert");
    return;
  }
  msg.textContent = "The Teleporter Key unlocks the portal. Its destination is coming soon.";
  msg.classList.add("band-alert");
}
setInterval(() => {
  if (state === "world" && bram.position.distanceTo(teleporter.position) <= 2.7) {
    msg.textContent = hasTeleporterKey() ? "Press E to use the teleporter." : "Teleporter locked — requires the Teleporter Key.";
    msg.classList.add("band-alert");
  }
}, 100);
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "e") useTeleporter();
});
renderInventory();

// Solid-world collision. Decorative grass, flowers, puddles, and path pebbles
// remain walkable, while every substantial prop tagged above blocks Bram.
const movementBeforeWorldCollision = move, bramCollisionRadius = 0.42;
let solidWorldObjects = [];
function refreshSolidWorldObjects() {
  solidWorldObjects = [];
  world.traverse((object) => {
    if (object.userData.solidRadius || object.userData.solidBox) solidWorldObjects.push(object);
  });
}
refreshSolidWorldObjects();
setInterval(refreshSolidWorldObjects, 500);
function objectIsVisible(object) {
  for (let current = object; current; current = current.parent) {
    if (!current.visible) return false;
  }
  return true;
}
function worldCollisionScore(position) {
  let score = 0;
  if (loc.textContent === "Starfall Town") {
    const localX = position.x - 100, localZ = position.z - 100, wallLimit = 15.95;
    score += Math.max(0, Math.abs(localX) - wallLimit);
    score += Math.max(0, Math.abs(localZ) - wallLimit);
  } else if (loc.textContent === "Meadow of Cinders") {
    score += Math.max(0, Math.hypot(position.x, position.z) - 14.8);
  }
  solidWorldObjects.forEach((object) => {
    if (!objectIsVisible(object) || object === bram) return;
    const radius = Number(object.userData.solidRadius || 0), box = object.userData.solidBox;
    if (!radius && !box) return;
    const center = object.getWorldPosition(new T.Vector3());
    if (radius) {
      score += Math.max(0, radius + bramCollisionRadius - Math.hypot(position.x - center.x, position.z - center.z));
    } else {
      const overlapX = Number(box.halfX) + bramCollisionRadius - Math.abs(position.x - center.x);
      const overlapZ = Number(box.halfZ) + bramCollisionRadius - Math.abs(position.z - center.z);
      if (overlapX > 0 && overlapZ > 0) score += Math.min(overlapX, overlapZ);
    }
  });
  return score;
}
move = (d) => {
  const before = bram.position.clone(), beforeScore = worldCollisionScore(before);
  movementBeforeWorldCollision(d);
  if (state !== "world") return;
  const desired = bram.position.clone(), desiredScore = worldCollisionScore(desired);
  if (desiredScore <= 1e-4 || desiredScore < beforeScore - 1e-4) return;
  const xOnly = new T.Vector3(desired.x, before.y, before.z), zOnly = new T.Vector3(before.x, before.y, desired.z), xScore = worldCollisionScore(xOnly), zScore = worldCollisionScore(zOnly);
  if (xScore <= 1e-4 || xScore < beforeScore - 1e-4) bram.position.copy(xOnly);
  else if (zScore <= 1e-4 || zScore < beforeScore - 1e-4) bram.position.copy(zOnly);
  else bram.position.copy(before);
  follow(bram.position);
};
