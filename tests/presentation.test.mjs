import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {fitBattleCamera} from '../src/presentation.js';
import {createBram,createGoblin,createOrc,createKnight,createNecromancer,createBat,createRockMonster,createUndead,setBramWeapon,walkUnit,resetUnit,attackPose} from '../src/models.js';
test('all arena corners fit beneath HUD at common browser sizes',()=>{
  const corners=[[-20,-20],[-20,20],[20,-20],[20,20]].map(([x,z])=>new THREE.Vector3(x,0,z));
  for(const [w,h] of [[1920,920],[1366,680],[800,510]]){
    const camera=new THREE.PerspectiveCamera(47,w/h,.1,300),view=fitBattleCamera(corners,w/h,h);
    camera.position.copy(view.position);camera.lookAt(view.target);camera.updateMatrixWorld();
    for(const p of corners){const projected=p.clone().project(camera);assert.ok(Math.abs(projected.x)<.9);assert.ok(Math.abs(projected.y)<1-200/h);}
  }
});
test('Bram uses a real articulated rig and equipment swaps cleanly',()=>{
  const bram=createBram();assert.equal(bram.userData.weapon,'Hammer');
  bram.traverse(o=>{if(o.isMesh) assert.ok(o.material.isMeshStandardMaterial, 'Character shading is smoothly lit');});
  assert.ok(bram.userData.rig.visual.children.some(o=>o.geometry?.type==='SphereGeometry'), 'Rounded character silhouette');
  walkUnit(bram,1);assert.notEqual(bram.userData.rig.leftLeg.rotation.x,0);
  attackPose(bram,.3);assert.notEqual(bram.userData.rig.rightArm.rotation.x,0);
  setBramWeapon(bram,'Woodcutter Axe');assert.equal(bram.userData.weapon,'Woodcutter Axe');
  setBramWeapon(bram,'Orc War Club');assert.equal(bram.userData.weapon,'Orc War Club');
  resetUnit(bram);assert.equal(bram.userData.rig.rightArm.rotation.x,0);assert.equal(bram.userData.rig.leftLeg.rotation.x,0);
});
test('every character model has valid 3D geometry and a working walk pose',()=>{
  for(const create of [createBram,createGoblin,createOrc,createKnight,createNecromancer,createBat,createRockMonster,createUndead]){
    const model=create();walkUnit(model,.7);let meshes=0;
    model.traverse(o=>{if(o.isMesh){meshes++;assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));}assert.ok(!o.isSprite);});
    assert.ok(meshes>3);resetUnit(model);
  }
});
