/* Zahlenreihen nach den Aufgabenformaten der Arbeitsblätter. */
'use strict';
const FlinkTasks = (() => {
 function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
   const j = Math.floor(Math.random() * (i + 1));
   [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
 }
 function sequence(kind, start, step) {
  const numbers = Array.from({length: 5}, (_, i) => start + i * step);
  const blanks = kind === 'continue' ? [2, 3] : kind === 'find' ? [1, 3, 4] : [1, 2, 3, 4];
  const title = kind === 'step'
   ? `Zähle ${step > 0 ? 'vorwärts' : 'rückwärts'} in Schritten von ${Math.abs(step)}.`
   : kind === 'find' ? 'Finde die Schrittweite. Ergänze die Reihe.' : 'Wie geht es weiter?';
  return {kind, title, numbers, blanks, step};
 }
 const givenSteps = [
  [0,100], [135,100], [100,100], [235,100], [400,100], [500,100],
  [350,50], [0,50], [150,50], [500,50], [650,50], [800,50],
  [1000,-50], [950,-50], [900,-50], [750,-50], [550,-50], [400,-50]
 ];
 const continuations = [
  [398,1], [198,1], [598,1], [798,1], [494,2], [194,2], [694,2],
  [766,10], [186,10], [386,10], [490,5], [595,5], [890,5],
  [337,-1], [301,-1], [501,-1], [901,-1], [866,-2], [502,-2], [702,-2],
  [555,-5], [510,-5], [710,-5], [293,-10], [313,-10], [813,-10]
 ];
 const hiddenSteps = [
  [895,1], [198,1], [697,1], [500,10], [200,10], [360,10], [750,50], [250,50],
  [900,-100], [1000,-100], [700,-100], [550,-10], [430,-10], [904,-1], [502,-1], [500,-50]
 ];
 const midpoints = [
  [0,50], [50,100], [100,150], [150,200], [250,300], [450,500],
  [0,100], [100,200], [300,400], [700,800], [800,900],
  [0,200], [200,400], [600,800], [800,1000],
  [0,500], [500,1000], [0,1000]
 ];
 const directions = [
  {name:'rechts', arrow:'→', row:0, column:1},
  {name:'links', arrow:'←', row:0, column:-1},
  {name:'oben', arrow:'↑', row:-1, column:0},
  {name:'unten', arrow:'↓', row:1, column:0}
 ];
 function bookTasks() {
  // Each pair is a direction index and the number of fields in that direction.
  const routes = [
   [[0,2]], [[1,3]], [[2,2]], [[3,1]],
   [[3,2],[0,3]], [[1,2],[2,1]], [[0,1],[3,3]],
   [[3,2],[0,3],[2,1]], [[2,2],[1,2],[3,1]], [[0,2],[3,1],[1,1]]
  ];
  return shuffle(routes.map((route,i)=>{
   const first = 1+100*Math.floor(Math.random()*10);
   const moves = route.map(([index,count])=>({...directions[index],count}));
   const eligible = Array.from({length:100},(_,cell)=>cell).filter(cell=>{
    let row=Math.floor(cell/10),column=cell%10;
    return moves.every(move=>{
     row+=move.row*move.count;
     column+=move.column*move.count;
     return row>=0&&row<10&&column>=0&&column<10;
    });
   });
   const start = first+eligible[Math.floor(Math.random()*eligible.length)];
   const end = start+moves.reduce((sum,move)=>sum+move.count*(10*move.row+move.column),0);
   const inverse = i===1||i===3;
   const move = moves[0];
   const title = inverse
    ? `Wie viele Felder springst du von ${start} nach ${end} ${move.name} ${move.arrow}?`
    : `Starte bei ${start}. Folge den Pfeilen. Wo landest du?`;
   const instruction = inverse ? title : title+' '+moves.map(move=>move.count+' '+move.name+' '+move.arrow).join(', dann ');
   return {kind:'book',title,instruction,moves,first,start,end,inverse,expected:inverse?move.count:end};
  }));
 }
 function placeTasks() {
  const easy = [102,105,120,126,203,210,230,245,302,306,320,326,340,405,420,432,501,510,543,650,702,810,900,904];
  return shuffle(easy).slice(0,10).map((expected,i)=>({
   kind:i<5?'build':'read',expected,
   digits:[Math.floor(expected/100),Math.floor(expected/10)%10,expected%10],
   title:i<5?`Stelle die Zahl ${expected} dar.`:'Welche Zahl siehst du?'
  }));
 }
 function make(mode) {
  if (mode === 'klassentest-v1') {
   const book=bookTasks();
   const bookSelection=[...book.filter(task=>task.moves.length===1).slice(0,2),
    ...book.filter(task=>task.moves.length===2).slice(0,2),book.find(task=>task.moves.length===3)];
   return [
    ...make('2bis9-v1').slice(0,10),
    ...make('zahlenreihen-v1').slice(0,5),
    ...placeTasks(),
    ...shuffle(bookSelection)
   ];
  }
  if (mode === 'tausenderbuch-v1') return bookTasks();
  if (mode === 'stellenwert-v1') return placeTasks();
  if (mode === '2bis9-v1') {
   const pool = [];
   for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) pool.push([a,b]);
   return shuffle(pool).slice(0,20);
  }
  const take = (pool, count, kind) => shuffle([...pool]).slice(0,count)
   .map(([start,step]) => sequence(kind,start,step));
  return shuffle([
   ...take(givenSteps.filter(([,step]) => step === 100), 1, 'step'),
   ...take(givenSteps.filter(([,step]) => step === 50), 1, 'step'),
   ...take(givenSteps.filter(([,step]) => step === -50), 1, 'step'),
   ...take(continuations.filter(([,step]) => step > 0), 2, 'continue'),
   ...take(continuations.filter(([,step]) => step < 0), 1, 'continue'),
   ...take(hiddenSteps, 2, 'find'),
   ...shuffle([...midpoints]).slice(0,2).map(([left,right]) => ({
    kind: 'middle',
    title: 'Welche Zahl liegt genau in der Mitte?',
    numbers: [left, (left + right) / 2, right],
    blanks: [1]
   }))
  ]);
 }
 return {make};
})();
if (typeof module !== 'undefined') module.exports = FlinkTasks;
