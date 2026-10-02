import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBattleEnvironment,usesTunnelArena,ROCK_HEALTH} from '../src/battle-environment.js';
test('tunnel dressing replaces meadow props and restores them on the next encounter',()=>{
 const battle=new THREE.Group(),ground=new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.MeshBasicMaterial()),tree=new THREE.Group();
 battle.add(ground,tree);const original=ground.material;
 const env=createBattleEnvironment(battle);env.setTunnel(true);
 assert.equal(tree.visible,false);assert.equal(battle.userData.environment,'sealed-tunnel');
 assert.notEqual(ground.material,original);assert.equal(battle.children[0],ground);
 env.setTunnel(false);assert.equal(tree.visible,true);assert.equal(ground.material,original);
 env.setTunnel(true);assert.equal(battle.getObjectByName('sealed-tunnel-arena').visible,true);
 assert.equal(usesTunnelArena('cave'),true);assert.equal(usesTunnelArena('meadow'),false);
 assert.equal(ROCK_HEALTH,10000);
});
