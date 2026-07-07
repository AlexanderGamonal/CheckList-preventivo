import React from 'react';

export default function KpiCard({ label, value, subtitle, color, bg, border }) {
  return (
    <div style={{
      flex: '1 1 150px', padding: '20px 24px', borderRadius: 12,
      background: bg || 'var(--bg-secondary)',
      border: `1.5px solid ${border || 'var(--border-default)'}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 40, fontWeight: 800, color: color || 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 6 }}>{subtitle}</div>}
    </div>
  );
}
