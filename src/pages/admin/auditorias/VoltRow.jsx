import React from 'react';
import { V_MIN, V_MAX, NT_MAX } from './constants.js';

export default function VoltRow({ label, value, tierra }) {
  if (value === null || value === undefined || value === '') return null;
  const n = parseFloat(String(value).replace(',', '.'));
  if (isNaN(n)) return null;
  const ok = tierra ? n <= NT_MAX : (n >= V_MIN && n <= V_MAX);
  return (
    <tr>
      <td style={{ padding: '5px 10px', fontSize: 12, color: 'var(--text-muted)', width: 60 }}>{label}</td>
      <td style={{ padding: '5px 10px', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{value} V</td>
      <td style={{ padding: '5px 10px' }}>
        <span style={{
          fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '2px 6px',
          color: ok ? '#16a34a' : '#dc2626',
          background: ok ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
        }}>
          {ok ? '✓ OK' : '⚠ Fuera de rango'}
        </span>
      </td>
    </tr>
  );
}
