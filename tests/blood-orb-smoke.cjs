const {chromium}=require(process.env.BRAM_PLAYWRIGHT_PATH||'playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader']});
try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5174/?test');await page.waitForFunction(()=>window.__bramTest);
const api=(method,...args)=>page.evaluate(({method,args})=>window.__bramTest[method](...args),{method,args});
await api('load',{tutorial:'done',vampireRecruited:true});await api('pause',true);await api('zone','cave',0,0);await api('battle',{type:'rock',id:'orb-test'});await api('skip');
await page.locator('#placeHero').selectOption('vampire');const path=await api('path');let placed=false;
for(const p of path){for(const offset of [3,-3])if(await api('place',p.x+offset,p.z)){placed=true;break;}if(placed)break;}
assert.ok(placed);assert.equal((await api('snapshot')).placed,false);await api('begin');
let orb=false,pool=false,damaged=false;
for(let i=0;i<400;i++){await api('step',.1);const s=await api('snapshot');orb ||= s.bloodMagic.orbs>0;pool ||=s.bloodMagic.pools>0;damaged ||=s.enemies.some(e=>e.hp<10000);if(orb&&pool&&damaged)break;}
assert.ok(orb,'slow orb exists before contact');assert.ok(pool,'orb leaves a pool');assert.ok(damaged,'orb damages the enemy');assert.equal((await api('snapshot')).placed,false);
assert.deepEqual(errors,[]);console.log('PASS vampire-only placement, slow blood orb, damaging blood pool and no automatic Bram placement');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
