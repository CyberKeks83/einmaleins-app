const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(stored='[]'){
 const elements=new Map(),memory=new Map([['flink-results-v1',stored]]);
 function el(){return {textContent:'',hidden:false,children:[],attrs:{},classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v},replaceChildren(...v){this.children=v},append(...v){this.children.push(...v)},focus(){},showModal(){this.open=true},close(){this.open=false}}}
 const sounds=[];const context={FlinkAudio:{attach(){},startRound(){sounds.push('start')},finishRound(){sounds.push('finish')},stop(){sounds.push('stop')}},document:{getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,addEventListener(){}},localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v)},performance:{now:()=>1000},setInterval:()=>1,clearInterval(){},confirm:()=>true};
 vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/app.js','utf8'),context);
 return {run:s=>vm.runInContext(s,context),memory,elements,sounds};
}
test('20 distinct tasks per round, no factor 1 or 10',()=>{
 const c=setup();for(let n=0;n<200;n++){
 c.run('start()');assert.equal(c.run('tasks.length'),20);assert.equal(c.run('new Set(tasks.map(t=>t.join(","))).size'),20);assert(c.run('tasks.every(([a,b])=>a>=2&&a<=9&&b>=2&&b<=9)'));
 }
});
test('incorrect answers advance and detailed review survives reopening',()=>{
 const c=setup();c.run('start();key("Enter")');assert.equal(c.run('index'),0);
 c.run('key("0");key("Enter")');assert.equal(c.run('index'),1);assert.equal(c.run('errors'),1);
 c.run('for(let n=1;n<20;n++){value=String(tasks[index][0]*tasks[index][1]);key("Enter")}');
 assert.equal(c.run('running'),false);assert.equal(c.run('history[0].correct'),19);assert.equal(c.run('history[0].responses.length'),20);
 c.run('openReview(history[0])');assert.equal(c.elements.get('reviewRows').children.length,1);assert.equal(c.elements.get('reviewDialog').open,true);
 assert.equal(c.elements.get('reviewRows').children[0].children[1].textContent,'0 ✕');
 assert.equal(c.elements.get('reviewRows').children[0].children[2].textContent,c.run('String(responses[0].a*responses[0].b)'));
 c.run("reviewFilter='all';renderReview()");assert.equal(c.elements.get('reviewRows').children.length,20);
 const restored=setup(c.memory.get('flink-results-v1'));restored.run("tab='recent';renderRecords()");restored.elements.get('records').children[0].onclick();
 assert.equal(restored.elements.get('reviewRows').children.length,1);assert.equal(restored.run('reviewRound.correct'),19);
});
test('perfect round shows no errors and old rounds have clear fallback',()=>{
 const c=setup(JSON.stringify([{ms:1000,errors:0,correct:20,date:1}]));assert.equal(c.elements.get('records').children[0].className,'empty');
 c.run('openReview(history[0])');assert.equal(c.elements.get('reviewLegacy').hidden,false);
 c.run('start();for(let n=0;n<20;n++){value=String(tasks[index][0]*tasks[index][1]);key("Enter")}');c.run('openReview(history[0])');
 assert.equal(c.elements.get('reviewEmpty').hidden,false);assert.equal(c.elements.get('reviewLegacy').hidden,true);assert.equal(c.elements.get('reviewTable').hidden,true);
 c.run("reviewFilter='all';renderReview()");assert.equal(c.elements.get('reviewRows').children.length,20);
});

test('music follows the round and applause only follows completion',()=>{
 const c=setup();c.run('start()');assert.deepEqual(c.sounds,['start']);
 c.run('value="0";key("Enter")');assert.deepEqual(c.sounds,['start']);
 c.run('for(let n=1;n<20;n++){value="0";key("Enter")}');assert.deepEqual(c.sounds,['start','finish']);
 c.run('start()');c.elements.get('cancel').onclick();assert.equal(c.sounds.at(-1),'stop');
});
