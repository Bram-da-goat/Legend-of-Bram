import test from 'node:test';
import assert from 'node:assert/strict';
import {SOUND_CUES,createSoundEngine} from '../src/audio.js';

test('sound cues have distinct, bounded, valid envelopes',()=>{
  assert.ok(Object.keys(SOUND_CUES).length>=35);
  assert.equal(new Set(Object.values(SOUND_CUES).map(JSON.stringify)).size,Object.keys(SOUND_CUES).length);
  for(const layers of Object.values(SOUND_CUES)) for(const [a,b,d,t,w,v] of layers) {
    assert.ok(a>0 && b>0 && d>.006 && d<=1 && t>=0 && v>0 && v<=.2);
    assert.ok(['sine','triangle','square','sawtooth','noise'].includes(w));
  }
});
test('sound respects gesture, mute, rate limits and unavailable audio',()=>{
  let created=0,started=0;
  const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>({connect(){},disconnect(){},gain:param(),frequency:param(),start(){started++;},stop(){}});
  const context={state:'running',currentTime:0,sampleRate:8000,destination:{},createGain:node,createDynamicsCompressor:node,createOscillator:node,createBufferSource:node,createBiquadFilter:node,createBuffer:()=>({getChannelData:()=>new Float32Array(8000)})};
  const audio=createSoundEngine({contextFactory:()=>{created++;return context;}});
  assert.equal(audio.play('hammer'),false);assert.equal(created,0);
  audio.unlock();assert.equal(audio.play('hammer'),true);assert.equal(started,2);
  assert.equal(audio.play('hammer'),false);
  audio.setEnabled(false);context.currentTime=1;assert.equal(audio.play('hammer'),false);
  audio.setEnabled(true);assert.equal(audio.play('hammer'),true);
  assert.equal(audio.play('missing'),false);
  const unavailable=createSoundEngine({contextFactory:()=>{throw Error('unsupported');}});
  unavailable.unlock();assert.equal(unavailable.play('click'),false);
});
