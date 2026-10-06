export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const env = (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env;
  if (env?.PROD !== true) return;

  window.addEventListener(
    'load',
    () => {
      void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
        console.warn('Service worker registration failed', error);
      });
    },
    { once: true }
  );
}
