import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { getAuditorias } from '../../services/auditoriaService.js';

const TIPO_LABELS = { retiro: 'Retiro', deposito: 'Depósito', multifuncion: 'Multifunción' };

function Badge({ value }) {
  if (value === true)  return <span style={{ color: 'var(--status-ok)', fontSize: 12, fontWeight: 600 }}>✓ Sí</span>;
  if (value === false) return <span style={{ color: 'var(--status-critical)', fontSize: 12, fontWeight: 600 }}>✗ No</span>;
  return <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>—</span>;
}

function DispositivosBadge({ estado }) {
  if (!estado) return <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>—</span>;
  const entries = Object.values(estado);
  const ok   = entries.filter(d => d.estado === 'ok').length;
  const mant = entries.filter(d => d.estado === 'mantenimiento').length;
  const rep  = entries.filter(d => d.estado === 'repuesto').length;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {ok   > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-ok)',       background: 'rgba(34,197,94,0.1)',  borderRadius: 4, padding: '2px 6px' }}>{ok} OK</span>}
      {mant > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-warn)',    background: 'var(--status-warn-dim)', borderRadius: 4, padding: '2px 6px' }}>⚠ {mant}</span>}
      {rep  > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--status-critical)', background: 'rgba(239,68,68,0.1)',  borderRadius: 4, padding: '2px 6px' }}>✕ {rep}</span>}
    </div>
  );
}

function VoltajeBadge({ voltajes }) {
  if (!voltajes) return <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>—</span>;
  const V_MIN = 220 * 0.95, V_MAX = 220 * 1.05, NT_MAX = 5;
  const check = (v, isTierra) => {
    const n = parseFloat(String(v).replace(',', '.'));
    if (!v || isNaN(n)) return null;
    if (isTierra) return n >= NT_MAX ? 'fuera' : 'ok';
    return (n >= V_MIN && n <= V_MAX) ? 'ok' : 'fuera';
  };
  const atm = voltajes.atm || {};
  const ups = voltajes.ups || {};
  const vals = [check(atm.lt), check(atm.ln), check(atm.nt, true), check(ups.lt), check(ups.ln), check(ups.nt, true)].filter(Boolean);
  if (!vals.length) return <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>—</span>;
  const allOk = vals.every(s => s === 'ok');
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, borderRadius: 4, padding: '2px 6px',
      color:      allOk ? 'var(--status-ok)' : 'var(--status-critical)',
      background: allOk ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
    }}>
      {allOk ? '✓ OK' : '⚠ Revisar'}
    </span>
  );
}

function exportarCSV(rows) {
  const headers = ['Fecha', 'ID ATM', 'Tipo', 'Punto', 'Marca', 'Modelo', 'Cliente', 'Hora Inicio', 'Hora Fin', 'Equipo OK', 'Pruebas OK', 'Dispositivos OK', 'Obs. Generales', 'Creado'];
  const lines = rows.map(r => {
    const ig = r.info_general || {};
    const de = r.dispositivos_estado || {};
    const ok = Object.values(de).filter(d => d.estado === 'ok').length;
    return [
      r.fecha || '',
      r.id_atm || '',
      TIPO_LABELS[r.tipo_atm] || r.tipo_atm || '',
      r.punto_texto || '',
      r.marca_texto || '',
      r.modelo_texto || '',
      r.cliente_texto || '',
      ig.horaInicio || '',
      ig.horaFin || '',
      r.equipo_funcionando === true ? 'Sí' : r.equipo_funcionando === false ? 'No' : '',
      r.pruebas_exitosas === true ? 'Sí' : r.pruebas_exitosas === false ? 'No' : '',
      ok || '',
      r.obs_generales || '',
      r.created_at ? new Date(r.created_at).toLocaleString('es-PE') : '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditorias_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const CELL = { padding: '10px 12px', fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-subtle)' };
const HEAD = { padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' };

export default function AuditoriasPage() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [filtroIdAtm, setFiltroIdAtm] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAuditorias({
        idAtm:      filtroIdAtm || undefined,
        fechaDesde: filtroDesde || undefined,
        fechaHasta: filtroHasta ? filtroHasta + 'T23:59:59' : undefined,
      });
      setRows(data);
    } catch (e) {
      setError(e.message || 'Error al cargar auditorías');
    } finally {
      setLoading(false);
    }
  }, [filtroIdAtm, filtroDesde, filtroHasta]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const INP = {
    padding: '7px 12px', borderRadius: 8,
    border: '1.5px solid var(--border-default)',
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
  };

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body)' }}>
        {/* Título */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>
            Auditorías
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Constancias de recepción de equipos ATM
          </p>
        </div>

        {/* Filtros */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
          background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 20,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ID ATM</label>
            <input
              type="text"
              value={filtroIdAtm}
              onChange={e => setFiltroIdAtm(e.target.value)}
              placeholder="Buscar..."
              style={{ ...INP, width: 160 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Desde</label>
            <input type="date" value={filtroDesde} onChange={e => setFiltroDesde(e.target.value)} style={{ ...INP, width: 150 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Hasta</label>
            <input type="date" value={filtroHasta} onChange={e => setFiltroHasta(e.target.value)} style={{ ...INP, width: 150 }} />
          </div>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: 'var(--brand)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            Filtrar
          </button>
          <button
            onClick={() => { setFiltroIdAtm(''); setFiltroDesde(''); setFiltroHasta(''); }}
            style={{
              padding: '8px 14px', borderRadius: 8,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            Limpiar
          </button>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={() => exportarCSV(rows)}
              disabled={rows.length === 0}
              style={{
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid var(--border-brand)',
                background: 'var(--brand-subtle)', color: 'var(--brand-light)',
                fontSize: 13, cursor: rows.length === 0 ? 'not-allowed' : 'pointer',
                opacity: rows.length === 0 ? 0.5 : 1,
              }}
            >
              ⬇ Exportar CSV
            </button>
          </div>
        </div>

        {/* Resumen */}
        <div style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 12 }}>
          {loading ? 'Cargando...' : `${rows.length} registro${rows.length !== 1 ? 's' : ''} encontrado${rows.length !== 1 ? 's' : ''}`}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 8,
            background: 'var(--status-critical-dim)', border: '1px solid var(--status-critical-border)',
            color: 'var(--status-critical)', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Tabla */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'auto',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr>
                {['Fecha', 'ID ATM', 'Tipo', 'Punto / Cliente', 'Marca / Modelo', 'Horario', 'Equipo OK', 'Pruebas OK', 'Dispositivos', 'Voltajes', 'Registrado'].map(h => (
                  <th key={h} style={HEAD}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={11} style={{ ...CELL, textAlign: 'center', color: 'var(--text-disabled)', padding: 32 }}>
                    Cargando...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ ...CELL, textAlign: 'center', color: 'var(--text-disabled)', padding: 40 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>No se encontraron registros</div>
                    <div style={{ fontSize: 12 }}>Ajusta los filtros o registra una nueva auditoría</div>
                  </td>
                </tr>
              )}
              {!loading && rows.map(r => {
                const ig = r.info_general || {};
                return (
                  <tr key={r.id} style={{ transition: 'background var(--transition-fast)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--active-overlay)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...CELL, fontFamily: 'var(--font-mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{r.fecha || '—'}</td>
                    <td style={{ ...CELL, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-brand)' }}>
                      {r.id_atm || '—'}
                    </td>
                    <td style={{ ...CELL, fontSize: 11 }}>
                      {TIPO_LABELS[r.tipo_atm] || r.tipo_atm || <span style={{ color: 'var(--text-disabled)' }}>—</span>}
                    </td>
                    <td style={CELL}>
                      <div>{r.punto_texto || '—'}</div>
                      {r.cliente_texto && <div style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{r.cliente_texto}</div>}
                    </td>
                    <td style={CELL}>
                      {r.marca_texto || '—'}
                      {r.modelo_texto && <span style={{ color: 'var(--text-disabled)', marginLeft: 4, fontSize: 11 }}>{r.modelo_texto}</span>}
                    </td>
                    <td style={{ ...CELL, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      {ig.horaInicio || '—'}{ig.horaFin ? ` → ${ig.horaFin}` : ''}
                    </td>
                    <td style={{ ...CELL, textAlign: 'center' }}><Badge value={r.equipo_funcionando} /></td>
                    <td style={{ ...CELL, textAlign: 'center' }}><Badge value={r.pruebas_exitosas} /></td>
                    <td style={CELL}><DispositivosBadge estado={r.dispositivos_estado} /></td>
                    <td style={{ ...CELL, textAlign: 'center' }}><VoltajeBadge voltajes={r.voltajes} /></td>
                    <td style={{ ...CELL, fontSize: 11, color: 'var(--text-disabled)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
