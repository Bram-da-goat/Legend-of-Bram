import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createBram,createGoblin,createOrc,createKnight,createNecromancer,createBat,createRockMonster,createSkeletonBoss,createVampire,createTree,createRock,createBuilding,createAltar,mat,setBramWeapon,walkUnit} from '../src/models.js';
test('model families use physical materials and valid bounded geometry',()=>{
 for(const create of [createBram,createGoblin,createOrc,createKnight,createNecromancer,createBat,createRockMonster,createSkeletonBoss,createVampire,createTree,createRock,createBuilding,createAltar]){
  const model=create();walkUnit(model,.4);let triangles=0;
  model.traverse(o=>{if(o.isMesh){assert.ok(!o.material.isMeshToonMaterial);assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
  assert.ok(triangles<35000,'individual model remains appropriate for browser play');
 }
});
test('roughness and metalness survive weapon rig finishing',()=>{
 const metal=mat('#aaaaaa',.3,.8);assert.equal(metal.roughness,.3);assert.equal(metal.metalness,.8);
 const bram=createBram();
 for(const name of ['Hammer','Woodcutter Axe','Orc War Club']){
  setBramWeapon(bram,name);let metalParts=0;
  bram.userData.rig.hammer.traverse(o=>{if(o.material?.metalness>.5)metalParts++;});
  assert.ok(metalParts>0);
 }
});
