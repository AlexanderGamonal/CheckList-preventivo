import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { c2dEstadoFinal, C2D_SITE_ITEMS, C2D_PRUEBAS_ITEMS } from '../../services/c2dService.js';

/* ─── Paleta ──────────────────────────────────────────────────── */
const C = {
  bg:      'var(--bg-primary)',
  card:    'var(--bg-secondary)',
  border:  'var(--border-default)',
  muted:   'var(--text-disabled)',
  text:    'var(--text-primary)',
  sub:     'var(--text-muted)',
  green:   '#22c55e',
  red:     '#ef4444',
  amber:   '#f59e0b',
  blue:    '#3b82f6',
  indigo:  '#6366f1',
  cyan:    '#06b6d4',
  violet:  '#8b5cf6',
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

function calcAuditoriaDecision(a) {
  // Simplificado — igual al motor de AuditoriasPage
  let score = 0;
  if (a.equipo_funcionando === true) score += 25;
  if (a.pruebas_exitosas === true)   score += 25;

  const devs = Object.values(a.dispositivos_estado || {});
  const repuestos = devs.filter(d => d.estado === 'repuesto').length;
  const mantos    = devs.filter(d => d.estado === 'mantenimiento').length;
  const deduction = Math.min(40, repuestos * 8 + mantos * 3);
  score += 40 - deduction;

  const v = a.voltajes || {};
  const inRange = x => { const n = parseFloat(x); return !isNaN(n) && n >= 209 && n <= 231; };
  const grndOk  = x => { const n = parseFloat(x); return !isNaN(n) && n < 4; };
  const voltOk =
    inRange(v.atm?.lt) && inRange(v.atm?.ln) && grndOk(v.atm?.nt);
  if (voltOk) score += 10;

  if (score >= 75 && repuestos >= 1) return 'OBSERVAR';
  if (score >= 75)                   return 'ACEPTAR';
  if (score >= 50)                   return 'OBSERVAR';
  return 'RECHAZAR';
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

/* ─── Sección con título grande ────────────────────────────────── */
function SectionTitle({ children, color = C.blue, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0 16px', paddingBottom: 8, borderBottom: `2px solid ${color}` }}>
      {icon && <span style={{ fontSize: 22 }}>{icon}</span>}
      <h2 style={{ color: C.text, fontSize: 18, fontWeight: 700, margin: 0 }}>{children}</h2>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState(6);
  const [mpData, setMpData] = useState(null);
  const [audData, setAudData] = useState(null);
  const [c2dData, setC2dData] = useState(null);
  const [globals, setGlobals] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [periodo]);

  async function loadData() {
    setLoading(true);
    const desde = getFirstOfPeriod(periodo);
    const primerDelMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

    const [
      mpTotalCnt, mpMesCnt, mpPeriodo,
      audTotalCnt, audPeriodo,
      c2dTotalCnt, c2dPeriodo,
    ] = await Promise.all([
      supabase.from('mantenimientos').select('id', { count: 'exact', head: true }),
      supabase.from('mantenimientos').select('id', { count: 'exact', head: true }).gte('fecha', primerDelMes),
      supabase.from('mantenimientos')
        .select('fecha, est_final, tecnico_nombre, marca_texto, disp_buenos, disp_defectuosos, disp_regulares, disp_no_aplica')
        .gte('fecha', desde).order('fecha', { ascending: true }),
      supabase.from('auditorias').select('id', { count: 'exact', head: true }),
      supabase.from('auditorias')
        .select('id, fecha, tipo_atm, equipo_funcionando, pruebas_exitosas, dispositivos_estado, voltajes')
        .gte('fecha', desde).order('fecha', { ascending: true }),
      supabase.from('mantenimientos_c2d').select('id', { count: 'exact', head: true }),
      supabase.from('mantenimientos_c2d')
        .select('id, fecha, dispositivos, voltajes_fuera_rango, pruebas_deposito, estado_site, tecnico_nombre')
        .gte('fecha', desde).order('fecha', { ascending: true }),
    ]);

    const mpRows  = mpPeriodo.data || [];
    const audRows = audPeriodo.data || [];
    const c2dRows = c2dPeriodo.data || [];
    const meses   = getLastNMonths(periodo);

    // ── KPIs globales ──
    setGlobals({
      mpTotal:  mpTotalCnt.count || 0,
      audTotal: audTotalCnt.count || 0,
      c2dTotal: c2dTotalCnt.count || 0,
      mpMes:    mpMesCnt.count || 0,
      periodo:  mpRows.length + audRows.length + c2dRows.length,
    });

    // ══════════════════ MP ══════════════════
    {
      const op      = mpRows.filter(r => r.est_final === 'Operativo').length;
      const inop    = mpRows.filter(r => r.est_final === 'Inoperativo').length;
      const conObs  = mpRows.filter(r => r.est_final === 'Operativo con observaciones').length;
      const pctOp   = mpRows.length ? Math.round(op / mpRows.length * 100) : 0;

      const avgCumpl = mpRows.length ? Math.round(mpRows.reduce((acc, r) => {
        const apl = r.disp_buenos + r.disp_defectuosos + r.disp_regulares;
        return acc + (apl > 0 ? r.disp_buenos / apl : 1);
      }, 0) / mpRows.length * 100) : 0;

      const mesMap = {};
      meses.forEach(m => { mesMap[m] = { mes: fmtMes(m), Operativo: 0, Inoperativo: 0, 'Con obs.': 0, total: 0 }; });
      mpRows.forEach(r => {
        const key = r.fecha?.slice(0, 7);
        if (mesMap[key]) {
          mesMap[key].total++;
          if (r.est_final === 'Operativo') mesMap[key].Operativo++;
          else if (r.est_final === 'Inoperativo') mesMap[key].Inoperativo++;
          else mesMap[key]['Con obs.']++;
        }
      });

      const pieData = [
        { name: 'Operativo',   value: op,     color: C.green },
        { name: 'Con obs.',    value: conObs, color: C.amber },
        { name: 'Inoperativo', value: inop,   color: C.red   },
      ].filter(p => p.value > 0);

      const tecMap = {};
      mpRows.forEach(r => { tecMap[r.tecnico_nombre] = (tecMap[r.tecnico_nombre] || 0) + 1; });
      const topTecs = Object.entries(tecMap)
        .map(([nombre, count]) => ({ nombre: (nombre || 'N/D').split(' ').slice(0, 2).join(' '), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      const marcaMap = {};
      mpRows.forEach(r => { marcaMap[r.marca_texto] = (marcaMap[r.marca_texto] || 0) + 1; });
      const topMarcas = Object.entries(marcaMap)
        .map(([marca, count]) => ({ marca: marca || 'N/D', count }))
        .sort((a, b) => b.count - a.count);

      setMpData({
        total: mpRows.length, op, inop, conObs, pctOp, avgCumpl,
        byMes: Object.values(mesMap), pieData, topTecs, topMarcas,
      });
    }

    // ══════════════════ AUDITORÍAS ══════════════════
    {
      const decisiones = audRows.map(calcAuditoriaDecision);
      const aceptar  = decisiones.filter(d => d === 'ACEPTAR').length;
      const observar = decisiones.filter(d => d === 'OBSERVAR').length;
      const rechazar = decisiones.filter(d => d === 'RECHAZAR').length;

      const mesMap = {};
      meses.forEach(m => { mesMap[m] = { mes: fmtMes(m), ACEPTAR: 0, OBSERVAR: 0, RECHAZAR: 0 }; });
      audRows.forEach((r, i) => {
        const key = r.fecha?.slice(0, 7);
        if (mesMap[key]) mesMap[key][decisiones[i]]++;
      });

      const pieData = [
        { name: 'ACEPTAR',  value: aceptar,  color: C.green },
        { name: 'OBSERVAR', value: observar, color: C.amber },
        { name: 'RECHAZAR', value: rechazar, color: C.red   },
      ].filter(p => p.value > 0);

      setAudData({
        total: audRows.length, aceptar, observar, rechazar,
        byMes: Object.values(mesMap), pieData,
      });
    }

    // ══════════════════ C2D ══════════════════
    {
      const estadoFinales = c2dRows.map(r => c2dEstadoFinal(r.dispositivos));
      const operativos    = estadoFinales.filter(e => e === 'operativo').length;
      const conObs        = estadoFinales.filter(e => e === 'observacion').length;
      const conFalla      = estadoFinales.filter(e => e === 'malo').length;
      const voltAnom      = c2dRows.filter(r => r.voltajes_fuera_rango).length;

      const mesMap = {};
      meses.forEach(m => { mesMap[m] = { mes: fmtMes(m), Operativos: 0, 'Con obs.': 0, 'Con falla': 0 }; });
      c2dRows.forEach((r, i) => {
        const key = r.fecha?.slice(0, 7);
        if (mesMap[key]) {
          const e = estadoFinales[i];
          if (e === 'operativo')   mesMap[key].Operativos++;
          else if (e === 'observacion') mesMap[key]['Con obs.']++;
          else if (e === 'malo')   mesMap[key]['Con falla']++;
        }
      });

      const pieData = [
        { name: 'Operativos', value: operativos, color: C.green },
        { name: 'Con obs.',   value: conObs,     color: C.amber },
        { name: 'Con falla',  value: conFalla,   color: C.red   },
      ].filter(p => p.value > 0);

      // Site issues
      const siteMap = {};
      C2D_SITE_ITEMS.forEach(({ key, label }) => { siteMap[label.replace(/[¿?]/g, '').trim()] = 0; });
      c2dRows.forEach(r => {
        C2D_SITE_ITEMS.forEach(({ key, label }) => {
          const clean = label.replace(/[¿?]/g, '').trim();
          if (r.estado_site?.items?.[key] === 'no') siteMap[clean]++;
        });
      });
      const siteRanking = Object.entries(siteMap)
        .map(([name, count]) => ({ name, count }))
        .filter(d => d.count > 0);

      setC2dData({
        total: c2dRows.length, operativos, conObs, conFalla, voltAnom,
        byMes: Object.values(mesMap), pieData, siteRanking,
      });
    }

    setLoading(false);
  }

  if (loading || !mpData || !audData || !c2dData || !globals) return (
    <AdminLayout>
      <div style={{ color: C.muted, paddingTop: 60, textAlign: 'center', fontSize: 14 }}>Cargando estadísticas...</div>
    </AdminLayout>
  );

  const axisStyle = { fill: C.muted, fontSize: 11 };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? 12 : 0, marginBottom: 20 }}>
        <div>
          <h1 style={{ color: C.text, fontSize: 22, fontWeight: 700 }}>Dashboard</h1>
          <p style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>Resumen consolidado de Mantenimientos, Auditorías y C2D</p>
        </div>
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

      {/* ═══════════ KPIs GLOBALES ═══════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 8 }}>
        <KpiCard title="Total Mantenimientos" value={globals.mpTotal}  color={C.blue}    icon="🔧" sub="Histórico" />
        <KpiCard title="Total Auditorías"     value={globals.audTotal} color={C.green}   icon="📝" sub="Histórico" />
        <KpiCard title="Total C2D"            value={globals.c2dTotal} color={C.violet}  icon="🧾" sub="Histórico" />
        <KpiCard title="En el período"        value={globals.periodo}  color={C.indigo}  icon="🔍" sub={`Últimos ${periodo} meses — todos`} />
      </div>

      {/* ═══════════ MANTENIMIENTOS ═══════════ */}
      <SectionTitle color={C.blue} icon="🔧">Mantenimientos Preventivos (ATM)</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
        <KpiCard title="Del período"       value={mpData.total}        color={C.blue}   sub={`Últimos ${periodo}M`} />
        <KpiCard title="Operativos"        value={mpData.op}           color={C.green}  sub={`${mpData.pctOp}%`} />
        <KpiCard title="Con observaciones" value={mpData.conObs}       color={C.amber} />
        <KpiCard title="Inoperativos"      value={mpData.inop}         color={C.red} />
        <KpiCard title="Prom. Cumplimiento" value={mpData.avgCumpl + '%'} color='#a855f7' sub="Buenos / total" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 16, marginBottom: 16 }}>
        <ChartCard title={`Mantenimientos por mes — últimos ${periodo}M`}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mpData.byMes} barSize={22} barGap={4}>
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
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mpData.pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} innerRadius={42} paddingAngle={3} label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                {mpData.pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: C.sub, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 8 }}>
        <ChartCard title="Top técnicos">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mpData.topTecs} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="nombre" tick={axisStyle} axisLine={false} tickLine={false} width={100} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" name="Mantenimientos" fill={C.indigo} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Por marca">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mpData.topMarcas} barSize={30}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="marca" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" name="Mantenimientos" fill={C.cyan} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ═══════════ AUDITORÍAS ═══════════ */}
      <SectionTitle color={C.green} icon="📝">Actas de Auditoría</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
        <KpiCard title="Del período" value={audData.total}    color={C.blue} sub={`Últimos ${periodo}M`} />
        <KpiCard title="ACEPTAR"     value={audData.aceptar}  color={C.green}
          sub={audData.total ? `${Math.round(audData.aceptar / audData.total * 100)}%` : '—'} />
        <KpiCard title="OBSERVAR"    value={audData.observar} color={C.amber}
          sub={audData.total ? `${Math.round(audData.observar / audData.total * 100)}%` : '—'} />
        <KpiCard title="RECHAZAR"    value={audData.rechazar} color={C.red}
          sub={audData.total ? `${Math.round(audData.rechazar / audData.total * 100)}%` : '—'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 16, marginBottom: 8 }}>
        <ChartCard title={`Auditorías por mes — últimos ${periodo}M`}>
          {audData.total ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={audData.byMes} barSize={22} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.sub, paddingTop: 12 }} />
                <Bar dataKey="ACEPTAR"  fill={C.green} radius={[4,4,0,0]} />
                <Bar dataKey="OBSERVAR" fill={C.amber} radius={[4,4,0,0]} />
                <Bar dataKey="RECHAZAR" fill={C.red}   radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState msg="Sin auditorías en el período" />
          )}
        </ChartCard>

        <ChartCard title="Distribución de decisión">
          {audData.pieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={audData.pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} innerRadius={42} paddingAngle={3} label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                  {audData.pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.sub, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState msg="Sin datos" />
          )}
        </ChartCard>
      </div>

      {/* ═══════════ C2D ═══════════ */}
      <SectionTitle color={C.violet} icon="🧾">Check List MP C2D (Cash Today)</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 16 }}>
        <KpiCard title="Del período"       value={c2dData.total}      color={C.blue}   sub={`Últimos ${periodo}M`} />
        <KpiCard title="Operativos"        value={c2dData.operativos} color={C.green}
          sub={c2dData.total ? `${Math.round(c2dData.operativos / c2dData.total * 100)}%` : '—'} />
        <KpiCard title="Con observaciones" value={c2dData.conObs}     color={C.amber} />
        <KpiCard title="Con falla"         value={c2dData.conFalla}   color={C.red} />
        <KpiCard title="Voltajes anómalos" value={c2dData.voltAnom}   color={C.violet} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 16, marginBottom: 8 }}>
        <ChartCard title={`C2D por mes — últimos ${periodo}M`}>
          {c2dData.total ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={c2dData.byMes} barSize={22} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="mes" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.sub, paddingTop: 12 }} />
                <Bar dataKey="Operativos" fill={C.green} radius={[4,4,0,0]} />
                <Bar dataKey="Con obs."   fill={C.amber} radius={[4,4,0,0]} />
                <Bar dataKey="Con falla"  fill={C.red}   radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState msg="Sin registros C2D en el período" />
          )}
        </ChartCard>

        <ChartCard title="Distribución de estado final">
          {c2dData.pieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={c2dData.pieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={70} innerRadius={42} paddingAngle={3} label={({ percent }) => `${Math.round(percent * 100)}%`} labelLine={false}>
                  {c2dData.pieData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.sub, paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState msg="Sin datos" />
          )}
        </ChartCard>
      </div>

      {c2dData.siteRanking.length > 0 && (
        <ChartCard title="Issues del site (marcadas No)" style={{ marginBottom: 8 }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={c2dData.siteRanking} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} width={150} />
              <Tooltip content={<DarkTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" name="Ocurrencias" fill={C.amber} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </AdminLayout>
  );
}

function EmptyState({ msg }) {
  return <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13 }}>{msg}</div>;
}
