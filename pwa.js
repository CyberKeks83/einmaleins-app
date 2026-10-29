'use strict';
(()=>{
 const CACHE='flink-web-1.3.0',status=document.getElementById('offlineStatus');
 let cached=false,installPrompt=null;
 const paint=()=>{status.textContent=cached?'Offline bereit':navigator.onLine?'Offline Modus wird vorbereitet …':'Offline Modus noch nicht gespeichert';status.classList.toggle('ready',cached);};
 document.getElementById('installApp').onclick=async()=>{
  if(installPrompt){const prompt=installPrompt;installPrompt=null;try{await prompt.prompt();return}catch{}}
  document.getElementById('installDialog').showModal();
 };
 document.getElementById('closeInstall').onclick=()=>document.getElementById('installDialog').close();
 globalThis.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e});
 globalThis.addEventListener('online',paint);globalThis.addEventListener('offline',paint);
 if(!('serviceWorker'in navigator)||!('caches'in globalThis)){status.textContent='Im Browser nutzbar · Offline Modus nicht verfügbar';return;}
 navigator.serviceWorker.register('./sw.js').then(reg=>{
  const check=()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='redundant')status.textContent='Offline Speichern fehlgeschlagen · bitte online erneut öffnen';});};
  check();reg.addEventListener('updatefound',check);
  return navigator.serviceWorker.ready;
 }).then(async()=>{
  const keys=await caches.keys();if(!keys.includes(CACHE))return;
  const cache=await caches.open(CACHE);const needed=['index.html','style.css','app.js','audio.js','pwa.js','manifest.webmanifest','icon.svg','icon-180.png','icon-192.png','icon-512.png'];
  const matches=await Promise.all(needed.map(file=>cache.match(new URL(file,location.href))));cached=matches.every(Boolean);paint();
 }).catch(()=>{status.textContent='Im Browser nutzbar · Offline Speichern nicht verfügbar';});
})();
