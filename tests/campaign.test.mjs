import { test } from "node:test";
import assert from "node:assert/strict";
import {
  restore,
  extensions,
  weaponStats,
  loot,
  buy,
  craft,
  findEcho,
  claimContract,
  forge,
  canEnterSentinel,
  awardSentinel,
} from "../src/campaign.mjs";
const fresh = () =>
  restore({
    version: 4,
    gold: 0,
    exp: 0,
    goblins: 0,
    quest: "meet_calder",
    equipped: "Hammer",
    weapons: ["Hammer"],
    materials: {
      Wood: 0,
      "Goblin Bone": 0,
      "Orc Tusk": 0,
      "Bat Wing": 0,
      "Vampire Shard": 0,
    },
    upgrades: { damage: 0, range: 0, aoe: 0 },
    visited: {},
    keyItems: [],
    cutscenes: [],
    defeatedBands: [],
    ...extensions(),
  });
test("old V4 saves retain progress and recover interrupted milestones", () => {
  const g = restore(fresh(), {
    gold: 876,
    exp: 345,
    goblins: 12,
    quest: "kill_goblins",
    materials: { Wood: 7 },
    bossDefeated: false,
  });
  assert.equal(g.gold, 876);
  assert.equal(g.exp, 345);
  assert.equal(g.materials.Wood, 7);
  assert.equal(g.quest, "return_calder");
  assert.deepEqual(g.echoes, []);
});
test("boss unlock survives missing legacy key", () => {
  const g = restore(fresh(), { bossDefeated: true, quest: "defeat_calder" });
  assert.equal(g.quest, "use_portal");
  assert.ok(g.keyItems.includes("Teleporter Key"));
});
test("bad counts and duplicate legacy items are sanitized", () => {
  const g = restore(fresh(), {
    gold: -2,
    exp: Infinity,
    keyItems: ["Strange Rune", "Strange Rune"],
    position: { x: NaN, z: 2 },
  });
  assert.equal(g.gold, 0);
  assert.equal(g.exp, 0);
  assert.equal(g.keyItems.length, 1);
  assert.equal(g.position.x, -4);
});
test("materials repeat; unique tools cannot charge twice", () => {
  const g = fresh();
  g.gold = 100;
  assert.ok(buy(g, "buyWood"));
  assert.ok(buy(g, "buyWood"));
  assert.equal(g.materials.Wood, 2);
  assert.ok(buy(g, "buyRune"));
  assert.equal(buy(g, "buyRune"), false);
  assert.equal(g.gold, 79);
});
test("purchases cannot make gold negative", () => {
  const g = fresh();
  assert.equal(buy(g, "buyTusk"), false);
  assert.equal(g.gold, 0);
});
test("crafting atomically consumes ingredients and never duplicates weapons", () => {
  const g = fresh();
  g.materials["Goblin Bone"] = 25;
  assert.equal(craft(g, "craftClub"), false);
  assert.equal(g.materials["Goblin Bone"], 25);
  g.materials["Orc Tusk"] = 10;
  assert.ok(craft(g, "craftClub"));
  assert.equal(g.materials["Orc Tusk"], 0);
  assert.equal(craft(g, "craftClub"), false);
  assert.equal(g.equipped, "Orc War Club");
});
test("weapons have different roles and upgrades apply to each", () => {
  const g = fresh(),
    hammer = weaponStats(g);
  g.equipped = "Woodcutter Axe";
  const axe = weaponStats(g);
  assert.ok(axe.cooldown < hammer.cooldown);
  g.equipped = "Orc War Club";
  const club = weaponStats(g);
  assert.equal(club.damage, 200);
  assert.equal(club.range, 3);
  assert.equal(club.aoe, 6);
  g.upgrades.damage = 1;
  g.forgeLevel = 1;
  assert.equal(weaponStats(g).damage, 218.4);
});
test("drop boundaries preserve requested probabilities", () => {
  assert.deepEqual(loot("goblin", () => 0.099).items, { "Goblin Bone": 1 });
  assert.deepEqual(loot("goblin", () => 0.1).items, {});
  assert.deepEqual(loot("orc", () => 0.249).items, { "Orc Tusk": 1 });
  assert.deepEqual(loot("orc", () => 0.25).items, {});
  assert.equal(loot("bat", () => 0.000989).items["Vampire Shard"], 1);
  assert.equal(loot("bat", () => 0.00099).items["Vampire Shard"], undefined);
  assert.deepEqual(loot("rock", () => 0).items, {});
});
test("echo rewards cannot be claimed twice", () => {
  const g = fresh();
  assert.ok(findEcho(g, "watch"));
  assert.equal(findEcho(g, "watch"), false);
  assert.equal(g.gold, 90);
  assert.equal(findEcho(g, "fake"), false);
});
test("contracts pay only at each three victories", () => {
  const g = fresh();
  g.wins = 3;
  assert.ok(claimContract(g));
  assert.equal(claimContract(g), false);
  assert.equal(g.materials["Orc Tusk"], 2);
  g.wins = 6;
  assert.ok(claimContract(g));
});
test("forge checks all resources before spending", () => {
  const g = fresh();
  g.gold = 100;
  assert.equal(forge(g), false);
  assert.equal(g.gold, 100);
  g.materials.Wood = 2;
  assert.ok(forge(g));
  assert.equal(g.forgeLevel, 1);
  assert.equal(g.gold, 20);
});
test("hidden guardian requires memories and its reward is one-time", () => {
  const g = fresh();
  g.echoes = ["watch", "lake", "hearth"];
  assert.equal(canEnterSentinel(g), false);
  g.bossDefeated = true;
  assert.ok(canEnterSentinel(g));
  assert.ok(awardSentinel(g));
  assert.equal(awardSentinel(g), false);
  assert.equal(g.gold, 750);
  assert.equal(g.upgrades.aoe, 1);
});
test("save round trip preserves purchases, echoes, contracts and blessings", () => {
  const g = fresh();
  g.gold = 3000;
  buy(g, "buyKey");
  findEcho(g, "watch");
  g.wins = 3;
  claimContract(g);
  const loaded = restore(fresh(), JSON.parse(JSON.stringify(g)));
  assert.deepEqual(loaded.keyItems, g.keyItems);
  assert.deepEqual(loaded.materials, g.materials);
  assert.deepEqual(loaded.echoes, g.echoes);
  assert.equal(loaded.gold, g.gold);
  assert.equal(loaded.contracts, 1);
});
