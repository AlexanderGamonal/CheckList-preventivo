import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';

/* ─── Paleta ──────────────────────────────────────────────────── */
const C = {
  // Layout — CSS tokens (dark mode OLED)
  bg:      'var(--bg-primary)',
  card:    'var(--bg-secondary)',
  border:  'var(--border-default)',
  muted:   'var(--text-disabled)',
  text:    'var(--text-primary)',
  sub:     'var(--text-muted)',
  // Chart colors — hex requerido por Recharts (SVG fill/stroke)
  green:   '#22c55e',
  red:     '#ef4444',
  amber:   '#f59e0b',
  blue:    '#3b82f6',
  indigo:  '#6366f1',
  cyan:    '#06b6d4',
};

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

/* ─── Helpers ─────────────────────────────────────────────────── */
function fmtMes(yyyyMM) {
  const [y, m] = yyyyMM.split('-');
  return MESES[parseInt(m) - 1] + ' \'' + y.slice(2);
}

function getLastNMonths(n) {
  const months = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(d.toISOString().slice(0, 7));
  }
  return months;
}

function getFirstOfPeriod(meses) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (meses - 1));
  return d.toISOString().slice(0, 10);
}

/* ─── Tooltip personalizado ───────────────────────────────────── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      {label && <div style={{ color: '#94a3b8', marginBottom: 6, fontWeight: 700 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#f8fafc', marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

/* ─── KPI Card ─────────────────────────────────────────────────── */
function KpiCard({ title, value, sub, color, icon }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: '20px 24px', borderLeft: `4px solid ${color}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: C.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ color: C.text, fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: C.sub, fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

/* ─── Chart Card ───────────────────────────────────────────────── */
function ChartCard({ title, children, style = {} }) {
  return (
    <div style={{ background: C.card, borderRadius: 12, padding: '20px 24px', ...style }}>
      <div style={{ color: C.sub, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 20 }}>{title}</div>
      {children}
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [periodo, setPeriodo] = useState(6); // meses
  const [data, setData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [periodo]);

  async function loadData() {
    setLoading(true);
    const desde = getFirstOfPeriod(periodo);

    const [allCount, mesCount, periodoRes] = await Promise.all([
      supabase.from('mantenimientos').select('id', { count: 'exact', head: true }),
      supabase.from('mantenimientos').select('id', { count: 'exact', head: true })
        .gte('fecha', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
      supabase.from('mantenimientos')
        .select('fecha, est_final, tecnico_nombre, marca_texto, disp_buenos, disp_defectuosos, disp_regulares, disp_no_aplica')
        .gte('fecha', desde)
        .order('fecha', { ascending: true }),
    ]);

    const rows = periodoRes.data || [];

    // KPIs
    const total   = allCount.count || 0;
    const mes     = mesCount.count || 0;
    const op      = rows.filter(r => r.est_final === 'Operativo').length;
    const inop    = rows.filter(r => r.est_final === 'Inoperativo').length;
    const conObs  = rows.filter(r => r.est_final === 'Operativo con observaciones').length;
    const pctOp   = rows.length > 0 ? Math.round(op / rows.length * 100) : 0;

    const avgCumpl = rows.length > 0
      ? Math.round(rows.reduce((acc, r) => {
          const apl = r.disp_buenos + r.disp_defectuosos + r.disp_regulares;
          return acc + (apl > 0 ? r.disp_buenos / apl : 1);
        }, 0) / rows.length * 100)
      : 0;

    // Gráfico 1: Mantenimientos por mes
    const mesMap = {};
    getLastNMonths(periodo).forEach(m => { mesMap[m] = { mes: fmtMes(m), Operativo: 0, Inoperativo: 0, 'Con obs.': 0, total: 0 }; });
    rows.forEach(r => {
      const key = r.fecha?.slice(0, 7);
      if (mesMap[key]) {
        mesMap[key].total++;
        if (r.est_final === 'Operativo') mesMap[key].Operativo++;
        else if (r.est_final === 'Inoperativo') mesMap[key].Inoperativo++;
        else mesMap[key]['Con obs.']++;
      }
    });
    const byMes = Object.values(mesMap);

    // Gráfico 2: Pie estado final
    const pieData = [
      { name: 'Operativo',    value: op,     color: C.green },
      { name: 'Con obs.',     value: conObs, color: C.amber },
      { name: 'Inoperativo',  value: inop,   color: C.red   },
    ].filter(p => p.value > 0);

    // Gráfico 3: Top técnicos
    const tecMap = {};
    rows.forEach(r => { tecMap[r.tecnico_nombre] = (tecMap[r.tecnico_nombre] || 0) + 1; });
    const topTecs = Object.entries(tecMap)
      .map(([nombre, count]) => ({ nombre: nombre.split(' ').slice(0, 2).join(' '), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Gráfico 4: Promedio dispositivos por mes
    const dispMap = {};
    getLastNMonths(periodo).forEach(m => { dispMap[m] = { mes: fmtMes(m), buenos: 0, defectuosos: 0, count: 0 }; });
    rows.forEach(r => {
      const key = r.fecha?.slice(0, 7);
      if (dispMap[key]) {
        dispMap[key].buenos += r.disp_buenos || 0;
        dispMap[key].defectuosos += r.disp_defectuosos || 0;
        dispMap[key].count++;
      }
    });
    const byDispMes = Object.values(dispMap).map(d => ({
      mes: d.mes,
      'Prom. Buenos':      d.count > 0 ? Math.round(d.buenos / d.count * 10) / 10 : 0,
      'Prom. Defectuosos': d.count > 0 ? Math.round(d.defectuosos / d.count * 10) / 10 : 0,
    }));

    // Gráfico 5: Top marcas
    const marcaMap = {};
    rows.forEach(r => { marcaMap[r.marca_texto] = (marcaMap[r.marca_texto] || 0) + 1; });
    const topMarcas = Object.entries(marcaMap)
      .map(([marca, count]) => ({ marca, count }))
      .sort((a, b) => b.count - a.count);

    setKpis({ total, mes, pctOp, avgCumpl, op, inop, conObs, totalPeriodo: rows.length });
    setData({ byMes, pieData, topTecs, byDispMes, topMarcas });
    setLoading(false);
  }

  if (loading) return (
    <AdminLayout>
      <div style={{ color: C.muted, paddingTop: 60, textAlign: 'center', fontSize: 14 }}>Cargando estadísticas...</div>
    </AdminLayout>
  );

  const axisStyle = { fill: C.muted, fontSize: 11 };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Estadísticas de mantenimientos preventivos</p>
        </div>
        {/* Selector período */}
        <div style={{ display: 'flex', background: C.card, borderRadius: 10, padding: 4, gap: 2, border: `1px solid ${C.border}` }}>
          {[3, 6, 12].map(m => (
            <button key={m} onClick={() => setPeriodo(m)} style={{
              padding: '6px 16px', borderRadius: 7, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: periodo === m ? C.blue : 'transparent',
              color: periodo === m ? '#fff' : C.muted,
              transition: 'all .15s',
            }}>
              {m}M
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard title="Total histórico"    value={kpis.total}          color={C.blue}   icon="📋" />
        <KpiCard title="Este mes"           value={kpis.mes}            color={C.cyan}   icon="📅" sub={new Date().toLocaleString('es', { month: 'long', year: 'numeric' })} />
        <KpiCard title="En el período"      value={kpis.totalPeriodo}   color={C.indigo} icon="🔍" sub={`Últimos ${periodo} meses`} />
        <KpiCard title="Operativos"         value={kpis.op}             color={C.green}  icon="✅" sub={`${kpis.pctOp}% del período`} />
        <KpiCard title="Con observaciones"  value={kpis.conObs}         color={C.amber}  icon="⚠️" sub="Requieren seguimiento" />
        <KpiCard title="Inoperativos"       value={kpis.inop}           color={C.red}    icon="🔴" sub="Requieren intervención" />
        <KpiCard title="Prom. Cumplimiento" value={kpis.avgCumpl + '%'} color='#a855f7'  icon="⚙️" sub="Dispositivos buenos / total" />
      </div>

      {/* Fila 1: Barras por mes + Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 16 }}>
        <ChartCard title={`Mantenimientos por mes — últimos ${periodo} meses`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.byMes} barSize={22} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.sub, paddingTop: 12 }} />
              <Bar dataKey="Operativo"   fill={C.green} radius={[4,4,0,0]} />
              <Bar dataKey="Con obs."    fill={C.amber} radius={[4,4,0,0]} />
              <Bar dataKey="Inoperativo" fill={C.red}   radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribución por estado">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data.pieData} dataKey="value" nameKey="name"
                cx="50%" cy="45%" outerRadius={80} innerRadius={48}
                paddingAngle={3}
                label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                labelLine={false}
              >
                {data.pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.sub, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Fila 2: Top técnicos + Dispositivos por mes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ChartCard title="Top técnicos — mantenimientos realizados">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.topTecs} layout="vertical" barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="nombre" tick={axisStyle} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" name="Mantenimientos" fill={C.indigo} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Promedio dispositivos buenos vs defectuosos por mes">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.byDispMes}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ stroke: C.border }} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.sub, paddingTop: 8 }} />
              <Line dataKey="Prom. Buenos"      stroke={C.green} strokeWidth={2} dot={{ r: 3, fill: C.green }} />
              <Line dataKey="Prom. Defectuosos" stroke={C.red}   strokeWidth={2} dot={{ r: 3, fill: C.red }}   />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Fila 3: Top marcas */}
      <ChartCard title="Mantenimientos por marca">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data.topMarcas} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="marca" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="count" name="Mantenimientos" fill={C.cyan} radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </AdminLayout>
  );
}
