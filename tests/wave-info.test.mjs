import {test} from 'node:test';
import assert from 'node:assert/strict';
import {waveRoster,showFightTutorial} from '../src/wave-info.mjs';
test('battle tutorial only appears until the first victory',()=>{
  assert.equal(showFightTutorial({wins:0}),true);
  assert.equal(showFightTutorial({wins:1}),false);
  assert.equal(showFightTutorial({bossDefeated:true}),false);
});
test('wave roster matches encounter composition and drop probabilities',()=>{
  assert.equal(waveRoster({type:'goblin'}).length,1);
  const orcs=waveRoster({type:'goblin',orc:true});
  assert.equal(orcs[1].count,1);assert.match(orcs[1].drops,/25%/);
  assert.match(orcs[0].drops,/10%/);
  const bats=waveRoster({type:'bat'})[0];assert.equal(bats.count,8);assert.match(bats.drops,/0\.099%/);
  assert.equal(waveRoster({type:'boss'})[0].count,100);
  assert.match(waveRoster({type:'rock'})[0].drops,/No item/);
});
