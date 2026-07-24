import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import ScoreCircle from './ScoreCircle.jsx';
import DecisionSelector from './DecisionSelector.jsx';
import { TIPO_LABELS, DECISION_COLORS, DEV_LABELS, CELL, HEAD } from './constants.js';

const INP = {
  padding: '7px 12px', borderRadius: 8,
  border: '1.5px solid var(--border-default)',
  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
  fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)',
};

export default function TabLista({ enriched, loading, onVerDetalle, onSelect }) {
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
