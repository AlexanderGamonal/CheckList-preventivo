import React from 'react';
import KpiCard from '../../../components/dashboard/KpiCard.jsx';
import EmptyState from './EmptyState.jsx';
import DistribucionPie from './DistribucionPie.jsx';
import FallasBar from './FallasBar.jsx';
import ScoreCircle from './ScoreCircle.jsx';
import DecisionSelector from './DecisionSelector.jsx';
import { DECISION_COLORS, PIE_FILL, DEV_LABELS, CELL, HEAD } from './constants.js';

export default function TabEjecutiva({ enriched, counts, fallasCounts, criticos, loading, onVerDetalle, onSelect }) {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-disabled)', fontSize: 14 }}>
      Cargando datos...
    </div>
  );

  const pct = key => counts.total ? `${((counts[key] / counts.total) * 100).toFixed(0)}%` : '0%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <KpiCard label="Total auditados" value={counts.total} subtitle="equipos revisados" />
        <KpiCard
          label="✓ Aceptar" value={counts.ACEPTAR} subtitle={pct('ACEPTAR') + ' del total'}
          color="#16a34a" bg="rgba(22,163,74,0.06)" border="rgba(22,163,74,0.25)"
        />
        <KpiCard
          label="⚠ Observar" value={counts.OBSERVAR} subtitle={pct('OBSERVAR') + ' del total'}
          color="#d97706" bg="rgba(217,119,6,0.06)" border="rgba(217,119,6,0.25)"
        />
        <KpiCard
          label="✕ Rechazar" value={counts.RECHAZAR} subtitle={pct('RECHAZAR') + ' del total'}
          color="#dc2626" bg="rgba(220,38,38,0.06)" border="rgba(220,38,38,0.25)"
        />
      </div>

      {counts.total === 0 ? (
        <EmptyState msg="No hay auditorías registradas aún" />
      ) : (
        <>
          {/* Charts row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Pie */}
            <div style={{
              flex: '0 1 260px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Distribución
              </div>
              <DistribucionPie counts={counts} total={counts.total} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {['ACEPTAR', 'OBSERVAR', 'RECHAZAR'].map(d => (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: PIE_FILL[d], flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{d}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, color: DECISION_COLORS[d].fg }}>{counts[d]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar */}
            <div style={{
              flex: '1 1 400px', background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)', borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Top Fallas por Dispositivo
              </div>
              <FallasBar data={fallasCounts} />
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#dc2626', flexShrink: 0 }} />
                  Requiere repuesto
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#d97706', flexShrink: 0 }} />
                  Requiere mantenimiento
                </div>
              </div>
            </div>
          </div>

          {/* Tabla semáforo — ATMs a rechazar */}
          {criticos.length > 0 && (
            <div style={{
              background: 'var(--bg-secondary)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 12, overflow: 'hidden',
            }}>
              <div style={{
                padding: '12px 20px',
                background: 'rgba(220,38,38,0.07)',
                borderBottom: '1px solid rgba(220,38,38,0.2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 14 }}>✕</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>
                  ATMs a Rechazar — {criticos.length} equipo{criticos.length !== 1 ? 's' : ''}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-disabled)', marginLeft: 4 }}>ordenados por score ascendente</span>
              </div>
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 620 }}>
                  <thead>
                    <tr>
                      {['ID ATM', 'Punto', 'Marca / Modelo', 'Score', 'Fallas', 'Observaciones', 'Decisión', ''].map(h => (
                        <th key={h} style={HEAD}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {criticos.map(r => {
                      const devEntries = Object.values(r.dispositivos_estado || {});
                      const rep  = devEntries.filter(d => d.estado === 'repuesto').length;
                      const mant = devEntries.filter(d => d.estado === 'mantenimiento').length;
                      return (
                        <tr key={r.id}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--active-overlay)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ ...CELL, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-brand)', fontWeight: 700 }}>
                            {r.id_atm || '—'}
                          </td>
                          <td style={{ ...CELL, fontSize: 12 }}>{r.punto_texto || '—'}</td>
                          <td style={{ ...CELL, fontSize: 12 }}>
                            {r.marca_texto || '—'}
                            {r.modelo_texto && <span style={{ color: 'var(--text-disabled)', marginLeft: 4 }}>{r.modelo_texto}</span>}
                          </td>
                          <td style={{ ...CELL, textAlign: 'center' }}>
                            <ScoreCircle score={r.score} decision={r.decision} />
                          </td>
                          <td style={{ ...CELL }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {rep > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', background: 'rgba(220,38,38,0.12)', borderRadius: 4, padding: '2px 6px' }}>
                                  ✕ {rep} rep.
                                </span>
                              )}
                              {mant > 0 && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: '#d97706', background: 'rgba(217,119,6,0.12)', borderRadius: 4, padding: '2px 6px' }}>
                                  ⚠ {mant} manto.
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ ...CELL, fontSize: 12, color: 'var(--text-muted)', maxWidth: 200 }}>
                            {r.obs_generales
                              ? r.obs_generales.slice(0, 90) + (r.obs_generales.length > 90 ? '…' : '')
                              : '—'}
                          </td>
                          <td style={CELL}>
                            <DecisionSelector
                              auditoriaId={r.id}
                              current={r.decision}
                              recommended={r.recommended}
                              onSelect={onSelect}
                              repuestosLabels={Object.entries(r.dispositivos_estado || {}).filter(([,d]) => d.estado === 'repuesto').map(([k]) => DEV_LABELS[k] || k)}
                            />
                          </td>
                          <td style={{ ...CELL }}>
                            <button
                              onClick={() => onVerDetalle(r)}
                              style={{
                                padding: '4px 12px', borderRadius: 6,
                                border: '1px solid var(--border-default)',
                                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                                fontSize: 12, cursor: 'pointer',
                              }}
                            >Ver</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {criticos.length === 0 && counts.total > 0 && (
            <div style={{
              padding: '20px 24px', borderRadius: 12,
              background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.25)',
              display: 'flex', alignItems: 'center', gap: 12,
              fontSize: 14, color: '#16a34a', fontWeight: 600,
            }}>
              ✓ Ningún equipo en categoría RECHAZAR
            </div>
          )}
        </>
      )}
    </div>
  );
}
