/* Flink: Zahlenreihen im Zahlenraum 0 bis 1000. */
'use strict';
const FlinkTasks=(()=>{
 const random=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
 const shuffle=items=>{for(let i=items.length-1;i>0;i--){const j=random(0,i);[items[i],items[j]]=[items[j],items[i]]}return items};
 function sequence(kind,direction){
  const step=direction*[1,2,5,10,50,100][random(0,5)];
  const span=Math.abs(step)*4;
  let low=random(0,1000-span);
  // Gezielt auch Übergänge wie 398, 399, 400 und 766, 776, 786 üben.
  if(Math.random()<.5){const boundary=random(1,9)*100;const candidate=boundary-random(1,Math.max(1,span-1));if(candidate>=0&&candidate+span<=1000)low=candidate;}
  const first=direction>0?low:low+span;
  const numbers=Array.from({length:5},(_,i)=>first+i*step);
  const blanks=kind==='find'?[1,3,4]:kind==='step'?[1,2,3]:[2,3,4];
  const title=kind==='step'?`Zähle in ${Math.abs(step)}er Schritten ${direction>0?'vorwärts':'rückwärts'}.`:kind==='find'?'Finde die Schrittweite. Ergänze die Reihe.':'Wie geht es weiter?';
  return {kind,title,numbers,blanks,step};
 }
 function middle(){const distance=random(1,100)*2;const left=random(0,1000-distance);return {kind:'middle',title:'Welche Zahl liegt genau in der Mitte?',numbers:[left,left+distance/2,left+distance],blanks:[1]};}
 function make(mode){
  if(mode==='2bis9-v1'){const pool=[];for(let a=2;a<=9;a++)for(let b=2;b<=9;b++)pool.push([a,b]);return shuffle(pool).slice(0,20);}
  const plan=[...Array(6).fill('continue'),...Array(6).fill('step'),...Array(4).fill('find'),...Array(4).fill('middle')];
  const tasks=[],seen=new Set();
  for(let i=0;i<plan.length;i++){let task,id;do{task=plan[i]==='middle'?middle():sequence(plan[i],i%2===0?1:-1);id=task.kind+':'+task.numbers.join(',')}while(seen.has(id));seen.add(id);tasks.push(task);}
  return shuffle(tasks);
 }
 return {make};
})();
if(typeof module!=='undefined')module.exports=FlinkTasks;
