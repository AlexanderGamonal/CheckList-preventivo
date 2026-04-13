import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa_install_dismissed') === '1'
  );

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const install = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_install_dismissed', '1');
    setDeferredPrompt(null);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: 16,
      right: 16,
      background: 'var(--bg-secondary, #1E293B)',
      border: '1px solid var(--border-strong, #334155)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          color: 'var(--text-primary, #F1F5F9)',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'var(--font-body, sans-serif)',
        }}>
          Instalar CheckList ATM
        </div>
        <div style={{
          color: 'var(--text-muted, #94A3B8)',
          fontSize: 12,
          marginTop: 2,
          fontFamily: 'var(--font-body, sans-serif)',
        }}>
          Acceso rápido desde tu pantalla de inicio
        </div>
      </div>
      <button onClick={install} style={{
        background: 'var(--brand, #3B82F6)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-body, sans-serif)',
      }}>
        Instalar
      </button>
      <button onClick={dismiss} style={{
        background: 'none',
        border: 'none',
        color: 'var(--text-disabled, #64748B)',
        fontSize: 18,
        cursor: 'pointer',
        padding: '4px 8px',
        lineHeight: 1,
      }}>
        ✕
      </button>
    </div>
  );
}
