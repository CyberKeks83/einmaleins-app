'use strict';
const $=id=>document.getElementById(id),LIMIT=120000,COUNT=20,KEY='flink-results-v1';
let history=[],storageOK=true;try{history=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(history))history=[];history=history.filter(r=>Number.isFinite(r.ms)&&r.ms>=0&&Number.isInteger(r.errors)&&r.errors>=0&&Number.isFinite(r.date));localStorage.setItem(KEY,JSON.stringify(history));}catch{history=[];storageOK=false;$('storageNotice').hidden=false;}
let responses=[],tasks=[],index=0,errors=0,value='',startTime=0,ticker=null,running=false,tab='best';
const time=ms=>{const s=Math.floor(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function paintTime(ms){$('time').textContent=time(ms);$('timer').classList.toggle('over',ms>LIMIT);$('timer').setAttribute('aria-label','Vergangene Zeit '+time(ms)+(ms>LIMIT?', über zwei Minuten':''));}
function paintDots(){const nodes=Array.from({length:COUNT},(_,i)=>{const el=document.createElement('span');el.className='dot'+(i<index?' done':i===index&&running?' current':'');return el});$('dots').replaceChildren(...nodes);}
function showQuestion(){value='';$('answer').textContent='?';$('feedback').textContent='Tippe dein Ergebnis ein.';$('feedback').classList.remove('error');$('question').textContent=tasks[index][0]+' × '+tasks[index][1]+' =';$('progressLabel').textContent='Aufgabe '+(index+1)+' von 20';paintDots();}
function start(){tasks=[];for(let a=1;a<=10;a++)for(let b=1;b<=10;b++)tasks.push([a,b]);for(let i=tasks.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[tasks[i],tasks[j]]=[tasks[j],tasks[i]]}tasks=tasks.slice(0,COUNT);index=0;errors=0;responses=[];running=true;startTime=performance.now();$('welcome').hidden=true;$('finished').hidden=true;$('playing').hidden=false;paintTime(0);showQuestion();clearInterval(ticker);ticker=setInterval(()=>paintTime(performance.now()-startTime),80);$('answer').focus({preventScroll:true});}
function finish(){
 const ms=performance.now()-startTime,correct=COUNT-errors;
 running=false;clearInterval(ticker);paintTime(ms);paintDots();
 $('playing').hidden=true;$('finished').hidden=false;$('progressLabel').textContent='20 von 20 beantwortet';
 const eligible=ms<LIMIT&&errors===0;
 const oldBest=history.filter(r=>r.errors===0&&r.ms<LIMIT).reduce((a,r)=>Math.min(a,r.ms),Infinity);
 $('finishTitle').textContent=eligible&&ms<oldBest?'Neue persönliche Bestzeit!':'Deine Auswertung';
 $('finishText').textContent=correct===COUNT?'Alle 20 Aufgaben richtig beantwortet.':'Alle 20 Aufgaben beantwortet. Hier ist dein Ergebnis.';
 $('summary').textContent=time(ms);$('summary').classList.toggle('over',ms>LIMIT);
 $('rightCount').textContent=correct;$('wrongCount').textContent=errors;$('accuracy').textContent=(correct/COUNT*100)+' %';
 const mistakes=responses.filter(r=>!r.correct);
 $('mistakeReview').hidden=mistakes.length===0;$('mistakeRows').replaceChildren();
 for(const r of mistakes){const row=document.createElement('tr');for(const v of [r.a+' × '+r.b,String(r.answer),String(r.a*r.b)]){const cell=document.createElement('td');cell.textContent=v;row.append(cell)}$('mistakeRows').append(row)}
 $('recordText').textContent=eligible?'Deine Zeit steht jetzt in der Bestenliste.':errors>0?'Für die Bestenliste: unter 2 Minuten und alle 20 richtig.':'Weiter so! Dein Ziel: weniger als 2 Minuten.';
 history.unshift({ms,errors,correct,date:Date.now()});history=history.slice(0,500);
 try{localStorage.setItem(KEY,JSON.stringify(history))}catch{storageOK=false;$('storageNotice').hidden=false;}
 renderRecords();$('again').focus({preventScroll:true});
}
function key(k){
 if(!running)return;
 if(/^\d$/.test(k)){if(value.length<3)value+=k;$('answer').textContent=value||'?';}
 else if(k==='Backspace'){value=value.slice(0,-1);$('answer').textContent=value||'?';}
 else if(k==='Enter'&&value!==''){
  const [a,b]=tasks[index],answer=Number(value),correct=answer===a*b;
  responses.push({a,b,answer,correct});if(!correct)errors++;
  index++;if(index===COUNT)finish();else showQuestion();
 }
}
function renderRecords(){const rows=tab==='best'?history.filter(r=>r.ms<LIMIT&&r.errors===0).sort((a,b)=>a.ms-b.ms).slice(0,5):history.slice(0,5);$('bestTab').setAttribute('aria-selected',String(tab==='best'));$('recentTab').setAttribute('aria-selected',String(tab==='recent'));$('records').setAttribute('aria-labelledby',tab==='best'?'bestTab':'recentTab');$('records').replaceChildren();if(!rows.length){const e=document.createElement('div');e.className='empty';e.textContent=tab==='best'?'Hier ist Platz für deine ersten Bestzeiten.\n20 Aufgaben, ohne Fehler, unter 2 Minuten.':'Deine letzten fünf abgeschlossenen Runden erscheinen hier.';$('records').append(e);return;}rows.forEach((r,i)=>{const row=document.createElement('div');row.className='record';const left=document.createElement('span');const rank=document.createElement('span');rank.className='rank';rank.textContent=tab==='best'?i+1:'✓';const date=document.createElement('span');date.textContent=new Date(r.date).toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' · '+new Date(r.date).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});left.append(rank,date);const right=document.createElement('span'),t=document.createElement('span'),meta=document.createElement('span');t.className='record-time'+(r.ms>LIMIT?' over':'');t.textContent=time(r.ms);meta.className='record-meta';meta.textContent=Number.isInteger(r.correct)?r.correct+'/20 richtig':r.errors===0?'fehlerfrei':r.errors+' Fehlv.';right.append(t,meta);row.append(left,right);$('records').append(row);});}
$('start').onclick=start;$('again').onclick=start;$('keypad').onclick=e=>{const b=e.target.closest('button');if(b)key(b.dataset.key)};document.addEventListener('keydown',e=>{if(!running||e.target.closest('dialog'))return;if(/^\d$/.test(e.key)||['Backspace','Enter'].includes(e.key)){if(e.key==='Enter'&&e.target.tagName==='BUTTON')return;e.preventDefault();if(!e.repeat)key(e.key)}});$('cancel').onclick=()=>{if(confirm('Diese Runde wirklich beenden? Sie wird nicht gespeichert.')){running=false;clearInterval(ticker);$('playing').hidden=true;$('welcome').hidden=false;$('progressLabel').textContent='Bereit, wenn du es bist.';index=0;paintDots();paintTime(0);}};$('bestTab').onclick=()=>{tab='best';renderRecords()};$('recentTab').onclick=()=>{tab='recent';renderRecords()};paintDots();renderRecords();
