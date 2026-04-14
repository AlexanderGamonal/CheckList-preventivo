import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import AppRouter from './router.jsx';
import './index.css';
import './print.css';

// Captura el evento ANTES de que React monte para no perderlo
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__pwaPrompt = e;
  window.dispatchEvent(new Event('pwa-prompt-ready'));
});

// Service worker — auto-update silencioso, chequea cada hora
registerSW({
  onOfflineReady() {
    console.log('[SW] App shell cached for offline use.');
  },
  onRegisteredSW(_, registration) {
    if (registration) {
      setInterval(() => registration.update(), 60 * 60 * 1000);
    }
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppRouter />
  </BrowserRouter>
);
