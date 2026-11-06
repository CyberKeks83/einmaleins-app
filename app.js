'use strict';
const $=id=>document.getElementById(id),LIMIT=120000,COUNT=20,MODE='2bis9-v1',KEY='flink-results-v1';
let history=[],storageOK=true;try{history=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(history))history=[];history=history.filter(r=>Number.isFinite(r.ms)&&r.ms>=0&&Number.isInteger(r.errors)&&r.errors>=0&&Number.isFinite(r.date));localStorage.setItem(KEY,JSON.stringify(history));}catch{history=[];storageOK=false;$('storageNotice').hidden=false;}
let mode=MODE,entries=[],activeBlank=0;
let responses=[],tasks=[],index=0,errors=0,value='',startTime=0,ticker=null,running=false,tab='best',reviewRound=null,reviewFilter='wrong';
const sound=typeof FlinkAudio!=='undefined'?FlinkAudio:{attach(){},startRound(){},finishRound(){},stop(){}};
sound.attach();
const time=ms=>{const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function paintTime(ms){$('time').textContent=time(ms);$('timer').classList.toggle('over',ms>LIMIT);$('timer').setAttribute('aria-label','Vergangene Zeit '+time(ms)+(ms>LIMIT?', über zwei Minuten':''));}
function paintDots(){const nodes=Array.from({length:COUNT},(_,i)=>{const el=document.createElement('span');el.className='dot'+(i<index?' done':i===index&&running?' current':'');return el});$('dots').replaceChildren(...nodes);}
function isSequence(){return mode==='zahlenreihen-v1';}
function setMode(next){
 if(running)return;
 mode=next;$('multiplyMode').setAttribute('aria-pressed',String(!isSequence()));$('sequenceMode').setAttribute('aria-pressed',String(isSequence()));
 $('welcomeTitle').textContent=isSequence()?'Entdecke die nächste Zahl!':'Auf die Plätze, fertig, rechnen!';
 $('welcomeText').textContent=isSequence()?'20 Zahlenreihen bis 1000. Vorwärts, rückwärts, Schrittweiten und die Mitte. Jede Reihe zählt als eine Aufgabe.':'20 gemischte Aufgaben aus den Reihen 2 bis 9. Jede Antwort zählt. Deine Auswertung kommt am Ende.';
 $('mathArt').textContent=isSequence()?'398 · 399 · ?':'7 × 8 = ?';
 $('finished').hidden=true;$('welcome').hidden=false;$('progressLabel').textContent='Bereit, wenn du es bist.';index=0;paintDots();paintTime(0);
 $('recordNote').textContent='Tippe auf eine Runde für die Auswertung. Bestzeiten gelten für die gewählte Übung: alle 20 Aufgaben richtig und unter 2 Minuten.';
 renderRecords();
}
function drawSequence(){
 const task=tasks[index],container=$('sequenceCells');container.replaceChildren();
 container.classList.toggle('midpoint',task.kind==='middle');
 task.numbers.forEach((number,i)=>{
  const blank=task.blanks.indexOf(i),cell=document.createElement(blank<0?'span':'button');
  cell.className='sequence-cell'+(blank<0?' given':blank===activeBlank?' active':'');
  cell.textContent=blank<0?String(number):entries[blank]||'?';
  if(blank>=0){cell.type='button';cell.setAttribute('aria-label','Fehlende Zahl '+(blank+1)+', '+(entries[blank]||'noch leer'));cell.setAttribute('aria-pressed',String(blank===activeBlank));cell.onclick=()=>{activeBlank=blank;value=entries[blank];drawSequence();};}
  container.append(cell);
 });
 $('feedback').textContent='Zahl '+(activeBlank+1)+' von '+task.blanks.length+' · Mit ✓ weiter.';
}
function showQuestion(){
 value='';entries=[];activeBlank=0;$('answer').textContent='?';$('feedback').textContent='Tippe dein Ergebnis ein.';$('feedback').classList.remove('error');
 $('sequenceCells').hidden=!isSequence();$('answer').hidden=isSequence();$('question').classList.toggle('sequence-title',isSequence());
 if(isSequence()){entries=tasks[index].blanks.map(()=> '');$('question').textContent=tasks[index].title;drawSequence();}
 else $('question').textContent=tasks[index][0]+' × '+tasks[index][1]+' =';
 $('progressLabel').textContent='Aufgabe '+(index+1)+' von 20';paintDots();
}
function start(){
 sound.startRound();tasks=FlinkTasks.make(mode);index=0;errors=0;responses=[];running=true;startTime=performance.now();
 $('modePicker').hidden=true;$('welcome').hidden=true;$('finished').hidden=true;$('playing').hidden=false;
 paintTime(0);showQuestion();clearInterval(ticker);ticker=setInterval(()=>paintTime(performance.now()-startTime),80);
 if(!isSequence())$('answer').focus({preventScroll:true});
}
function finish(){
 const ms=performance.now()-startTime,correct=COUNT-errors;
 running=false;sound.finishRound();clearInterval(ticker);paintTime(ms);paintDots();
 $('playing').hidden=true;$('finished').hidden=false;$('modePicker').hidden=false;$('progressLabel').textContent='20 von 20 beantwortet';
 const eligible=ms<LIMIT&&errors===0;
 const oldBest=history.filter(r=>r.mode===mode&&r.errors===0&&r.ms<LIMIT).reduce((a,r)=>Math.min(a,r.ms),Infinity);
 $('finishTitle').textContent=eligible&&ms<oldBest?'Neue persönliche Bestzeit!':'Deine Auswertung';
 $('finishText').textContent=correct===COUNT?'Alle 20 Aufgaben richtig beantwortet.':'Alle 20 Aufgaben beantwortet. Hier ist dein Ergebnis.';
 $('summary').textContent=time(ms);$('summary').classList.toggle('over',ms>LIMIT);
 $('rightCount').textContent=correct;$('wrongCount').textContent=errors;$('accuracy').textContent=(correct/COUNT*100)+' %';
 $('reviewSummary').textContent=errors===0?'Alle Antworten sind richtig.':errors+' '+(errors===1?'Aufgabe kannst':'Aufgaben kannst')+' du noch üben.';
 $('detailScore').hidden=!isSequence();if(isSequence()){const all=responses.flatMap(r=>r.answers.map((v,i)=>v===r.expected[i]));$('detailScore').textContent=all.filter(Boolean).length+' von '+all.length+' einzelnen Zahlen richtig. Eine Reihe ist richtig, wenn alle Lücken stimmen.';}
 $('recordText').textContent=eligible?'Deine Zeit steht jetzt in der Bestenliste.':errors>0?'Für die Bestenliste: unter 2 Minuten und alle 20 richtig.':'Weiter so! Dein Ziel: weniger als 2 Minuten.';
 const result={ms,errors,correct,date:Date.now(),mode,responses:responses.map(r=>({...r}))};
 history.unshift(result);$('viewResults').onclick=()=>openReview(result);history=history.slice(0,500);
 try{localStorage.setItem(KEY,JSON.stringify(history))}catch{storageOK=false;$('storageNotice').hidden=false;}
 renderRecords();$('again').focus({preventScroll:true});
}
function key(k){
 if(!running)return;
 if(/^\d$/.test(k)){
  if(value.length<(isSequence()?4:3))value+=k;
  if(isSequence()){entries[activeBlank]=value;drawSequence();}else $('answer').textContent=value||'?';
 }else if(k==='Backspace'){
  value=value.slice(0,-1);if(isSequence()){entries[activeBlank]=value;drawSequence();}else $('answer').textContent=value||'?';
 }else if(k==='Enter'&&value!==''){
  if(isSequence()){
   const next=entries.findIndex((v,i)=>i>activeBlank&&v==='');const missing=next>=0?next:entries.findIndex(v=>v==='');
   if(missing>=0){activeBlank=missing;value=entries[missing];drawSequence();return;}
   const task=tasks[index],answers=entries.map(Number),expected=task.blanks.map(i=>task.numbers[i]);
   const correct=answers.every((v,i)=>v===expected[i]);
   responses.push({kind:task.kind,title:task.title,numbers:[...task.numbers],blanks:[...task.blanks],answers,expected,correct});if(!correct)errors++;
  }else{
   const [a,b]=tasks[index],answer=Number(value),correct=answer===a*b;
   responses.push({a,b,answer,correct});if(!correct)errors++;
  }
  index++;if(index===COUNT)finish();else showQuestion();
 }
}
function openReview(round){
 reviewRound=round;reviewFilter='wrong';
 $('reviewTitle').textContent='Deine Auswertung';
 $('reviewMode').textContent=round.mode==='zahlenreihen-v1'?'Zahlenreihen bis 1000':'Kleines Einmaleins';
 $('reviewStats').textContent=Number.isInteger(round.correct)?`${round.correct} richtig · ${round.errors} falsch · ${time(round.ms)}`:`Zeit ${time(round.ms)} · ${round.errors} Fehlversuche`;
 const hasDetails=Array.isArray(round.responses)&&round.responses.length===COUNT;
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
 $('reviewEmpty').hidden=details.length!==COUNT||visible.length>0;
 for(const r of visible){
  const row=document.createElement('tr');
  const columns=r.numbers?[r.numbers.map((v,i)=>r.blanks.includes(i)?'?':v).join(' · '),r.answers.join(', ')+(r.correct?' ✓':' ✕'),r.expected.join(', ')]:[r.a+' × '+r.b,String(r.answer)+(r.correct?' ✓':' ✕'),String(r.a*r.b)];
  for(const text of columns){const cell=document.createElement('td');cell.textContent=text;row.append(cell)}
  row.className=r.correct?'answer-correct':'answer-wrong';$('reviewRows').append(row);
 }
}
function renderRecords(){
 const rows=tab==='best'?history.filter(r=>r.mode===mode&&r.ms<LIMIT&&r.errors===0).sort((a,b)=>a.ms-b.ms).slice(0,5):history.filter(r=>r.mode===mode||(!r.mode&&mode===MODE)).slice(0,5);
 $('bestTab').setAttribute('aria-selected',String(tab==='best'));$('recentTab').setAttribute('aria-selected',String(tab==='recent'));
 $('records').setAttribute('aria-labelledby',tab==='best'?'bestTab':'recentTab');$('records').replaceChildren();
 if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent=tab==='best'?'Hier ist Platz für deine ersten Bestzeiten. 20 Aufgaben der gewählten Übung, ohne Fehler, unter 2 Minuten.':'Deine letzten fünf abgeschlossenen Runden erscheinen hier.';$('records').append(e);return;}
 rows.forEach((r,i)=>{
  const row=document.createElement('button');row.type='button';row.className='record';
  row.setAttribute('aria-label','Auswertung ansehen: '+new Date(r.date).toLocaleString('de-DE'));
  const left=document.createElement('span'),rank=document.createElement('span'),date=document.createElement('span');
  rank.className='rank';rank.textContent=tab==='best'?i+1:'↗';
  date.textContent=new Date(r.date).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' · '+new Date(r.date).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  left.append(rank,date);
  const right=document.createElement('span'),t=document.createElement('span'),meta=document.createElement('span');
  t.className='record-time'+(r.ms>LIMIT?' over':'');t.textContent=time(r.ms);meta.className='record-meta';
  meta.textContent=Number.isInteger(r.correct)?r.correct+'/20 richtig':r.errors===0?'fehlerfrei':r.errors+' Fehlv.';
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


$('multiplyMode').onclick=()=>setMode(MODE);$('sequenceMode').onclick=()=>setMode('zahlenreihen-v1');setMode(MODE);
