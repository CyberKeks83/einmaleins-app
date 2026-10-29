const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs');
function setup(stored=null){
 const sources=[],events={},intervals=new Set(),storage=new Map(stored?[["flink-sound-v1",stored]]:[]),button={attrs:{},setAttribute(k,v){this.attrs[k]=v}};
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const node=()=>({connect(){},disconnect(){},gain:param(),threshold:param(),ratio:param(),frequency:param(),Q:param(),pan:param(),start(){this.started=true},stop(){this.stopped=true}});
 class Context{
  constructor(){this.currentTime=0;this.sampleRate=1000;this.destination={};this.state='running';}
  createGain(){return node()}createDynamicsCompressor(){return node()}createBiquadFilter(){return node()}createStereoPanner(){return node()}
  createOscillator(){const n=node();sources.push(n);return n}createBufferSource(){const n=node();n.bufferSource=true;sources.push(n);return n}
  createBuffer(ch,len){return {getChannelData(){return new Float32Array(len)}}}
  resume(){this.state='running';return Promise.resolve()}suspend(){this.state='suspended';return Promise.resolve()}
 }
 const context={AudioContext:Context,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},document:{hidden:false,getElementById:()=>button,addEventListener:(n,f)=>events[n]=f},addEventListener:(n,f)=>events[n]=f,setInterval:f=>{intervals.add(f);return f},clearInterval:f=>intervals.delete(f)};
 vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/audio.js','utf8'),context);context.FlinkAudio.attach();
 return {audio:context.FlinkAudio,context,button,sources,storage,events,intervals};
}
test('music starts on request, stops in background, resumes and ends with applause',async()=>{
 const c=setup();assert.equal(c.sources.length,0);c.audio.startRound();await Promise.resolve();assert(c.sources.some(s=>!s.bufferSource));assert.equal(c.intervals.size,1);
 c.audio.background();assert.equal(c.intervals.size,0);assert(c.sources.every(s=>s.stopped));
 c.audio.foreground();await Promise.resolve();assert.equal(c.intervals.size,1);
 c.audio.finishRound();await Promise.resolve();assert.equal(c.intervals.size,0);assert(c.sources.filter(s=>s.bufferSource).length>40);
 c.audio.stop();assert(c.sources.every(s=>s.stopped));
});
test('mute persists and prevents music and applause',async()=>{
 const c=setup();c.button.onclick();assert.equal(c.storage.get('flink-sound-v1'),'off');c.audio.startRound();await Promise.resolve();c.audio.finishRound();await Promise.resolve();assert.equal(c.sources.length,0);
 const restored=setup('off');assert.equal(restored.button.attrs['aria-pressed'],'false');restored.audio.startRound();await Promise.resolve();assert.equal(restored.sources.length,0);
 restored.button.onclick();await Promise.resolve();assert(restored.sources.length>0);assert.equal(restored.storage.get('flink-sound-v1'),'on');
});
test('no applause after abort or in the background',async()=>{
 const c=setup();c.audio.startRound();await Promise.resolve();c.audio.stop();assert(!c.sources.some(s=>s.bufferSource));
 c.audio.startRound();await Promise.resolve();c.audio.background();c.audio.finishRound();await Promise.resolve();assert(!c.sources.some(s=>s.bufferSource));
});
