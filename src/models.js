import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Character-only finishing pass: keep the scenery faceted and all rig pivots intact.
function softenCharacter(root, lightweight = false) {
  const materials = new Map();
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const original = mesh.geometry, p = original.parameters;
    let geometry;
    if (original.type === "BoxGeometry" && !lightweight)
      geometry = new RoundedBoxGeometry(p.width, p.height, p.depth, 2,
        Math.min(p.width, p.height, p.depth) * 0.18);
    else if (original.type === "IcosahedronGeometry")
      geometry = new THREE.SphereGeometry(p.radius, lightweight ? 10 : 20, lightweight ? 8 : 14);
    else if (original.type === "CylinderGeometry" || original.type === "ConeGeometry")
      geometry = new THREE.CylinderGeometry(p.radiusTop ?? 0, p.radiusBottom ?? p.radius,
        p.height, lightweight ? 10 : 20, 1, p.openEnded);
    else if (original.type === "SphereGeometry")
      geometry = new THREE.SphereGeometry(p.radius, 24, 16, p.phiStart, p.phiLength, p.thetaStart, p.thetaLength);
    else if (original.type === "TorusGeometry")
      geometry = new THREE.TorusGeometry(p.radius, p.tube, 8, 24, p.arc);
    if (geometry) { mesh.geometry = geometry; original.dispose(); }
    const old = mesh.material;
    if (!materials.has(old)) materials.set(old, new THREE.MeshStandardMaterial({
      color: old.color, roughness: 0.78, metalness: 0,
      emissive: old.emissive, emissiveIntensity: old.emissiveIntensity,
      side: old.side,
    }));
    mesh.material = materials.get(old);
  });
  for (const old of materials.keys()) old.dispose();
  return root;
}

// Storybook diorama: faceted silhouettes, warm materials, fully rigged characters.
const ramp = new THREE.DataTexture(
  new Uint8Array([
    95, 95, 95, 255, 155, 155, 155, 255, 215, 215, 215, 255, 255, 255, 255, 255,
  ]),
  4,
  1,
  THREE.RGBAFormat,
);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
ramp.needsUpdate = true;
const mat = (
  color,
  roughness = 0.9,
  metalness = 0,
  emissive = null,
  intensity = 0,
) =>
  new THREE.MeshToonMaterial({
    color: new THREE.Color(color).offsetHSL(0, 0.08, 0.045),
    gradientMap: ramp,
    emissive: emissive || "#000000",
    emissiveIntensity: intensity,
  });
function part(parent, geometry, material, position = [0, 0, 0], name = "") {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}
function box(parent, size, material, position, name = "") {
  return part(parent, new THREE.BoxGeometry(...size), material, position, name);
}
function ball(parent, r, material, position, detail = 0) {
  return part(
    parent,
    new THREE.IcosahedronGeometry(r, detail),
    material,
    position,
  );
}
function pivot(parent, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  parent.add(group);
  return group;
}
function limb(parent, x, y, skin, boots = false) {
  const group = pivot(parent, x, y, 0);
  part(
    group,
    new THREE.CylinderGeometry(
      boots ? 0.12 : 0.095,
      boots ? 0.105 : 0.08,
      boots ? 0.42 : 0.4,
      6,
    ),
    skin,
    [0, -0.2, 0],
  );
  if (boots) box(group, [0.25, 0.15, 0.38], mat("#263b46"), [0, -0.44, 0.08]);
  else ball(group, 0.11, skin, [0, -0.42, 0], 1);
  return group;
}
function unit(kind = "bram") {
  const root = new THREE.Group(),
    visual = new THREE.Group();
  root.add(visual);
  const monster = kind === "goblin" || kind === "orc",
    cursed = kind === "necro",
    armored = kind === "knight" || cursed;
  const skin = mat(monster ? "#91b953" : cursed ? "#91b5a0" : "#f0c497"),
    cloth = mat(
      kind === "bram"
        ? "#326b7a"
        : kind === "smith"
          ? "#a4563d"
          : kind === "merchant"
            ? "#6869a2"
            : monster
              ? "#866047"
              : cursed
                ? "#4a345d"
                : "#6c8496",
    );
  const metal = mat(cursed ? "#667778" : "#a7bcc6"),
    dark = mat("#293b45"),
    gold = mat("#d5b063");
  part(
    visual,
    new THREE.CylinderGeometry(0.31, 0.4, 0.62, 7),
    cloth,
    [0, 1.02, 0],
  );
  box(visual, [0.68, 0.1, 0.48], dark, [0, 0.81, 0]);
  box(visual, [0.13, 0.13, 0.06], gold, [0, 0.81, 0.26]);
  const leftLeg = limb(visual, -0.18, 0.68, dark, true),
    rightLeg = limb(visual, 0.18, 0.68, dark, true);
  const leftArm = limb(visual, -0.43, 1.31, armored ? metal : skin),
    rightArm = limb(visual, 0.43, 1.31, armored ? metal : skin);
  const head = ball(visual, 0.34, skin, [0, 1.66, 0], 1);
  head.scale.set(1, 1.1, 0.95);
  for (const x of [-0.12, 0.12]) {
    box(visual, [0.075, 0.07, 0.04], dark, [x, 1.68, 0.29]);
    box(visual, [0.1, 0.045, 0.04], dark, [x, 1.79, 0.27]);
  }
  ball(visual, 0.07, skin, [0, 1.61, 0.33], 0);
  if (!monster && !armored) {
    const hair = ball(
      visual,
      0.35,
      mat(kind === "smith" ? "#633e32" : "#664632"),
      [0, 1.86, -0.025],
      1,
    );
    hair.scale.set(1, 0.58, 0.98);
    for (const x of [-0.28, 0.28])
      box(visual, [0.09, 0.19, 0.14], mat("#664632"), [x, 1.72, -0.02]);
    if (kind === "bram") {
      const scarf = mat("#d69243");
      part(
        visual,
        new THREE.TorusGeometry(0.24, 0.085, 5, 8),
        scarf,
        [0, 1.4, 0],
      ).rotation.x = Math.PI / 2;
      const cape = box(
        visual,
        [0.59, 0.75, 0.07],
        mat("#285165"),
        [0, 1.01, -0.31],
      );
      cape.rotation.x = 0.12;
    }
    if (kind === "smith")
      box(visual, [0.48, 0.48, 0.07], mat("#614738"), [0, 0.96, 0.32]);
    if (kind === "merchant")
      part(
        visual,
        new THREE.ConeGeometry(0.48, 0.38, 7),
        mat("#766a99"),
        [0, 2.06, 0],
      );
  }
  if (monster) {
    for (const side of [-1, 1]) {
      const ear = part(visual, new THREE.ConeGeometry(0.14, 0.46, 3), skin, [
        side * 0.44,
        1.75,
        0,
      ]);
      ear.rotation.z = -side * 1.18;
      if (kind === "orc") {
        const tusk = part(
          visual,
          new THREE.ConeGeometry(0.065, 0.25, 5),
          mat("#f8e5b7"),
          [side * 0.2, 1.54, 0.32],
        );
        tusk.rotation.z = -side * 0.3;
      }
    }
  }
  if (armored) {
    const helmet = part(
      visual,
      new THREE.SphereGeometry(0.37, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62),
      metal,
      [0, 1.7, 0],
    );
    helmet.scale.y = 1.05;
    box(visual, [0.55, 0.105, 0.1], dark, [0, 1.72, 0.32]);
    for (const side of [-1, 1]) {
      const shoulder = ball(visual, 0.23, metal, [side * 0.45, 1.3, 0], 0);
      shoulder.scale.y = 0.6;
    }
    box(visual, [0.5, 0.4, 0.09], metal, [0, 1.1, 0.32]);
    if (cursed) {
      box(visual, [0.065, 0.38, 0.11], dark, [0.1, 1.1, 0.37]).rotation.z =
        0.45;
      for (const x of [-0.12, 0.12])
        box(visual, [0.1, 0.05, 0.05], mat("#aff7a4", 1, 0, "#57cd79", 0.8), [
          x,
          1.72,
          0.39,
        ]);
      const shard = box(visual, [0.2, 0.19, 0.08], metal, [-0.3, 0.88, 0.34]);
      shard.rotation.z = -0.5;
    } else box(visual, [0.08, 0.58, 0.08], gold, [0, 1.98, 0]);
  }
  const hammer = pivot(rightArm, 0, -0.36, 0.12);
  root.userData = {
    radius: monster ? 0.5 : 0.52,
    rig: { visual, leftLeg, rightLeg, leftArm, rightArm, hammer },
    weapon: "",
  };
  if (kind === "orc") root.scale.setScalar(1.35);
  else if (kind === "goblin") root.scale.setScalar(0.74);
  return softenCharacter(root);
}
function clearObject(group) {
  for (const child of [...group.children]) {
    child.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) o.material.dispose();
    });
    group.remove(child);
  }
}
export function setBramWeapon(root, weapon) {
  if (root.userData.weapon === weapon) return;
  const mount = root.userData.rig.hammer;
  clearObject(mount);
  const wood = mat("#90603b"),
    iron = mat("#799aa8"),
    edge = mat("#cedad6"),
    leather = mat("#493f39");
  part(
    mount,
    new THREE.CylinderGeometry(0.055, 0.07, 1.25, 7),
    wood,
    [0, 0.15, 0],
  );
  for (const y of [-0.27, -0.17, -0.07])
    part(mount, new THREE.TorusGeometry(0.067, 0.017, 4, 8), leather, [
      0,
      y,
      0,
    ]).rotation.x = Math.PI / 2;
  if (weapon === "Woodcutter Axe") {
    const shape = new THREE.Shape();
    shape.moveTo(-0.08, 0.85);
    shape.lineTo(0.44, 0.88);
    shape.lineTo(0.59, 0.34);
    shape.lineTo(0.18, 0.45);
    shape.lineTo(-0.08, 0.48);
    shape.closePath();
    const blade = part(
      mount,
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 1,
        steps: 1,
      }),
      iron,
      [0, 0, -0.05],
    );
    box(mount, [0.065, 0.51, 0.12], edge, [0.5, 0.61, 0]).rotation.z = 0.28;
  } else if (weapon === "Orc War Club") {
    part(
      mount,
      new THREE.CylinderGeometry(0.23, 0.16, 0.62, 7),
      wood,
      [0, 0.66, 0],
    );
    for (const y of [0.45, 0.78])
      part(mount, new THREE.TorusGeometry(0.22, 0.045, 4, 7), iron, [
        0,
        y,
        0,
      ]).rotation.x = Math.PI / 2;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 2 + 0.3,
        s = part(mount, new THREE.ConeGeometry(0.065, 0.24, 4), edge, [
          Math.cos(a) * 0.23,
          0.46 + Math.floor(i / 4) * 0.32,
          Math.sin(a) * 0.23,
        ]);
      s.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(Math.cos(a), 0.2, Math.sin(a)).normalize(),
      );
    }
  } else {
    box(mount, [0.76, 0.34, 0.34], iron, [0, 0.76, 0]);
    for (const x of [-0.35, 0.35])
      box(mount, [0.09, 0.37, 0.37], edge, [x, 0.76, 0]);
    box(mount, [0.15, 0.1, 0.13], wood, [0, 0.98, 0]);
  }
  root.userData.weapon = weapon;
  softenCharacter(mount);
}
export function createBram() {
  const root = unit();
  setBramWeapon(root, "Hammer");
  return root;
}
export function createGoblin() {
  const root = unit("goblin");
  setBramWeapon(root, "Woodcutter Axe");
  return root;
}
export function createUndead() {
  // The hundred-minion phase uses lightweight rigs instead of full hero models.
  const root = new THREE.Group(),
    visual = new THREE.Group();
  root.add(visual);
  const bone = mat("#b5c2a3"),
    cloth = mat("#687f77");
  box(visual, [0.48, 0.55, 0.3], cloth, [0, 0.88, 0]);
  ball(visual, 0.23, bone, [0, 1.43, 0]);
  const leftLeg = limb(visual, -0.14, 0.64, bone, true),
    rightLeg = limb(visual, 0.14, 0.64, bone, true),
    leftArm = limb(visual, -0.33, 1.08, bone),
    rightArm = limb(visual, 0.33, 1.08, bone);
  root.traverse((o) => (o.castShadow = false));
  root.userData = {
    radius: 0.4,
    rig: { visual, leftLeg, rightLeg, leftArm, rightArm },
  };
  return softenCharacter(root, true);
}
export function createSkeletonBoss(enraged = false) {
  const root = new THREE.Group(), visual = new THREE.Group();
  root.add(visual);
  const bone = mat(enraged ? '#e7c4b7' : '#e9dfbc'), dark = mat('#24252d');
  const glow = new THREE.MeshStandardMaterial({color:enraged?'#ff4444':'#a386ff',emissive:enraged?'#ff2222':'#7044ff',emissiveIntensity:2});
  box(visual,[.1,.65,.12],bone,[0,1.02,0]);
  for(let i=0;i<4;i++) box(visual,[.56-i*.05,.055,.26],bone,[0,.87+i*.12,0]);
  box(visual,[.4,.16,.25],bone,[0,.69,0]);
  ball(visual,.28,bone,[0,1.65,0]);
  for(const x of [-.11,.11]) {
    box(visual,[.14,.12,.055],dark,[x,1.69,.235]);
    box(visual,[.06,.045,.06],glow,[x,1.69,.27]);
  }
  for(let i=0;i<5;i++) box(visual,[.045,.085,.08],bone,[-.12+i*.06,1.4,.19]);
  const leftLeg=limb(visual,-.16,.65,bone,true),rightLeg=limb(visual,.16,.65,bone,true),leftArm=limb(visual,-.38,1.25,bone),rightArm=limb(visual,.38,1.25,bone);
  for(let i=0;i<5;i++) part(visual,new THREE.ConeGeometry(.075,.25+(i%2)*.12,4),mat('#bca15d'),[-.24+i*.12,1.98,0]);
  box(rightArm,[.09,.75,.09],dark,[0,-.57,.14]);
  box(rightArm,[.13,.65,.06],enraged?glow:bone,[0,-1.18,.14]);
  root.userData.rig={visual,leftLeg,rightLeg,leftArm,rightArm};
  root.scale.setScalar(enraged?1.65:1.4);
  return root;
}
export function createOrc() {
  const root = unit("orc");
  setBramWeapon(root, "Orc War Club");
  root.userData.radius = 0.72;
  return root;
}
export function createKnight() {
  const root = unit("knight");
  setBramWeapon(root, "Hammer");
  return root;
}
export const SENTINEL_HEALTH = 21000;
export function createOathboundSentinel() {
  const root=unit('knight'),r=root.userData.rig;
  root.name='Oathbound Sentinel';root.userData.ghostKnight=true;
  root.traverse(o=>{
    if(!o.isMesh)return;
    o.material.color.set('#ffd36a');
    o.material.emissive.set('#e9a831');o.material.emissiveIntensity=.48;
    o.material.metalness=.65;o.material.roughness=.24;
    o.material.transparent=true;o.material.opacity=.78;o.material.depthWrite=false;
    o.castShadow=false;
  });
  const glow=new THREE.MeshBasicMaterial({color:'#fff0ad',transparent:true,opacity:.85,depthWrite:false});
  const veil=new THREE.MeshBasicMaterial({color:'#ffcb60',transparent:true,opacity:.16,depthWrite:false,side:THREE.DoubleSide});
  const halo=part(r.visual,new THREE.TorusGeometry(.49,.025,8,40),glow,[0,2.36,0]);
  halo.rotation.x=Math.PI/2;r.halo=halo;
  for(const x of [-.12,.12]) box(r.visual,[.09,.045,.025],glow,[x,1.72,.39]);
  const blade=box(r.hammer,[.15,1.25,.07],glow,[0,.48,0]);
  part(r.hammer,new THREE.ConeGeometry(.11,.24,4),glow,[0,1.22,0]);
  box(r.hammer,[.54,.09,.15],glow,[0,-.2,0]);
  box(r.hammer,[.09,.35,.09],mat('#92632c'),[0,-.42,0]);
  const mantle=part(r.visual,new THREE.ConeGeometry(.6,1.55,20,1,true),veil,[0,.52,-.12]);
  mantle.rotation.z=Math.PI;
  r.wisps=[];
  for(let i=0;i<8;i++) {
    const w=part(r.visual,new THREE.OctahedronGeometry(.035),glow);
    r.wisps.push(w);
  }
  const light=new THREE.PointLight('#ffcb65',2.5,5);light.position.y=1.5;root.add(light);
  root.traverse(o=>{if(o.isMesh)o.castShadow=false;});
  return root;
}
export function createNecromancer() {
  const root = unit("necro");
  setBramWeapon(root, "Orc War Club");
  return root;
}
export function createVillager(kind = "merchant") {
  const root = unit(kind);
  if (kind === "smith") setBramWeapon(root, "Hammer");
  return root;
}
export function createVampire() {
  const root=new THREE.Group(),visual=new THREE.Group();root.add(visual);
  const skin=mat('#d8cfdd'),black=mat('#211d2b'),red=mat('#74253d');
  part(visual,new THREE.CylinderGeometry(.3,.46,.9,10),black,[0,.95,0]);
  const cape=part(visual,new THREE.ConeGeometry(.72,1.4,10,1,true),red,[0,.95,-.15]);cape.scale.z=.45;
  ball(visual,.31,skin,[0,1.7,0]);
  const hair=ball(visual,.32,black,[0,1.89,-.06]);hair.scale.y=.5;
  for(const x of [-.12,.12]) {
    box(visual,[.08,.06,.05],mat('#ff526e',1,0,'#b81436',1),[x,1.72,.285]);
    const fang=part(visual,new THREE.ConeGeometry(.025,.12,5),mat('#fff5db'),[x*.7,1.51,.285]);fang.rotation.z=Math.PI;
  }
  box(visual,[.18,.12,.07],red,[0,1.37,.3]);
  const leftArm=limb(visual,-.4,1.29,skin),rightArm=limb(visual,.4,1.29,skin),leftLeg=limb(visual,-.18,.62,black,true),rightLeg=limb(visual,.18,.62,black,true);
  root.userData.rig={visual,leftArm,rightArm,leftLeg,rightLeg};return root;
}
export function createBat() {
  const root = new THREE.Group(),
    visual = new THREE.Group();
  root.add(visual);
  ball(visual, 0.22, mat("#665484"), [0, 0, 0], 1);
  for (const x of [-0.09, 0.09])
    ball(visual, 0.035, mat("#f7bc80"), [x, 0.08, 0.18]);
  const wings = [];
  for (const side of [-1, 1]) {
    const wing = pivot(visual, side * 0.12, 0.06, 0),
      shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(side * 0.78, 0.3);
    shape.lineTo(side * 0.61, -0.12);
    shape.lineTo(side * 0.42, -0.04);
    shape.lineTo(side * 0.24, -0.26);
    shape.closePath();
    const membrane = mat("#9e769f");
    membrane.side = THREE.DoubleSide;
    part(wing, new THREE.ShapeGeometry(shape), membrane);
    wings.push(wing);
    part(visual, new THREE.ConeGeometry(0.09, 0.24, 3), mat("#665484"), [
      side * 0.12,
      0.25,
      0,
    ]);
  }
  root.userData = {
    radius: 0.42,
    rig: { visual, leftWing: wings[0], rightWing: wings[1] },
  };
  return softenCharacter(root);
}
export function createRockMonster() {
  const root = new THREE.Group(),
    visual = new THREE.Group();
  root.add(visual);
  const stone = mat("#85908a"),
    moss = mat("#577b68");
  const torso = ball(visual, 0.62, stone, [0, 0.87, 0]);
  torso.scale.set(1, 0.85, 0.75);
  ball(visual, 0.38, moss, [0, 1.47, 0]);
  for (const x of [-0.14, 0.14])
    box(visual, [0.1, 0.055, 0.06], mat("#f8d384", 1, 0, "#dc9c39", 0.5), [
      x,
      1.5,
      0.3,
    ]);
  const leftLeg = limb(visual, -0.29, 0.6, stone, true),
    rightLeg = limb(visual, 0.29, 0.6, stone, true);
  const leftArm = limb(visual, -0.65, 1.04, stone),
    rightArm = limb(visual, 0.65, 1.04, stone);
  root.userData = {
    radius: 0.7,
    rig: { visual, leftLeg, rightLeg, leftArm, rightArm },
  };
  return root;
}
export function tintUnit(root, color) {
  const tint = new THREE.Color(color);
  root.traverse((o) => {
    if (o.material?.color) o.material.color.lerp(tint, 0.4);
  });
}
export function walkUnit(root, time, amount = 0.58) {
  const r = root.userData.rig;
  if (!r) return;
  if(root.userData.ghostKnight) {
    r.visual.position.y=.26+Math.sin(time*2)*.1;
    r.leftArm.rotation.x=-.15+Math.sin(time*1.8)*.06;
    r.rightArm.rotation.x=-.25;
    r.halo.rotation.z=time*.45;
    r.wisps.forEach((w,i)=>{const a=time*.6+i*Math.PI/4;w.position.set(Math.cos(a)*.65,.3+(i/8)*1.9+Math.sin(time+i)*.09,Math.sin(a)*.65);});
    return;
  }
  const s = Math.sin(time * 9);
  if (r.leftWing) {
    r.leftWing.rotation.z = s * 0.6;
    r.rightWing.rotation.z = -s * 0.6;
    root.position.y = 0.85 + Math.sin(time * 4) * 0.14;
    return;
  }
  r.visual.position.y = Math.abs(s) * 0.045;
  if (r.leftLeg) {
    r.leftLeg.rotation.x = s * amount;
    r.rightLeg.rotation.x = -s * amount;
  }
  if (r.leftArm) {
    r.leftArm.rotation.x = -s * amount * 0.55;
    r.rightArm.rotation.x = s * amount * 0.3;
  }
}
export function resetUnit(root) {
  const r = root.userData.rig;
  if (!r) return;
  for (const key of ["leftArm", "rightArm", "leftLeg", "rightLeg", "hammer"])
    r[key]?.rotation.set(0, 0, 0);
  r.visual.position.y = 0;
  r.visual.rotation.set(0, 0, 0);
  r.visual.scale.set(1, 1, 1);
}
export function attackPose(root, p, axe = false) {
  const r = root.userData.rig,
    wind = p < 0.4 ? p / 0.4 : p < 0.68 ? 1 - (p - 0.4) / 0.28 : 0,
    recovery = p > 0.68 ? (1 - p) / 0.32 : 0;
  r.visual.rotation.x = -wind * 0.12 + recovery * 0.14;
  r.rightArm.rotation.x = -wind * 2.5 + recovery * 0.8;
  r.leftArm.rotation.x = -wind * 2.25 + recovery * 0.75;
  r.leftArm.rotation.z = -Math.sin(p * Math.PI) * 0.45;
  r.hammer.rotation.x = -wind * 0.35 + recovery * 2.2;
  if (axe) {
    r.visual.rotation.y = Math.sin(p * Math.PI * 2) * 0.25;
    r.rightArm.rotation.z = -Math.sin(p * Math.PI) * 1.1;
    r.hammer.rotation.z = Math.sin(p * Math.PI) * 0.8;
  }
}
export function createTree(scale = 1, autumn = false) {
  const root = new THREE.Group(),
    trunk = mat("#725441");
  part(
    root,
    new THREE.CylinderGeometry(0.1, 0.24, 1.7, 6),
    trunk,
    [0, 0.85, 0],
  );
  const colors = autumn
    ? ["#c67548", "#e3a25a", "#ba6141"]
    : ["#376f65", "#508c70", "#7aab75"];
  for (let i = 0; i < 3; i++) {
    const crown = part(
      root,
      new THREE.ConeGeometry(1.02 - i * 0.18, 1.45, 7),
      mat(colors[i]),
      [0, 1.6 + i * 0.56, 0],
    );
    crown.rotation.y = i * 0.6;
  }
  root.scale.setScalar(scale);
  root.userData.radius = 0.42 * scale;
  return root;
}
export function createRock(scale = 1) {
  const root = new THREE.Group(),
    stone = ball(root, scale, mat("#81958b"), [0, scale * 0.32, 0]);
  stone.scale.set(1.1, 0.62, 0.84);
  stone.rotation.y = 0.45;
  root.userData.radius = scale * 0.85;
  return root;
}
export function createPortal() {
  const root = new THREE.Group(),
    stone = mat("#7e8f9d"),
    glow = new THREE.MeshBasicMaterial({
      color: "#92e4da",
      transparent: true,
      opacity: 0.78,
    });
  part(root, new THREE.CylinderGeometry(1.5, 1.8, 0.3, 9), stone, [0, 0.15, 0]);
  const ring = part(
      root,
      new THREE.TorusGeometry(1.15, 0.1, 6, 32),
      glow,
      [0, 0.34, 0],
    ),
    core = part(
      root,
      new THREE.CircleGeometry(1.03, 32),
      new THREE.MeshBasicMaterial({
        color: "#5895a9",
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      }),
      [0, 0.33, 0],
    );
  ring.rotation.x = core.rotation.x = -Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2,
      shard = ball(root, 0.18, glow, [
        Math.cos(a) * 1.5,
        0.6,
        Math.sin(a) * 1.5,
      ]);
    shard.userData.orbit = a;
  }
  const light = new THREE.PointLight("#8cf3df", 0, 7);
  light.position.y = 1;
  root.add(light);
  root.userData = { ring, core, light, active: false, radius: 1.8 };
  return root;
}
export function createAltar() {
  const root = new THREE.Group(),
    stone = mat("#bdbea8");
  part(
    root,
    new THREE.CylinderGeometry(1.45, 1.85, 0.35, 8),
    stone,
    [0, 0.18, 0],
  );
  part(
    root,
    new THREE.CylinderGeometry(0.65, 0.85, 1.3, 6),
    stone,
    [0, 0.9, 0],
  );
  part(
    root,
    new THREE.CylinderGeometry(0.92, 0.75, 0.18, 6),
    mat("#7f9294"),
    [0, 1.62, 0],
  );
  const crystal = ball(
    root,
    0.43,
    mat("#9ce9d4", 1, 0, "#4b9f96", 0.65),
    [0, 2.25, 0],
  );
  crystal.scale.y = 1.4;
  const light = new THREE.PointLight("#8de9d6", 0, 7);
  light.position.y = 2;
  root.add(light);
  root.userData = { crystal, light, active: false, radius: 2.05 };
  return root;
}
export function createBuilding(type = "house") {
  const root = new THREE.Group(),
    wall = mat("#e1cfaa"),
    beam = mat("#705444"),
    roof = mat(
      type === "smith" ? "#526c86" : type === "shop" ? "#507d7d" : "#7c6785",
    );
  box(root, [5.4, 0.4, 4], mat("#a4a697"), [0, 0.2, 0]);
  box(root, [5.2, 2.7, 3.8], wall, [0, 1.6, 0]);
  for (const x of [-2.55, 0, 2.55])
    box(root, [0.17, 2.7, 0.16], beam, [x, 1.6, 1.95]);
  box(root, [5.35, 0.14, 0.16], beam, [0, 2.25, 1.96]);
  const shape = new THREE.Shape();
  shape.moveTo(-3, 0);
  shape.lineTo(0, 1.9);
  shape.lineTo(3, 0);
  shape.closePath();
  part(
    root,
    new THREE.ExtrudeGeometry(shape, { depth: 4.6, bevelEnabled: false }),
    roof,
    [0, 2.94, -2.3],
  );
  for (let z = -2.3; z <= 2.3; z += 0.55)
    for (const side of [-1, 1]) {
      const rib = box(root, [3.55, 0.035, 0.045], mat("#7895a0"), [
        side * 1.5,
        3.88,
        z,
      ]);
      rib.rotation.z = -side * 0.56;
    }
  box(root, [1.05, 1.95, 0.12], beam, [0, 1.2, 2]);
  box(root, [0.09, 0.09, 0.05], mat("#e7b369"), [0.3, 1.2, 2.09]);
  for (const x of [-1.5, 1.5]) {
    box(root, [0.9, 0.85, 0.12], beam, [x, 1.55, 2]);
    box(root, [0.68, 0.63, 0.14], mat("#f1c77a", 1, 0, "#d08d48", 0.3), [
      x,
      1.55,
      2.05,
    ]);
    box(root, [0.06, 0.69, 0.16], beam, [x, 1.55, 2.08]);
    box(root, [0.74, 0.05, 0.16], beam, [x, 1.55, 2.08]);
    box(root, [1.1, 0.2, 0.4], mat("#90694f"), [x, 0.96, 2.2]);
    for (let i = 0; i < 3; i++)
      ball(root, 0.14, mat(i % 2 ? "#d7a6b2" : "#7a9f6c"), [
        x - 0.3 + i * 0.3,
        1.13,
        2.23,
      ]);
  }
  box(root, [0.65, 2, 0.7], mat("#9ba397"), [-1.8, 3.6, -0.7]);
  root.userData = { radius: 3.05, type };
  return root;
}
export function createInterior(type) {
  const root = new THREE.Group(),
    dark = type === "basement";
  if(type === "house") {
    const shape = new THREE.Shape();
    shape.moveTo(-9,-7);shape.lineTo(9,-7);shape.lineTo(9,7);shape.lineTo(-9,7);shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-1.25,2.7);hole.lineTo(-1.25,6);hole.lineTo(1.25,6);hole.lineTo(1.25,2.7);hole.closePath();
    shape.holes.push(hole);
    part(root,new THREE.ShapeGeometry(shape),mat('#a4805e')).rotation.x=-Math.PI/2;
    box(root,[2.5,.1,3.3],mat('#272d37'),[0,-1.95,-4.35]);
    for(const x of [-1.25,1.25]) box(root,[.12,2,3.3],mat('#765f49'),[x,-1,-4.35]);
  } else box(root, [18, 0.25, 14], mat(dark ? "#626d73" : "#a4805e"), [0, -0.12, 0]);
  for (const [x, z, sx, sz] of [
    [0, -7, 18, 0.3],
    [-9, 0, 0.3, 14],
    [9, 0, 0.3, 14],
  ])
    box(root, [sx, 3.6, sz], mat(dark ? "#84948f" : "#ddcdae"), [x, 1.8, z]);
  for (const x of [-6, -3, 0, 3, 6])
    box(root, [0.18, 3.6, 0.22], mat("#796352"), [x, 1.8, -6.78]);
  for (let z = -6.5; z < 7; z += 0.65) {
    if(type === "house" && z < -2.7 && z > -6) continue;
    box(root, [17.8, 0.01, 0.02], mat(dark ? "#78817d" : "#87684e"), [
      0,
      0.015,
      z,
    ]);
  }
  if (!dark) {
    box(
      root,
      [4, 0.03, 3],
      mat(type === "smith" ? "#738b96" : "#9685a5"),
      [0, 0.035, 1.4],
    );
    box(root, [3.6, 0.035, 2.6], mat("#cab99c"), [0, 0.04, 1.4]);
  }
  return root;
}
export { mat, part, box };
