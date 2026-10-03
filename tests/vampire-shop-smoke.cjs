const {chromium}=require(process.env.BRAM_PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader']});
 try {
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5174/?test');await page.waitForFunction(()=>window.__bramTest);
  const api=(method,...args)=>page.evaluate(({method,args})=>window.__bramTest[method](...args),{method,args});
  await api('load',{gold:3000,materials:{'Bat Wing':500,'Vampire Shard':2},tutorial:'done'});
  await api('pause',true);await api('zone','vampireRuin',0,-8);await api('interact');await api('skip');
  await page.locator('[data-action="vampireSword"]').click();
  let s=await api('snapshot');assert.equal(s.game.equipped,'Vampire Sword');assert.equal(s.game.gold,0);
  await page.locator('[data-action="recruitVampire"]').click();s=await api('snapshot');
  assert.equal(s.game.vampireRecruited,true);assert.equal(s.game.materials['Vampire Shard'],0);
  assert.ok(await page.locator('[data-action="recruitVampire"]').isDisabled());
  const saved=await api('readSave');await api('load',saved);assert.equal((await api('snapshot')).game.vampireRecruited,true);
  await api('clear');await api('zone','cave',3,4);await api('battle',{type:'bat',id:'vampire-test'});await api('skip');
  await api('step',.1);assert.equal((await api('snapshot')).companionVisible,false);
  const path=await api('path');let placed=false;
  for(const p of path) {if(await api('place',p.x+3,p.z)){placed=true;break;}}
  assert.ok(placed);await api('step',.1);assert.equal((await api('snapshot')).companionVisible,false);
  await page.locator('#placeHero').selectOption('vampire');assert.ok(await api('place',19,19));
  await api('begin');await api('step',12);assert.equal((await api('snapshot')).companionVisible,true);
  await api('clear');assert.equal((await api('snapshot')).companionVisible,false);
  assert.deepEqual(errors,[]);console.log('PASS vampire NPC trades, sword equipment, saved recruitment and battle companion');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
