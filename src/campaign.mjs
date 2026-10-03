// Shared rules used by the game and the regression tests. Keep save names stable.
export const WEAPONS = {
  "Vampire Sword": { damage: 200, range: 4, aoe: 2, cooldown: .39, animation: .32 },
  Hammer: { damage: 65, range: 4.8, aoe: 3.2, cooldown: 0.82, animation: 0.62 },
  "Woodcutter Axe": {
    damage: 42,
    range: 4.4,
    aoe: 1.8,
    cooldown: 0.3,
    animation: 0.26,
  },
  "Orc War Club": {
    damage: 200,
    range: 3,
    aoe: 6,
    cooldown: 1.65,
    animation: 0.95,
  },
};
export const SECRETS = [
  {
    id: "watch",
    zone: "meadow",
    x: 18,
    z: -18,
    title: "The Watchman’s Oath",
    hint: "A broken arch watches the north-east meadow.",
    text: "Calder once stood beside Bram’s father. His oath was to guard the living, not command the dead. A line has been scratched beneath it: “An oath is a choice, made again every morning.”",
    gold: 90,
    exp: 60,
  },
  {
    id: "lake",
    zone: "meadow",
    x: -17,
    z: -12,
    title: "A Letter Never Sent",
    hint: "Look beside the water, west of the old altar.",
    text: "“Mira, if the beacon goes dark, lead them home. There is a chamber below my house. Do not mistake its guardian for its prisoner.” The signature is Bram’s father’s.",
    gold: 75,
    exp: 75,
  },
  {
    id: "hearth",
    zone: "town",
    x: -21,
    z: -14,
    title: "The Last Lantern",
    hint: "A lonely lantern burns behind Starfall’s smithy.",
    text: "Oren kept a lantern lit for every missing traveller. Only this one remains. Inside its base is a note: “The Stoneguard did not abandon us. He went below.”",
    gold: 100,
    exp: 80,
  },
  {
    id: "cellar",
    zone: "basement",
    x: 5,
    z: -2,
    title: "The Stoneguard’s Map",
    hint: "The old cellar has more than one thing worth investigating.",
    text: "Three marks circle a sealed chamber at the end of the Hollow. “The sentinel binds the breach. If it forgets its purpose, remind it with the light we left behind.”",
    gold: 100,
    exp: 100,
  },
  {
    id: "depths",
    zone: "cave",
    x: -7,
    z: -28,
    title: "An Echo in the Stone",
    hint: "Follow the deepest bend of the Hollow.",
    text: "A memory answers Bram’s touch: his father, lowering his hammer, facing something beyond a wall of light. “Some doors must stay closed. But no one should have to stand alone.”",
    gold: 150,
    exp: 150,
  },
];
export function extensions() {
  return {
    echoes: [],
    wins: 0,
    contracts: 0,
    forgeLevel: 0,
    harvested: {},
    secretBossDefeated: false,
    skeletonBossDefeated: false,
    extinguishedLanterns: [],
    vampireRiddleStarted: false,
    vampireRiddleStep: 0,
    vampireRiddleSolved: false,
    metVrykolakas: false,
    vampireRecruited: false,
    vampireExp: 0,
    vampirePaths: {blood:0,night:0,vitality:0},
    journeyComplete: false,
    seenStories: [],
    stats: { bats: 0, rocks: 0, orcs: 0 },
    campaignRevision: 1,
  };
}
const count = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
export function restore(defaults, data = {}) {
  const g = { ...defaults, ...extensions(), ...data };
  g.vampireRecruited = data.vampireRecruited === true;
  g.vampireExp=Number.isFinite(data.vampireExp)?Math.max(0,data.vampireExp):0;
  g.vampirePaths=Object.fromEntries(['blood','night','vitality'].map(k=>[k,Math.min(5,count(data.vampirePaths?.[k]))]));
  g.extinguishedLanterns = [...new Set(Array.isArray(data.extinguishedLanterns) ? data.extinguishedLanterns : [])].filter(id => Number.isInteger(id) && id >= 0 && id < 4);
  g.vampireRiddleSolved=data.vampireRiddleSolved===true;
  g.vampireRiddleStarted=g.vampireRiddleSolved || data.vampireRiddleStarted===true;
  g.vampireRiddleStep=g.vampireRiddleSolved?3:g.vampireRiddleStarted?Math.min(2,count(data.vampireRiddleStep)):0;
  for (const key of ["materials", "upgrades", "visited", "stats", "harvested"])
    g[key] = { ...(defaults[key] || extensions()[key]), ...(data[key] || {}) };
  for (const key of [
    "keyItems",
    "weapons",
    "defeatedBands",
    "cutscenes",
    "echoes",
    "seenStories",
  ])
    g[key] = [...new Set(Array.isArray(g[key]) ? g[key] : [])].filter(
      (x) => typeof x === "string",
    );
  if (!g.weapons.includes("Hammer")) g.weapons.unshift("Hammer");
  g.weapons = g.weapons.filter((w) => Boolean(WEAPONS[w]));
  g.echoes = g.echoes.filter((id) => SECRETS.some((s) => s.id === id));
  if (!g.weapons.includes(g.equipped) || !WEAPONS[g.equipped])
    g.equipped = "Hammer";
  for (const key of [
    "exp",
    "gold",
    "goblins",
    "wins",
    "contracts",
    "forgeLevel",
  ])
    g[key] = key === "exp" && Number.isFinite(g[key]) ? Math.max(0, g[key]) : count(g[key]);
  for (const key of Object.keys(g.materials))
    g.materials[key] = count(g.materials[key]);
  if (g.wins > 0 || g.bossDefeated) g.tutorial = "done";
  for (const key of ["damage", "range", "aoe"])
    g.upgrades[key] = count(g.upgrades[key]);
  for (const key of ["bats", "rocks", "orcs"])
    g.stats[key] = count(g.stats[key]);
  if (!data.campaignRevision) {
    if (g.defeatedBands.some((id) => id.startsWith("cave-bats")))
      g.stats.bats = Math.max(1, g.stats.bats);
    if (g.defeatedBands.includes("cave-rock-1"))
      g.stats.rocks = Math.max(1, g.stats.rocks);
  }
  g.forgeLevel = Math.min(10, g.forgeLevel);
  g.position = {
    x: Number.isFinite(data.position?.x) ? data.position.x : -4,
    z: Number.isFinite(data.position?.z) ? data.position.z : 10,
  };
  if (g.bossDefeated && !g.keyItems.includes("Teleporter Key"))
    g.keyItems.push("Teleporter Key");
  // Resume milestones, not partially played cutscene callbacks.
  if (g.quest === "kill_goblins" && g.goblins >= 10) g.quest = "return_calder";
  if (
    g.bossDefeated &&
    ["meet_calder", "kill_goblins", "return_calder", "defeat_calder"].includes(
      g.quest,
    )
  )
    g.quest = "use_portal";
  if (g.location === "town" && g.quest === "use_portal")
    g.quest = "visit_services";
  if (g.visited.smith && g.visited.shop && g.quest === "visit_services")
    g.quest = "awaken_altar";
  if (g.visited.manHouse && g.quest === "enter_man_cave")
    g.quest = "find_basement";
  if (g.visited.cave && g.quest === "find_basement") g.quest = "explore_cave";
  if (g.quest === "explore_cave" && g.stats.bats > 0 && g.stats.rocks > 0)
    g.quest = "complete";
  if (g.journeyComplete) g.quest = "epilogue";
  g.version = 4;
  g.campaignRevision = 1;
  return g;
}
export function weaponStats(g) {
  const base = WEAPONS[g.equipped] || WEAPONS.Hammer;
  return {
    ...base,
    damage:
      (base.damage + (g.forgeLevel || 0) * 8) * altarMultiplier(g.upgrades.damage),
    range: base.range * altarMultiplier(g.upgrades.range),
    aoe: base.aoe * altarMultiplier(g.upgrades.aoe),
  };
}
// Additive percentages of the weapon's base stat; each stat has its own tiers.
export function nextAltarPercent(level = 0) {
  return Math.max(1, 5 - Math.floor(count(level) / 10));
}
export function altarMultiplier(level = 0) {
  let remaining=count(level),percent=0;
  for(let tier=5;tier>1;tier--) {
    const levels=Math.min(10,remaining);percent+=levels*tier;remaining-=levels;
  }
  return 1+(percent+remaining)/100;
}
export function loot(type, random = Math.random) {
  const items = {};
  let exp = 0;
  if (type === "goblin") {
    exp = 10;
    if (random() < 0.1) items["Goblin Bone"] = 1;
  }
  if (type === "orc") {
    exp = 100;
    if (random() < 0.25) items["Orc Tusk"] = 1;
  }
  if (type === "bat") {
    exp = 12.5;
    if (random() < 0.3) items["Bat Wing"] = 1;
    if (random() < 0.00099) items["Vampire Shard"] = 1;
  }
  if (type === "rock") exp = 150;
  return { exp, items };
}
export const SHARD_SUMMON = "Vampire Shard Summoning Sigil";
export const vampirePassageOpen = g => new Set(g.extinguishedLanterns || []).size === 4 && [0,1,2,3].every(id => g.extinguishedLanterns.includes(id));
export function extinguishLantern(g, id) {
  if (!Number.isInteger(id) || id < 0 || id > 3 || !(g.materials['Vampire Shard'] > 0)) return false;
  g.extinguishedLanterns ||= [];
  if(g.extinguishedLanterns.includes(id)) return false;
  g.extinguishedLanterns.push(id);
  return true;
}
export function awardSkeleton(g) {
  if (g.skeletonBossDefeated) return false;
  g.skeletonBossDefeated = true;
  if (!g.keyItems.includes(SHARD_SUMMON)) g.keyItems.push(SHARD_SUMMON);
  return true;
}
export function enemyLoot(g, type, random = Math.random) {
  const reward = loot(type, random);
  if (type === "bat" && g.keyItems.includes(SHARD_SUMMON)) {
    reward.items["Vampire Shard"] = 1;
    g.keyItems = g.keyItems.filter(item => item !== SHARD_SUMMON);
    reward.summonConsumed = true;
  }
  return reward;
}
export const STOCK = {
  buyWood: ["Wood", 10],
  buyBone: ["Goblin Bone", 40],
  buyTusk: ["Orc Tusk", 500],
  buyRune: ["Strange Rune", 1, true],
  buyKey: ["Key to the Man Cave", 1000, true],
};
export const RECIPES = {
  craftAxe: ["Woodcutter Axe", { "Goblin Bone": 5 }],
  craftClub: ["Orc War Club", { "Goblin Bone": 25, "Orc Tusk": 10 }],
};
export function buy(g, id) {
  const item = STOCK[id];
  if (!item) return false;
  const [name, cost, unique] = item;
  if (g.gold < cost || (unique && g.keyItems.includes(name))) return false;
  g.gold -= cost;
  if (unique) g.keyItems.push(name);
  else g.materials[name] = (g.materials[name] || 0) + 1;
  return true;
}
export function affordability(g, id) {
  if(id==='vampireSword' || id==='recruitVampire') {
    const sword=id==='vampireSword',owned=sword?g.weapons.includes('Vampire Sword'):g.vampireRecruited;
    return {owned,short:!owned && ((g.materials['Vampire Shard']||0)<1 || (sword && ((g.materials['Bat Wing']||0)<500 || g.gold<3000))),verb:sword?'craft':'recruit'};
  }
  if (STOCK[id]) {
    const [name,cost,unique]=STOCK[id];
    const owned=Boolean(unique && g.keyItems.includes(name));
    return { owned, short: !owned && g.gold < cost, verb:'buy' };
  }
  if (RECIPES[id]) {
    const [name,cost]=RECIPES[id],owned=g.weapons.includes(name);
    return { owned, short: !owned && Object.entries(cost).some(([item,n])=>(g.materials[item]||0)<n), verb:'craft' };
  }
  if(id==='forge') return {owned:g.forgeLevel>=10, short:g.forgeLevel<10 && (g.gold<80+g.forgeLevel*60 || (g.materials.Wood||0)<2+g.forgeLevel),verb:'craft'};
  return {owned:false,short:false,verb:'buy'};
}
export function craft(g, id) {
  const recipe = RECIPES[id];
  if (!recipe) return false;
  const [name, cost] = recipe;
  if (
    g.weapons.includes(name) ||
    Object.entries(cost).some(([item, n]) => (g.materials[item] || 0) < n)
  )
    return false;
  for (const [item, n] of Object.entries(cost)) g.materials[item] -= n;
  g.weapons.push(name);
  g.equipped = name;
  return true;
}
// The caller supplies the current region; these offers never belong to normal shops.
export function vampireTrade(g,id,zone) {
  if(zone!=='vampireRuin' || !['vampireSword','recruitVampire'].includes(id)) return false;
  const status=affordability(g,id);
  if(status.owned || status.short) return false;
  g.materials['Vampire Shard']--;
  if(id==='vampireSword') {
    g.materials['Bat Wing']-=500;g.gold-=3000;
    g.weapons.push('Vampire Sword');g.equipped='Vampire Sword';
  } else {g.vampireRecruited=true;g.vampireExp=0;g.vampirePaths={blood:0,night:0,vitality:0};}
  return true;
}
export const VAMPIRE_PATHS={blood:'Blood Magic',night:'Night Command',vitality:'Ancient Vitality'};
export function vampireLevelCost(g,key){return 100*((g.vampirePaths?.[key]||0)+1);}
export function upgradeVampire(g,key){
  if(!g.vampireRecruited || !VAMPIRE_PATHS[key])return false;
  const levels=g.vampirePaths;
  if(levels[key]>=5 || Object.entries(levels).some(([k,n])=>k!==key && n>0 && n<5) || g.vampireExp<vampireLevelCost(g,key))return false;
  g.vampireExp-=vampireLevelCost(g,key);levels[key]++;return true;
}
export function vampireStats(g){
  const p=g.vampirePaths||{};
  return {damage:90+40*(p.blood||0),aoe:.4+.45*(p.blood||0),range:6+.6*(p.night||0),cooldown:3-.2*(p.night||0),stun:.1*(p.vitality||0)};
}
export function vampireStun(enemy,duration){
  if(enemy.stunImmunity>0 || duration<=0)return false;
  const capped=Math.min(.5,duration);enemy.stun=Math.max(enemy.stun||0,capped);enemy.stunImmunity=capped+3;return true;
}
export function applyBloodLoss(enemy){enemy.bloodLoss=3;}
export function findEcho(g, id) {
  const secret = SECRETS.find((s) => s.id === id);
  if (!secret || g.echoes.includes(id)) return false;
  g.echoes.push(id);
  g.gold += secret.gold;
  g.exp += secret.exp;
  return true;
}
export const VAMPIRE_RIDDLE = 'First wake the bronze throat that has no tongue. Then let the captive sun sleep. Last, touch the cup that thirsts but never drinks. Sound, silence, and an empty promise: in that order the old blood remembers.';
export function advanceVampireRiddle(g, action) {
  if(g.vampireRiddleSolved) return 'complete';
  if(!g.vampireRiddleStarted) return 'locked';
  if(!['bell','brazier','chalice'].includes(action)) return 'locked';
  if(action!==['bell','brazier','chalice'][g.vampireRiddleStep]) {g.vampireRiddleStep=0;return 'wrong';}
  g.vampireRiddleStep++;
  if(g.vampireRiddleStep===3) {g.vampireRiddleSolved=true;return 'solved';}
  return 'correct';
}
export function claimContract(g, variant='standard') {
  if(!['standard','vampire'].includes(variant) || (variant==='vampire' && !g.vampireRiddleSolved)) return false;
  if (g.wins < (g.contracts + 1) * 3) return false;
  g.contracts++;
  g.gold += 180;
  if(variant==='vampire') {
    g.materials['Bat Wing']=(g.materials['Bat Wing']||0)+25;
    g.materials.Wood=(g.materials.Wood||0)+8;
  } else {
    g.materials["Goblin Bone"] += 5;
    g.materials["Orc Tusk"] += 2;
  }
  return true;
}
export function forge(g) {
  const cost = 80 + g.forgeLevel * 60,
    wood = 2 + g.forgeLevel;
  if (g.forgeLevel >= 10 || g.gold < cost || g.materials.Wood < wood)
    return false;
  g.gold -= cost;
  g.materials.Wood -= wood;
  g.forgeLevel++;
  return true;
}
export function canEnterSentinel(g) {
  return g.echoes.length >= 3 && Boolean(g.bossDefeated);
}
export function awardSentinel(g) {
  if (g.secretBossDefeated) return false;
  g.secretBossDefeated = true;
  g.gold += 750;
  g.exp += 500;
  g.upgrades.aoe += 1;
  return true;
}
