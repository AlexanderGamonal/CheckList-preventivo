import React from 'react';
import { DECISION_COLORS } from './constants.js';

export default function ScoreCircle({ score, decision }) {
  const c = DECISION_COLORS[decision] || { fg: 'var(--text-disabled)', bg: 'transparent', border: 'transparent' };
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 38, height: 38, borderRadius: '50%',
      background: c.bg, border: `2px solid ${c.border}`,
      color: c.fg, fontSize: 13, fontWeight: 800, flexShrink: 0,
    }}>
      {score}
    </div>
  );
}
