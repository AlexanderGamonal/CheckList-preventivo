import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';

const BTN_RED = {
  padding: '10px 24px', borderRadius: 8, border: 'none',
  background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const BTN_GHOST = {
  padding: '10px 20px', borderRadius: 8, border: '1px solid #334155',
  background: 'transparent', color: '#94a3b8', fontSize: 13, cursor: 'pointer',
};

export default function ResetDatosPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=selección, 2=confirmación, 3=resultado
  const [opciones, setOpciones] = useState({ mantenimientos: false, atms: false, tecnicos: false });
  const [conteos, setConteos] = useState({ mantenimientos: 0, atms: 0, tecnicos: 0 });
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);

  useEffect(() => { cargarConteos(); }, []);

  async function cargarConteos() {
    const [m, a, t] = await Promise.all([
      supabase.from('mantenimientos').select('id', { count: 'exact', head: true }),
      supabase.from('atms').select('id', { count: 'exact', head: true }),
      supabase.from('tecnicos').select('id', { count: 'exact', head: true }),
    ]);
    setConteos({ mantenimientos: m.count || 0, atms: a.count || 0, tecnicos: t.count || 0 });
  }

  function toggleAll(val) {
    setOpciones({ mantenimientos: val, atms: val, tecnicos: val });
  }

  const algunaSeleccionada = Object.values(opciones).some(Boolean);
  // Si se seleccionan ATMs, mantenimientos también debe borrarse (FK constraint)
  const forzarMant = opciones.atms || opciones.tecnicos;

  async function ejecutarReset() {
    setLoading(true);
    const res = [];
    try {
      // 1. Mantenimientos siempre primero (FK → atms y tecnicos)
      const borrarMant = opciones.mantenimientos || forzarMant;
      if (borrarMant) {
        const { count, error } = await supabase.from('mantenimientos').delete().neq('id', 0);
        if (error) throw new Error('Error borrando mantenimientos: ' + error.message);
        res.push(`✓ ${count ?? conteos.mantenimientos} mantenimientos eliminados`);
      }

      // 2. ATMs → luego modelos, marcas, clientes
      if (opciones.atms) {
        const { count: cAtms, error: eAtms } = await supabase.from('atms').delete().neq('id', 0);
        if (eAtms) throw new Error('Error borrando ATMs: ' + eAtms.message);
        res.push(`✓ ${cAtms ?? conteos.atms} ATMs eliminados`);

        const { error: eMod } = await supabase.from('modelos').delete().neq('id', 0);
        if (eMod) throw new Error('Error borrando modelos: ' + eMod.message);

        const { error: eMar } = await supabase.from('marcas').delete().neq('id', 0);
        if (eMar) throw new Error('Error borrando marcas: ' + eMar.message);

        const { error: eCli } = await supabase.from('clientes').delete().neq('id', 0);
        if (eCli) throw new Error('Error borrando clientes: ' + eCli.message);

        res.push('✓ Modelos, marcas y clientes eliminados');
      }

      // 3. Técnicos
      if (opciones.tecnicos) {
        const { count: cTec, error: eTec } = await supabase.from('tecnicos').delete().neq('id', 0);
        if (eTec) throw new Error('Error borrando técnicos: ' + eTec.message);
        res.push(`✓ ${cTec ?? conteos.tecnicos} técnicos eliminados`);
      }

      setResultados(res);
      setStep(3);
    } catch (e) {
      setResultados(['✗ ' + e.message]);
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#450a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⚠️</div>
            <div>
              <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Reset de Datos</h1>
              <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>Elimina datos de prueba antes de cargar datos reales</p>
            </div>
          </div>
          <div style={{ padding: '10px 16px', borderRadius: 8, background: '#450a0a22', border: '1px solid #ef444433', fontSize: 12, color: '#fca5a5' }}>
            Esta operación es <strong>irreversible</strong>. Solo superadmin puede ejecutarla.
          </div>
        </div>

        {/* STEP 1 — Selección */}
        {step === 1 && (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 20 }}>
              Selecciona qué datos borrar
            </div>

            {/* Seleccionar todo */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: '#0f172a', marginBottom: 16, cursor: 'pointer' }}>
              <input type="checkbox"
                checked={Object.values(opciones).every(Boolean)}
                onChange={e => toggleAll(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#ef4444' }}
              />
              <span style={{ color: '#f8fafc', fontSize: 13, fontWeight: 700 }}>Seleccionar todo</span>
            </label>

            {/* Opciones individuales */}
            {[
              { key: 'mantenimientos', label: 'Mantenimientos', desc: 'Historial de mantenimientos preventivos', count: conteos.mantenimientos, color: '#60a5fa' },
              { key: 'atms', label: 'ATMs', desc: 'Cajeros + clientes, marcas y modelos asociados', count: conteos.atms, color: '#a78bfa', warn: 'También borrará mantenimientos por FK' },
              { key: 'tecnicos', label: 'Técnicos', desc: 'Registro de técnicos de mantenimiento', count: conteos.tecnicos, color: '#34d399', warn: 'También borrará mantenimientos por FK' },
            ].map(({ key, label, desc, count, color, warn }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 8, border: `1px solid ${opciones[key] ? '#ef444455' : '#334155'}`, background: opciones[key] ? '#450a0a22' : 'transparent', marginBottom: 10, cursor: 'pointer' }}>
                <input type="checkbox"
                  checked={opciones[key]}
                  onChange={e => setOpciones(p => ({ ...p, [key]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#ef4444', marginTop: 2 }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#f8fafc', fontSize: 13, fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color, background: color + '22', padding: '2px 10px', borderRadius: 20 }}>{count} registros</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>{desc}</div>
                  {warn && opciones[key] && (
                    <div style={{ color: '#f59e0b', fontSize: 11, marginTop: 4 }}>⚠ {warn}</div>
                  )}
                </div>
              </label>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                onClick={() => setStep(2)}
                disabled={!algunaSeleccionada}
                style={{ ...BTN_RED, opacity: algunaSeleccionada ? 1 : 0.4, cursor: algunaSeleccionada ? 'pointer' : 'not-allowed' }}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Confirmación */}
        {step === 2 && (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 20 }}>
              Confirmar eliminación
            </div>

            <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>Se eliminarán:</div>
              {(opciones.mantenimientos || forzarMant) && (
                <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 6 }}>• {conteos.mantenimientos} mantenimientos</div>
              )}
              {opciones.atms && (
                <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 6 }}>• {conteos.atms} ATMs (+ modelos, marcas y clientes)</div>
              )}
              {opciones.tecnicos && (
                <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 6 }}>• {conteos.tecnicos} técnicos</div>
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
                Escribe <strong style={{ color: '#ef4444' }}>CONFIRMAR</strong> para continuar:
              </label>
              <input
                type="text" autoFocus
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="CONFIRMAR"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${confirmText === 'CONFIRMAR' ? '#ef4444' : '#334155'}`, background: '#0f172a', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setStep(1); setConfirmText(''); }} style={BTN_GHOST}>
                ← Atrás
              </button>
              <button
                onClick={ejecutarReset}
                disabled={confirmText !== 'CONFIRMAR' || loading}
                style={{ ...BTN_RED, opacity: confirmText === 'CONFIRMAR' && !loading ? 1 : 0.4, cursor: confirmText === 'CONFIRMAR' && !loading ? 'pointer' : 'not-allowed' }}
              >
                {loading ? 'Borrando...' : 'Borrar datos'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 — Resultado */}
        {step === 3 && (
          <div style={{ background: '#1e293b', borderRadius: 12, padding: 28 }}>
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 20 }}>
              Resultado
            </div>
            <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              {resultados.map((r, i) => (
                <div key={i} style={{ color: r.startsWith('✓') ? '#22c55e' : '#ef4444', fontSize: 13, marginBottom: 6 }}>{r}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setStep(1); setConfirmText(''); setOpciones({ mantenimientos: false, atms: false, tecnicos: false }); cargarConteos(); }} style={BTN_GHOST}>
                Nuevo reset
              </button>
              <button onClick={() => navigate('/admin/dashboard')} style={{ ...BTN_GHOST, background: '#334155', color: '#f8fafc', border: 'none' }}>
                Ir al Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
