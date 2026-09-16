/* Wrapper de Google Analytics 4 (gtag.js, cargado condicionalmente en index.html).
   No-op si GA no está configurado o el script fue bloqueado (adblock). */

export function trackPageView(path) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', { page_path: path });
}

export function trackEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
