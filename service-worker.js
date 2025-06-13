// Este service worker simple permite que la aplicación sea instalable (PWA).

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado');
  // Opcional: precachear archivos importantes aquí si se necesita funcionalidad offline.
});

self.addEventListener('fetch', (event) => {
  // Para esta app, usaremos una estrategia de "network first".
  // Intenta obtener el recurso de la red, y si falla, no hace nada (requiere conexión).
  event.respondWith(fetch(event.request));
});
