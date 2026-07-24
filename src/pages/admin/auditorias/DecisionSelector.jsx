import React from 'react';
import { DECISION_COLORS } from './constants.js';

export default function DecisionSelector({ auditoriaId, current, recommended, onSelect, repuestosLabels = [] }) {
  const DEC_ICONS = { ACEPTAR: '✓', OBSERVAR: '⚠', RECHAZAR: '✕' };

  function buildTitle(d, isRec) {
    if (d === 'OBSERVAR' && repuestosLabels.length > 0)
      return `OBSERVAR · Repuesto: ${repuestosLabels.join(', ')}`;
    return `${d}${isRec ? ' · recomendado por algoritmo' : ''}`;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {['ACEPTAR', 'OBSERVAR', 'RECHAZAR'].map(d => {
          const active = current === d;
          const isRec  = recommended === d;
          const c = DECISION_COLORS[d];
          return (
            <button
              key={d}
              onClick={() => onSelect(auditoriaId, d)}
              title={buildTitle(d, isRec)}
              style={{
                padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                border: active
                  ? `2px solid ${c.border}`
                  : isRec
                    ? `1.5px dashed ${c.border}`
                    : '1.5px solid var(--border-subtle)',
                background: active ? c.bg : 'transparent',
                color: active ? c.fg : isRec ? c.fg : 'var(--text-disabled)',
                fontSize: 13, fontWeight: active ? 800 : isRec ? 600 : 400,
                opacity: active ? 1 : isRec ? 0.65 : 0.3,
                transition: 'all 0.12s',
              }}
            >
              {DEC_ICONS[d]}
            </button>
          );
        })}
      </div>
      {current !== recommended && (
        <div style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: '0.2px' }}>
          alg: {DEC_ICONS[recommended]} · editado
        </div>
      )}
    </div>
  );
}
