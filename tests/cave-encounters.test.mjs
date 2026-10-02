import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CAVE_SPAWNS,respawnDelay,caveBandAllowed} from '../src/cave-encounters.mjs';
const path=Array.from({length:201},(_,i)=>({x:0,z:i/2}));
test('bats span the cave; rocks are only in the last fifth',()=>{
  const bats=CAVE_SPAWNS.filter(s=>s.type==='bat'),rocks=CAVE_SPAWNS.filter(s=>s.type==='rock');
  assert.equal(bats.length,6);assert.equal(rocks.length,2);
  assert.ok(bats[0].progress<.2 && bats.at(-1).progress>.9);
  assert.ok(rocks.every(s=>s.progress>=.8));
  assert.ok(CAVE_SPAWNS.every(s=>caveBandAllowed({x:0,z:s.progress*100},s.type,path)));
  assert.equal(new Set(CAVE_SPAWNS.map(s=>s.id)).size,8);
});
test('rock chase cannot leave final fifth; no bands wander through tunnel walls',()=>{
  assert.equal(caveBandAllowed({x:0,z:79},'rock',path),false);
  assert.equal(caveBandAllowed({x:0,z:80},'rock',path),true);
  assert.equal(caveBandAllowed({x:0,z:20},'bat',path),true);
  assert.equal(caveBandAllowed({x:3,z:90},'bat',path),false);
  assert.equal(respawnDelay('bat'),20);assert.equal(respawnDelay('rock'),20);
  assert.equal(respawnDelay('goblin'),45);
});
