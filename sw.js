'use strict';
const CACHE='flink-web-1.3.0',FILES=['./index.html','./style.css','./app.js','./audio.js','./pwa.js','./manifest.webmanifest','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('flink-web-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 if(event.request.mode==='navigate'){
  event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(new URL('./index.html',self.location.href).href);const online=fetch(event.request).then(response=>{if(!response.ok)throw Error('Network response failed');return response});if(saved){return Promise.race([online.catch(()=>saved),new Promise(resolve=>setTimeout(()=>resolve(saved),1800))]);}return online;})());return;
 }
 const relative=url.pathname.slice(new URL('./',self.location.href).pathname.length);
 if(!FILES.includes('./'+relative))return;
 event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
