import {test} from 'node:test';
import assert from 'node:assert/strict';
import {restore,extensions,awardSkeleton,enemyLoot,SHARD_SUMMON} from '../src/campaign.mjs';
const fresh=()=>restore({version:4,exp:0,gold:0,materials:{},upgrades:{},visited:{},weapons:['Hammer'],keyItems:[],...extensions()});
test('skeleton reward survives restore and cannot be claimed twice',()=>{
  const g=fresh();assert.equal(awardSkeleton(g),true);
  const loaded=restore(fresh(),JSON.parse(JSON.stringify(g)));
  assert.ok(loaded.keyItems.includes(SHARD_SUMMON));assert.equal(awardSkeleton(loaded),false);
  const reward=enemyLoot(loaded,'bat',()=>1);
  assert.equal(reward.items['Vampire Shard'],1);assert.equal(reward.summonConsumed,true);
  assert.ok(!loaded.keyItems.includes(SHARD_SUMMON));
  const used=restore(fresh(),JSON.parse(JSON.stringify(loaded)));
  assert.equal(awardSkeleton(used),false);assert.equal(enemyLoot(used,'bat',()=>1).items['Vampire Shard'],undefined);
});
test('sigil ignores non-bats and never doubles a natural shard drop',()=>{
  const g=fresh();awardSkeleton(g);enemyLoot(g,'rock',()=>0);
  assert.ok(g.keyItems.includes(SHARD_SUMMON));
  assert.equal(enemyLoot(g,'bat',()=>0).items['Vampire Shard'],1);
  assert.equal(g.keyItems.length,0);
});
