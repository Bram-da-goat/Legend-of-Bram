const {chromium}=require(process.env.BRAM_PLAYWRIGHT_PATH||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader']});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5174/?test');await page.waitForFunction(()=>window.__bramTest);
  const api=(method,...args)=>page.evaluate(({method,args})=>window.__bramTest[method](...args),{method,args});
  await api('load',{weapons:['Hammer','Vampire Sword'],equipped:'Vampire Sword',tutorial:'done',vampireRecruited:true,vampireExp:2000});
  await api('pause',true);
  for(const width of [1280,390]){
    await page.setViewportSize({width,height:900});
    const panel=await page.locator('.party-panel').boundingBox(),button=await page.locator('#vampireParty').boundingBox();
    assert.ok(button.y+button.height<=panel.y,'vampire button above Bram');
    assert.ok(Math.abs(button.x-panel.x)<5 && button.x+button.width<=width,'left-aligned and on screen');
  }
  await page.setViewportSize({width:1280,height:900});await page.locator('#vampireParty').click();
  await page.locator('[data-action="vampire-level-blood"]').click();
  assert.ok(await page.locator('[data-action="vampire-level-night"]').isDisabled());
  for(let i=0;i<4;i++)await page.locator('[data-action="vampire-level-blood"]').click();
  assert.equal((await api('snapshot')).game.vampirePaths.blood,5);
  await page.locator('[data-action="vampire-level-night"]').click();
  assert.equal((await api('snapshot')).game.vampirePaths.night,1);
  await page.locator('[data-close="serviceMenu"]').click();
  const saved=await api('readSave');await api('load',saved);
  assert.equal((await api('snapshot')).game.vampirePaths.blood,5);
  await api('zone','cave',0,0);await api('battle',{type:'bat',id:'blood-bat-test'});await api('skip');
  assert.ok(await api('place',19,19));await api('begin');await api('step',3.1);
  let s=await api('snapshot');assert.equal(s.blood.bats.length,1);assert.equal(s.blood.bats[0].hp,500);assert.ok(s.blood.bats[0].t<1);
  await api('ability');s=await api('snapshot');assert.equal(s.blood.active,10);assert.equal(s.abilityCooldown,50);
  await api('step',9.8);s=await api('snapshot');
  assert.ok(s.blood.blessing>0,'bat contact damage empowers later bats');
  assert.ok(s.blood.bats.some(b=>b.hp>500));
  const blessing=s.blood.blessing;await api('step',.5);s=await api('snapshot');assert.equal(s.blood.active,0);assert.ok(s.blood.blessing>=blessing);
  await api('clear');assert.equal((await api('snapshot')).blood.blessing,0);
  assert.deepEqual(errors,[]);console.log('PASS vampire upgrade UI, saves, reverse-path bats, Blood Sucker timing, blessing and battle cleanup');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
