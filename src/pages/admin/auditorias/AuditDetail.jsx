import React from 'react';
import ScoreCircle from './ScoreCircle.jsx';
import DecisionBadge from './DecisionBadge.jsx';
import Section from './Section.jsx';
import InfoGrid from './InfoGrid.jsx';
import Pill from './Pill.jsx';
import VoltRow from './VoltRow.jsx';
import { calcularScore, calcularDecision } from './helpers.js';
import { TIPO_LABELS, DEV_LABELS, CELL, HEAD, V_MIN, V_MAX, NT_MAX } from './constants.js';

export default function AuditDetail({ auditoria: a, onClose }) {
  const score    = a.score    ?? calcularScore(a);
  const decision = a.decision ?? calcularDecision(a).decision;
  const ig   = a.info_general || {};
  const devs = a.dispositivos_estado || {};
  const volt = a.voltajes || {};

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '40px 16px', overflowY: 'auto',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg-primary)', borderRadius: 16,
        border: '1px solid var(--border-default)',
        width: '100%', maxWidth: 700,
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        marginBottom: 40,
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: '1px solid var(--border-default)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <ScoreCircle score={score} decision={decision} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>{a.id_atm || '—'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {a.punto_texto || '—'}{a.cliente_texto ? ` · ${a.cliente_texto}` : ''}
            </div>
          </div>
          <DecisionBadge decision={decision} />
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: 'none',
              background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: 16, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Datos generales */}
          <Section title="Datos Generales">
            <InfoGrid items={[
              { label: 'Fecha',       value: a.fecha || '—' },
              { label: 'Hora inicio', value: ig.horaInicio || '—' },
              { label: 'Hora fin',    value: ig.horaFin || '—' },
              { label: 'Tipo',        value: TIPO_LABELS[a.tipo_atm] || a.tipo_atm || '—' },
              { label: 'Marca',       value: a.marca_texto || '—' },
              { label: 'Modelo',      value: a.modelo_texto || '—' },
              { label: 'N° Serie',    value: a.nro_serie || '—' },
              { label: 'IP Equipo',   value: ig.ipEquipo || '—' },
              { label: 'Software',    value: ig.software || '—' },
              { label: 'Dirección',   value: a.direccion || '—' },
            ]} />
          </Section>

          {/* Equipo y pruebas */}
          <Section title="Equipo & Pruebas en Línea">
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 }}>
                  Equipo funcionando
                </div>
                {a.equipo_funcionando === true  ? <Pill color="ok">✓ Sí</Pill> :
                 a.equipo_funcionando === false ? <Pill color="crit">✗ No</Pill> :
                 <Pill color="none">—</Pill>}
                {a.equipo_funcionando_obs && a.equipo_funcionando_obs !== 'ok' && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{a.equipo_funcionando_obs}</div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 4 }}>
                  Pruebas exitosas
                </div>
                {a.pruebas_exitosas === true  ? <Pill color="ok">✓ Sí</Pill> :
                 a.pruebas_exitosas === false ? <Pill color="crit">✗ No</Pill> :
                 <Pill color="none">—</Pill>}
                {a.pruebas_exitosas_obs && a.pruebas_exitosas_obs !== 'ok' && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{a.pruebas_exitosas_obs}</div>
                )}
              </div>
            </div>
          </Section>

          {/* Dispositivos */}
          {Object.keys(devs).length > 0 && (
            <Section title="Dispositivos">
              <div style={{ overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
                  <thead>
                    <tr>
                      {['Dispositivo', 'Estado', 'Observación'].map(h => (
                        <th key={h} style={{ ...HEAD, background: 'none' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(devs).map(([key, d]) => (
                      <tr key={key}>
                        <td style={{ ...CELL, fontSize: 12 }}>{DEV_LABELS[key] || key}</td>
                        <td style={CELL}>
                          {d.estado === 'ok'            ? <Pill color="ok">✓ OK</Pill> :
                           d.estado === 'mantenimiento' ? <Pill color="warn">⚠ Mantenimiento</Pill> :
                           d.estado === 'repuesto'      ? <Pill color="crit">✕ Repuesto</Pill> :
                           <Pill color="none">—</Pill>}
                        </td>
                        <td style={{ ...CELL, fontSize: 12, color: 'var(--text-muted)' }}>{d.obs || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {/* Voltajes */}
          {(volt.atm || volt.ups) && (
            <Section title="Voltajes">
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                {volt.atm && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6 }}>ATM</div>
                    <table style={{ borderCollapse: 'collapse' }}>
                      <tbody>
                        <VoltRow label="L-T" value={volt.atm.lt} tierra={false} />
                        <VoltRow label="L-N" value={volt.atm.ln} tierra={false} />
                        <VoltRow label="N-T" value={volt.atm.nt} tierra={true} />
                      </tbody>
                    </table>
                  </div>
                )}
                {volt.ups && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6 }}>UPS</div>
                    <table style={{ borderCollapse: 'collapse' }}>
                      <tbody>
                        <VoltRow label="L-T" value={volt.ups.lt} tierra={false} />
                        <VoltRow label="L-N" value={volt.ups.ln} tierra={false} />
                        <VoltRow label="N-T" value={volt.ups.nt} tierra={true} />
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-disabled)' }}>
                Rango OK: L-T / L-N {V_MIN.toFixed(0)}–{V_MAX.toFixed(0)} V · N-T ≤ {NT_MAX} V
              </div>
            </Section>
          )}

          {/* Observaciones */}
          {a.obs_generales && (
            <Section title="Observaciones Generales">
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.65 }}>
                {a.obs_generales}
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
