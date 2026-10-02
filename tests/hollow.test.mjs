import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { dressHollow } from '../src/hollow.js';

test('hideout decorations leave entrance routes clear and tunnel faces upward', () => {
  const manHouse=new THREE.Group(), basement=new THREE.Group(), cave=new THREE.Group();
  const colliders={manHouse:[],basement:[],cave:[]};
  const cavePath=new THREE.CatmullRomCurve3([[0,18],[-5,11],[3,4],[-6,-4],[4,-13],[-2,-23],[-8,-33]].map(([x,z])=>new THREE.Vector3(x,.03,z)));
  const details=dressHollow({manHouse,basement,cave,cavePath,colliders});
  assert.ok(details.flames.length>6);
  for(const name of ['manHouse','basement']) {
    for(let z=-5;z<=5;z+=.25) for(const c of colliders[name])
      assert.ok(Math.hypot(c.object.position.x,c.object.position.z-z)>c.radius+.48);
  }
  const floor=cave.children.find(o=>o.geometry?.attributes.position.count===362);
  assert.ok(floor);
  for(let i=1;i<floor.geometry.attributes.normal.array.length;i+=3)
    assert.ok(floor.geometry.attributes.normal.array[i]>.99);
  for(const zone of [manHouse,basement,cave]) zone.traverse(o=>{
    if(o.isMesh) assert.ok(Array.from(o.geometry.attributes.position.array).every(Number.isFinite));
  });
});
