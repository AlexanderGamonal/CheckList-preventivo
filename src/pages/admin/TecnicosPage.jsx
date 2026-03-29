import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import Toast from '../../components/Toast.jsx';

const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #334155' };
const TD = { padding: '10px 14px', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid #0f172a' };
const INP_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #334155', background: '#0f172a',
  color: '#f8fafc', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const LABEL_STYLE = { display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' };

const EMPTY_FORM = { nombre: '', num_interno: '' };

export default function TecnicosPage() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);
  const [toast, setToast] = useState(null);

  // --- Import state ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState('pick');
  const [importRows, setImportRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importFileError, setImportFileError] = useState('');
  const importFileRef = useRef(null);

  useEffect(() => { loadTecnicos(); }, []);

  async function loadTecnicos() {
    setLoading(true);
    const { data } = await supabase
      .from('tecnicos')
      .select('id, nombre, num_interno, activo, created_at')
      .order('nombre');
    setTecnicos(data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditRow(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(tec) {
    setEditRow(tec);
    setForm({ nombre: tec.nombre, num_interno: tec.num_interno });
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditRow(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  async function handleSave() {
    const { nombre, num_interno } = form;
    if (!nombre.trim() || !num_interno.trim()) {
      setError('Nombre y número interno son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { nombre: nombre.trim(), num_interno: num_interno.trim().toUpperCase() };
    let res;
    if (editRow) {
      res = await supabase.from('tecnicos').update(payload).eq('id', editRow.id);
    } else {
      res = await supabase.from('tecnicos').insert(payload);
    }
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    closeModal();
    setToast({ msg: editRow ? 'Técnico actualizado correctamente' : 'Técnico creado correctamente', type: 'ok' });
    loadTecnicos();
  }

  async function handleToggleActivo(tec) {
    const accion = tec.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Confirmar ${accion} al técnico ${tec.nombre}?`)) return;
    setTogglingId(tec.id);
    await supabase.from('tecnicos').update({ activo: !tec.activo }).eq('id', tec.id);
    setTogglingId(null);
    setToast({ msg: `${tec.nombre} ${tec.activo ? 'desactivado' : 'activado'}`, type: 'ok' });
    loadTecnicos();
  }

  function formatDate(dt) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Import functions ──────────────────────────────────────────
  function openImportModal() {
    setImportStep('pick');
    setImportRows([]);
    setImportResults(null);
    setImportFileError('');
    setShowImportModal(true);
    setTimeout(() => importFileRef.current?.click(), 100);
  }

  function closeImportModal() {
    setShowImportModal(false);
    setImportRows([]);
    setImportResults(null);
    setImportFileError('');
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

      if (raw.length === 0) {
        setImportFileError('El archivo no contiene filas de datos.');
        return;
      }

      const rows = raw.map(r => {
        const n = {};
        Object.keys(r).forEach(k => { n[k.trim().toLowerCase()] = String(r[k]).trim(); });
        return n;
      }).filter(r => r.num_interno || r.nombre);

      const seenNums = new Set();
      const validated = rows.map(row => {
        const num = (row.num_interno || '').toUpperCase();
        const nombre = row.nombre || '';
        if (!num || !nombre) return { ...row, num_interno: num, nombre, _valid: false, _error: 'Faltan campos' };
        if (seenNums.has(num)) return { ...row, num_interno: num, nombre, _valid: false, _error: 'Num. interno duplicado en el archivo' };
        seenNums.add(num);
        return { num_interno: num, nombre, _valid: true, _error: '' };
      });

      setImportRows(validated);
      setImportStep('preview');
    } catch {
      setImportFileError('No se pudo leer el archivo. Verifique que sea un .xlsx o .csv válido.');
    }
  }

  async function handleConfirmImport() {
    const valid = importRows.filter(r => r._valid);
    if (valid.length === 0) return;
    setImporting(true);
    const results = { ok: 0, errors: [] };
    for (let i = 0; i < valid.length; i++) {
      const { num_interno, nombre } = valid[i];
      const { error } = await supabase.from('tecnicos').insert({ nombre, num_interno });
      if (error) results.errors.push({ num_interno, msg: error.message });
      else results.ok++;
    }
    setImportResults(results);
    setImportStep('results');
    setImporting(false);
  }

  function handleImportClose() {
    closeImportModal();
    loadTecnicos();
  }

  const filtered = tecnicos.filter(t =>
    t.nombre.toLowerCase().includes(search.toLowerCase()) ||
    t.num_interno.toLowerCase().includes(search.toLowerCase())
  );

  const validCount = importRows.filter(r => r._valid).length;
  const errorCount = importRows.filter(r => !r._valid).length;

  return (
    <AdminLayout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Tecnicos</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Gestion del personal tecnico</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={openImportModal}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #334155', background: '#0f172a', color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Importar CSV/Excel
          </button>
          <button
            onClick={openCreate}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            + Nuevo Tecnico
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar por nombre o numero interno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...INP_STYLE, maxWidth: 360, background: '#1e293b', border: '1px solid #334155' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              {['Nombre', 'Num. Interno', 'Activo', 'Registrado', 'Acciones'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ ...TD, textAlign: 'center', paddingTop: 32, paddingBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <span style={{ color: '#64748b', fontSize: 13 }}>Cargando...</span>
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#64748b', paddingTop: 32, paddingBottom: 32 }}>Sin resultados — intenta con otro término de búsqueda</td></tr>
            ) : filtered.map(t => (
              <tr
                key={t.id}
                onMouseEnter={() => setHoveredRow(t.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ opacity: t.activo ? 1 : 0.5, background: hoveredRow === t.id ? '#263548' : 'transparent', transition: 'background 0.15s' }}
              >
                <td style={{ ...TD, fontWeight: 600 }}>{t.nombre}</td>
                <td style={{ ...TD, color: '#60a5fa', fontFamily: 'monospace' }}>{t.num_interno}</td>
                <td style={TD}>
                  <span style={{ color: t.activo ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 12 }}>
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ ...TD, color: '#64748b', fontSize: 12 }}>{formatDate(t.created_at)}</td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(t)}
                      style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#334155', color: '#e2e8f0', fontSize: 12, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#475569'}
                      onMouseLeave={e => e.currentTarget.style.background = '#334155'}
                    >Editar</button>
                    <button onClick={() => handleToggleActivo(t)} disabled={togglingId === t.id}
                      style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: t.activo ? '#7f1d1d' : '#14532d', color: t.activo ? '#fca5a5' : '#86efac', fontSize: 12, cursor: togglingId === t.id ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s' }}
                    >
                      {togglingId === t.id ? '...' : t.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
              {editRow ? 'Editar Tecnico' : 'Nuevo Tecnico'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>Nombre completo</label>
                <input type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Carlos Ramirez Torres" style={INP_STYLE} autoFocus />
              </div>
              <div>
                <label style={LABEL_STYLE}>Número interno</label>
                <input type="text" value={form.num_interno} onChange={e => setForm(p => ({ ...p, num_interno: e.target.value }))} placeholder="Ej: TEC-006" style={INP_STYLE} />
              </div>
            </div>
            {error && <div style={{ color: '#f87171', fontSize: 12, marginTop: 16 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: saving ? '#334155' : '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : editRow ? 'Guardar cambios' : 'Crear Tecnico'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, width: '100%', maxWidth: importStep === 'preview' ? 560 : 440, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>

            {importStep === 'pick' && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Importar Tecnicos</h2>
                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Columnas requeridas en el archivo:</p>
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
                  {[
                    { col: 'num_interno', desc: 'Número único del técnico (se convierte a mayúsculas)' },
                    { col: 'nombre',      desc: 'Nombre completo del técnico' },
                  ].map(({ col, desc }) => (
                    <div key={col} style={{ display: 'flex', gap: 12, marginBottom: 4, alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'monospace', color: '#60a5fa', minWidth: 110, flexShrink: 0 }}>{col}</span>
                      <span style={{ color: '#94a3b8' }}>{desc}</span>
                    </div>
                  ))}
                </div>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 20 }}>Formatos aceptados: .xlsx, .xls, .csv</p>
                {importFileError && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 16 }}>{importFileError}</div>}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={closeImportModal} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={() => importFileRef.current?.click()} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Seleccionar archivo
                  </button>
                </div>
              </>
            )}

            {importStep === 'preview' && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Vista previa</h2>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>{validCount} listos</span>
                  {errorCount > 0 && <span style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>{errorCount} con errores (se omitirán)</span>}
                </div>
                <div style={{ maxHeight: 340, overflowY: 'auto', borderRadius: 8, border: '1px solid #334155' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Num. Interno', 'Nombre', 'Estado'].map(h => <th key={h} style={{ ...TH, position: 'sticky', top: 0, background: '#0f172a' }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((r, i) => (
                        <tr key={i} style={{ background: r._valid ? 'transparent' : 'rgba(239,68,68,0.08)' }}>
                          <td style={{ ...TD, fontFamily: 'monospace', color: '#60a5fa' }}>{r.num_interno}</td>
                          <td style={TD}>{r.nombre}</td>
                          <td style={{ ...TD, color: r._valid ? '#22c55e' : '#f87171', fontSize: 11 }}>{r._valid ? 'OK' : r._error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                  <button onClick={closeImportModal} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleConfirmImport} disabled={importing || validCount === 0} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: importing || validCount === 0 ? '#334155' : '#3b82f6', color: importing || validCount === 0 ? '#64748b' : '#fff', fontSize: 13, fontWeight: 700, cursor: importing || validCount === 0 ? 'not-allowed' : 'pointer' }}>
                    {importing ? 'Importando...' : `Importar ${validCount} técnicos`}
                  </button>
                </div>
              </>
            )}

            {importStep === 'results' && importResults && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Importación completada</h2>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: '#22c55e', fontSize: 15, fontWeight: 700 }}>{importResults.ok} técnicos importados</span>
                </div>
                {importResults.errors.length > 0 && (
                  <>
                    <div style={{ color: '#f87171', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{importResults.errors.length} errores:</div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0f172a', borderRadius: 8, padding: 12 }}>
                      {importResults.errors.map((e, i) => (
                        <div key={i} style={{ color: '#fca5a5', fontSize: 11, marginBottom: 4 }}>
                          <strong>{e.num_interno}</strong>: {e.msg}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button onClick={handleImportClose} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImportFile} />
    </AdminLayout>
  );
}
