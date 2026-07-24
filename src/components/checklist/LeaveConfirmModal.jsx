import React from 'react';

export default function LeaveConfirmModal({ pct, onCancel, onConfirm }) {
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '22px 20px', width: '100%', maxWidth: 340 }}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>¿Salir del formulario?</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          Tienes {pct}% completado. El borrador se mantendrá guardado y podrás continuar desde el inicio.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px 0', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 10, color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Continuar editando
          </button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px 0', background: 'var(--status-critical-dim)', border: '1px solid var(--status-critical-border)', borderRadius: 10, color: 'var(--status-critical)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
