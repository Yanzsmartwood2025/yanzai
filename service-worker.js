// Este service worker simple permite que la aplicación sea instalable (PWA)
// al registrarse correctamente, pero no interfiere con las solicitudes de red.

self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalado y listo.');
  // La presencia de este archivo y este evento es suficiente para los criterios de instalación de PWA.
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activado.');
});

// Hemos eliminado el evento 'fetch' para evitar que interfiera
// con las respuestas del servidor, lo que solucionará el problema de la descarga.
