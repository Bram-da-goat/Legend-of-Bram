import {test} from 'node:test';
import assert from 'node:assert/strict';
import {affordability} from '../src/campaign.mjs';
test('shop affordances follow exact gold and ingredient boundaries',()=>{
 const g={gold:9,keyItems:[],weapons:['Hammer'],materials:{'Goblin Bone':4,'Orc Tusk':10,Wood:2},forgeLevel:0};
 assert.equal(affordability(g,'buyWood').short,true);
 g.gold=10;assert.equal(affordability(g,'buyWood').short,false);
 assert.equal(affordability(g,'craftAxe').short,true);
 g.materials['Goblin Bone']=5;assert.equal(affordability(g,'craftAxe').short,false);
 assert.equal(affordability(g,'craftClub').short,true);
 g.materials['Goblin Bone']=25;assert.equal(affordability(g,'craftClub').short,false);
 g.keyItems.push('Strange Rune');g.gold=0;
 assert.deepEqual(affordability(g,'buyRune'),{owned:true,short:false,verb:'buy'});
 g.weapons.push('Woodcutter Axe');g.materials['Goblin Bone']=0;
 assert.deepEqual(affordability(g,'craftAxe'),{owned:true,short:false,verb:'craft'});
});
