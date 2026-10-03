import test from 'node:test';import assert from 'node:assert/strict';
import {vampireStats,vampireStun,applyBloodLoss} from '../src/campaign.mjs';
test('orb damage is five times the old rank damage and cadence stays slow',()=>{
 for(let rank=0;rank<=5;rank++){
  const s=vampireStats({vampirePaths:{blood:rank,night:rank,vitality:rank}});
  assert.equal(s.damage*5,450+rank*200);assert.ok(s.cooldown>=2);assert.ok(s.stun<=.5);
 }
});
test('blood loss refreshes without stacking and stun has a mandatory immunity gap',()=>{
 const enemy={stun:0};applyBloodLoss(enemy);applyBloodLoss(enemy);assert.equal(enemy.bloodLoss,3);
 assert.ok(vampireStun(enemy,.5));assert.equal(enemy.stunImmunity,3.5);
 enemy.stun=0;enemy.stunImmunity=3;assert.equal(vampireStun(enemy,.5),false);assert.equal(enemy.stun,0);
 enemy.stunImmunity=0;assert.ok(vampireStun(enemy,.5));
});
