import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extensions,restore,advanceVampireRiddle,claimContract} from '../src/campaign.mjs';
const fresh=()=>({version:4,gold:0,exp:0,wins:3,materials:{Wood:0,'Goblin Bone':0,'Orc Tusk':0},upgrades:{},visited:{},weapons:['Hammer'],keyItems:[],...extensions(),wins:3});
test('riddle requires starting quest, resets mistakes, and preserves partial progress',()=>{
 const g=fresh();assert.equal(advanceVampireRiddle(g,'bell'),'locked');
 g.vampireRiddleStarted=true;assert.equal(advanceVampireRiddle(g,'bell'),'correct');
 assert.equal(advanceVampireRiddle(g,'chalice'),'wrong');assert.equal(g.vampireRiddleStep,0);
 advanceVampireRiddle(g,'bell');const saved=restore(fresh(),JSON.parse(JSON.stringify(g)));
 assert.equal(saved.vampireRiddleStep,1);assert.equal(saved.vampireRiddleStarted,true);
 advanceVampireRiddle(saved,'brazier');assert.equal(advanceVampireRiddle(saved,'chalice'),'solved');
 assert.equal(advanceVampireRiddle(saved,'bell'),'complete');assert.equal(saved.vampireRiddleStep,3);
});
test('night supplies unlock only after riddle and share contract progress',()=>{
 const g=fresh();assert.equal(claimContract(g,'vampire'),false);
 g.vampireRiddleSolved=true;assert.equal(claimContract(g,'vampire'),true);
 assert.equal(g.gold,180);assert.deepEqual(g.materials,{Wood:8,'Goblin Bone':0,'Orc Tusk':0,'Bat Wing':3});
 assert.equal(claimContract(g),false);
});
