import React from 'react';

export default function Pill({ color, children }) {
  const map = {
    ok:   { color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
    warn: { color: '#d97706', bg: 'rgba(217,119,6,0.12)' },
    crit: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
    none: { color: 'var(--text-disabled)', bg: 'transparent' },
  };
  const c = map[color] || map.none;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4, color: c.color, background: c.bg }}>
      {children}
    </span>
  );
}
