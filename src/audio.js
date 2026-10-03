// Procedural, asset-free sound effects. Audio starts only after a user gesture.
// Each layer: frequency, end frequency, duration, delay, waveform, gain.
const tone = (a,b,d=.16,t=0,w='sine',v=.08)=>[a,b,d,t,w,v];
export const SOUND_CUES = {
  click:[tone(520,640,.045)], open:[tone(330,660,.12)], close:[tone(480,220,.09)],
  error:[tone(140,95,.15,0,'square',.035)], dialogue:[tone(240,320,.065)],
  equip:[tone(900,420,.1,0,'triangle'),tone(1200,700,.1,.06)],
  buy:[tone(1100,1100,.12),tone(1500,1500,.18,.09)],
  craft:[tone(1900,700,.15,0,'triangle'),tone(1700,650,.17,.16,'triangle'),tone(880,1320,.25,.32)],
  level:[tone(440,440,.2),tone(550,550,.2,.12),tone(660,880,.4,.24)],
  reward:[tone(660,660,.15),tone(880,880,.22,.1)],
  loot:[tone(1250,1750,.13)], shard:[tone(660,1320,.5),tone(990,1980,.55,.15)],
  swing:[tone(450,100,.18,0,'noise',.035)],
  hammer:[tone(105,32,.3,0,'sine',.2),tone(800,90,.17,0,'noise',.1)],
  club:[tone(65,22,.45,0,'triangle',.14),tone(320,60,.25,0,'noise',.12)],
  slash:[tone(1600,180,.16,0,'noise',.12),tone(420,110,.08,0,'triangle')],
  hit:[tone(95,35,.22,0,'triangle',.12)],
  earthshatter:[tone(75,20,.8,0,'sine',.2),tone(700,50,.65,0,'noise',.12)],
  goblin:[tone(440,130,.15,0,'sawtooth',.035)], orc:[tone(110,38,.3,0,'sawtooth',.04)],
  bat:[tone(2300,1100,.12,0,'sine',.04)], rock:[tone(600,50,.3,0,'noise',.09)],
  undead:[tone(190,60,.22,0,'triangle')], boss:[tone(100,45,.5,0,'sawtooth',.045)],
  place:[tone(120,65,.1),tone(600,800,.09,.05)], wave:[tone(220,330,.35,0,'sawtooth',.035)],
  victory:[tone(392,392,.2),tone(494,494,.2,.16),tone(587,587,.2,.32),tone(784,784,.5,.48)],
  defeat:[tone(300,240,.25),tone(220,160,.3,.2),tone(130,55,.6,.4)],
  portal:[tone(180,950,.6,0,'sine'),tone(650,1600,.45,.1,'triangle',.035)],
  door:[tone(200,65,.2,0,'noise',.055),tone(85,45,.1,.15)],
  stairs:[tone(150,90,.07),tone(130,70,.07,.12),tone(110,60,.07,.24)],
  grass:[tone(700,180,.065,0,'noise',.025)], stone:[tone(180,60,.065,0,'triangle',.045)],
  wood:[tone(240,95,.08,0,'triangle',.04)], chop:[tone(350,80,.13,0,'noise'),tone(160,55,.17)],
  bell:[tone(880,880,.8),tone(1370,1370,.65,0,'sine',.035)],
  brazier:[tone(1200,80,.45,0,'noise',.07)], chalice:[tone(1600,1600,.45)],
};

export function createSoundEngine({contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()}={}) {
  let context, master, noise, enabled=true, unlocked=false, voices=0;
  const recent=new Map();
  function unlock() {
    unlocked=true;
    if (!enabled) return;
    try {
      if(!context) {
        context=contextFactory(); master=context.createGain(); master.gain.value=.65;
        const limiter=context.createDynamicsCompressor();master.connect(limiter);limiter.connect(context.destination);
        noise=context.createBuffer(1,context.sampleRate,context.sampleRate);
        const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++) samples[i]=Math.random()*2-1;
      }
      if(context.state==='suspended') context.resume().catch(()=>{});
    } catch { /* Audio is optional, never a gameplay dependency. */ }
  }
  function play(kind) {
    if(!enabled || !unlocked || !context || context.state!=='running') return false;
    const layers=SOUND_CUES[kind];if(!layers) return false;
    const now=context.currentTime;
    if(now-(recent.get(kind)??-Infinity)<.075 || voices+layers.length>32) return false;
    recent.set(kind,now);
    try { for(const [from,to,duration,delay,wave,volume] of layers) {
      const source=wave==='noise'?context.createBufferSource():context.createOscillator();
      const filter=context.createBiquadFilter(),gain=context.createGain(),start=now+delay;
      if(wave==='noise') {source.buffer=noise;filter.type='lowpass';filter.frequency.setValueAtTime(from,start);filter.frequency.exponentialRampToValueAtTime(to,start+duration);}
      else {source.type=wave;source.frequency.setValueAtTime(from,start);source.frequency.exponentialRampToValueAtTime(to,start+duration);filter.frequency.value=18000;}
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.006);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      source.connect(filter);filter.connect(gain);gain.connect(master);voices++;
      source.onended=()=>{voices--;source.disconnect();filter.disconnect();gain.disconnect();};
      source.start(start);source.stop(start+duration+.01);
    } return true; } catch {return false;}
  }
  return {play,unlock,setEnabled(value){enabled=!!value;if(master)master.gain.value=enabled?.65:0;if(enabled&&unlocked)unlock();}};
}
