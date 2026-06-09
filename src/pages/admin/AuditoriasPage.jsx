import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { getAuditorias } from '../../services/auditoriaService.js';
import * as XLSX from 'xlsx';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ── Constants ──────────────────────────────────────────────────────────────────

const TIPO_LABELS = { retiro: 'Retiro', deposito: 'Depósito', multifuncion: 'Multifunción' };
const V_MIN = 220 * 0.95;
const V_MAX = 220 * 1.05;
const NT_MAX = 4;

const DECISION_COLORS = {
  ACEPTAR:  { fg: '#16a34a', bg: 'rgba(22,163,74,0.12)',  border: 'rgba(22,163,74,0.3)'  },
  OBSERVAR: { fg: '#d97706', bg: 'rgba(217,119,6,0.12)',  border: 'rgba(217,119,6,0.3)'  },
  RECHAZAR: { fg: '#dc2626', bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.3)'  },
};
const PIE_FILL = { ACEPTAR: '#16a34a', OBSERVAR: '#d97706', RECHAZAR: '#dc2626' };

const DEV_LABELS = {
  lectorTarjetas:    'Lector de Tarjetas',
  impresoraRecibos:  'Impresora de Recibos',
  tecladoEPP:        'Teclado EPP',
  cpu:               'CPU',
  pantalla:          'Pantalla',
  memoriaRAM:        'Memoria RAM',
  capacidadSSD:      'SSD / HDD',
  shutterAntiFraude: 'Shutter Anti-Fraude',
  sistemaEntintado:  'Sistema Entintado',
  lectorOtro:        'Lector (otro)',
  impresoraOtro:     'Impresora (otro)',
  askTipo:           'ASK',
  tipoNose:          'Nose',
};

const INP = {
  padding: '7px 12px', borderRadius: 8,
  border: '1.5px solid var(--border-default)',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
};
const CELL = {
  padding: '10px 12px', fontSize: 13,
  color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)',
};
const HEAD = {
  padding: '10px 12px', fontSize: 11, fontWeight: 700,
  color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase',
  background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-default)',
  textAlign: 'left',
};

// ── Scoring ────────────────────────────────────────────────────────────────────

function voltajesEnRango(voltajes) {
  if (!voltajes) return false;
  const atm = voltajes.atm || {};
  const ups = voltajes.ups || {};
  const parseV = v => {
    if (v === null || v === undefined || v === '') return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return isNaN(n) ? null : n;
  };
  const readings = [
    [parseV(atm.lt), false], [parseV(atm.ln), false], [parseV(atm.nt), true],
    [parseV(ups.lt), false], [parseV(ups.ln), false], [parseV(ups.nt), true],
  ].filter(([v]) => v !== null);
  if (!readings.length) return false;
  return readings.every(([v, tierra]) => tierra ? v <= NT_MAX : (v >= V_MIN && v <= V_MAX));
}

function calcularScore(a) {
  let score = 0;
  if (a.equipo_funcionando) score += 25;
  if (a.pruebas_exitosas)   score += 25;
  const devs      = Object.values(a.dispositivos_estado || {});
  const repuestos = devs.filter(d => d.estado === 'repuesto').length;
  const manto     = devs.filter(d => d.estado === 'mantenimiento').length;
  score += (40 - Math.min(40, repuestos * 8 + manto * 3));
  if (voltajesEnRango(a.voltajes)) score += 10;
  return Math.max(0, Math.min(100, score));
}

function calcularDecision(a) {
  const score     = calcularScore(a);
  const devs      = Object.values(a.dispositivos_estado || {});
  const repuestos = devs.filter(d => d.estado === 'repuesto').length;
  if (score >= 75 && repuestos >= 1) return { decision: 'OBSERVAR', score };
  if (score >= 75)                   return { decision: 'ACEPTAR',  score };
  if (score >= 50)                   return { decision: 'OBSERVAR', score };
  return                                    { decision: 'RECHAZAR', score };
}

// ── Mini Components ────────────────────────────────────────────────────────────

function DecisionBadge({ decision }) {
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

function DecisionSelector({ auditoriaId, current, recommended, onSelect, repuestosLabels = [] }) {
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

function ScoreCircle({ score, decision }) {
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

function KpiCard({ label, value, subtitle, color, bg, border }) {
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

function Pill({ color, children }) {
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

function EmptyState({ msg }) {
  return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-disabled)', fontSize: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
      {msg}
    </div>
  );
}

// ── Detail helpers ─────────────────────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase',
        letterSpacing: '0.5px', marginBottom: 10, paddingBottom: 6,
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function InfoGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px 24px' }}>
      {items.map(({ label, value }) => value && value !== '—' ? (
        <div key={label}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{value}</div>
        </div>
      ) : null)}
    </div>
  );
}

// ── Charts ─────────────────────────────────────────────────────────────────────

function DistribucionPie({ counts, total }) {
  const data = [
    { name: 'ACEPTAR',  value: counts.ACEPTAR  || 0 },
    { name: 'OBSERVAR', value: counts.OBSERVAR || 0 },
    { name: 'RECHAZAR', value: counts.RECHAZAR || 0 },
  ].filter(d => d.value > 0);

  if (!data.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-disabled)', fontSize: 13 }}>
      Sin datos
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
          {data.map(entry => <Cell key={entry.name} fill={PIE_FILL[entry.name]} />)}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
          formatter={(v, n) => [`${v} ATMs (${total ? ((v / total) * 100).toFixed(0) : 0}%)`, n]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function FallasBar({ data }) {
  if (!data.length) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-disabled)', fontSize: 13 }}>
      Sin fallas registradas
    </div>
  );
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} width={145} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
          cursor={{ fill: 'rgba(255,255,255,0.04)' }}
        />
        <Bar dataKey="repuesto" name="Requiere repuesto" fill="#dc2626" stackId="s" />
        <Bar dataKey="manto" name="Requiere mantenimiento" fill="#d97706" stackId="s" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Audit Detail Modal ─────────────────────────────────────────────────────────

function VoltRow({ label, value, tierra }) {
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

function AuditDetail({ auditoria: a, onClose }) {
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

// ── Leyenda Modal ──────────────────────────────────────────────────────────────

function LeyendaModal({ onClose }) {
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

// ── Tab 1: Vista Ejecutiva ─────────────────────────────────────────────────────

function TabEjecutiva({ enriched, counts, fallasCounts, criticos, loading, onVerDetalle, onSelect }) {
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

// ── Tab 2: Lista de ATMs ───────────────────────────────────────────────────────

function TabLista({ enriched, loading, onVerDetalle, onSelect }) {
  const [search,          setSearch]          = useState('');
  const [filtroDecision,  setFiltroDecision]  = useState('TODOS');
  const [filtroMarca,     setFiltroMarca]     = useState('');
  const [filtroDesde,     setFiltroDesde]     = useState('');
  const [filtroHasta,     setFiltroHasta]     = useState('');

  const marcas = useMemo(() => {
    const set = new Set(enriched.map(r => r.marca_texto).filter(Boolean));
    return Array.from(set).sort();
  }, [enriched]);

  const filtered = useMemo(() => enriched.filter(r => {
    if (search) {
      const q = search.toLowerCase();
      if (!(r.id_atm || '').toLowerCase().includes(q) &&
          !(r.punto_texto || '').toLowerCase().includes(q)) return false;
    }
    if (filtroDecision !== 'TODOS' && r.decision !== filtroDecision) return false;
    if (filtroMarca && r.marca_texto !== filtroMarca) return false;
    if (filtroDesde && r.fecha && r.fecha < filtroDesde) return false;
    if (filtroHasta && r.fecha && r.fecha > filtroHasta) return false;
    return true;
  }), [enriched, search, filtroDecision, filtroMarca, filtroDesde, filtroHasta]);

  function exportarCSV() {
    const headers = [
      'Fecha', 'ID ATM', 'Tipo', 'Punto', 'Marca', 'Modelo', 'Cliente',
      'IP Equipo', 'Máscara Red', 'Gateway', 'DNS 1', 'DNS 2', 'S.O.', 'Software',
      'Equipo OK', 'Pruebas OK', 'Score', 'Decisión', 'Obs. Generales',
    ];
    const lines = filtered.map(r => [
      r.fecha || '', r.id_atm || '',
      TIPO_LABELS[r.tipo_atm] || r.tipo_atm || '',
      r.punto_texto || '', r.marca_texto || '', r.modelo_texto || '', r.cliente_texto || '',
      r.info_general?.ipEquipo      || '',
      r.info_general?.mascaraRed    || '',
      r.info_general?.gateway       || '',
      r.info_general?.dns1          || '',
      r.info_general?.dns2          || '',
      r.info_general?.sistemaOperativo || '',
      r.info_general?.software      || '',
      r.equipo_funcionando === true  ? 'Sí' : r.equipo_funcionando === false  ? 'No' : '',
      r.pruebas_exitosas   === true  ? 'Sí' : r.pruebas_exitosas   === false  ? 'No' : '',
      r.score ?? '', r.decision || '', r.obs_generales || '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `auditorias_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function exportarExcel() {
    const KW = ['repuesto', 'reemplaz', 'cambi', 'desgast', 'deteriora', 'roto', 'falla', 'dañad', 'gastado', 'partido', 'quebrad'];
    const hasKW = t => !!t && t !== 'ok' && KW.some(k => t.toLowerCase().includes(k));

    const buildRepuestos = r => {
      const items = [];
      const devs = r.dispositivos_estado || {};

      // Dispositivos explícitamente marcados como repuesto
      Object.entries(devs).forEach(([k, d]) => {
        if (d.estado === 'repuesto') {
          const obs = d.obs && d.obs !== 'ok' ? ` — "${d.obs}"` : '';
          items.push((DEV_LABELS[k] || k) + obs);
        }
      });

      // Dispositivos en mantenimiento cuya obs menciona palabras clave
      Object.entries(devs).forEach(([k, d]) => {
        if (d.estado === 'mantenimiento' && hasKW(d.obs))
          items.push(`${DEV_LABELS[k] || k} [manto.]: "${d.obs}"`);
      });

      // Observaciones de otros campos
      if (hasKW(r.equipo_funcionando_obs)) items.push(`Estado equipo: "${r.equipo_funcionando_obs}"`);
      if (hasKW(r.pruebas_exitosas_obs))   items.push(`Pruebas línea: "${r.pruebas_exitosas_obs}"`);
      if (r.pruebas_linea_obs)
        Object.values(r.pruebas_linea_obs).forEach(v => { if (hasKW(v)) items.push(`Prueba: "${v}"`); });
      if (hasKW(r.obs_generales))          items.push(`Obs. generales: "${r.obs_generales}"`);

      return items.join('\n') || '—';
    };

    const data = filtered.map(r => ({
      'Fecha':                   r.fecha || '',
      'ID ATM':                  r.id_atm || '',
      'Punto':                   r.punto_texto || '',
      'Marca':                   r.marca_texto || '',
      'Modelo':                  r.modelo_texto || '',
      'IP Equipo':               r.info_general?.ipEquipo         || '',
      'Máscara Red':             r.info_general?.mascaraRed       || '',
      'Gateway':                 r.info_general?.gateway          || '',
      'DNS 1':                   r.info_general?.dns1             || '',
      'DNS 2':                   r.info_general?.dns2             || '',
      'S.O.':                    r.info_general?.sistemaOperativo || '',
      'Software':                r.info_general?.software         || '',
      'Equipo OK':               r.equipo_funcionando === true ? 'Sí' : r.equipo_funcionando === false ? 'No' : '',
      'Pruebas OK':              r.pruebas_exitosas   === true ? 'Sí' : r.pruebas_exitosas   === false ? 'No' : '',
      'Decisión':                r.decision || '',
      'Repuestos Requeridos':    buildRepuestos(r),
      'Requiere Mantenimiento':  Object.entries(r.dispositivos_estado || {})
                                   .filter(([, d]) => d.estado === 'mantenimiento')
                                   .map(([k]) => DEV_LABELS[k] || k).join(', ') || '—',
      'Obs. Generales':          r.obs_generales || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 12 }, { wch: 14 }, { wch: 28 },
      { wch: 13 }, { wch: 16 }, { wch: 16 },
      { wch: 14 }, { wch: 14 }, { wch: 12 },
      { wch: 12 }, { wch: 18 }, { wch: 16 },
      { wch: 9  }, { wch: 10 }, { wch: 10 },
      { wch: 55 }, { wch: 38 }, { wch: 50 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditorías');
    XLSX.writeFile(wb, `auditorias_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filtros */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
        borderRadius: 12, padding: '16px 20px',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Buscar</label>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ID ATM o Punto…" style={{ ...INP, width: 180 }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Decisión</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {['TODOS', 'ACEPTAR', 'OBSERVAR', 'RECHAZAR'].map(d => {
              const active = filtroDecision === d;
              const c = DECISION_COLORS[d];
              return (
                <button key={d} onClick={() => setFiltroDecision(d)} style={{
                  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: active ? 700 : 400,
                  background: active ? (c ? c.bg : 'var(--bg-tertiary)') : 'transparent',
                  color: active ? (c ? c.fg : 'var(--text-primary)') : 'var(--text-muted)',
                  outline: active ? `1.5px solid ${c ? c.border : 'var(--border-default)'}` : 'none',
                  transition: 'all 0.15s',
                }}>
                  {d === 'TODOS' ? 'Todos' : d}
                </button>
              );
            })}
          </div>
        </div>

        {marcas.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Marca</label>
            <select value={filtroMarca} onChange={e => setFiltroMarca(e.target.value)} style={{ ...INP, width: 130, cursor: 'pointer' }}>
              <option value="">Todas</option>
              {marcas.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Desde</label>
          <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} style={{ ...INP, width: 140 }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hasta</label>
          <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} style={{ ...INP, width: 140 }} />
        </div>

        <button
          onClick={() => { setSearch(''); setFiltroDecision('TODOS'); setFiltroMarca(''); setFiltroDesde(''); setFiltroHasta(''); }}
          style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border-default)',
            background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
          }}
        >
          Limpiar
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={exportarCSV} disabled={filtered.length === 0}
            style={{
              padding: '7px 16px', borderRadius: 8,
              border: '1px solid var(--border-brand)',
              background: 'var(--brand-subtle)', color: 'var(--brand-light)',
              fontSize: 12, cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
              opacity: filtered.length === 0 ? 0.5 : 1,
            }}
          >
            ⬇ CSV
          </button>
          <button
            onClick={exportarExcel} disabled={filtered.length === 0}
            style={{
              padding: '7px 16px', borderRadius: 8,
              border: '1px solid rgba(22,163,74,0.4)',
              background: 'rgba(22,163,74,0.08)', color: '#16a34a',
              fontSize: 12, fontWeight: 600,
              cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
              opacity: filtered.length === 0 ? 0.5 : 1,
            }}
          >
            ⬇ Excel
          </button>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
        {loading ? 'Cargando...' : `${filtered.length} registro${filtered.length !== 1 ? 's' : ''}`}
      </div>

      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr>
              {['Fecha', 'ID ATM', 'Punto / Cliente', 'Marca / Modelo', 'Eq. OK', 'Pruebas', 'Score', 'Decisión', ''].map(h => (
                <th key={h} style={HEAD}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={9} style={{ ...CELL, textAlign: 'center', padding: 40, color: 'var(--text-disabled)' }}>Cargando...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ ...CELL, textAlign: 'center', padding: 40, color: 'var(--text-disabled)' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                  <div>Sin resultados</div>
                </td>
              </tr>
            )}
            {!loading && filtered.map(r => (
              <tr key={r.id}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--active-overlay)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ ...CELL, fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{r.fecha || '—'}</td>
                <td style={{ ...CELL, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-brand)', fontWeight: 700 }}>{r.id_atm || '—'}</td>
                <td style={CELL}>
                  <div>{r.punto_texto || '—'}</div>
                  {r.cliente_texto && <div style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{r.cliente_texto}</div>}
                </td>
                <td style={{ ...CELL }}>
                  {r.marca_texto || '—'}
                  {r.modelo_texto && <span style={{ color: 'var(--text-disabled)', marginLeft: 4, fontSize: 11 }}>{r.modelo_texto}</span>}
                </td>
                <td style={{ ...CELL, textAlign: 'center' }}>
                  {r.equipo_funcionando === true  ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> :
                   r.equipo_funcionando === false ? <span style={{ color: '#dc2626', fontWeight: 700 }}>✗</span> :
                   <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                </td>
                <td style={{ ...CELL, textAlign: 'center' }}>
                  {r.pruebas_exitosas === true  ? <span style={{ color: '#16a34a', fontWeight: 700 }}>✓</span> :
                   r.pruebas_exitosas === false ? <span style={{ color: '#dc2626', fontWeight: 700 }}>✗</span> :
                   <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                </td>
                <td style={{ ...CELL, textAlign: 'center' }}><ScoreCircle score={r.score} decision={r.decision} /></td>
                <td style={CELL}>
                  <DecisionSelector
                    auditoriaId={r.id}
                    current={r.decision}
                    recommended={r.recommended}
                    onSelect={onSelect}
                    repuestosLabels={Object.entries(r.dispositivos_estado || {}).filter(([,d]) => d.estado === 'repuesto').map(([k]) => DEV_LABELS[k] || k)}
                  />
                </td>
                <td style={CELL}>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AuditoriasPage() {
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [tab,        setTab]        = useState(0);
  const [detail,     setDetail]     = useState(null);
  const [overrides,  setOverrides]  = useState({});
  const [showLeyenda, setShowLeyenda] = useState(false);

  const setOverride = useCallback((id, dec) => setOverrides(p => ({ ...p, [id]: dec })), []);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await getAuditorias({ limit: 500 });
      setRows(data);
    } catch (e) {
      setError(e.message || 'Error al cargar auditorías');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const enriched = useMemo(() => rows.map(r => {
    const { decision: recommended, score } = calcularDecision(r);
    return { ...r, recommended, score };
  }), [rows]);

  const displayed = useMemo(() => enriched.map(r => ({
    ...r,
    decision: overrides[r.id] != null ? overrides[r.id] : r.recommended,
    overridden: overrides[r.id] != null && overrides[r.id] !== r.recommended,
  })), [enriched, overrides]);

  const counts = useMemo(() => ({
    total:    displayed.length,
    ACEPTAR:  displayed.filter(r => r.decision === 'ACEPTAR').length,
    OBSERVAR: displayed.filter(r => r.decision === 'OBSERVAR').length,
    RECHAZAR: displayed.filter(r => r.decision === 'RECHAZAR').length,
  }), [displayed]);

  const fallasCounts = useMemo(() => {
    const map = {};
    displayed.forEach(a => {
      Object.entries(a.dispositivos_estado || {}).forEach(([key, d]) => {
        if (d.estado === 'repuesto' || d.estado === 'mantenimiento') {
          if (!map[key]) map[key] = { repuesto: 0, manto: 0 };
          if (d.estado === 'repuesto') map[key].repuesto++;
          else map[key].manto++;
        }
      });
    });
    return Object.entries(map)
      .map(([k, c]) => ({ name: DEV_LABELS[k] || k, ...c, total: c.repuesto + c.manto }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [displayed]);

  const criticos = useMemo(() =>
    displayed.filter(r => r.decision === 'RECHAZAR').sort((a, b) => a.score - b.score),
    [displayed]
  );

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body)' }}>
        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
              Dashboard de Auditorías
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
              Recomendaciones ACEPTAR / OBSERVAR / RECHAZAR para equipos ATM auditados
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setShowLeyenda(true)}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid var(--border-brand)',
                background: 'var(--brand-subtle)', color: 'var(--brand-light)',
                fontSize: 13, cursor: 'pointer',
              }}
            >
              ℹ Guía de métricas
            </button>
            <button
              onClick={fetchData} disabled={loading}
              style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-default)',
                background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              ⟳ {loading ? 'Cargando…' : 'Recargar'}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 16,
            background: 'var(--status-critical-dim)', border: '1px solid var(--status-critical-border)',
            color: 'var(--status-critical)', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '1px solid var(--border-default)' }}>
          {['Vista Ejecutiva', 'Lista de ATMs'].map((label, i) => (
            <button
              key={i} onClick={() => setTab(i)}
              style={{
                padding: '9px 20px', border: 'none', cursor: 'pointer',
                background: 'transparent', fontSize: 13,
                fontWeight: tab === i ? 700 : 400,
                color: tab === i ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: tab === i ? '2px solid var(--brand)' : '2px solid transparent',
                marginBottom: -1, borderRadius: '4px 4px 0 0',
                transition: 'color 0.15s',
              }}
            >
              {label}
              {!loading && i === 0 && counts.RECHAZAR > 0 && (
                <span style={{
                  marginLeft: 8, fontSize: 10, fontWeight: 700,
                  background: 'rgba(220,38,38,0.15)', color: '#dc2626',
                  borderRadius: 20, padding: '1px 7px',
                }}>
                  {counts.RECHAZAR}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <TabEjecutiva
            enriched={displayed} counts={counts}
            fallasCounts={fallasCounts} criticos={criticos}
            loading={loading} onVerDetalle={setDetail} onSelect={setOverride}
          />
        )}
        {tab === 1 && (
          <TabLista enriched={displayed} loading={loading} onVerDetalle={setDetail} onSelect={setOverride} />
        )}

        {detail && <AuditDetail auditoria={detail} onClose={() => setDetail(null)} />}
        {showLeyenda && <LeyendaModal onClose={() => setShowLeyenda(false)} />}
      </div>
    </AdminLayout>
  );
}
