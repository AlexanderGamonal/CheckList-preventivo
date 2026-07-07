import React from 'react';

export default function LeyendaModal({ open, onClose, title = 'Guía de métricas', children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f172a', border: '1px solid #334155',
          borderRadius: 12, padding: 24, maxWidth: 720, width: '100%',
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LeyendaSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        color: '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: 0.5, marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 6,
      }}>{title}</div>
      <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}
