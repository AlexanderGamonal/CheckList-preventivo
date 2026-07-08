import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import * as XLSX from 'xlsx';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import { C2D_DEVICE_LABELS, C2D_ESTADO_LABELS, C2D_SITE_ITEMS, C2D_PRUEBAS_ITEMS, C2D_PRUEBA_LABELS, c2dEstadoFinal as estadoFinal, c2dContarPorEstado as contarPorEstado } from '../../services/c2dService.js';
import { VOLT_MIN, VOLT_MAX, NT_MAX } from '../../constants/voltages.js';
import KpiCard from '../../components/dashboard/KpiCard.jsx';
import LeyendaModal, { LeyendaSection } from '../../components/dashboard/LeyendaModal.jsx';

const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' };
const TD = { padding: '10px 14px', fontSize: 13, color: '#e2e8f0', whiteSpace: 'nowrap' };
const INPUT_STYLE = { padding: '7px 10px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: 13, minWidth: 120 };

const ESTADO_COLORS = {
  operativo:   '#22c55e',
  observacion: '#f59e0b',
  malo:        '#ef4444',
};

const ESTADO_FINAL_LABEL = {
  operativo:   'Operativo',
  observacion: 'Con observaciones',
  malo:        'Con falla',
};

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
  const [filtrosFecha, setFiltrosFecha] = useState({ desde: '', hasta: '' });
  const [filtrosLista, setFiltrosLista] = useState({
    id_atm: '', punto: '', tecnico_nombre: '',
    tiene_cash_control: '', voltajes_fuera_rango: '',
  });
  const [tab, setTab] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [toast, setToast] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [showLeyenda, setShowLeyenda] = useState(false);

  useEffect(() => {
    fetchData();
    supabase.from('tecnicos').select('nombre').eq('activo', true).order('nombre').then(({ data }) => setTecnicos(data || []));
  }, []);

  async function fetchData() {
    setLoading(true);
    let q = supabase
      .from('mantenimientos_c2d')
      .select('id, created_at, fecha, hora_inicio, hora_fin, id_atm_texto, punto_texto, nro_serie, marca_texto, modelo_texto, tecnico_id, tecnico_nombre, tecnico_num, tiene_cash_control, estado_site, pruebas_deposito, voltajes, voltajes_fuera_rango, dispositivos, obs_generales')
      .order('created_at', { ascending: false })
      .limit(200);
    if (filtrosFecha.desde) q = q.gte('fecha', filtrosFecha.desde);
    if (filtrosFecha.hasta) q = q.lte('fecha', filtrosFecha.hasta);
    const { data, error } = await q;
    if (error) console.error(error);
    setRows(data || []);
    setLoading(false);
  }

  const enriched = useMemo(() => rows.map(r => {
    const counts = contarPorEstado(r.dispositivos);
    return {
      ...r,
      estadoFinal:      estadoFinal(r.dispositivos),
      countOperativo:   counts.operativo,
      countObs:         counts.observacion,
      countMalo:        counts.malo,
      pruebasFallidas:  C2D_PRUEBAS_ITEMS.filter(({ key }) => r.pruebas_deposito?.items?.[key] === 'fallido').length,
      siteIssues:       C2D_SITE_ITEMS.filter(({ key })    => r.estado_site?.items?.[key] === 'no').length,
    };
  }), [rows]);

  const stats = useMemo(() => {
    const finales = enriched.map(r => r.estadoFinal);
    return {
      total:        enriched.length,
      operativos:   finales.filter(e => e === 'operativo').length,
      conObs:       finales.filter(e => e === 'observacion').length,
      inoperativos: finales.filter(e => e === 'malo').length,
      voltFalla:    enriched.filter(r => r.voltajes_fuera_rango).length,
    };
  }, [enriched]);

  const pieData = useMemo(() => (
    [
      { name: 'Operativo',         key: 'operativo',   value: stats.operativos },
      { name: 'Con observaciones', key: 'observacion', value: stats.conObs },
      { name: 'Con falla',         key: 'malo',        value: stats.inoperativos },
    ].filter(d => d.value > 0)
  ), [stats]);

  const dispositivosRanking = useMemo(() => {
    const acc = {};
    for (const r of enriched) {
      for (const [k, v] of Object.entries(r.dispositivos || {})) {
        if (v?.estado === 'malo' || v?.estado === 'observacion') {
          acc[k] = (acc[k] || 0) + 1;
        }
      }
    }
    return Object.entries(acc)
      .map(([key, count]) => ({ name: C2D_DEVICE_LABELS[key] || key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [enriched]);

  const pruebasFallidasRanking = useMemo(() => (
    C2D_PRUEBAS_ITEMS.map(({ key, label }) => {
      const count = enriched.filter(r => r.pruebas_deposito?.items?.[key] === 'fallido').length;
      return { name: label, count };
    }).filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count)
  ), [enriched]);

  const siteIssuesRanking = useMemo(() => (
    C2D_SITE_ITEMS.map(({ key, label }) => {
      const count = enriched.filter(r => r.estado_site?.items?.[key] === 'no').length;
      const clean = label.replace(/[¿?]/g, '').trim();
      return { name: clean, count };
    }).filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count)
  ), [enriched]);

  function handleExportExcel() {
    setExporting(true);
    try {
      const data = enriched.map(r => {
        const counts = contarPorEstado(r.dispositivos);
        const siteItems = r.estado_site?.items || {};
        const siteObs   = r.estado_site?.obs   || {};
        const siteNo    = C2D_SITE_ITEMS
          .filter(({ key }) => siteItems[key] === 'no')
          .map(({ key, label }) => `${label}${siteObs[key] ? ` (${siteObs[key]})` : ''}`)
          .join(' · ');
        const pruItems  = r.pruebas_deposito?.items || {};
        const pruObs    = r.pruebas_deposito?.obs   || {};
        const pruExit   = C2D_PRUEBAS_ITEMS.filter(({ key }) => pruItems[key] === 'exitoso').length;
        const pruFall   = C2D_PRUEBAS_ITEMS
          .filter(({ key }) => pruItems[key] === 'fallido')
          .map(({ key, label }) => `${label}${pruObs[key] ? ` (${pruObs[key]})` : ''}`)
          .join(' · ');
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
          'Site OK':           C2D_SITE_ITEMS.filter(({ key }) => siteItems[key] === 'si').length,
          'Site con Obs.':     siteNo || '—',
          'Pruebas Exitosas':  pruExit,
          'Pruebas Fallidas':  pruFall || '—',
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

  function handleExportCsv() {
    setExportingCsv(true);
    try {
      const headers = [
        'Fecha', 'ID C2D', 'Punto', 'N° Serie', 'Marca', 'Modelo', 'Técnico', 'N° Interno',
        'Cash Control', 'Voltajes Fuera Rango', 'Estado Final',
        'Operativos', 'Con Observación', 'Malos', 'Pruebas Fallidas', 'Site con Obs.',
        'Dispositivos con falla', 'Obs. Generales',
      ];
      const lines = enriched.map(r => {
        const counts = contarPorEstado(r.dispositivos);
        return [
          r.fecha || '', r.id_atm_texto || '', r.punto_texto || '',
          r.nro_serie || '', r.marca_texto || '', r.modelo_texto || '',
          r.tecnico_nombre || '', r.tecnico_num || '',
          r.tiene_cash_control === true ? 'Sí' : r.tiene_cash_control === false ? 'No' : '',
          r.voltajes_fuera_rango ? 'Sí' : 'No',
          ESTADO_FINAL_LABEL[r.estadoFinal] || '—',
          counts.operativo, counts.observacion, counts.malo,
          r.pruebasFallidas, r.siteIssues,
          dispositivosConFalla(r.dispositivos) || '—',
          r.obs_generales || '',
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
      });
      const csv = [headers.join(','), ...lines].join('\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `c2d_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
      setToast('✓ CSV exportado');
    } catch (e) {
      setToast('Error: ' + e.message);
    } finally {
      setExportingCsv(false);
      setTimeout(() => setToast(''), 3000);
    }
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Check List MP C2D</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Mantenimientos Cash Today registrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setShowLeyenda(true)}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}
          >
            📖 Guía de métricas
          </button>
          <button
            onClick={handleExportCsv} disabled={exportingCsv || !rows.length}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: rows.length ? 'pointer' : 'not-allowed', opacity: rows.length ? 1 : 0.5 }}
          >
            {exportingCsv ? 'Exportando...' : '↓ CSV'}
          </button>
          <button
            onClick={handleExportExcel} disabled={exporting || !rows.length}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#0ea5e9', color: '#fff', fontSize: 13, fontWeight: 700, cursor: rows.length ? 'pointer' : 'not-allowed', opacity: rows.length ? 1 : 0.5 }}
          >
            {exporting ? 'Exportando...' : '↓ Excel'}
          </button>
        </div>
      </div>

      {/* Rango de fechas — afecta el dataset base de ambos tabs */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Desde</label>
          <input type="date" value={filtrosFecha.desde}
            onChange={e => setFiltrosFecha(p => ({ ...p, desde: e.target.value }))}
            style={INPUT_STYLE} />
        </div>
        <div>
          <label style={{ display: 'block', color: '#64748b', fontSize: 11, marginBottom: 4 }}>Hasta</label>
          <input type="date" value={filtrosFecha.hasta}
            onChange={e => setFiltrosFecha(p => ({ ...p, hasta: e.target.value }))}
            style={INPUT_STYLE} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetchData}
            style={{ padding: '7px 18px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Actualizar</button>
          <button onClick={() => { setFiltrosFecha({ desde: '', hasta: '' }); setTimeout(fetchData, 0); }}
            style={{ padding: '7px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Limpiar</button>
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
              borderBottom: tab === i ? '2px solid #8b5cf6' : '2px solid transparent',
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
          dispositivosRanking={dispositivosRanking}
          pruebasFallidasRanking={pruebasFallidasRanking}
          siteIssuesRanking={siteIssuesRanking}
          enriched={enriched} loading={loading}
          onDetalle={setDetalle}
        />
      )}

      {tab === 1 && (
        <TabLista
          enriched={enriched} loading={loading}
          hoveredRow={hoveredRow} setHoveredRow={setHoveredRow}
          onDetalle={setDetalle}
          filtros={filtrosLista} setFiltros={setFiltrosLista}
          tecnicos={tecnicos}
        />
      )}

      {detalle && <DetalleModal reg={detalle} onClose={() => setDetalle(null)} />}

      <LeyendaModal open={showLeyenda} onClose={() => setShowLeyenda(false)} title="Guía de métricas — C2D">
        <LeyendaSection title="Estado final del C2D">
          Se deriva del <b>peor estado</b> encontrado entre los dispositivos evaluados:
          <br />
          <b style={{ color: '#22c55e' }}>Operativo</b>: todos los dispositivos operativos.<br />
          <b style={{ color: '#f59e0b' }}>Con observaciones</b>: al menos uno con observación (sin fallas).<br />
          <b style={{ color: '#ef4444' }}>Con falla</b>: al menos uno marcado como Malo / Falla.
        </LeyendaSection>
        <LeyendaSection title="Estado del site">
          <b>Site OK</b>: item marcado como <i>Sí</i>. <b>Site con Obs.</b>: item marcado como <i>No</i> (típicamente con observación descriptiva).
        </LeyendaSection>
        <LeyendaSection title="Pruebas de depósito">
          <b style={{ color: '#22c55e' }}>Exitoso</b> · <b style={{ color: '#ef4444' }}>Fallido</b> · <b>N/A</b>. El gráfico de "Pruebas fallidas" cuenta solo las <b>Fallidas</b>.
        </LeyendaSection>
        <LeyendaSection title="Voltajes">
          <b>Fuera de rango</b>: alguna medida (Equipo, UPS o Transformador) fuera de <code>{VOLT_MIN}–{VOLT_MAX} V</code> (L-N/L-T) o <code>≤ {NT_MAX} V</code> (N-T).
        </LeyendaSection>
      </LeyendaModal>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}

/* ══════════════════════ TAB EJECUTIVA ══════════════════════ */

function TabEjecutiva({ stats, pieData, dispositivosRanking, pruebasFallidasRanking, siteIssuesRanking, enriched, loading, onDetalle }) {
  if (loading) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Cargando...</div>;
  if (!enriched.length) return <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Sin resultados para los filtros aplicados</div>;

  const pct = (n) => stats.total ? Math.round((n / stats.total) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <KpiCard label="Total C2D" value={stats.total} color="#60a5fa" />
        <KpiCard label="Operativos" value={stats.operativos} subtitle={`${pct(stats.operativos)}%`} color="#22c55e" />
        <KpiCard label="Con observaciones" value={stats.conObs} subtitle={`${pct(stats.conObs)}%`} color="#f59e0b" />
        <KpiCard label="Con falla" value={stats.inoperativos} subtitle={`${pct(stats.inoperativos)}%`} color="#ef4444" />
        <KpiCard label="Voltajes anómalos" value={stats.voltFalla} color="#a855f7" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        <ChartCard title="Distribución de estado final">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                {pieData.map(e => <Cell key={e.key} fill={ESTADO_COLORS[e.key]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
            {pieData.map(d => (
              <div key={d.key} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#cbd5e1' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: ESTADO_COLORS[d.key] }} />
                {d.name} · {d.value}
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Dispositivos con más fallas">
          {dispositivosRanking.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dispositivosRanking} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={140} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="count" position="right" fill="#e2e8f0" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Todos los dispositivos operativos" />}
        </ChartCard>

        <ChartCard title="Pruebas de depósito fallidas">
          {pruebasFallidasRanking.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={pruebasFallidasRanking} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={140} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="count" position="right" fill="#e2e8f0" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Sin pruebas fallidas" />}
        </ChartCard>

        <ChartCard title="Issues del site (marcadas No)">
          {siteIssuesRanking.length ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={siteIssuesRanking} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={160} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="count" position="right" fill="#e2e8f0" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart msg="Sin observaciones de site" />}
        </ChartCard>
      </div>

      {/* Recientes */}
      <ChartCard title="Mantenimientos recientes">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['Fecha', 'ID C2D', 'Punto', 'Técnico', 'Estado', 'Volt', 'CC', 'Pru. Fall.', 'Site Obs.', ''].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {enriched.slice(0, 10).map(r => (
                <tr key={r.id} style={{ background: '#1e293b' }}>
                  <td style={{ ...TD, color: '#94a3b8' }}>{r.fecha}</td>
                  <td style={{ ...TD, fontWeight: 700, color: '#60a5fa' }}>{r.id_atm_texto}</td>
                  <td style={{ ...TD, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.punto_texto || '—'}</td>
                  <td style={{ ...TD, color: '#cbd5e1' }}>{r.tecnico_nombre || '—'}</td>
                  <td style={TD}>
                    <span title={ESTADO_FINAL_LABEL[r.estadoFinal] || '—'} style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: ESTADO_COLORS[r.estadoFinal] || '#64748b' }} />
                  </td>
                  <td style={{ ...TD, textAlign: 'center' }}>{r.voltajes_fuera_rango ? <span style={{ color: '#ef4444' }}>⚠</span> : <span style={{ color: '#22c55e' }}>✓</span>}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>{r.tiene_cash_control === true ? <span style={{ color: '#a855f7' }}>Sí</span> : r.tiene_cash_control === false ? <span style={{ color: '#64748b' }}>No</span> : '—'}</td>
                  <td style={{ ...TD, textAlign: 'center', color: r.pruebasFallidas ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{r.pruebasFallidas || 0}</td>
                  <td style={{ ...TD, textAlign: 'center', color: r.siteIssues ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>{r.siteIssues || 0}</td>
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

function TabLista({ enriched, loading, hoveredRow, setHoveredRow, onDetalle, filtros, setFiltros, tecnicos }) {
  const filtered = useMemo(() => enriched.filter(r => {
    if (filtros.id_atm.trim() && !(r.id_atm_texto || '').toLowerCase().includes(filtros.id_atm.trim().toLowerCase())) return false;
    if (filtros.punto.trim() && !(r.punto_texto || '').toLowerCase().includes(filtros.punto.trim().toLowerCase())) return false;
    if (filtros.tecnico_nombre && r.tecnico_nombre !== filtros.tecnico_nombre) return false;
    if (filtros.tiene_cash_control === 'si' && r.tiene_cash_control !== true) return false;
    if (filtros.tiene_cash_control === 'no' && r.tiene_cash_control !== false) return false;
    if (filtros.voltajes_fuera_rango === 'si' && !r.voltajes_fuera_rango) return false;
    return true;
  }), [enriched, filtros]);

  function limpiar() {
    setFiltros({ id_atm: '', punto: '', tecnico_nombre: '', tiene_cash_control: '', voltajes_fuera_rango: '' });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Filtros de lista */}
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Filtros de búsqueda</div>
          <button onClick={limpiar} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Limpiar</button>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
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
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>Mostrando <b style={{ color: '#e2e8f0' }}>{filtered.length}</b> de {enriched.length} registros</div>
      </div>

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
          ) : filtered.length === 0 ? (
            <tr><td colSpan={10} style={{ ...TD, textAlign: 'center', color: '#64748b', padding: 40 }}>Sin resultados</td></tr>
          ) : filtered.map((r, i) => {
            const isHovered = hoveredRow === r.id;
            const rowBg = isHovered ? '#263548' : (i % 2 === 0 ? '#1e293b' : '#172033');
            const fallas = dispositivosConFalla(r.dispositivos);
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
                  <span title={ESTADO_FINAL_LABEL[r.estadoFinal] || '—'} style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: ESTADO_COLORS[r.estadoFinal] || '#64748b', boxShadow: `0 0 6px ${ESTADO_COLORS[r.estadoFinal] || '#64748b'}88` }} />
                </td>
                <td style={{ ...TD, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', color: '#e2e8f0' }}>{fallas || '—'}</td>
                <td style={TD}>
                  <button onClick={() => onDetalle(r)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #475569', background: 'transparent', color: '#94a3b8', fontSize: 11, cursor: 'pointer' }}>Ver</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </div>
  );
}

/* ══════════════════════ MODAL DETALLE ══════════════════════ */

function DetalleModal({ reg, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, padding: 24, maxWidth: 720, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700 }}>{reg.id_atm_texto}</div>
            <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{reg.fecha} · {reg.tecnico_nombre}</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>✕</button>
        </div>

        <DetalleSection title="Voltajes">
          {['equipo', 'ups', 'transformador'].map(b => {
            const v = reg.voltajes?.[b];
            if (!v) return null;
            return (
              <div key={b} style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 13 }}>
                <span style={{ minWidth: 130, color: '#94a3b8', textTransform: 'capitalize' }}>{b}:</span>
                <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>L-T: {v.lt || '—'} · L-N: {v.ln || '—'} · N-T: {v.nt || '—'}</span>
              </div>
            );
          })}
          {reg.voltajes_fuera_rango && <div style={{ marginTop: 8, color: '#ef4444', fontWeight: 600, fontSize: 12 }}>⚠ Fuera de rango</div>}
        </DetalleSection>

        <DetalleSection title="Estado del site">
          {C2D_SITE_ITEMS.map(({ key, label }) => {
            const val = reg.estado_site?.items?.[key];
            const obs = reg.estado_site?.obs?.[key];
            const color = val === 'si' ? '#22c55e' : val === 'no' ? '#ef4444' : '#64748b';
            const badge = val === 'si' ? '✓ OK' : val === 'no' ? '✕ No' : '—';
            return (
              <div key={key} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
                <span style={{ minWidth: 190, color: '#94a3b8' }}>{label}</span>
                <span style={{ color, fontWeight: 600 }}>{badge}</span>
                {obs && <span style={{ flex: 1, color: '#cbd5e1', fontStyle: 'italic' }}>— {obs}</span>}
              </div>
            );
          })}
        </DetalleSection>

        <DetalleSection title="Dispositivos">
          {Object.entries(reg.dispositivos || {}).map(([k, c]) => (
            <div key={k} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
              <span style={{ minWidth: 190, color: '#94a3b8' }}>{C2D_DEVICE_LABELS[k] || k}:</span>
              <span style={{ color: ESTADO_COLORS[c.estado] || '#64748b', fontWeight: 600 }}>{C2D_ESTADO_LABELS[c.estado] || '—'}</span>
              <span style={{ color: '#64748b', fontSize: 12 }}>({c.num_fotos_antes || 0}A / {c.num_fotos_despues || 0}D)</span>
              {c.obs && <span style={{ flex: 1, color: '#cbd5e1', fontStyle: 'italic' }}>— {c.obs}</span>}
            </div>
          ))}
        </DetalleSection>

        <DetalleSection title="Pruebas de depósito">
          {C2D_PRUEBAS_ITEMS.map(({ key, label }) => {
            const val = reg.pruebas_deposito?.items?.[key];
            const obs = reg.pruebas_deposito?.obs?.[key];
            const color = val === 'exitoso' ? '#22c55e' : val === 'fallido' ? '#ef4444' : '#64748b';
            return (
              <div key={key} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
                <span style={{ minWidth: 190, color: '#94a3b8' }}>{label}</span>
                <span style={{ color, fontWeight: 600 }}>{C2D_PRUEBA_LABELS[val] || '—'}</span>
                {obs && <span style={{ flex: 1, color: '#cbd5e1', fontStyle: 'italic' }}>— {obs}</span>}
              </div>
            );
          })}
        </DetalleSection>

        <DetalleSection title="Observaciones generales">
          <div style={{ fontSize: 13, color: '#cbd5e1', whiteSpace: 'pre-wrap', background: '#1e293b', padding: 12, borderRadius: 6 }}>
            {reg.obs_generales || '—'}
          </div>
        </DetalleSection>
      </div>
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

function DetalleSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, borderBottom: '1px solid #334155', paddingBottom: 6 }}>{title}</div>
      {children}
    </div>
  );
}
