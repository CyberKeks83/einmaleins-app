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
 function make(mode) {
  if (mode === '2bis9-v1') {
   const pool = [];
   for (let a = 2; a <= 9; a++) for (let b = 2; b <= 9; b++) pool.push([a,b]);
   return shuffle(pool).slice(0,20);
  }
  const take = (pool, count, kind) => shuffle([...pool]).slice(0,count)
   .map(([start,step]) => sequence(kind,start,step));
  return shuffle([
   ...take(givenSteps.filter(([,step]) => step === 100), 2, 'step'),
   ...take(givenSteps.filter(([,step]) => step === 50), 2, 'step'),
   ...take(givenSteps.filter(([,step]) => step === -50), 2, 'step'),
   ...take(continuations.filter(([,step]) => step > 0), 3, 'continue'),
   ...take(continuations.filter(([,step]) => step < 0), 3, 'continue'),
   ...take(hiddenSteps, 4, 'find'),
   ...shuffle([...midpoints]).slice(0,4).map(([left,right]) => ({
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
