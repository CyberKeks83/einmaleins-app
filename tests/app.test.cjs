const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(stored='[]'){
 const elements=new Map(),memory=new Map([['flink-results-v1',stored]]);
 function el(){return {textContent:'',hidden:false,children:[],attrs:{},classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this.attrs[k]=v},replaceChildren(...v){this.children=v},append(...v){this.children.push(...v)},get lastElementChild(){return this.children.at(-1)},focus(){},showModal(){this.open=true},close(){this.open=false}}}
 const sounds=[];const context={FlinkAudio:{attach(){},startRound(){sounds.push('start')},finishRound(){sounds.push('finish')},stop(){sounds.push('stop')}},document:{getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el,addEventListener(){}},localStorage:{getItem:k=>memory.get(k),setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},performance:{now:()=>1000},setInterval:()=>1,clearInterval(){},confirm:()=>true};
 vm.createContext(context);vm.runInContext(fs.readFileSync('app/src/main/assets/tasks.js','utf8'),context);vm.runInContext(fs.readFileSync('app/src/main/assets/app.js','utf8'),context);
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

test('privacy control deletes stored results',()=>{
 const c=setup(JSON.stringify([{ms:1000,errors:0,correct:20,date:1}]));
 c.elements.get('eraseResults').onclick();assert.equal(c.memory.has('flink-results-v1'),false);assert.equal(c.run('history.length'),0);
});


test('sequence rounds contain 10 unique bounded tasks, both directions and each worksheet type',()=>{
 const c=setup();c.run("setMode('zahlenreihen-v1')");
 for(let n=0;n<250;n++){
  c.run('start()');assert.equal(c.run('tasks.length'),10);assert(c.run('tasks.every(t=>t.numbers.every(v=>Number.isInteger(v)&&v>=0&&v<=1000))'));
  assert.equal(c.run("new Set(tasks.map(t=>t.kind+':'+t.numbers.join(','))).size"),10);
  assert(c.run("['continue','step','find','middle'].every(k=>tasks.some(t=>t.kind===k))"));
  assert(c.run('tasks.some(t=>t.step<0)&&tasks.some(t=>t.step>0)'));
  assert(c.run("tasks.every(t=>t.kind!=='middle'||t.numbers[1]===(t.numbers[0]+t.numbers[2])/2)"));
 }
});
test('sequence gaps advance, wrong entries submit, review persists and rankings stay separate',()=>{
 const c=setup();c.run("setMode('zahlenreihen-v1');start();tasks[0]={kind:'continue',title:'Wie geht es weiter?',numbers:[398,399,400,401,402],blanks:[2,3,4]};showQuestion();key('Enter')");assert.equal(c.run('index'),0);
 c.run("key('0');key('Enter')");assert.equal(c.run('activeBlank'),1);assert.equal(c.run('index'),0);
 c.run("value='401';entries[1]=value;key('Enter');value='402';entries[2]=value;key('Enter')");assert.equal(c.run('index'),1);assert.equal(c.run('errors'),1);
 c.run("for(let n=1;n<10;n++){entries=tasks[index].blanks.map(i=>String(tasks[index].numbers[i]));value=entries[0];key('Enter')}");
 assert.equal(c.run('running'),false);assert.equal(c.run('history[0].correct'),9);assert.equal(c.run('history[0].mode'),'zahlenreihen-v1');
 c.run('openReview(history[0])');assert.equal(c.elements.get('reviewRows').children.length,1);assert.equal(c.elements.get('reviewRows').children[0].children[2].textContent,'400, 401, 402');
 const restored=setup(c.memory.get('flink-results-v1'));restored.run("tab='recent';renderRecords()");assert.equal(restored.elements.get('records').children[0].className,'empty');
 restored.run("setMode('zahlenreihen-v1')");assert.equal(restored.elements.get('records').children.length,1);restored.elements.get('records').children[0].onclick();assert.equal(restored.run('reviewRound.correct'),9);
});
test('sequence input permits 1000 and active gaps can be revised before submitting',()=>{
 const c=setup();c.run("setMode('zahlenreihen-v1');start();tasks[0]={kind:'step',title:'Vorwärts',numbers:[600,700,800,900,1000],blanks:[1,2,4]};showQuestion();key('7');key('0');key('0');key('Enter');key('8');key('0');key('0');key('Enter');key('1');key('0');key('0');key('0')");
 assert.equal(c.run('value'),'1000');c.run("key('5')");assert.equal(c.run('value'),'1000');
 c.elements.get('sequenceCells').children[1].onclick();c.run("key('Backspace');key('1')");assert.equal(c.run('entries[0]'),'701');
 c.run("key('Backspace');key('0');key('Enter')");assert.equal(c.run('index'),1);assert.equal(c.run('responses[0].correct'),true);
});

test('Tausenderbuch jumps stay on one page and answers advance the round',()=>{
 const c=setup();
 for(let i=0;i<30;i++){
  c.run("setMode('tausenderbuch-v1');start()");
  assert.equal(c.run('tasks.length'),10);
  assert(c.run('tasks.every(t=>t.start>=t.first&&t.end>=t.first&&t.start<t.first+100&&t.end<t.first+100)'));
  assert(c.run('tasks.filter(t=>t.inverse).every(t=>t.expected>=1&&t.expected<=3)'));
  c.run('running=false');
 }
 c.run("start();for(let n=0;n<10;n++){value=String(tasks[index].expected);key('Enter')}");
 assert.equal(c.run('history[0].correct'),10);
 assert.equal(c.run('history[0].total'),10);
});
test('marking 326 uses three hundreds, two tens, and six ones',()=>{
 const c=setup();
 c.run("setMode('stellenwert-v1');start();tasks[0]={kind:'build',title:'Stelle die Zahl 326 dar.',expected:326,digits:[3,2,6]};showQuestion()");
 const groups=c.elements.get('placeGroups').children;
 groups[0].lastElementChild.children[2].onclick();
 groups[1].lastElementChild.children[1].onclick();
 groups[2].lastElementChild.children[5].onclick();
 c.elements.get('submitPlace').onclick();
 assert.equal(c.run('responses[0].answer'),326);
 assert.equal(c.run('responses[0].correct'),true);
 c.run("for(let n=1;n<10;n++){const task=tasks[index];if(task.kind==='build'){marked=task.digits;submitPlace()}else{value=String(task.expected);key('Enter')}}");
 assert.equal(c.run('history[0].correct'),10);
});
test('previous 20 task sequence rounds remain in history but do not compete with 10 task rounds',()=>{
 const old={mode:'zahlenreihen-v1',ms:500,errors:0,correct:20,date:1};
 const c=setup(JSON.stringify([old]));
 c.run("setMode('zahlenreihen-v1')");
 assert.equal(c.elements.get('records').children[0].className,'empty');
 c.run("tab='recent';renderRecords()");
 assert.equal(c.elements.get('records').children[0].className,'record');
});
