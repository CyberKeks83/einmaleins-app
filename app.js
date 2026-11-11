'use strict';
const $=id=>document.getElementById(id),MODE='2bis9-v1',KEY='flink-results-v1';
let history=[],storageOK=true;try{history=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(history))history=[];history=history.filter(r=>Number.isFinite(r.ms)&&r.ms>=0&&Number.isInteger(r.errors)&&r.errors>=0&&Number.isFinite(r.date));localStorage.setItem(KEY,JSON.stringify(history));}catch{history=[];storageOK=false;$('storageNotice').hidden=false;}
let mode=MODE,entries=[],activeBlank=0,marked=[0,0,0];
const EXAM='klassentest-v1',WORKSHEET='arbeitsblatt-v1';
function isTimedTest(){return mode===EXAM||mode===WORKSHEET;}
const gradeScale=[[30,'1'],[29,'1−'],[28,'1–2'],[27,'2+'],[26,'2'],[25,'2−'],[24,'2–3'],[23,'3+'],[22,'3'],[21,'3−'],[20,'3–4'],[19,'4+'],[18,'4'],[17,'4−'],[16,'4–5'],[15,'5+'],[13,'5'],[11,'5−'],[9,'5–6'],[0,'6']];
function gradeFor(points){return gradeScale.find(([minimum])=>points>=minimum)[1];}
const MODES = {
 [WORKSHEET]: {name:'Klassenarbeit üben',count:30,minutes:20,art:'✎',intro:'30 Aufgaben nach den Vorbereitungsblättern. Rechne, ergänze Lücken und arbeite mit Zahlenstrahl und Hundertertafel.'},
 [EXAM]: {name:'Klassentest',count:30,minutes:20,art:'✎',intro:'10 Einmaleins, 5 Zahlenreihen, 10 Stellenwerte und 5 Tausenderbuch. Maximal 20 Minuten. Jede vollständig richtige Aufgabe gibt einen Punkt.'},
 '2bis9-v1': {name:'Kleines Einmaleins', count:20, minutes:2, art:'7 × 8 = ?', intro:'Gemischte Aufgaben aus den Reihen 2 bis 9.'},
 'zahlenreihen-v1': {name:'Zahlenreihen bis 1000', count:10, minutes:10, art:'398 · 399 · ?', intro:'Zähle vorwärts und rückwärts, ergänze Reihen und finde die Mitte.'},
 'tausenderbuch-v1': {name:'Tausenderbuch', count:10, minutes:10, art:'← ↑ ↓ →', intro:'Springe auf einer Hundertertafel. Ein Feld nach rechts bedeutet +1, ein Feld nach unten +10.'},
 'stellenwert-v1': {name:'Hunderter, Zehner, Einer', count:10, minutes:10, art:'H · Z · E', intro:'Lies und baue Zahlen aus roten Hundertern, blauen Zehnern und grünen Einern.'}
};

let responses=[],tasks=[],index=0,errors=0,value='',startTime=0,examDeadline=0,ticker=null,running=false,tab='best',reviewRound=null,reviewFilter='wrong';
const sound=typeof FlinkAudio!=='undefined'?FlinkAudio:{attach(){},startRound(){},finishRound(){},stop(){}};
sound.attach();
const time=ms=>{const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function paintTime(ms){if(isTimedTest()){const remaining=time(Math.ceil(Math.max(0,timeLimit()-ms)/1000)*1000);$('time').textContent=remaining;$('timer').classList.toggle('over',ms>=timeLimit());$('timer').setAttribute('aria-label','Verbleibende Zeit '+remaining);return;}$('time').textContent=time(ms);$('timer').classList.toggle('over',ms>timeLimit());$('timer').setAttribute('aria-label','Vergangene Zeit '+time(ms)+(ms>timeLimit()?', über '+limitMinutes()+' Minuten':''));}
function paintDots(){const nodes=Array.from({length:roundCount()},(_,i)=>{const el=document.createElement('span');el.className='dot'+(i<index?' done':i===index&&running?' current':'');return el});$('dots').replaceChildren(...nodes);}
function isSequence(){return Array.isArray(tasks[index]?.blanks);}
function limitMinutes(){return MODES[mode].minutes;}
function roundCount(){return MODES[mode].count;}
function savedCount(round){return round.total ?? 20;}
function timeLimit(){return limitMinutes()*60_000;}
function setMode(next){
 if(running)return;
 mode=next;
 for(const [id,key] of Object.entries({multiplyMode:MODE,sequenceMode:'zahlenreihen-v1',bookMode:'tausenderbuch-v1',placeMode:'stellenwert-v1',examMode:EXAM,worksheetMode:WORKSHEET})){
  $(id).setAttribute('aria-pressed',String(mode===key));
 }
 const exercise=MODES[mode];
 $('headlineCount').textContent=exercise.count+' Aufgaben.';
 $('welcomeTitle').textContent=exercise.name;
 $('welcomeText').textContent=exercise.count+' Aufgaben. '+exercise.intro;
 $('mathArt').textContent=exercise.art;
 $('finished').hidden=true;$('welcome').hidden=false;$('progressLabel').textContent='Bereit, wenn du es bist.';index=0;paintDots();paintTime(0);
 $('goalTime').textContent=isTimedTest()?'Zeitlimit 20:00':'Bis '+limitMinutes()+':00 grün';
 $('goalAfter').hidden=isTimedTest();
 $('examScale').hidden=!isTimedTest();
 $('gradeScale').textContent=gradeScale.map(([points,grade])=>points+' P.: '+grade).join(' · ');
 $('bestTimeLimit').textContent='unter '+limitMinutes()+' Min.';
 $('recordNote').textContent='Tippe auf eine Runde für die Auswertung. Für die Bestenliste brauchst du '+roundCount()+' richtige Aufgaben in weniger als '+limitMinutes()+' Minuten.';
 renderRecords();
}
function drawSequence(){
 const task=tasks[index],container=$('sequenceCells');container.replaceChildren();
 container.classList.toggle('worksheet-layout',Boolean(task.layout));
 container.classList.toggle('midpoint',task.kind==='middle');
 function makeCell(i){
  const number=task.numbers[i];
  const blank=task.blanks.indexOf(i),cell=document.createElement(blank<0?'span':'button');
  cell.className='sequence-cell'+(blank<0?' given':blank===activeBlank?' active':'');
  cell.textContent=blank<0?String(number):entries[blank]||'?';
  if(blank>=0){cell.type='button';cell.setAttribute('aria-label','Fehlende Zahl '+(blank+1)+', '+(entries[blank]||'noch leer'));cell.setAttribute('aria-pressed',String(blank===activeBlank));cell.onclick=()=>{activeBlank=blank;value=entries[blank];drawSequence();};}
  return cell;
 }
 if(task.layout){
  for(const tokens of task.layout){
   const row=document.createElement('div');
   row.className='worksheet-row';
   for(const token of tokens){
    if(Number.isInteger(token)){row.append(makeCell(token));continue;}
    const label=document.createElement('span');label.textContent=token;row.append(label);
   }
   container.append(row);
  }
 }else task.numbers.forEach((_,i)=>container.append(makeCell(i)));
 $('feedback').textContent='Zahl '+(activeBlank+1)+' von '+task.blanks.length+' · Mit ✓ weiter.';
}
function drawNumberLine(task){
 const canvas=$('numberLine');
 const context=canvas.getContext('2d');
 const left=34,right=686,y=56;
 const position=n=>left+(right-left)*(n-task.first)/(task.last-task.first);
 const reading=task.kind==='line-read';
 context.clearRect(0,0,720,116);
 context.strokeStyle='#243e34';
 context.fillStyle='#243e34';
 context.textAlign='center';
 context.font='26px system-ui';
 context.beginPath();context.moveTo(left,y);context.lineTo(right,y);context.stroke();
 function tick(n,height,label){
  const x=position(n);
  context.beginPath();context.moveTo(x,y-height);context.lineTo(x,y+height);context.stroke();
  if(label!==undefined)context.fillText(label,x,y+height+28);
 }
 const marks=$('lineChoices');
 marks.replaceChildren();
 if(reading){
  for(let n=task.first;n<=task.last;n++)tick(n,n%10===0?13:n%5===0?8:5,n%10===0?String(n):undefined);
  const x=position(task.expected);
  context.fillStyle='#a82125';
  context.beginPath();context.moveTo(x-8,29);context.lineTo(x+8,29);context.lineTo(x,y-3);context.fill();
  const lower=Math.floor(task.expected/10)*10;
  canvas.setAttribute('aria-label','Zahlenstrahl von '+task.first+' bis '+task.last+'. Der Pfeil steht '+(task.expected-lower)+' kleine Striche rechts von '+lower+'.');
 }else{
  tick(0,13,'0');tick(500,13,'500');tick(1000,13,'1000');
  task.marks.forEach((n,i)=>{
   const letter='ABCD'[i];
   tick(n,10);
   context.fillText(letter,position(n),32);
   const button=document.createElement('button');
   button.type='button';button.textContent=letter;
   button.setAttribute('aria-label','Markierung '+letter);
   button.onclick=()=>{
    if(!running||expireExam()||tasks[index]!==task)return;
    submitAnswer({title:task.title,answer:letter,expected:lineSolution(task),correct:n===task.expected});
   };
   marks.append(button);
  });
  canvas.setAttribute('aria-label','Zahlenstrahl von 0 bis 1000 mit vier Markierungen von A bis D.');
 }
}
function lineSolution(task){return 'ABCD'[task.marks.indexOf(task.expected)]+' ('+task.expected+')';}
function drawBook(task){
 const route=$('bookRoute');
 route.hidden=task.inverse;
 route.replaceChildren(...(task.inverse?[]:task.moves.map(move=>{
  const step=document.createElement('span');
  step.textContent=move.count+' '+move.arrow;
  step.setAttribute('aria-label',move.count+' Felder nach '+move.name);
  return step;
 })));
 const grid=$('bookGrid');
 grid.replaceChildren();
 for(let n=task.first;n<task.first+100;n++){
  const cell=document.createElement('span');
  cell.textContent=n;
  if(n===task.start)cell.className='book-start';
  if(task.inverse&&n===task.end)cell.className='book-end';
  grid.append(cell);
 }
 $('bookHint').textContent='↑ −10 · ← −1 · → +1 · ↓ +10'+(task.inverse?' · Ziel gelb':'')+' · Start grün';
}
const placeNames=['Hunderter','Zehner','Einer'];
function drawPlaces(task, update=false){
 const panel=$('placeGroups');
 const building=task.kind==='build';
 if(!update){
  panel.replaceChildren();
  for(let column=0;column<3;column++){
   const group=document.createElement('section');
   group.className='place-group place-'+column;
   const label=document.createElement('strong');
   label.textContent=placeNames[column];
   group.append(label);
   const shapes=document.createElement('div');
   shapes.className='place-shapes';
   const count=building?9:task.digits[column];
   for(let i=0;i<count;i++){
    const shape=document.createElement(building?'button':'span');
    shape.className='place-shape';
    if(building){
     shape.type='button';
     shape.setAttribute('aria-label',(i+1)+' '+placeNames[column]);
     shape.onclick=()=>{
      marked[column]=marked[column]===i+1?i:i+1;
      drawPlaces(task,true);
     };
    }else shape.setAttribute('aria-hidden','true');
    shapes.append(shape);
   }
   if(building){
    const clear=document.createElement('button');
    clear.type='button';
    clear.className='place-clear';
    clear.textContent='0';
    clear.setAttribute('aria-label',placeNames[column]+' auf null setzen');
    clear.onclick=()=>{marked[column]=0;drawPlaces(task,true);};
    group.append(clear);
   }
   group.append(shapes);
   panel.append(group);
  }
 }
 if(building){
  Array.from(panel.children).forEach((group,column)=>{
   Array.from(group.lastElementChild.children).forEach((shape,i)=>{
    shape.setAttribute('aria-pressed',String(i<marked[column]));
   });
  });
  $('placeHint').textContent=marked.map((count,i)=>count+' '+placeNames[i]).join(' · ');
 }else{
  $('placeHint').textContent='';
 }
}
function showQuestion(){
 value='';entries=[];activeBlank=0;$('answer').textContent='?';$('feedback').textContent='Tippe dein Ergebnis ein.';$('feedback').classList.remove('error');
 const task=tasks[index];
 const isBook=task.kind==='book';
 const isPlace=task.kind==='build'||task.kind==='read';
 const building=task.kind==='build';
 const marking=task.kind==='line-mark';
 const isLine=marking||task.kind==='line-read';
 $('linePanel').hidden=!isLine;
 if(isLine)drawNumberLine(task);
 $('sequenceCells').hidden=!isSequence();
 $('answer').hidden=isSequence()||building||marking;
 $('question').classList.toggle('sequence-title',mode!==MODE);
 $('bookPanel').hidden=!isBook;
 $('placePanel').hidden=!isPlace;
 $('keypad').hidden=building||marking;
 $('feedback').hidden=building||marking;
 $('submitPlace').hidden=!building;
 if(isBook)drawBook(task);
 if(isPlace){marked=[0,0,0];drawPlaces(task);}
 if(isSequence()){entries=tasks[index].blanks.map(()=> '');$('question').textContent=tasks[index].title;drawSequence();}
 else $('question').textContent=task.title??(task[0]+' × '+task[1]+' =');
 $('progressLabel').textContent='Aufgabe '+(index+1)+' von '+roundCount();paintDots();
}
function start(){
 sound.startRound();tasks=FlinkTasks.make(mode);index=0;errors=0;responses=[];running=true;startTime=performance.now();examDeadline=Date.now()+timeLimit();
 $('modePicker').hidden=true;$('welcome').hidden=true;$('finished').hidden=true;$('playing').hidden=false;
 paintTime(0);showQuestion();clearInterval(ticker);ticker=setInterval(()=>{if(!expireExam())paintTime(elapsed());},80);
 if(!$('answer').hidden)$('answer').focus({preventScroll:true});
}
function elapsed(){
 return isTimedTest()?Math.max(0,timeLimit()-(examDeadline-Date.now())):performance.now()-startTime;
}
function expireExam(){
 if(!running||!isTimedTest()||Date.now()<examDeadline)return false;
 for(const task of tasks.slice(index)){
  if(Array.isArray(task.blanks)){
   responses.push({title:reviewTaskTitle(task),layout:task.layout,numbers:task.numbers,blanks:task.blanks,answers:[],expected:task.blanks.map(i=>task.numbers[i]),correct:false,unanswered:true});
  }else if(Array.isArray(task)){
   responses.push({a:task[0],b:task[1],correct:false,unanswered:true});
  }else{
   responses.push({title:reviewTaskTitle(task),expected:task.kind==='line-mark'?lineSolution(task):task.expected,correct:false,unanswered:true});
  }
 }
 finish(true);
 return true;
}
function finish(timedOut=false){
 const ms=timedOut?timeLimit():elapsed();
 const unanswered=roundCount()-index;
 const correct=index-errors;
 running=false;sound.finishRound();clearInterval(ticker);paintTime(ms);paintDots();
 $('playing').hidden=true;$('finished').hidden=false;$('modePicker').hidden=false;$('progressLabel').textContent=index+' von '+roundCount()+' beantwortet';
 const eligible=ms<timeLimit()&&correct===roundCount();
 const oldBest=history.filter(r=>r.mode===mode&&savedCount(r)===roundCount()&&r.errors===0&&r.ms<timeLimit()).reduce((a,r)=>Math.min(a,r.ms),Infinity);
 $('finishTitle').textContent=eligible&&ms<oldBest?'Neue persönliche Bestzeit!':'Deine Auswertung';
 $('finishText').textContent=timedOut?'Die 20 Minuten sind vorbei. '+unanswered+' Aufgaben blieben offen.':correct===roundCount()?'Alle '+roundCount()+' Aufgaben richtig beantwortet.':'Alle '+roundCount()+' Aufgaben beantwortet.';
 $('summary').textContent=time(ms);$('summary').classList.toggle('over',ms>timeLimit());
 $('examResult').hidden=!isTimedTest();
 $('examResult').textContent=isTimedTest()?correct+' / 30 Punkte · Note '+gradeFor(correct):'';
 $('rightCount').textContent=correct;$('wrongCount').textContent=errors;$('accuracy').textContent=Math.round(correct/roundCount()*100)+' %';
 $('reviewSummary').textContent=unanswered?'Offene Aufgaben geben 0 Punkte.':errors===0?'Alle Antworten sind richtig.':errors+' '+(errors===1?'Aufgabe kannst':'Aufgaben kannst')+' du noch üben.';
 $('detailScore').hidden=mode!=='zahlenreihen-v1';if(mode==='zahlenreihen-v1'){const all=responses.flatMap(r=>r.answers.map((v,i)=>v===r.expected[i]));$('detailScore').textContent=all.filter(Boolean).length+' von '+all.length+' einzelnen Zahlen richtig. Eine Reihe ist richtig, wenn alle Lücken stimmen.';}
 $('recordText').hidden=isTimedTest();
 $('recordText').textContent=eligible?'Deine Zeit steht jetzt in der Bestenliste.':errors>0?'Für die Bestenliste: unter '+limitMinutes()+' Minuten und alle '+roundCount()+' richtig.':'Dein Ziel: weniger als '+limitMinutes()+' Minuten.';
 const result={ms,errors,correct,date:Date.now(),mode,total:roundCount(),...(isTimedTest()?{grade:gradeFor(correct),unanswered}:{}),responses:responses.map(r=>({...r}))};
 history.unshift(result);$('viewResults').onclick=()=>openReview(result);history=history.slice(0,500);
 try{localStorage.setItem(KEY,JSON.stringify(history))}catch{storageOK=false;$('storageNotice').hidden=false;}
 renderRecords();$('again').focus({preventScroll:true});
}
function submitAnswer(response){
 responses.push(response);
 if(!response.correct)errors++;
 index++;
 if(index===roundCount())finish();
 else showQuestion();
}
function submitPlace(){
 if(!running||expireExam()||tasks[index].kind!=='build')return;
 const task=tasks[index];
 const answer=marked[0]*100+marked[1]*10+marked[2];
 submitAnswer({title:task.title,answer,expected:task.expected,correct:answer===task.expected});
}
function reviewTaskTitle(task){
 if(task.kind==='grid')return task.title+' Gegeben: '+task.anchor+'. Lücken zeilenweise.';
 if(task.kind==='line-read')return task.title+' Zahlenstrahl '+task.first+' bis '+task.last+'.';
 if(task.kind==='read')return task.title+' '+task.digits.map((count,i)=>count+' '+placeNames[i]).join(', ');
 return task.instruction??task.title;
}
function key(k){
 if(!running||expireExam()||['build','line-mark'].includes(tasks[index].kind))return;
 if(/^\d$/.test(k)){
  if(value.length<(mode===MODE?3:4))value+=k;
  if(isSequence()){entries[activeBlank]=value;drawSequence();}else $('answer').textContent=value||'?';
 }else if(k==='Backspace'){
  value=value.slice(0,-1);if(isSequence()){entries[activeBlank]=value;drawSequence();}else $('answer').textContent=value||'?';
 }else if(k==='Enter'&&value!==''){
  if(isSequence()){
   const next=entries.findIndex((v,i)=>i>activeBlank&&v==='');const missing=next>=0?next:entries.findIndex(v=>v==='');
   if(missing>=0){activeBlank=missing;value=entries[missing];drawSequence();return;}
   const task=tasks[index],answers=entries.map(Number),expected=task.blanks.map(i=>task.numbers[i]);
   const correct=(task.solutions??[expected]).some(solution=>answers.every((v,i)=>v===solution[i]));
   submitAnswer({kind:task.kind,title:reviewTaskTitle(task),layout:task.layout,numbers:[...task.numbers],blanks:[...task.blanks],answers,expected:correct?answers:expected,correct});
  }else if(Array.isArray(tasks[index])){
   const [a,b]=tasks[index],answer=Number(value),correct=answer===a*b;
   submitAnswer({a,b,answer,correct});
  }else{
   const task=tasks[index],answer=Number(value),expected=task.expected;
   const title=reviewTaskTitle(task);
   submitAnswer({title,answer,expected,correct:answer===expected});
  }
 }
}
function openReview(round){
 reviewRound=round;reviewFilter='wrong';
 $('reviewTitle').textContent='Deine Auswertung';
 $('reviewMode').textContent=(MODES[round.mode]??MODES[MODE]).name;
 $('reviewStats').textContent=Number.isInteger(round.correct)?`${round.correct} richtig · ${round.errors} falsch · ${time(round.ms)}`:`Zeit ${time(round.ms)} · ${round.errors} Fehlversuche`;
 if(round.grade)$('reviewStats').textContent+= ' · '+round.correct+' / 30 Punkte · Note '+round.grade+(round.unanswered?' · '+round.unanswered+' offen':'');
 const hasDetails=Array.isArray(round.responses)&&round.responses.length===savedCount(round);
 $('allAnswers').textContent='Alle '+savedCount(round)+' Antworten';
 $('reviewFilters').hidden=!hasDetails;
 $('reviewLegacy').hidden=hasDetails;
 $('reviewLegacy').textContent='Für diese frühere Runde wurden noch keine einzelnen Antworten gespeichert. Neue Runden kannst du hier vollständig ansehen.';
 renderReview();$('reviewDialog').showModal();
}
function renderReview(){
 $('onlyWrong').setAttribute('aria-pressed',String(reviewFilter==='wrong'));
 $('allAnswers').setAttribute('aria-pressed',String(reviewFilter==='all'));
 const details=Array.isArray(reviewRound?.responses)?reviewRound.responses:[];
 const visible=reviewFilter==='wrong'?details.filter(r=>!r.correct):details;
 $('reviewRows').replaceChildren();
 $('reviewTable').hidden=visible.length===0;
 $('reviewEmpty').hidden=!reviewRound||details.length!==savedCount(reviewRound)||visible.length>0;
 for(const r of visible){
  const row=document.createElement('tr');
  const columns=r.numbers?[r.layout?r.title+' '+r.layout.map(row=>row.map(token=>Number.isInteger(token)?(r.blanks.includes(token)?'?':r.numbers[token]):token).join(' ')).join(' / '):r.numbers.map((v,i)=>r.blanks.includes(i)?'?':v).join(' · '),r.answers.join(', ')+(r.correct?' ✓':' ✕'),r.expected.join(', ')]:[r.title??(r.a+' × '+r.b),String(r.answer)+(r.correct?' ✓':' ✕'),String(r.expected??(r.a*r.b))];
  if(r.unanswered)columns[1]='Offen';
  for(const text of columns){const cell=document.createElement('td');cell.textContent=text;row.append(cell)}
  row.className=r.correct?'answer-correct':'answer-wrong';$('reviewRows').append(row);
 }
}
function renderRecords(){
 const rows=tab==='best'?history.filter(r=>r.mode===mode&&savedCount(r)===roundCount()&&r.ms<timeLimit()&&r.errors===0).sort((a,b)=>a.ms-b.ms).slice(0,5):history.filter(r=>r.mode===mode||(!r.mode&&mode===MODE)).slice(0,5);
 $('bestTab').setAttribute('aria-selected',String(tab==='best'));$('recentTab').setAttribute('aria-selected',String(tab==='recent'));
 $('records').setAttribute('aria-labelledby',tab==='best'?'bestTab':'recentTab');$('records').replaceChildren();
 if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent=tab==='best'?'Hier ist Platz für deine ersten Bestzeiten. '+roundCount()+' Aufgaben der gewählten Übung, ohne Fehler, unter '+limitMinutes()+' Minuten.':'Deine letzten fünf abgeschlossenen Runden erscheinen hier.';$('records').append(e);return;}
 rows.forEach((r,i)=>{
  const row=document.createElement('button');row.type='button';row.className='record';
  row.setAttribute('aria-label','Auswertung ansehen: '+new Date(r.date).toLocaleString('de-DE'));
  const left=document.createElement('span'),rank=document.createElement('span'),date=document.createElement('span');
  rank.className='rank';rank.textContent=tab==='best'?i+1:'↗';
  date.textContent=new Date(r.date).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' · '+new Date(r.date).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  left.append(rank,date);
  const right=document.createElement('span'),t=document.createElement('span'),meta=document.createElement('span');
  t.className='record-time'+(r.ms>timeLimit()?' over':'');t.textContent=time(r.ms);meta.className='record-meta';
  meta.textContent=Number.isInteger(r.correct)?r.correct+'/'+savedCount(r)+' richtig':r.errors===0?'fehlerfrei':r.errors+' Fehlv.';
  if(r.grade)meta.textContent=r.correct+'/30 Punkte · Note '+r.grade;
  const hint=document.createElement('span');hint.className='record-hint';hint.textContent=r.mode===mode?'Auswertung ansehen ›':'Frühere Runde ›';
  right.append(t,meta,hint);row.append(left,right);row.onclick=()=>openReview(r);$('records').append(row);
 });
}
$('onlyWrong').onclick=()=>{reviewFilter='wrong';renderReview()};
$('allAnswers').onclick=()=>{reviewFilter='all';renderReview()};
$('closeReview').onclick=()=>$('reviewDialog').close();
$('start').onclick=start;$('again').onclick=start;$('keypad').onclick=e=>{const b=e.target.closest('button');if(b)key(b.dataset.key)};document.addEventListener('keydown',e=>{if(!running||e.target.closest('dialog'))return;if(/^\d$/.test(e.key)||['Backspace','Enter'].includes(e.key)){if(e.key==='Enter'&&e.target.tagName==='BUTTON')return;e.preventDefault();if(!e.repeat)key(e.key)}});$('cancel').onclick=()=>{if(confirm('Diese Runde wirklich beenden? Sie wird nicht gespeichert.')){sound.stop();running=false;clearInterval(ticker);$('playing').hidden=true;$('welcome').hidden=false;$('modePicker').hidden=false;$('progressLabel').textContent='Bereit, wenn du es bist.';index=0;paintDots();paintTime(0);}};$('bestTab').onclick=()=>{tab='best';renderRecords()};$('recentTab').onclick=()=>{tab='recent';renderRecords()};paintDots();renderRecords();

$('openPrivacy').onclick=()=>{$('privacyMessage').textContent='';$('privacyDialog').showModal()};
$('closePrivacy').onclick=()=>$('privacyDialog').close();
$('eraseResults').onclick=()=>{
 if(!confirm('Alle gespeicherten Ergebnisse auf diesem Gerät unwiderruflich löschen?'))return;
 try{localStorage.removeItem(KEY);history=[];renderRecords();$('privacyMessage').textContent='Die gespeicherten Ergebnisse wurden gelöscht.';}
 catch{$('privacyMessage').textContent='Die Ergebnisse konnten nicht gelöscht werden. Bitte nutze die Einstellungen für Websitedaten deines Browsers.';}
};


$('multiplyMode').onclick=()=>setMode(MODE);$('sequenceMode').onclick=()=>setMode('zahlenreihen-v1');
$('bookMode').onclick=()=>setMode('tausenderbuch-v1');
$('placeMode').onclick=()=>setMode('stellenwert-v1');
$('submitPlace').onclick=submitPlace;
$('examMode').onclick=()=>setMode(EXAM);
$('worksheetMode').onclick=()=>setMode(WORKSHEET);
setMode(MODE);
