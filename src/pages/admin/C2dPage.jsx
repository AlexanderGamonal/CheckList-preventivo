import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import { C2D_DEVICE_LABELS, C2D_ESTADO_LABELS } from '../../services/c2dService.js';

const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' };
const TD = { padding: '10px 14px', fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap' };

const INPUT_STYLE = { padding: '7px 10px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: 13, minWidth: 120 };

const ESTADO_COLORS = {
  operativo:   '#22c55e',
  observacion: '#f59e0b',
  malo:        '#ef4444',
};

function estadoFinal(disp) {
  const estados = Object.values(disp || {}).map(c => c?.estado).filter(Boolean);
  if (!estados.length) return null;
  if (estados.some(e => e === 'malo'))        return 'malo';
  if (estados.some(e => e === 'observacion')) return 'observacion';
  return 'operativo';
}

function contarPorEstado(disp) {
  const counts = { operativo: 0, observacion: 0, malo: 0 };
  Object.values(disp || {}).forEach(c => {
    if (c?.estado && counts[c.estado] !== undefined) counts[c.estado]++;
  });
  return counts;
}

function dispositivosConFalla(disp) {
  return Object.entries(disp || {})
    .filter(([, c]) => c?.estado === 'malo' || c?.estado === 'observacion')
    .map(([k, c]) => `${C2D_DEVICE_LABELS[k] || k}${c.obs ? ` (${c.obs})` : ''}`)
    .join(', ');
}

export default function C2dPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tecnicos, setTecnicos] = useState([]);
  const [filtros, setFiltros] = useState({
    desde: '', hasta: '', id_atm: '', punto: '', tecnico_nombre: '',
    tiene_cash_control: '', voltajes_fuera_rango: '',
  });
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    fetchData();
    supabase.from('tecnicos').select('nombre').eq('activo', true).order('nombre').then(({ data }) => setTecnicos(data || []));
  }, []);

  async function fetchData() {
    setLoading(true);
    let q = supabase
      .from('mantenimientos_c2d')
      .select('id, created_at, fecha, hora_inicio, hora_fin, id_atm_texto, punto_texto, nro_serie, marca_texto, modelo_texto, tecnico_id, tecnico_nombre, tecnico_num, tiene_cash_control, voltajes, voltajes_fuera_rango, dispositivos, obs_generales')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filtros.desde)                       q = q.gte('fecha', filtros.desde);
    if (filtros.hasta)                       q = q.lte('fecha', filtros.hasta);
    if (filtros.id_atm.trim())               q = q.ilike('id_atm_texto', `%${filtros.id_atm.trim()}%`);
    if (filtros.punto.trim())                q = q.ilike('punto_texto', `%${filtros.punto.trim()}%`);
    if (filtros.tecnico_nombre)              q = q.eq('tecnico_nombre', filtros.tecnico_nombre);
    if (filtros.tiene_cash_control === 'si') q = q.eq('tiene_cash_control', true);
    if (filtros.tiene_cash_control === 'no') q = q.eq('tiene_cash_control', false);
    if (filtros.voltajes_fuera_rango === 'si') q = q.eq('voltajes_fuera_rango', true);
    const { data, error } = await q;
    if (error) console.error(error);
    setRows(data || []);
    setLoading(false);
  }

  function limpiarFiltros() {
    setFiltros({ desde: '', hasta: '', id_atm: '', punto: '', tecnico_nombre: '', tiene_cash_control: '', voltajes_fuera_rango: '' });
  }

  function handleExportExcel() {
    setExporting(true);
    try {
      const data = rows.map(r => {
        const counts = contarPorEstado(r.dispositivos);
        return {
          'Fecha':             r.fecha || '',
          'ID C2D':            r.id_atm_texto || '',
          'Punto':             r.punto_texto || '',
          'N° Serie':          r.nro_serie || '',
          'Marca':             r.marca_texto || '',
          'Modelo':            r.modelo_texto || '',
          'Técnico':           r.tecnico_nombre || '',
          'N° Interno':        r.tecnico_num || '',
          'Hora Inicio':       r.hora_inicio || '',
          'Hora Fin':          r.hora_fin || '',
          'Cash Control':      r.tiene_cash_control === true ? 'Sí' : r.tiene_cash_control === false ? 'No' : '',
          'Voltaje Equipo L-T': r.voltajes?.equipo?.lt || '',
          'Voltaje Equipo L-N': r.voltajes?.equipo?.ln || '',
          'Voltaje Equipo N-T': r.voltajes?.equipo?.nt || '',
          'Voltajes Fuera Rango': r.voltajes_fuera_rango ? 'Sí' : 'No',
          'Operativos':        counts.operativo,
          'Con Observación':   counts.observacion,
          'Malos / Falla':     counts.malo,
          'Dispositivos con falla': dispositivosConFalla(r.dispositivos) || '—',
          'Obs. Generales':    r.obs_generales || '',
        };
      });
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 15 },
        { wch: 13 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
        { wch: 10 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
        { wch: 10 }, { wch: 15 }, { wch: 12 }, { wch: 50 }, { wch: 50 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'C2D');
      XLSX.writeFile(wb, `c2d_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setToast('✓ Excel exportado');
    } catch (e) {
      setToast('Error: ' + e.message);
    } finally {
      setExporting(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  const stats = useMemo(() => {
    const finales = rows.map(r => estadoFinal(r.dispositivos));
    return {
      total:       rows.length,
      operativos:  finales.filter(e => e === 'operativo').length,
      conObs:      finales.filter(e => e === 'observacion').length,
      inoperativos: finales.filter(e => e === 'malo').length,
      voltFalla:   rows.filter(r => r.voltajes_fuera_rango).length,
    };
  }, [rows]);

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Check List MP C2D</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Mantenimientos Cash Today registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleExportExcel} disabled={exporting || !rows.length}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: rows.length ? 'pointer' : 'not-allowed', opacity: rows.length ? 1 : 0.5 }}
          >
            {exporting ? 'Exportando...' : '↓ Excel'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Filtros</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Desde</label>
            <input type="date" value={filtros.desde} onChange={e => setFiltros(p => ({ ...p, desde: e.target.value }))} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Hasta</label>
            <input type="date" value={filtros.hasta} onChange={e => setFiltros(p => ({ ...p, hasta: e.target.value }))} style={INPUT_STYLE} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>ID C2D</label>
            <input type="text" placeholder="Buscar..." value={filtros.id_atm} onChange={e => setFiltros(p => ({ ...p, id_atm: e.target.value }))} style={{ ...INPUT_STYLE, minWidth: 140 }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Punto</label>
            <input type="text" placeholder="Buscar..." value={filtros.punto} onChange={e => setFiltros(p => ({ ...p, punto: e.target.value }))} style={{ ...INPUT_STYLE, minWidth: 140 }} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Técnico</label>
            <select value={filtros.tecnico_nombre} onChange={e => setFiltros(p => ({ ...p, tecnico_nombre: e.target.value }))} style={INPUT_STYLE}>
              <option value="">Todos</option>
              {tecnicos.map(t => <option key={t.nombre}>{t.nombre}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Cash Control</label>
            <select value={filtros.tiene_cash_control} onChange={e => setFiltros(p => ({ ...p, tiene_cash_control: e.target.value }))} style={INPUT_STYLE}>
              <option value="">Todos</option>
              <option value="si">Con Cash Control</option>
              <option value="no">Sin Cash Control</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Voltajes</label>
            <select value={filtros.voltajes_fuera_rango} onChange={e => setFiltros(p => ({ ...p, voltajes_fuera_rango: e.target.value }))} style={INPUT_STYLE}>
              <option value="">Todos</option>
              <option value="si">Solo con anomalía</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchData} style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Filtrar</button>
            <button onClick={() => { limpiarFiltros(); setTimeout(fetchData, 0); }} style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Limpiar</button>
          </div>
        </div>
      </div>

      {toast && <div style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 8, background: '#0f2018', color: '#10b981', fontSize: 13, fontWeight: 600 }}>{toast}</div>}

      {/* Stats */}
      {!loading && rows.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatBadge label="Total" value={stats.total} color="#60a5fa" />
          <StatBadge label="Operativos" value={`${stats.operativos} (${stats.total ? Math.round(stats.operativos / stats.total * 100) : 0}%)`} color="#22c55e" />
          <StatBadge label="Con observaciones" value={`${stats.conObs} (${stats.total ? Math.round(stats.conObs / stats.total * 100) : 0}%)`} color="#f59e0b" />
          <StatBadge label="Con falla" value={`${stats.inoperativos} (${stats.total ? Math.round(stats.inoperativos / stats.total * 100) : 0}%)`} color="#ef4444" />
          <StatBadge label="Voltajes anómalos" value={stats.voltFalla} color="#a855f7" />
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Fecha', 'ID C2D', 'Punto', 'Marca', 'Técnico', 'CC', 'Volt', 'Estado', 'Disp. con falla', ''].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ ...TD, textAlign: 'center', color: '#64748b', padding: 32 }}>
                <span style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <span style={{ marginLeft: 10 }}>Cargando...</span>
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={10} style={{ ...TD, textAlign: 'center', color: '#64748b', padding: 40 }}>Sin resultados</td></tr>
            ) : rows.map((r, i) => {
              const final    = estadoFinal(r.dispositivos);
              const fallas   = dispositivosConFalla(r.dispositivos);
              const isHovered = hoveredRow === r.id;
              const rowBg = isHovered ? '#263548' : (i % 2 === 0 ? '#1e293b' : '#172033');
              return (
                <tr key={r.id}
                  onMouseEnter={() => setHoveredRow(r.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{ background: rowBg, transition: 'background 0.15s' }}
                >
                  <td style={{ ...TD, color: '#94a3b8' }}>{r.fecha}</td>
                  <td style={{ ...TD, fontWeight: 700, color: '#60a5fa' }}>{r.id_atm_texto}</td>
                  <td style={{ ...TD, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.punto_texto || '—'}</td>
                  <td style={TD}>{r.marca_texto || '—'}</td>
                  <td style={{ ...TD, color: '#cbd5e1' }}>{r.tecnico_nombre || '—'}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    {r.tiene_cash_control === true ? <span style={{ color: '#a855f7', fontWeight: 700 }}>Sí</span> : r.tiene_cash_control === false ? <span style={{ color: '#64748b' }}>No</span> : '—'}
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    {r.voltajes_fuera_rango ? <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠</span> : <span style={{ color: '#22c55e' }}>✓</span>}
                  </td>
                  <td style={TD}>
                    <span title={C2D_ESTADO_LABELS[final] || '—'} style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: ESTADO_COLORS[final] || '#64748b', boxShadow: `0 0 6px ${ESTADO_COLORS[final] || '#64748b'}88` }} />
                  </td>
                  <td style={{ ...TD, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', color: '#e2e8f0' }}>{fallas || '—'}</td>
                  <td style={TD}>
                    <button onClick={() => setDetalle(r)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Ver</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {detalle && (
        <div onClick={() => setDetalle(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 24, maxWidth: 720, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>{detalle.id_atm_texto}</div>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{detalle.fecha} · {detalle.tecnico_nombre}</div>
              </div>
              <button onClick={() => setDetalle(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
            </div>

            <DetalleSection title="Voltajes">
              {['equipo', 'ups', 'transformador'].map(b => {
                const v = detalle.voltajes?.[b];
                if (!v) return null;
                return (
                  <div key={b} style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 13 }}>
                    <span style={{ minWidth: 130, color: '#94a3b8', textTransform: 'capitalize' }}>{b}:</span>
                    <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>L-T: {v.lt || '—'} · L-N: {v.ln || '—'} · N-T: {v.nt || '—'}</span>
                  </div>
                );
              })}
              {detalle.voltajes_fuera_rango && <div style={{ marginTop: 8, color: '#ef4444', fontWeight: 600, fontSize: 12 }}>⚠ Fuera de rango</div>}
            </DetalleSection>

            <DetalleSection title="Dispositivos">
              {Object.entries(detalle.dispositivos || {}).map(([k, c]) => (
                <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ minWidth: 190, color: '#94a3b8' }}>{C2D_DEVICE_LABELS[k] || k}:</span>
                  <span style={{ color: ESTADO_COLORS[c.estado] || '#64748b', fontWeight: 600 }}>{C2D_ESTADO_LABELS[c.estado] || '—'}</span>
                  <span style={{ color: '#64748b', fontSize: 12 }}>({c.num_fotos_antes || 0}A / {c.num_fotos_despues || 0}D)</span>
                  {c.obs && <span style={{ flex: 1, color: '#cbd5e1', fontStyle: 'italic' }}>— {c.obs}</span>}
                </div>
              ))}
            </DetalleSection>

            <DetalleSection title="Observaciones generales">
              <div style={{ fontSize: 13, color: '#cbd5e1', whiteSpace: 'pre-wrap', background: '#1e293b', padding: 12, borderRadius: 6 }}>
                {detalle.obs_generales || '—'}
              </div>
            </DetalleSection>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 8, background: color + '15', border: `1px solid ${color}33` }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function DetalleSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}
