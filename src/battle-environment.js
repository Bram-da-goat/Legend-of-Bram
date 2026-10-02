import * as THREE from 'three';
import {box,part,mat,createRock} from './models.js';

export const ROCK_HEALTH = 10000;
export const usesTunnelArena = returnZone => ['cave', 'ossuary'].includes(returnZone);

export function createBattleEnvironment(battle) {
  const ground=battle.children[0],original=ground.material;
  const meadowProps=battle.children.slice(1);
  const cavern=new THREE.Group();cavern.name='sealed-tunnel-arena';
  battle.add(cavern);
  const floor=mat('#586865'),wall=mat('#526975'),wood=mat('#674832');
  const crystal=mat('#8ce4df',1,0,'#39a7b4',.7),iron=mat('#394b50');
  // Tactical cutaway: solid walls, but an open camera view of every placement tile.
  for(const [x,z,sx,sz] of [[0,-27,57,3],[-27,0,3,57],[27,0,3,57],[0,27,57,3]])
    box(cavern,[sx,6,sz],wall,[x,3,z]);
  for(let i=0;i<52;i++) {
    const angle=i/52*Math.PI*2,x=Math.cos(angle)*32,z=Math.sin(angle)*32;
    const rock=createRock(2.2+(i%4)*.35);rock.position.set(x,0,z);rock.scale.y=2;
    rock.traverse(o=>{if(o.isMesh)o.material=wall;});cavern.add(rock);
  }
  const lanterns=[];
  for(const [x,z] of [[-21,-17],[21,-17],[-21,17],[21,17]]) {
    box(cavern,[.7,5,.7],wood,[x,2.5,z]);
    box(cavern,[1.6,.3,1],iron,[x,4.5,z]);
    for(let i=0;i<3;i++) {
      const shard=part(cavern,new THREE.ConeGeometry(.35,.9+i*.65,5),crystal,[x+(i-1)*.6,.5+i*.3,z+1]);
      shard.rotation.z=(i-1)*.25;
    }
    const lantern=new THREE.Group();lantern.position.set(x,3.5,z);lantern.userData.lanternId=lanterns.length;
    cavern.add(lantern);
    box(lantern,[1.1,1.5,1.1],iron,[0,0,0]);
    const flame=box(lantern,[.95,1.1,1.16],mat('#ffd398',1,0,'#ff9b43',1.5),[0,0,0]);
    const lamp=new THREE.PointLight('#ffb96b',32,23,1);lamp.position.set(0,0,1);lantern.add(lamp);
    lantern.userData.flame=flame;lantern.userData.light=lamp;lanterns.push(lantern);
  }
  const light=new THREE.PointLight('#78d9e1',18,70,1);light.position.set(0,9,-12);cavern.add(light);
  cavern.visible=false;
  return {
    lanterns,
    syncLanterns(off=[]) {
      for(const lantern of lanterns) {
        const dark=off.includes(lantern.userData.lanternId),m=lantern.userData.flame.material;
        m.color.set(dark?'#22232b':'#ffd398');m.emissiveIntensity=dark?0:1.5;
        lantern.userData.light.intensity=dark?0:32;
      }
      const factor=1-off.length*.17;
      floor.color.set('#586865').multiplyScalar(factor);
      wall.color.set('#526975').multiplyScalar(factor);
      crystal.emissiveIntensity=.7*factor;
      light.intensity=18*factor;
    },
    hitLantern(raycaster) {
      if(!cavern.visible) return null;
      const hit=raycaster.intersectObjects(lanterns,true)[0];
      if(!hit)return null;
      let object=hit.object;
      while(object && object.userData.lanternId===undefined) object=object.parent;
      return object?.userData.lanternId ?? null;
    },
    setTunnel(enabled) {
      cavern.visible=enabled;
      ground.material=enabled?floor:original;
      for(const prop of meadowProps) prop.visible=!enabled;
      battle.userData.environment=enabled?'sealed-tunnel':'meadow';
    },
  };
}
