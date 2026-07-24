import React from 'react';
import { DECISION_COLORS } from './constants.js';

export default function DecisionBadge({ decision }) {
  const c = DECISION_COLORS[decision] || { fg: 'var(--text-disabled)', bg: 'transparent', border: 'transparent' };
  const icons = { ACEPTAR: '✓', OBSERVAR: '⚠', RECHAZAR: '✕' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.3px',
      padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap',
      color: c.fg, background: c.bg, border: `1px solid ${c.border}`,
    }}>
      {icons[decision]} {decision}
    </span>
  );
}
