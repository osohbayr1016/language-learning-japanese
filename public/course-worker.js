const CACHE='nihongo-static-v1';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.add('/index.html')).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put('/index.html',response.clone());}return response;}).catch(async()=>await caches.match('/index.html')??new Response('Интернэтгүй хичээл бэлдээгүй байна. Холбогдсон үедээ дахин нээнэ үү.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));return;
 }
 if(!/^\/(assets|fonts|stroke-data|dictionary)\//.test(url.pathname)&&url.pathname!=='/offline-manifest.json'&&url.pathname!=='/icons.json')return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);const cached=await cache.match(event.request);
  if(cached&&/^\/(assets|fonts)\//.test(url.pathname))return cached;
  try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch(error){if(cached)return cached;throw error;}
 })());
});
