import {test} from 'node:test';
import assert from 'node:assert/strict';
import {altarMultiplier,nextAltarPercent,weaponStats,WEAPONS} from '../src/campaign.mjs';
test('altar tiers diminish at each ten levels and stop at one percent',()=>{
 for(const [level,next,total] of [[0,5,1],[9,5,1.45],[10,4,1.5],[11,4,1.54],[20,3,1.9],[30,2,2.2],[40,1,2.4],[50,1,2.5]]) {
  assert.equal(nextAltarPercent(level),next);assert.ok(Math.abs(altarMultiplier(level)-total)<1e-10);
 }
});
test('every weapon gains the same percentage rather than flat stats',()=>{
 for(const [equipped,base] of Object.entries(WEAPONS)) {
  const stats=weaponStats({equipped,forgeLevel:0,upgrades:{damage:1,range:1,aoe:1}});
  for(const key of ['damage','range','aoe']) assert.equal(stats[key],base[key]*1.05);
 }
});
