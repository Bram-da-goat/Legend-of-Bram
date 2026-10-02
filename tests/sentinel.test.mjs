import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOathboundSentinel,SENTINEL_HEALTH,walkUnit} from '../src/models.js';
test('Sentinel is a golden ghost knight with 15 times its original HP',()=>{
 assert.equal(SENTINEL_HEALTH,1400*15);
 const model=createOathboundSentinel(),r=model.userData.rig;
 assert.equal(model.userData.ghostKnight,true);
 assert.ok(r.leftArm && r.rightArm && r.halo && r.hammer.children.length);
 walkUnit(model,1);assert.ok(r.visual.position.y>.15);assert.equal(r.wisps.length,8);
 model.traverse(o=>{if(o.isMesh)assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));});
});
