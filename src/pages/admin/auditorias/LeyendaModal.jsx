import React from 'react';

export default function LeyendaModal({ onClose }) {
  const ROW  = { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '6px 20px', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' };
  const LBL  = { fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' };
  const VAL  = { fontSize: 12, color: 'var(--text-muted)' };
  const H3   = { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--border-subtle)', marginTop: 0 };
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--bg-primary)', borderRadius: 16, border: '1px solid var(--border-default)', width: '100%', maxWidth: 560, boxShadow: '0 25px 60px rgba(0,0,0,0.5)', marginBottom: 40 }}>
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>ℹ Guía de métricas</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Cómo se calcula el score y qué significa cada indicador</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Score */}
          <div>
            <h3 style={H3}>Algoritmo de puntuación (0–100 pts)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ['Equipo funcionando',         '+25 pts', 'El equipo encendió y respondió correctamente'],
                ['Pruebas en línea exitosas',  '+25 pts', 'Las transacciones de prueba se ejecutaron sin error'],
                ['Dispositivos OK',            'hasta +40 pts', 'Se descuentan puntos por fallas en dispositivos (ver tabla abajo)'],
                ['Voltajes en rango',          '+10 pts', 'Todos los voltajes medidos dentro del rango aceptable'],
              ].map(([k, v, desc]) => (
                <div key={k} style={ROW}>
                  <div>
                    <div style={LBL}>{k}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{ ...VAL, fontWeight: 700, color: 'var(--brand-light)', alignSelf: 'center' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispositivos */}
          <div>
            <h3 style={H3}>Deducción por estado de dispositivos</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ['✓ OK',              '0 pts',   'ok',   'Dispositivo en correcto funcionamiento'],
                ['⚠ Mantenimiento',   '−3 pts',  'warn', 'Requiere servicio técnico programado'],
                ['✕ Requiere repuesto','−8 pts',  'crit', 'Requiere reposición de componente físico'],
              ].map(([estado, pts, color, desc]) => {
                const colors = { ok: '#16a34a', warn: '#d97706', crit: '#dc2626' };
                return (
                  <div key={estado} style={ROW}>
                    <div>
                      <div style={{ ...LBL, color: colors[color] }}>{estado}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>{desc}</div>
                    </div>
                    <div style={{ ...VAL, fontWeight: 700, alignSelf: 'center', color: colors[color] }}>{pts}</div>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 8, fontStyle: 'italic' }}>
              La deducción máxima por dispositivos es 40 pts (el mínimo de esta categoría es 0).
            </div>
          </div>

          {/* Voltajes */}
          <div>
            <h3 style={H3}>Rangos de voltaje aceptables (ATM y UPS)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ['L-T  (Línea — Tierra)',  '209 – 231 V', '±5% de 220 V nominal'],
                ['L-N  (Línea — Neutro)',  '209 – 231 V', '±5% de 220 V nominal'],
                ['N-T  (Neutro — Tierra)', '≤ 4 V',       'Valores más altos indican problemas de tierra eléctrica'],
              ].map(([m, rango, nota]) => (
                <div key={m} style={ROW}>
                  <div>
                    <div style={{ ...LBL, fontFamily: 'var(--font-mono)' }}>{m}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>{nota}</div>
                  </div>
                  <div style={{ ...VAL, fontFamily: 'var(--font-mono)', fontWeight: 700, alignSelf: 'center' }}>{rango}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 8, fontStyle: 'italic' }}>
              Si cualquier lectura está fuera de rango, el ítem de voltajes no suma los 10 pts.
            </div>
          </div>

          {/* Decisiones */}
          <div>
            <h3 style={H3}>Criterios de decisión</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                ['✓ ACEPTAR',  'Score ≥ 75 pts',            '#16a34a', 'El equipo está en buenas condiciones para ser recibido'],
                ['⚠ OBSERVAR', 'Score 50–74 pts',           '#d97706', 'El equipo presenta fallas pero puede aceptarse con seguimiento. También aplica si score ≥ 75 pero hay al menos 1 dispositivo que requiere repuesto.'],
                ['✕ RECHAZAR', 'Score < 50 pts',            '#dc2626', 'El equipo requiere intervención mayor antes de ser aceptado'],
              ].map(([dec, criterio, col, desc]) => (
                <div key={dec} style={ROW}>
                  <div>
                    <div style={{ ...LBL, color: col }}>{dec}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>{desc}</div>
                  </div>
                  <div style={{ ...VAL, fontFamily: 'var(--font-mono)', fontWeight: 700, alignSelf: 'center', color: col }}>{criterio}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Selector */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-default)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Sobre el selector de decisión (✓ ⚠ ✕)</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <li>El botón coloreado y sólido es la decisión actual.</li>
              <li>El botón con <strong>borde punteado</strong> es la recomendación del algoritmo.</li>
              <li>Haz clic en cualquier botón para cambiar la decisión según tu criterio experto.</li>
              <li>Si cambias la decisión, verás "alg: X · editado" debajo del selector.</li>
              <li>Los cambios son solo para esta sesión y no se guardan en la base de datos.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
