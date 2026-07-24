import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { getAuditorias } from '../../services/auditoriaService.js';
import { calcularDecision } from './auditorias/helpers.js';
import { DEV_LABELS } from './auditorias/constants.js';
import TabEjecutiva from './auditorias/TabEjecutiva.jsx';
import TabLista from './auditorias/TabLista.jsx';
import AuditDetail from './auditorias/AuditDetail.jsx';
import LeyendaModal from './auditorias/LeyendaModal.jsx';

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
