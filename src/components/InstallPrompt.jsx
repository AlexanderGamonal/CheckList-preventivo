import { useState, useEffect } from 'react';

const DISMISS_KEY = 'pwa_install_dismissed_until';
const DISMISS_DAYS = 7;

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function isDismissed() {
  const until = localStorage.getItem(DISMISS_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function dismiss() {
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISS_KEY, String(until));
}

// ── Botón pequeño para header ──────────────────────────────────────────────
export function InstallButton() {
  const [ready, setReady] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    if (isStandalone()) return;
    if (ios) { setReady(true); return; }
    if (window.__pwaPrompt) { setReady(true); return; }
    const h = () => setReady(true);
    window.addEventListener('pwa-prompt-ready', h);
    return () => window.removeEventListener('pwa-prompt-ready', h);
  }, []);

  if (!ready || isStandalone()) return null;

  const handleClick = async () => {
    if (ios) { setShowModal(true); return; }
    if (!window.__pwaPrompt) return;
    window.__pwaPrompt.prompt();
    const { outcome } = await window.__pwaPrompt.userChoice;
    if (outcome === 'accepted') window.__pwaPrompt = null;
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Instalar app"
        style={{
          background: 'rgba(59,130,246,0.15)',
          border: '1px solid rgba(59,130,246,0.35)',
          borderRadius: 8,
          color: '#60a5fa',
          fontSize: 13,
          fontWeight: 700,
          padding: '5px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          whiteSpace: 'nowrap',
        }}
      >
        📲 Instalar
      </button>

      {showModal && ios && (
        <IOSModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

// ── Modal instrucciones iOS ────────────────────────────────────────────────
function IOSModal({ onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 10000,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 16,
          padding: '20px 18px',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
          Instalar en iPhone / iPad
        </p>
        {[
          ['1.', '📤', 'Toca el botón Compartir en Safari'],
          ['2.', '➕', 'Selecciona "Agregar a pantalla de inicio"'],
          ['3.', '✅', 'Toca "Agregar" para confirmar'],
        ].map(([n, icon, text]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: 13, minWidth: 18 }}>{n}</span>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ color: '#cbd5e1', fontSize: 13 }}>{text}</span>
          </div>
        ))}
        <button
          onClick={onClose}
          style={{
            marginTop: 8,
            width: '100%',
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '11px 0',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

// ── Banner flotante (aparece automático, expira en 7 días) ─────────────────
export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    if (isStandalone() || isDismissed()) return;

    if (ios) {
      setVisible(true);
      return;
    }

    if (window.__pwaPrompt) {
      setVisible(true);
      return;
    }
    const h = () => setVisible(true);
    window.addEventListener('pwa-prompt-ready', h);
    return () => window.removeEventListener('pwa-prompt-ready', h);
  }, []);

  // Auto-hide después de 8 segundos
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  const handleInstall = async () => {
    if (ios) { setShowModal(true); return; }
    if (!window.__pwaPrompt) return;
    window.__pwaPrompt.prompt();
    const { outcome } = await window.__pwaPrompt.userChoice;
    if (outcome === 'accepted') {
      window.__pwaPrompt = null;
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setVisible(false);
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        bottom: 16, left: 16, right: 16,
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 9999,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 600 }}>
            📲 Instalar CheckList ATM
          </div>
          <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
            {ios
              ? 'Toca Instalar para ver cómo agregar a inicio'
              : 'Acceso rápido desde tu pantalla de inicio'}
          </div>
        </div>
        <button onClick={handleInstall} style={{
          background: '#3b82f6', color: '#fff', border: 'none',
          borderRadius: 8, padding: '8px 14px', fontSize: 13,
          fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          Instalar
        </button>
        <button onClick={handleDismiss} style={{
          background: 'none', border: 'none',
          color: '#64748b', fontSize: 18, cursor: 'pointer',
          padding: '4px 8px', lineHeight: 1,
        }}>
          ✕
        </button>
      </div>

      {showModal && ios && (
        <IOSModal onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
