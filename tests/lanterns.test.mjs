import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {extinguishLantern,vampirePassageOpen,restore,extensions} from '../src/campaign.mjs';
import {createBattleEnvironment} from '../src/battle-environment.js';
const fresh=()=>({version:4,gold:0,exp:0,materials:{},upgrades:{},visited:{},weapons:['Hammer'],keyItems:[],...extensions()});
test('four unique lanterns require a carried shard and persist without consuming it',()=>{
 const g=fresh();assert.equal(extinguishLantern(g,0),false);
 g.materials['Vampire Shard']=1;
 for(let i=0;i<4;i++){assert.equal(vampirePassageOpen(g),false);assert.equal(extinguishLantern(g,i),true);assert.equal(extinguishLantern(g,i),false);}
 assert.equal(g.materials['Vampire Shard'],1);assert.equal(vampirePassageOpen(g),true);
 const loaded=restore(fresh(),JSON.parse(JSON.stringify(g)));assert.equal(vampirePassageOpen(loaded),true);
 assert.equal(extinguishLantern(g,4),false);
 assert.deepEqual(restore(fresh(),{extinguishedLanterns:[0,0,1,7,'2',-1]}).extinguishedLanterns,[0,1]);
 assert.deepEqual(restore(fresh(),{}).extinguishedLanterns,[]);
});
test('arena has exactly four lanterns with persistent visual darkness',()=>{
 const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.PlaneGeometry(),new THREE.MeshBasicMaterial()));
 const env=createBattleEnvironment(root);env.setTunnel(true);assert.equal(env.lanterns.length,4);
 env.syncLanterns([0,2]);assert.deepEqual(env.lanterns.map(l=>l.userData.light.intensity),[0,32,0,32]);
 env.setTunnel(false);env.setTunnel(true);assert.equal(env.lanterns[0].userData.flame.material.emissiveIntensity,0);
 env.syncLanterns([]);assert.ok(env.lanterns.every(l=>l.userData.light.intensity===32));
});
