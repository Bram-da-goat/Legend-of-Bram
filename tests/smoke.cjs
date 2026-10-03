// Run against a local Vite server. Uses an isolated browser profile: never a player's save.
const { chromium } = require(process.env.BRAM_PLAYWRIGHT_PATH || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const output = path.join(__dirname, "artifacts");
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath:
      process.env.BRAM_CHROME ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: [
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--use-angle=swiftshader",
    ],
  });
  const context = await browser.newContext({viewport: {width:1440,height:960}});
  const page = await context.newPage(), errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  const api = (method, ...args) =>
    page.evaluate(({ method, args }) => window.__bramTest[method](...args), {
      method,
      args,
    });
  const snap = () => api("snapshot");
  const check = (label) => console.log("PASS " + label);
  try {
    await page.goto("http://127.0.0.1:5174/?test");
    await page.waitForFunction(() => !!window.__bramTest);
    await api("pause", true);
    const duplicate = await page.context().newPage();
    await duplicate.goto("http://127.0.0.1:5174/");
    await duplicate.waitForFunction(() => !document.querySelector('#bootError').hidden);
    assert.match(await duplicate.locator('#bootTitle').textContent(), /another tab/);
    await duplicate.close();
    check('second tab cannot overwrite the active save');
    await page.locator("#newGame").click();
    assert.equal((await snap()).state, "cutscene");
    await page.locator("#skipCutscene").click();
    await page.waitForTimeout(1000);
    assert.equal((await snap()).state, "world");
    check("new journey and opening cutscene");
    await page.screenshot({ path: path.join(output, "meadow.png") });
    await page.locator("#journalButton").click();
    assert.equal(await page.locator(".lore-card").count(), 5);
    await page.locator('[data-close="journal"]').click();
    check("journal, five discovery clues, close");
    await api("zone", "meadow", 0, 8);
    assert.equal((await snap()).blocked, false);
    check("portal landing collision recovery");
    await api("load", {
      gold: 2400,
      exp: 600,
      bossDefeated: true,
      quest: "use_portal",
      weapons: ["Hammer", "Woodcutter Axe", "Orc War Club"],
      materials: { Wood: 10, "Goblin Bone": 40, "Orc Tusk": 15 },
      wins: 3,
      tutorial: "done",
    });
    await api("zone", "town", 0, 17);
    assert.equal((await snap()).blocked, false);
    await page.screenshot({ path: path.join(output, "town.png") });
    check("town return-portal safe landing");
    await api("zone", "shopInterior", 0, 0);
    await api("interact");
    if ((await snap()).state === "cutscene") await api("skip");
    assert.equal((await snap()).state, "menu");
    await page.locator('[data-action="buyWood"]').click();
    assert.equal((await snap()).game.materials.Wood, 11);
    await page.locator('[data-service-tab="tools"]').click();
    await page.locator('[data-action="buyRune"]').click();
    assert.equal(
      (await snap()).game.keyItems.filter((x) => x === "Strange Rune").length,
      1,
    );
    assert.equal(
      await page.locator('[data-action="buyRune"]').isDisabled(),
      true,
    );
    await page.locator('[data-action="buyKey"]').click();
    await page.locator('[data-service-tab="contracts"]').click();
    await page.locator('[data-action="contract"]').click();
    assert.equal((await snap()).game.contracts, 1);
    check("NPC shop, repeated materials, unique tools and contract");
    await page.locator('[data-close="serviceMenu"]').click();
    await api("zone", "smithInterior", 0, 0);
    await api("interact");
    if ((await snap()).state === "cutscene") await api("skip");
    await page.locator('[data-action="forge"]').click();
    assert.equal((await snap()).game.forgeLevel, 1);
    check("smith equipment and permanent forge upgrade");
    await page.locator('[data-close="serviceMenu"]').click();
    await page.locator('#inventoryButton').click();
    await page.locator('.inventory-item[aria-label="Woodcutter Axe"]').click();
    assert.equal((await snap()).game.equipped,'Woodcutter Axe');
    assert.equal(await page.locator('.inventory-item img').first().evaluate(img=>img.naturalWidth),120);
    await page.locator('[data-close="inventoryMenu"]').click();
    await api("zone", "town", 0, 7);
    await api("interact");
    assert.equal(await page.locator("#altarMenu").isVisible(), true);
    await page.locator('[data-action="level-damage"]').click();
    assert.equal((await snap()).game.upgrades.damage, 1);
    await page.locator('[data-close="altarMenu"]').click();
    check("altar unlock and spend EXP");
    await api("zone", "manHouse", 0, 5);
    await api("pause", false);
    await page.waitForTimeout(700);
    await api("pause", true);
    await page.screenshot({ path: path.join(output, "hideout.png") });
    await api("zone", "basement", 0, 4);
    await api("pause", false);
    await page.waitForTimeout(700);
    await api("pause", true);
    await page.screenshot({ path: path.join(output, "cellar.png") });
    assert.equal((await snap()).blocked, false);
    await api("zone", "cave", 0, 18);
    assert.equal((await snap()).blocked, false);
    check("house, cellar, cave transitions");
    await api("zone", "basement", 5, 0);
    await api("interact");
    assert.ok((await snap()).game.echoes.includes("cellar"));
    await api("skip");
    check("memory discovery grants permanent lore");
    const saved = (await snap()).game;
    await api("save");
    await page.reload();
    await page.waitForFunction(() => !!window.__bramTest);
    await api("pause", true);
    await page.locator("#continueGame").click();
    assert.equal((await snap()).game.gold, saved.gold);
    assert.equal((await snap()).game.forgeLevel, 1);
    assert.ok((await snap()).game.echoes.includes("cellar"));
    check("reload retains purchases, forge, lore and gold");
    await api("zone", "cave", 0, 15);
    await api("battle", { type: "bat", id: "test-bats" });
    assert.equal((await snap()).environment,'sealed-tunnel');
    await page.screenshot({path:path.join(output,'tunnel-battle.png')});
    assert.equal(await page.locator('#battleWeapon').count(),0);
    await page.locator('#battleInventory').click();
    assert.equal(await page.locator('#inventoryMenu').isVisible(),true);
    await page.locator('[data-close="inventoryMenu"]').click();
    assert.equal(await page.locator('#tutorial').isVisible(), false);
    assert.match(await page.locator('#waveRoster').innerText(), /0\.099%/);
    assert.equal((await snap()).placed, false);
    assert.equal(await page.locator("#prompt").isVisible(), false);
    await api("place", 0, 16);
    await page.locator("#startWave").click();
    await api("step", 6);
    assert.equal((await snap()).enemies.length, 8);
    check("eight cave bats and no overworld NPC prompt in battle");
    await api("leak");
    await api("step", 0.1);
    assert.equal(await page.locator("#battleResult").isVisible(), true);
    assert.equal((await snap()).battleState, "result");
    await page.locator("#resultRetry").click();
    assert.equal((await snap()).environment,'sealed-tunnel');
    assert.equal((await snap()).battleReturn.zone, "cave");
    check("gate failure and retry preserve cave checkpoint");
    await api("place", 0, 16);
    await api("begin");
    await api("step", 6);
    await api("kill");
    await api("step", 0.1);
    assert.equal((await snap()).battleState, "result");
    await page.locator("#resultContinue").click();
    assert.equal((await snap()).zone, "cave");
    check("victory returns to the correct area");
    await api("zone", "meadow", -4, 10);
    await api("battle", { type: "goblin", id: "test-orc", orc: true });
    assert.equal((await snap()).environment,'meadow');
    await api("place", 0, 16);
    await api("begin");
    await api("step", 6);
    assert.equal(
      (await snap()).enemies.filter((e) => e.type === "orc").length,
      1,
    );
    await api("clear");
    await api("battle", { type: "goblin", id: "test-no-orc", orc: false });
    await api("place", 0, 16);
    await api("begin");
    await api("step", 6);
    assert.equal(
      (await snap()).enemies.filter((e) => e.type === "orc").length,
      0,
    );
    check("orc bands match battle composition");
    await api("clear");
    await api("battle", { type: "boss", id: "calder-boss" });
    await api("place", 0, 16);
    await api("begin");
    assert.equal((await snap()).enemies.length, 100);
    await api("reposition");
    await api("begin");
    assert.equal((await snap()).enemies.length, 100);
    assert.equal((await snap()).repositionAvailable, false);
    check("boss reposition does not duplicate undead");
    await api("step", 1);
    await api("ability");
    assert.ok((await snap()).abilityCooldown > 0);
    check("Earthshatter active attack");
    await api("kill");
    await api("step", 0.1);
    assert.equal((await snap()).bossStage, "knight");
    assert.equal((await snap()).enemies[0].hp, 200);
    await api("kill");
    await api("step", 0.1);
    assert.equal((await snap()).state, "cutscene");
    await api("skip");
    assert.equal((await snap()).bossStage, "necro");
    assert.equal((await snap()).enemies[0].hp, 400);
    await api("step", 1);
    await page.screenshot({ path: path.join(output, "battle.png") });
    await api("kill");
    await api("step", 0.1);
    assert.ok((await snap()).game.bossDefeated);
    await api("skip");
    assert.equal((await snap()).zone, "meadow");
    check("complete Calder phase transitions and portal reward");
    await api("load", {
      ...saved,
      bossDefeated: true,
      echoes: ["watch", "lake", "cellar"],
      location: "cave",
      position: { x: -8, z: -30 },
      quest: "complete",
    });
    await api("interact");
    assert.equal((await snap()).state, "cutscene");
    await api("skip");
    if ((await snap()).zone === "cave") {
      await api("interact");
      await api("skip");
    }
    assert.equal((await snap()).zone, "battle");
    await api("place", 0, 16);
    await api("begin");
    assert.equal((await snap()).enemies[0].hp, 21000);
    await api("kill");
    await api("step", 0.1);
    assert.equal((await snap()).game.secretBossDefeated, true);
    await page.locator("#resultContinue").click();
    await api("skip");
    assert.equal((await snap()).game.journeyComplete, true);
    check("hidden Sentinel unlock, reward and epilogue");
    await api('load',{gold:0,materials:{Wood:0,'Goblin Bone':0,'Orc Tusk':0},weapons:['Hammer'],seenStories:['mira','oren'],wins:1});
    await api('zone','shopInterior',0,0);await api('interact');
    if((await snap()).state==='cutscene') await api('skip');
    await page.locator('[data-service-tab="materials"]').click();
    assert.equal(await page.locator('[data-action="buyWood"]').isDisabled(),true);
    assert.match(await page.locator('#serviceContent').innerText(),/You do not have enough to buy this item/);
    await page.locator('[data-close="serviceMenu"]').click();
    await api('zone','smithInterior',0,0);await api('interact');
    if((await snap()).state==='cutscene') await api('skip');
    await page.locator('[data-service-tab="craft"]').click();
    assert.equal(await page.locator('[data-action="craftAxe"]').isDisabled(),true);
    assert.match(await page.locator('#serviceContent').innerText(),/You do not have enough to craft this item/);
    await page.screenshot({path:path.join(output,'crafting.png')});
    await page.locator('[data-close="serviceMenu"]').click();
    await api('zone','cave',3,4);await api('pause',false);await page.waitForTimeout(800);await api('pause',true);
    await page.screenshot({path:path.join(output,'enclosed-tunnel.png')});
    check('unaffordable shop and forge controls, completed tutorial and wave drops');
    await api('battle',{type:'rock',id:'rock-health-check'});
    assert.equal((await snap()).environment,'sealed-tunnel');
    await api('place',0,16);await api('begin');await api('step',.04);
    assert.equal((await snap()).enemies[0].hp,10000);
    await api('clear');
    check('rock monsters have 10000 HP and tunnel arena survives retries');
    await api('load',{tutorial:'done',wins:1});
    const seam=await api('secretWall');
    await api('zone','cave',seam.center.x,seam.center.z);
    for(let i=0;i<35 && (await snap()).zone==='cave';i++) await api('walk',seam.normal.x,seam.normal.z);
    assert.equal((await snap()).zone,'ossuary','walk into false wall enters secret room');
    await api('zone','ossuary',0,-3);await api('interact');
    assert.equal((await snap()).zone,'battle');
    await api('place',0,16);await api('begin');
    assert.equal((await snap()).enemies[0].hp,3000);
    await api('kill');await api('step',.04);
    assert.equal((await snap()).enemies[0].hp,5000);
    assert.equal((await snap()).game.skeletonBossDefeated,false);
    await api('leak');await api('step',.04);
    assert.equal((await snap()).game.keyItems.includes('Vampire Shard Summoning Sigil'),false);
    await api('battle',{type:'skeleton',id:'hidden-marrow-king'});
    await api('place',0,16);await api('begin');
    assert.equal((await snap()).enemies[0].hp,3000);
    await api('kill');await api('step',.04);await api('kill');await api('step',.04);
    assert.equal((await snap()).game.skeletonBossDefeated,true);
    assert.ok((await snap()).game.keyItems.includes('Vampire Shard Summoning Sigil'));
    await api('save');
    const secretSave=await api('readSave');await api('load',secretSave);
    assert.ok((await snap()).game.keyItems.includes('Vampire Shard Summoning Sigil'));
    await api('zone','ossuary',0,7);await api('interact');
    assert.equal((await snap()).zone,'cave');
    const shards=(await snap()).game.materials['Vampire Shard']||0;
    await api('battle',{type:'bat',id:'sigil-test'});await api('place',0,16);await api('begin');await api('step',.04);
    await api('kill');await api('step',.04);
    assert.equal((await snap()).game.materials['Vampire Shard'],shards+1);
    assert.equal((await snap()).game.keyItems.includes('Vampire Shard Summoning Sigil'),false);
    await api('clear');
    check('hidden wall, two skeleton phases, loss/retry, saved reward, exit and one-use guaranteed shard');
    await api('load',{tutorial:'done',wins:1,materials:{'Vampire Shard':0}});
    await api('zone','meadow',0,-25);
    for(let i=0;i<25;i++) await api('walk',0,-1);
    assert.equal((await snap()).zone,'meadow');
    await api('zone','cave',3,4);await api('battle',{type:'bat',id:'lantern-test'});
    await api('pause',false);await page.waitForTimeout(6000);await api('pause',true);
    let lanterns=await api('lanterns');assert.equal(lanterns.length,4);
    await page.mouse.click(lanterns[0].x,lanterns[0].y);
    assert.deepEqual((await snap()).game.extinguishedLanterns,[]);
    assert.equal(await page.locator('#toast').innerText(),'Nothing happens.');
    await api('load',{tutorial:'done',wins:1,materials:{'Vampire Shard':1}});
    await api('zone','cave',3,4);await api('battle',{type:'bat',id:'lantern-test'});
    await api('pause',false);await page.waitForTimeout(6000);await api('pause',true);
    lanterns=await api('lanterns');
    for(const l of lanterns)await page.mouse.click(l.x,l.y);
    assert.equal((await snap()).game.extinguishedLanterns.length,4);
    assert.equal((await snap()).placed,false,'lantern clicks must not place Bram');
    assert.equal((await snap()).game.materials['Vampire Shard'],1);
    assert.ok((await api('lanterns')).every(l=>l.intensity===0));
    await api('save');await api('load',await api('readSave'));
    assert.equal((await snap()).game.extinguishedLanterns.length,4);
    await api('zone','cave',3,4);await api('battle',{type:'rock',id:'lantern-reload'});
    assert.ok((await api('lanterns')).every(l=>l.intensity===0));
    await api('clear');await api('zone','meadow',0,-25);
    for(let i=0;i<25 && (await snap()).zone==='meadow';i++)await api('walk',0,-1);
    assert.equal((await snap()).zone,'vampireCave');
    await api('zone','vampireCave',0,-2);await api('interact');
    assert.equal((await snap()).state,'cutscene');await api('skip');
    await api('zone','vampireCave',0,5);await api('interact');assert.equal((await snap()).zone,'meadow');
    check('four clickable lanterns, shard requirement, persistent darkness, meadow passage and vampire dialogue');
    await api('load',{tutorial:'done',wins:3,vampireRiddleStarted:false});
    assert.ok((await api('riddleObjects')).every(o=>!o.visible));
    const objects=await api('riddleObjects');
    assert.deepEqual(objects.map(o=>o.zone),['meadow','ossuary','vampireCave']);
    for(const o of objects){await api('zone',o.zone,o.x,o.z+1.4);await api('interact');}
    assert.equal((await snap()).game.vampireRiddleStep,0);
    await api('zone','vampireCave',0,-2);await api('interact');await api('skip');
    assert.ok((await api('riddleObjects')).every(o=>o.visible));
    for(const i of [0,2]){await api('zone',objects[i].zone,objects[i].x,objects[i].z+1.4);await api('interact');}
    assert.equal((await snap()).game.vampireRiddleStep,0,'wrong order resets rite');
    await api('zone',objects[0].zone,objects[0].x,objects[0].z+1.4);await api('interact');
    assert.equal((await snap()).game.vampireRiddleStep,1);
    await api('save');await api('load',await api('readSave'));
    assert.ok((await api('riddleObjects')).every(o=>o.visible));
    assert.equal((await snap()).game.vampireRiddleStep,1);
    for(const i of [1,2]){await api('zone',objects[i].zone,objects[i].x,objects[i].z+1.4);await api('interact');}
    assert.equal((await snap()).game.vampireRiddleSolved,true);await api('skip');
    await api('zone','shopInterior',0,0);await api('interact');if((await snap()).state==='cutscene')await api('skip');
    await page.locator('[data-service-tab="contracts"]').click();
    await page.locator('[data-action="contractVampire"]').click();
    assert.equal((await snap()).game.materials['Bat Wing'],25);
    assert.equal((await snap()).game.materials.Wood,8);
    await page.locator('[data-close="serviceMenu"]').click();
    await api('load',{tutorial:'done'});
    assert.ok((await api('riddleObjects')).every(o=>!o.visible));
    check('quest-only riddle objects across meadow, skeleton chamber and vampire refuge; order, reload and night supplies');
    const results = await page.evaluate(() => {
      const t = window.__bramTest,
        results = [];
      for (const kind of ["goblin", "goblin", "goblin", "bat"]) {
        t.clear();
        t.load({
          tutorial: "done",
          bossDefeated: true,
          weapons: ["Hammer"],
          equipped: "Hammer",
          upgrades:
            kind === "bat"
              ? { damage: 2, range: 2, aoe: 1 }
              : { damage: 0, range: 0, aoe: 0 },
        });
        t.zone("meadow", -4, 10);
        t.battle({
          type: kind,
          id: "balance-" + results.length,
          orc: kind === "goblin",
        });
        const path = t.path(),
          range = t.snapshot().stats.range;
        let best = { score: -1 };
        for (let x = -18; x <= 18; x += 0.75)
          for (let z = -18; z <= 18; z += 0.75) {
            let nearest = Infinity,
              score = 0;
            for (const p of path) {
              const d = Math.hypot(x - p.x, z - p.z);
              nearest = Math.min(nearest, d);
              if (d < range) score++;
            }
            if (nearest >= 1.8 && score > best.score) best = { x, z, score };
          }
        t.place(best.x, best.z);
        t.begin();
        for (let i = 0; i < 460 && t.snapshot().battleState !== "result"; i++) {
          t.step(0.25);
          t.ability();
        }
        const s = t.snapshot();
        results.push({ kind, won: s.game.wins === 1, position: best });
      }
      return results;
    });
    console.log("Natural battle balance: " + JSON.stringify(results));
    assert.ok(
      results.every((r) => r.won),
      "Meadow encounters are winnable with the starter hammer; cave bats with five earned altar blessings",
    );
    assert.deepEqual(errors, []);
    check("no browser runtime errors");
    console.log("Screenshots: " + output);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
