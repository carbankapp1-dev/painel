// Service Worker do Painel de Sistemas
// Guarda em cache a "casca" do app (arquivo principal + ícones) para abrir rápido
// e funcionar como app instalado. NÃO guarda em cache os dados do Firebase nem
// as prévias do thum.io — esses precisam sempre vir atualizados da rede.

const CACHE_NAME = 'painel-sistemas-v1';

const APP_SHELL = [
  './',
  './index.html',
  './site.webmanifest',
  './favicon.ico',
  './favicon-16x16.png',
  './favicon-32x32.png',
  './apple-touch-icon.png',
  './android-chrome-192x192.png',
  './android-chrome-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // se algum arquivo não existir com esse nome, não trava a instalação
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Nunca intercepta chamadas ao Firebase, ao SDK do Firebase ou aos prints do thum.io
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('thum.io')
  ) {
    return;
  }

  // Para o restante (a casca do app): tenta a rede primeiro, cai pro cache se offline
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
