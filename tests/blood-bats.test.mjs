import test from 'node:test';import assert from 'node:assert/strict';
import {newBloodBattle,grantBloodDamage,bloodBat} from '../src/blood-bats.mjs';
import {extensions,upgradeVampire,vampireStats,restore,WEAPONS} from '../src/campaign.mjs';
test('sword stats and bat blessing last only this battle',()=>{
 assert.deepEqual(WEAPONS['Vampire Sword'],{damage:200,range:4,aoe:2,cooldown:.39,animation:.32});
 const state=newBloodBattle();state.bats.push(bloodBat(state));grantBloodDamage(state,100);assert.equal(state.bats[0].hp,500);
 state.active=10;grantBloodDamage(state,200);assert.equal(state.bats[0].hp,700);assert.equal(bloodBat(state).hp,700);
 state.active=0;grantBloodDamage(state,200);assert.equal(bloodBat(state).hp,700);assert.equal(bloodBat(newBloodBattle()).hp,500);
 assert.equal(bloodBat(state).damage,500);
});
test('vampire paths lock until rank five and spend only companion EXP',()=>{
 const g={...extensions(),vampireRecruited:true,vampireExp:5000,exp:900};
 assert.ok(upgradeVampire(g,'blood'));assert.equal(upgradeVampire(g,'night'),false);
 for(let i=0;i<4;i++)assert.ok(upgradeVampire(g,'blood'));
 assert.equal(upgradeVampire(g,'blood'),false);assert.ok(upgradeVampire(g,'night'));assert.equal(g.exp,900);
 assert.equal(vampireStats(g).damage,290);assert.equal(g.vampireExp,3400);
});
