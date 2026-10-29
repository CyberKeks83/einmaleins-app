'use strict';
// Original music and synthesized applause. No downloads, recordings or external services.
globalThis.FlinkAudio=(()=>{
 const AudioCtor=globalThis.AudioContext||globalThis.webkitAudioContext;
 let enabled=true,available=!!AudioCtor,ctx=null,master=null,music=null,claps=null,noise=null;
 let inRound=false,paused=false,scheduler=null,step=0,nextTime=0;
 const nodes=new Set(),STORAGE='flink-sound-v1',STEP=0.25;
 try{enabled=localStorage.getItem(STORAGE)!=='off'}catch{}
 const button=()=>document.getElementById('soundToggle');
 function paint(){const b=button();if(!b)return;b.disabled=!available;b.textContent=!available?'Ton nicht verfügbar':enabled?'♫ Ton an':'♫ Ton aus';b.setAttribute('aria-pressed',String(enabled&&available));b.setAttribute('aria-label',!available?'Ton nicht verfügbar':enabled?'Musik und Applaus ausschalten':'Musik und Applaus einschalten');}
 function ensure(){
  if(!available)return false;
  try{if(!ctx){ctx=new AudioCtor();master=ctx.createGain();master.gain.value=0.42;const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=6;master.connect(limiter);limiter.connect(ctx.destination);music=ctx.createGain();music.gain.value=0.24;music.connect(master);claps=ctx.createGain();claps.gain.value=0.55;claps.connect(master);noise=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*0.22),ctx.sampleRate);const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
  return true;}catch{available=false;paint();return false;}
 }
 function track(node){nodes.add(node);node.onended=()=>{nodes.delete(node);node.disconnect()};return node;}
 function clear(){if(scheduler!==null){clearInterval(scheduler);scheduler=null;}for(const n of nodes){try{n.stop()}catch{}}nodes.clear();}
 function tone(midi,t,duration,volume,type='triangle'){
  const o=track(ctx.createOscillator()),g=ctx.createGain();o.type=type;o.frequency.value=440*Math.pow(2,(midi-69)/12);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+0.015);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);
  o.connect(g);g.connect(music);o.start(t);o.stop(t+duration+0.02);
 }
 function percussion(t){
  const o=track(ctx.createOscillator()),g=ctx.createGain();o.frequency.setValueAtTime(115,t);o.frequency.exponentialRampToValueAtTime(43,t+0.12);g.gain.setValueAtTime(0.42,t);g.gain.exponentialRampToValueAtTime(0.0001,t+0.17);o.connect(g);g.connect(music);o.start(t);o.stop(t+0.18);
 }
 function schedule(){
  if(!ctx||!inRound||!enabled||paused||document.hidden)return;
  // Four evolving minor-key chords, a pulsing bass and a light eighth-note arpeggio.
  const chords=[[50,53,57,62],[46,50,53,58],[53,57,60,65],[48,52,55,60]],pattern=[0,2,1,3,2,1,3,2];
  while(nextTime<ctx.currentTime+0.15){
   const chord=chords[Math.floor(step/16)%4],pos=step%8;
   tone(chord[pattern[pos]]+12,nextTime,0.33,pos%2?0.12:0.18);
   if(step%4===0){tone(chord[0]-12,nextTime,0.72,0.4,'sine');percussion(nextTime);}
   if(step%16===0)chord.forEach(n=>tone(n,nextTime,2.8,0.055,'sine'));
   step++;nextTime+=STEP;
  }
 }
 function beginMusic(){if(!ctx||!inRound||!enabled||paused||document.hidden)return;clear();step=0;nextTime=ctx.currentTime+0.06;schedule();scheduler=setInterval(schedule,45);}
 function resumeMusic(){if(!ensure())return;ctx.resume().then(()=>{if(inRound&&enabled&&!paused)beginMusic()}).catch(()=>{available=false;paint()});}
 function startRound(){clear();inRound=true;paused=false;if(enabled)resumeMusic();}
 function clap(t,volume,pan){
  const source=track(ctx.createBufferSource()),filter=ctx.createBiquadFilter(),g=ctx.createGain();source.buffer=noise;filter.type='bandpass';filter.frequency.value=1100+Math.random()*1800;filter.Q.value=0.55;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+0.003);g.gain.exponentialRampToValueAtTime(0.0001,t+0.11+Math.random()*0.07);
  source.connect(filter);filter.connect(g);
  if(ctx.createStereoPanner){const p=ctx.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(claps)}else g.connect(claps);
  source.start(t,Math.random()*0.015);source.stop(t+0.21);
 }
 function finishRound(){
  inRound=false;clear();if(!enabled||paused||document.hidden||!ensure())return;
  ctx.resume().then(()=>{if(!enabled||inRound||paused||document.hidden)return;const base=ctx.currentTime+0.04;
   // Twelve virtual audience members clap at different rates and positions.
   for(let person=0;person<12;person++){let t=0.02+Math.random()*0.18;const interval=0.26+Math.random()*0.16;while(t<2.5){const fade=Math.min(1,t/0.25,(2.7-t)/0.6);clap(base+t,(0.26+Math.random()*0.2)*fade,(person/11)*1.6-0.8);t+=interval+Math.random()*0.07;}}
  }).catch(()=>{});
 }
 function stop(){inRound=false;clear();}
 function background(){paused=true;clear();if(ctx)ctx.suspend().catch(()=>{});}
 function foreground(){paused=false;if(enabled&&inRound)resumeMusic();}
 function attach(){paint();const b=button();if(b)b.onclick=()=>{enabled=!enabled;try{localStorage.setItem(STORAGE,enabled?'on':'off')}catch{}clear();paint();if(enabled&&inRound)resumeMusic()};document.addEventListener('visibilitychange',()=>{if(document.hidden)background();else foreground()});globalThis.addEventListener('pagehide',background);}
 return {attach,startRound,finishRound,stop,background,foreground};
})();
