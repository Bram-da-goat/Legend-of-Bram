// Isolated synthetic journey; never reads the player's browser profile.
const {chromium}=require(process.env.BRAM_PLAYWRIGHT_PATH || 'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:960}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const api=(method,...args)=>page.evaluate(({method,args})=>window.__bramTest[method](...args),{method,args});
  const out=path.join(__dirname,'artifacts');fs.mkdirSync(out,{recursive:true});
  const shot=name=>page.screenshot({path:path.join(out,'ui-'+name+'.png')});
  await page.goto('http://127.0.0.1:5174/?test');await page.waitForFunction(()=>window.__bramTest);
  await page.evaluate(()=>document.fonts.ready);
  assert.ok(await page.evaluate(()=>document.fonts.check('20px "Starfall Pixel"')),'bundled pixel font loads');
  await shot('title');
  await api('load',{tutorial:'done',bossDefeated:true,wins:3,gold:600,exp:800,seenStories:['oren','mira'],weapons:['Hammer','Woodcutter Axe','Orc War Club'],materials:{Wood:12,'Goblin Bone':8,'Orc Tusk':3,'Vampire Shard':1,'Bat Wing':4},keyItems:['Teleporter Key','Strange Rune'],vampireRiddleSolved:true});
  await page.waitForTimeout(800);await api('pause',true);await shot('hud');
  await page.locator('#inventoryButton').click();await page.locator('[data-inventory-tab="materials"]').click();await shot('inventory');
  assert.equal(await page.locator('.inventory-item').count(),5);
  await page.locator('[data-close="inventoryMenu"]').click();
  await api('zone','shopInterior',0,0);await api('interact');await shot('shop');
  await page.locator('[data-service-tab="contracts"]').click();assert.ok(await page.locator('[data-action="contractVampire"]').isVisible());
  await page.locator('[data-close="serviceMenu"]').click();
  await page.locator('#journalButton').click();await shot('journal');await page.locator('[data-close="journal"]').click();
  await api('zone','town',0,1.2);await api('interact');assert.ok(await page.locator('#altarMenu').isVisible());await shot('altar');
  if(await page.locator('#altarMenu').isVisible())await page.locator('[data-close="altarMenu"]').click();
  await api('zone','cave',3,4);await api('battle',{type:'bat',id:'ui-wave'});await api('pause',false);await page.waitForTimeout(3000);await api('pause',true);await shot('battle');
  await api('clear');await api('zone','vampireCave',0,-2);await api('interact');await shot('dialogue');await api('skip');
  await page.setViewportSize({width:390,height:844});await api('zone','meadow',-4,10);await page.waitForTimeout(200);await shot('mobile-hud');
  await page.locator('#inventoryButton').click();await shot('mobile-inventory');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal page overflow');
  assert.ok(await page.evaluate(()=>{const e=document.querySelector('#inventoryMenu');return e.scrollWidth<=e.clientWidth+1}),'inventory fits narrow viewport');
  assert.deepEqual(errors,[]);console.log('PASS UI desktop screens, mobile inventory layout and controls; screenshots in '+out);
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
