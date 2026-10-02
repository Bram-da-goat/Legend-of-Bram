import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loot,restore} from '../src/campaign.mjs';
test('rock EXP triples and bat EXP halves without changing item drops',()=>{
 assert.equal(loot('rock').exp,150);
 assert.deepEqual(loot('rock').items,{});
 assert.equal(loot('bat',()=>1).exp,12.5);
 assert.equal(loot('bat',()=>0).items['Bat Wing'],1);
});
test('half-point EXP survives save restoration',()=>{
 const defaults={weapons:['Hammer'],equipped:'Hammer',keyItems:[],materials:{},upgrades:{damage:0,range:0,aoe:0},visited:{}};
 assert.equal(restore(defaults,{exp:12.5}).exp,12.5);
});
