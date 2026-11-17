importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyB4CUawMDCq8hMBdSjQSuGxzqciZz8Lb2k",
  authDomain: "marcas-boas-ruins.firebaseapp.com",
  projectId: "marcas-boas-ruins",
  messagingSenderId: "569774940333",
  appId: "1:569774940333:web:ed69c9a65ca067ecea2624"
});
firebase.messaging();

const CACHE = "marcas-v2";
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "index.html", "manifest.json", "icon-192.png"])).catch(() => {}));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); return res; })
      .catch(() => caches.match(r).then(m => m || caches.match("index.html")))
  );
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type: "window", includeUncontrolled: true}).then(cs => cs.length ? cs[0].focus() : clients.openWindow("./")));
});
