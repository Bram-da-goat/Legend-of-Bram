import test from 'node:test';
import assert from 'node:assert/strict';
import {extensions,vampireTrade,restore,weaponStats} from '../src/campaign.mjs';
const fresh=()=>({...extensions(),weapons:['Hammer'],equipped:'Hammer',gold:3000,materials:{'Vampire Shard':2,'Bat Wing':500},upgrades:{damage:0,range:0,aoe:0},keyItems:[],visited:{}});
test('vampire sword uses exact costs, rejects other locations and duplicates',()=>{
 const g=fresh();assert.equal(vampireTrade(g,'vampireSword','town'),false);
 assert.equal(vampireTrade(g,'vampireSword','vampireRuin'),true);
 assert.equal(g.gold,0);assert.equal(g.materials['Bat Wing'],0);assert.equal(g.materials['Vampire Shard'],1);
 assert.equal(weaponStats(g).damage,200);assert.equal(vampireTrade(g,'vampireSword','vampireRuin'),false);
 const loaded=restore(fresh(),JSON.parse(JSON.stringify(g)));assert.equal(loaded.equipped,'Vampire Sword');
});
test('recruitment persists, costs a separate shard, and never charges twice',()=>{
 const g=fresh();assert.equal(vampireTrade(g,'recruitVampire','vampireRuin'),true);
 assert.equal(g.materials['Vampire Shard'],1);assert.equal(g.gold,3000);
 assert.equal(vampireTrade(g,'recruitVampire','vampireRuin'),false);
 assert.equal(restore(fresh(),g).vampireRecruited,true);
});
test('each missing sword ingredient rejects the entire transaction',()=>{
 for(const missing of ['gold','Bat Wing','Vampire Shard']) {
  const g=fresh();if(missing==='gold')g.gold=2999;else g.materials[missing]=missing==='Bat Wing'?499:0;
  const before=JSON.stringify(g);assert.equal(vampireTrade(g,'vampireSword','vampireRuin'),false);assert.equal(JSON.stringify(g),before);
 }
});
