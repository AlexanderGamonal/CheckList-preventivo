import React, { useState, useEffect } from 'react';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import { exportarCSV, exportarDispositivosCSV } from '../../services/csvExport.js';

const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' };
const TD = { padding: '10px 14px', fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap' };

const EST_COLOR = {
  'Operativo': '#22c55e',
  'Inoperativo': '#ef4444',
  'Operativo con observaciones': '#f59e0b',
};

const INPUT_STYLE = { padding: '7px 10px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: 13, minWidth: 120 };

function pctColor(pct) {
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
}

function calcPct(buenos, defect, reg) {
  const total = (buenos || 0) + (defect || 0) + (reg || 0);
  return total > 0 ? Math.round(((buenos || 0) / total) * 100) : null;
}

export default function MantenimientosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marcas, setMarcas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [filtros, setFiltros] = useState({
    desde: '', hasta: '', est_final: '',
    id_atm: '', punto: '', marca: '', tecnico_nombre: '',
    disp_buenos_min: '', disp_defectuosos_min: '',
  });
  const [exporting, setExporting] = useState(false);
  const [exportingDisp, setExportingDisp] = useState(false);
  const [toast, setToast] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  useEffect(() => {
    fetchData();
    supabase.from('marcas').select('nombre').order('nombre').then(({ data }) => setMarcas(data || []));
    supabase.from('tecnicos').select('nombre').order('nombre').then(({ data }) => setTecnicos(data || []));
  }, []);

  async function fetchData() {
    setLoading(true);
    let q = supabase
      .from('mantenimientos')
      .select('id, fecha, id_atm_texto, punto_texto, marca_texto, tecnico_nombre, est_final, disp_buenos, disp_defectuosos, disp_regulares')
      .order('fecha', { ascending: false })
      .limit(200);
    if (filtros.desde)               q = q.gte('fecha', filtros.desde);
    if (filtros.hasta)               q = q.lte('fecha', filtros.hasta);
    if (filtros.est_final)           q = q.eq('est_final', filtros.est_final);
    if (filtros.id_atm.trim())       q = q.ilike('id_atm_texto', `%${filtros.id_atm.trim()}%`);
    if (filtros.punto.trim())        q = q.ilike('punto_texto', `%${filtros.punto.trim()}%`);
    if (filtros.marca)               q = q.eq('marca_texto', filtros.marca);
    if (filtros.tecnico_nombre)      q = q.eq('tecnico_nombre', filtros.tecnico_nombre);
    if (filtros.disp_buenos_min !== '') q = q.gte('disp_buenos', parseInt(filtros.disp_buenos_min));
    if (filtros.disp_defectuosos_min !== '') q = q.gte('disp_defectuosos', parseInt(filtros.disp_defectuosos_min));
    const { data } = await q;
    setRows(data || []);
    setLoading(false);
  }

  function limpiarFiltros() {
    setFiltros({ desde: '', hasta: '', est_final: '', id_atm: '', punto: '', marca: '', tecnico_nombre: '', disp_buenos_min: '', disp_defectuosos_min: '' });
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportarCSV(filtros);
      setToast('✓ mantenimientos.csv exportado');
    } catch (e) {
      setToast('Error: ' + e.message);
    } finally {
      setExporting(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  async function handleExportDisp() {
    setExportingDisp(true);
    try {
      await exportarDispositivosCSV(filtros);
      setToast('✓ dispositivos.csv exportado');
    } catch (e) {
      setToast('Error: ' + e.message);
    } finally {
      setExportingDisp(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  const stats = {
    total: rows.length,
    operativos: rows.filter(r => r.est_final === 'Operativo').length,
    conObs: rows.filter(r => r.est_final === 'Operativo con observaciones').length,
    inoperativos: rows.filter(r => r.est_final === 'Inoperativo').length,
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Mantenimientos</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Historial de mantenimientos realizados</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleExport} disabled={exporting}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {exporting ? 'Exportando...' : '↓ Mantenimientos CSV'}
            </button>
            <button
              onClick={handleExportDisp} disabled={exportingDisp}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              {exportingDisp ? 'Exportando...' : '↓ Dispositivos CSV'}
            </button>
          </div>
          <span style={{ color: '#475569', fontSize: 10 }}>Para Power BI: importar ambos archivos y relacionar por mantenimiento_id</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Filtros</div>
        {/* Row 1 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          {[['desde', 'Desde', 'date'], ['hasta', 'Hasta', 'date']].map(([key, label, type]) => (
            <div key={key}>
              <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>{label}</label>
              <input type={type} value={filtros[key]}
                onChange={e => setFiltros(p => ({ ...p, [key]: e.target.value }))}
                style={INPUT_STYLE}
              />
            </div>
          ))}
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Estado</label>
            <select value={filtros.est_final}
              onChange={e => setFiltros(p => ({ ...p, est_final: e.target.value }))}
              style={INPUT_STYLE}
            >
              <option value="">Todos</option>
              <option>Operativo</option>
              <option>Inoperativo</option>
              <option>Operativo con observaciones</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>ID ATM</label>
            <input type="text" placeholder="Buscar..." value={filtros.id_atm}
              onChange={e => setFiltros(p => ({ ...p, id_atm: e.target.value }))}
              style={{ ...INPUT_STYLE, minWidth: 140 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Punto</label>
            <input type="text" placeholder="Buscar..." value={filtros.punto}
              onChange={e => setFiltros(p => ({ ...p, punto: e.target.value }))}
              style={{ ...INPUT_STYLE, minWidth: 140 }}
            />
          </div>
        </div>
        {/* Row 2 */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Marca</label>
            <select value={filtros.marca}
              onChange={e => setFiltros(p => ({ ...p, marca: e.target.value }))}
              style={INPUT_STYLE}
            >
              <option value="">Todas</option>
              {marcas.map(m => <option key={m.nombre}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Técnico</label>
            <select value={filtros.tecnico_nombre}
              onChange={e => setFiltros(p => ({ ...p, tecnico_nombre: e.target.value }))}
              style={INPUT_STYLE}
            >
              <option value="">Todos</option>
              {tecnicos.map(t => <option key={t.nombre}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Disp. Buenos ≥</label>
            <input type="number" min="0" placeholder="0" value={filtros.disp_buenos_min}
              onChange={e => setFiltros(p => ({ ...p, disp_buenos_min: e.target.value }))}
              style={{ ...INPUT_STYLE, minWidth: 90 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Disp. Defect. ≥</label>
            <input type="number" min="0" placeholder="0" value={filtros.disp_defectuosos_min}
              onChange={e => setFiltros(p => ({ ...p, disp_defectuosos_min: e.target.value }))}
              style={{ ...INPUT_STYLE, minWidth: 90 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={fetchData}
              style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              Filtrar
            </button>
            <button onClick={() => { limpiarFiltros(); setTimeout(fetchData, 0); }}
              style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {toast && <div style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 8, background: '#0f2018', color: '#10b981', fontSize: 13, fontWeight: 600 }}>{toast}</div>}

      {/* Stats bar */}
      {!loading && rows.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <StatBadge label="Total" value={stats.total} color="#60a5fa" />
          <StatBadge label="Operativos" value={`${stats.operativos} (${stats.total ? Math.round(stats.operativos / stats.total * 100) : 0}%)`} color="#22c55e" />
          <StatBadge label="Con observaciones" value={`${stats.conObs} (${stats.total ? Math.round(stats.conObs / stats.total * 100) : 0}%)`} color="#f59e0b" />
          <StatBadge label="Inoperativos" value={`${stats.inoperativos} (${stats.total ? Math.round(stats.inoperativos / stats.total * 100) : 0}%)`} color="#ef4444" />
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Fecha', 'ID ATM', 'Punto', 'Marca', 'Técnico', 'Estado', 'B ✓', 'D ✗', '% Cumpl.'].map(h => (
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
              <tr><td colSpan={10} style={{ ...TD, textAlign: 'center', color: '#64748b', padding: 40 }}>Sin resultados para los filtros aplicados</td></tr>
            ) : rows.map((r, i) => {
              const pct = calcPct(r.disp_buenos, r.disp_defectuosos, r.disp_regulares);
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
                  <td style={{ ...TD, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.punto_texto}</td>
                  <td style={TD}>{r.marca_texto}</td>
                  <td style={{ ...TD, color: '#cbd5e1' }}>{r.tecnico_nombre}</td>
                  <td style={TD}>
                    <span title={r.est_final} style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: EST_COLOR[r.est_final] || '#64748b', boxShadow: `0 0 6px ${EST_COLOR[r.est_final] || '#64748b'}88` }} />
                  </td>
                  <td style={{ ...TD, textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>{r.disp_buenos ?? '—'}</td>
                  <td style={{ ...TD, textAlign: 'center', color: '#ef4444', fontWeight: 700 }}>{r.disp_defectuosos ?? '—'}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    {pct !== null ? (
                      <span style={{ fontWeight: 700, color: pctColor(pct) }}>{pct}%</span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

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
