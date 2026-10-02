import * as THREE from 'three';
import {box,part,mat} from './models.js';

export function upgradeShops({smithInterior,shopInterior,colliders}) {
  const oak=mat('#ba8246'),dark=mat('#67503e'),metal=mat('#8baebc');
  for(const [zone,name] of [[shopInterior,'shopInterior'],[smithInterior,'smithInterior']]) {
    // Side counters frame the NPC; the middle aisle stays accessible.
    for(const x of [-3,3]) {
      const counter=new THREE.Group();counter.position.set(x,0,-.3);zone.add(counter);
      box(counter,[2.3,1.1,1.1],dark,[0,.55,0]);
      box(counter,[2.5,.14,1.3],oak,[0,1.15,0]);
      colliders[name].push({object:counter,radius:1.25});
      for(let i=0;i<4;i++) {
        if(name==='shopInterior') {
          const bottle=mat(['#45a79d','#edb057','#7898c9','#db8ea3'][i]);
          part(counter,new THREE.CylinderGeometry(.12,.19,.36,12),bottle,[-.8+i*.5,1.41,0]);
          box(counter,[.1,.12,.1],oak,[-.8+i*.5,1.64,0]);
        } else {
          const ingot=box(counter,[.38,.18,.24],metal,[-.8+i*.5,1.32,0]);ingot.rotation.y=.2;
        }
      }
    }
    for(let row=0;row<3;row++) {
      box(zone,[5,.13,.9],oak,[0,1+row*.75,-6.3]);
      for(let col=0;col<8;col++)
        box(zone,[.35,.35+(col%3)*.1,.4],mat(['#dcac58','#68aaa1','#8b96c4'][col%3]),[-2+col*.57,1.25+row*.75,-6.3]);
    }
    for(const x of [-6,6]) {
      box(zone,[1.8,1.6,.1],mat('#efc873',1,0,'#edb754',.4),[x,2.2,-6.75]);
      box(zone,[.1,1.65,.15],dark,[x,2.2,-6.65]);
      box(zone,[1.9,.1,.15],dark,[x,2.2,-6.65]);
    }
    box(zone,[3,.025,8],mat(name==='shopInterior'?'#548f91':'#b4744e'),[0,.075,1.5]);
  }
  const anvil=new THREE.Group();anvil.position.set(4.8,0,3);smithInterior.add(anvil);
  box(anvil,[1.4,.6,1.3],dark,[0,.3,0]);box(anvil,[.8,.5,.7],metal,[0,.85,0]);box(anvil,[1.7,.25,.8],metal,[0,1.2,0]);
  colliders.smithInterior.push({object:anvil,radius:1});
}
