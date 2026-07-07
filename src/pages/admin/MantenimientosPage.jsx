import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import * as XLSX from 'xlsx';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import { exportarCSV, exportarDispositivosCSV } from '../../services/csvExport.js';
import KpiCard from '../../components/dashboard/KpiCard.jsx';
import LeyendaModal, { LeyendaSection } from '../../components/dashboard/LeyendaModal.jsx';

const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' };
const TD = { padding: '10px 14px', fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap' };
const INPUT_STYLE = { padding: '7px 10px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: 13, minWidth: 120 };

const EST_COLOR = {
  'Operativo': '#22c55e',
  'Inoperativo': '#ef4444',
  'Operativo con observaciones': '#f59e0b',
};

const PIE_FILL = {
  'Operativo': '#22c55e',
  'Operativo con observaciones': '#f59e0b',
  'Inoperativo': '#ef4444',
};

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

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
  const [tab, setTab] = useState(0);
  const [detalle, setDetalle] = useState(null);
  const [showLeyenda, setShowLeyenda] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingDisp, setExportingDisp] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
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
      .select('id, fecha, id_atm_texto, punto_texto, marca_texto, tecnico_nombre, est_final, disp_buenos, disp_defectuosos, disp_regulares, disp_no_aplica, obs_gen, resultados, recomendaciones, dispositivos, voltajes, site_eval')
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

  const enriched = useMemo(() => rows.map(r => ({
    ...r,
    totalDisp: (r.disp_buenos ?? 0) + (r.disp_defectuosos ?? 0) + (r.disp_regulares ?? 0) + (r.disp_no_aplica ?? 0),
    pctCumpl: calcPct(r.disp_buenos, r.disp_defectuosos, r.disp_regulares),
  })), [rows]);

  const stats = useMemo(() => ({
    total:        enriched.length,
    operativos:   enriched.filter(r => r.est_final === 'Operativo').length,
    conObs:       enriched.filter(r => r.est_final === 'Operativo con observaciones').length,
    inoperativos: enriched.filter(r => r.est_final === 'Inoperativo').length,
  }), [enriched]);

  const pieData = useMemo(() => (
    [
      { name: 'Operativo',                    value: stats.operativos },
      { name: 'Operativo con observaciones',  value: stats.conObs },
      { name: 'Inoperativo',                  value: stats.inoperativos },
    ].filter(d => d.value > 0)
  ), [stats]);

  // Bar horizontal: dispositivos defectuosos por marca (top N)
  const defectosPorMarca = useMemo(() => {
    const acc = {};
    for (const r of enriched) {
      const m = r.marca_texto || 'Sin marca';
      acc[m] = (acc[m] || 0) + (r.disp_defectuosos ?? 0);
    }
    return Object.entries(acc)
      .map(([name, defectos]) => ({ name, defectos }))
      .filter(d => d.defectos > 0)
      .sort((a, b) => b.defectos - a.defectos)
      .slice(0, 6);
  }, [enriched]);

  // Bar vertical: mantenimientos por mes (últimos 6 meses)
  const porMes = useMemo(() => {
    const bucket = {};
    for (const r of enriched) {
      if (!r.fecha) continue;
      const key = r.fecha.slice(0, 7); // YYYY-MM
      bucket[key] = (bucket[key] || 0) + 1;
    }
    return Object.entries(bucket)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([ym, count]) => {
        const [y, m] = ym.split('-');
        return { name: `${MONTH_LABELS[+m - 1]} ${y.slice(2)}`, count };
      });
  }, [enriched]);

  // Bar horizontal: puntos con más inoperativos
  const puntosInoperativos = useMemo(() => {
    const acc = {};
    for (const r of enriched) {
      if (r.est_final !== 'Inoperativo') continue;
      const p = r.punto_texto || 'Sin punto';
      acc[p] = (acc[p] || 0) + 1;
    }
    return Object.entries(acc)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [enriched]);

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

  function handleExportExcel() {
    setExportingExcel(true);
    try {
      const data = enriched.map(r => ({
        'Fecha':          r.fecha || '',
        'ID ATM':         r.id_atm_texto || '',
        'Punto':          r.punto_texto || '',
        'Marca':          r.marca_texto || '',
        'Técnico':        r.tecnico_nombre || '',
        'Estado Final':   r.est_final || '',
        'Buenos':         r.disp_buenos ?? 0,
        'Regulares':      r.disp_regulares ?? 0,
        'Defectuosos':    r.disp_defectuosos ?? 0,
        'N/A':            r.disp_no_aplica ?? 0,
        '% Cumpl.':       r.pctCumpl != null ? r.pctCumpl : '',
        'Obs. Generales': r.obs_gen || '',
        'Resultados':     r.resultados || '',
        'Recomendaciones': r.recomendaciones || '',
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 13 }, { wch: 25 }, { wch: 22 },
        { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 6 }, { wch: 10 },
        { wch: 40 }, { wch: 40 }, { wch: 40 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mantenimientos');
      XLSX.writeFile(wb, `mantenimientos_${new Date().toISOString().slice(0, 10)}.xlsx`);
      setToast('✓ Excel exportado');
    } catch (e) {
      setToast('Error: ' + e.message);
    } finally {
      setExportingExcel(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Mantenimientos</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Historial de mantenimientos preventivos ATM</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setShowLeyenda(true)}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
          >
            📖 Guía de métricas
          </button>
          <button
            onClick={handleExport} disabled={exporting}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {exporting ? 'Exportando...' : '↓ CSV'}
          </button>
          <button
            onClick={handleExportDisp} disabled={exportingDisp}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            {exportingDisp ? 'Exportando...' : '↓ Dispositivos CSV'}
          </button>
          <button
            onClick={handleExportExcel} disabled={exportingExcel || !rows.length}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: rows.length ? 1 : 0.5 }}
          >
            {exportingExcel ? 'Exportando...' : '↓ Excel'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>Filtros</div>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid #334155' }}>
        {['Vista Ejecutiva', 'Lista'].map((label, i) => (
          <button
            key={i} onClick={() => setTab(i)}
            style={{
              padding: '9px 20px', border: 'none', cursor: 'pointer',
              background: 'transparent', fontSize: 13,
              fontWeight: tab === i ? 700 : 400,
              color: tab === i ? '#f8fafc' : '#64748b',
              borderBottom: tab === i ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {label}
            {i === 0 && stats.inoperativos > 0 && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: 20, padding: '1px 7px' }}>
                {stats.inoperativos}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <TabEjecutiva
          stats={stats} pieData={pieData}
          defectosPorMarca={defectosPorMarca}
          porMes={porMes}
          puntosInoperativos={puntosInoperativos}
          enriched={enriched}
          loading={loading}
          onDetalle={setDetalle}
        />
      )}

      {tab === 1 && (
        <TabLista
          enriched={enriched} loading={loading}
          hoveredRow={hoveredRow} setHoveredRow={setHoveredRow}
          onDetalle={setDetalle}
        />
      )}

      {detalle && <DetalleModal mant={detalle} onClose={() => setDetalle(null)} />}
      <LeyendaModal open={showLeyenda} onClose={() => setShowLeyenda(false)} title="Guía de métricas — Mantenimientos">
        <LeyendaSection title="Estado final">
          <b style={{ color: '#22c55e' }}>Operativo</b>: equipo sin fallas detectadas.<br/>
          <b style={{ color: '#f59e0b' }}>Operativo con observaciones</b>: funciona pero requiere atención.<br/>
          <b style={{ color: '#ef4444' }}>Inoperativo</b>: equipo no funcional.
        </LeyendaSection>
        <LeyendaSection title="Estado por dispositivo">
          <b style={{ color: '#22c55e' }}>Bueno</b> · <b style={{ color: '#f59e0b' }}>Regular</b> · <b style={{ color: '#ef4444' }}>Defectuoso</b> · <b>No Aplica</b>. Cada mantenimiento agrega estos totales al registro.
        </LeyendaSection>
        <LeyendaSection title="% Cumplimiento">
          Fórmula: <code>Buenos / (Buenos + Regulares + Defectuosos)</code>. Los N.A. no se cuentan.
        </LeyendaSection>
        <LeyendaSection title="Gráficos">
          <b>Pie</b>: distribución del estado final.<br/>
          <b>Defectuosos por marca</b>: suma de dispositivos defectuosos agrupados por marca del equipo.<br/>
          <b>Mantenimientos por mes</b>: últimos 6 meses con actividad.<br/>
          <b>Puntos con más inoperativos</b>: top 5 puntos donde se marcó Inoperativo.
        </LeyendaSection>
      </LeyendaModal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}

/* ══════════════════════ TAB EJECUTIVA ══════════════════════ */

function TabEjecutiva({ stats, pieData, defectosPorMarca, porMes, puntosInoperativos, enriched, loading, onDetalle }) {
  if (loading) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Cargando...</div>;
  if (!enriched.length) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Sin resultados para los filtros aplicados</div>;

  const pct = (n) => stats.total ? Math.round((n / stats.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total" value={stats.total} color="#60a5fa" />
        <KpiCard label="Operativos" value={stats.operativos} subtitle={`${pct(stats.operativos)}%`} color="#22c55e" />
        <KpiCard label="Con observaciones" value={stats.conObs} subtitle={`${pct(stats.conObs)}%`} color="#f59e0b" />
        <KpiCard label="Inoperativos" value={stats.inoperativos} subtitle={`${pct(stats.inoperativos)}%`} color="#ef4444" />
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        <ChartCard title="Distribución de estado">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {pieData.map((entry) => <Cell key={entry.name} fill={PIE_FILL[entry.name] || '#94a3b8'} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_FILL[d.name] || '#94a3b8' }} />
                {d.name} · {d.value}
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Dispositivos defectuosos por marca">
          {defectosPorMarca.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={defectosPorMarca} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={80} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="defectos" fill="#ef4444" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="defectos" position="right" fill="#e2e8f0" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Sin defectos registrados" />}
        </ChartCard>

        <ChartCard title="Mantenimientos por mes">
          {porMes.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={porMes}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#60a5fa" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="count" position="top" fill="#e2e8f0" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Sin datos" />}
        </ChartCard>

        <ChartCard title="Puntos con más inoperativos">
          {puntosInoperativos.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={puntosInoperativos} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={120} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="count" position="right" fill="#e2e8f0" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Sin inoperativos" />}
        </ChartCard>
      </div>

      {/* Recientes */}
      <ChartCard title="Mantenimientos recientes">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Fecha', 'ID ATM', 'Punto', 'Marca', 'Técnico', 'Estado', 'B/D/R', '% Cumpl.', ''].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {enriched.slice(0, 10).map(r => (
                <tr key={r.id} style={{ background: '#1e293b' }}>
                  <td style={{ ...TD, color: '#94a3b8' }}>{r.fecha}</td>
                  <td style={{ ...TD, fontWeight: 700, color: '#60a5fa' }}>{r.id_atm_texto}</td>
                  <td style={{ ...TD, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.punto_texto || '—'}</td>
                  <td style={TD}>{r.marca_texto || '—'}</td>
                  <td style={{ ...TD, color: '#cbd5e1' }}>{r.tecnico_nombre || '—'}</td>
                  <td style={TD}><span title={r.est_final} style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: EST_COLOR[r.est_final] || '#64748b' }} /></td>
                  <td style={{ ...TD, fontFamily: 'monospace', fontSize: 12 }}>
                    <span style={{ color: '#22c55e' }}>{r.disp_buenos ?? 0}</span>/
                    <span style={{ color: '#ef4444' }}>{r.disp_defectuosos ?? 0}</span>/
                    <span style={{ color: '#f59e0b' }}>{r.disp_regulares ?? 0}</span>
                  </td>
                  <td style={{ ...TD, fontWeight: 700, color: r.pctCumpl != null ? pctColor(r.pctCumpl) : '#64748b' }}>{r.pctCumpl != null ? r.pctCumpl + '%' : '—'}</td>
                  <td style={TD}>
                    <button onClick={() => onDetalle(r)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

/* ══════════════════════ TAB LISTA ══════════════════════ */

function TabLista({ enriched, loading, hoveredRow, setHoveredRow, onDetalle }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            {['Fecha', 'ID ATM', 'Punto', 'Marca', 'Técnico', 'Estado', 'B ✓', 'D ✗', '% Cumpl.', ''].map(h => (
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
          ) : enriched.length === 0 ? (
            <tr><td colSpan={10} style={{ ...TD, textAlign: 'center', color: '#64748b', padding: 40 }}>Sin resultados</td></tr>
          ) : enriched.map((r, i) => {
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
                  {r.pctCumpl !== null ? (
                    <span style={{ fontWeight: 700, color: pctColor(r.pctCumpl) }}>{r.pctCumpl}%</span>
                  ) : '—'}
                </td>
                <td style={TD}>
                  <button onClick={() => onDetalle(r)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Ver</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════════════════ HELPERS ══════════════════════ */

function ChartCard({ title, children }) {
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: 16 }}>
      <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

function EmptyChart({ msg }) {
  return (
    <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 13 }}>
      {msg}
    </div>
  );
}

function DetalleModal({ mant, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 24, maxWidth: 720, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>{mant.id_atm_texto}</div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{mant.fecha} · {mant.tecnico_nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 6 }}>Resumen</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 13 }}>
            <div><span style={{ color: '#94a3b8' }}>Estado:</span><br /><b style={{ color: EST_COLOR[mant.est_final] || '#64748b' }}>{mant.est_final || '—'}</b></div>
            <div><span style={{ color: '#94a3b8' }}>Buenos:</span><br /><b style={{ color: '#22c55e' }}>{mant.disp_buenos ?? 0}</b></div>
            <div><span style={{ color: '#94a3b8' }}>Regulares:</span><br /><b style={{ color: '#f59e0b' }}>{mant.disp_regulares ?? 0}</b></div>
            <div><span style={{ color: '#94a3b8' }}>Defectuosos:</span><br /><b style={{ color: '#ef4444' }}>{mant.disp_defectuosos ?? 0}</b></div>
          </div>
        </div>

        {mant.dispositivos && Object.keys(mant.dispositivos).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 6 }}>Dispositivos evaluados</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
              {Object.entries(mant.dispositivos).slice(0, 40).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{k}</span>
                  <b style={{ color: v.est === 'Bueno' ? '#22c55e' : v.est === 'Defectuoso' ? '#ef4444' : v.est === 'Regular' ? '#f59e0b' : '#64748b' }}>
                    {v.est || '—'}
                  </b>
                </div>
              ))}
            </div>
          </div>
        )}

        {(mant.obs_gen || mant.resultados || mant.recomendaciones) && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 6 }}>Observaciones</div>
            {mant.obs_gen && <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8, whiteSpace: 'pre-wrap' }}><b>Generales:</b> {mant.obs_gen}</p>}
            {mant.resultados && <p style={{ fontSize: 13, color: '#cbd5e1', marginBottom: 8, whiteSpace: 'pre-wrap' }}><b>Resultados:</b> {mant.resultados}</p>}
            {mant.recomendaciones && <p style={{ fontSize: 13, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}><b>Recomendaciones:</b> {mant.recomendaciones}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
