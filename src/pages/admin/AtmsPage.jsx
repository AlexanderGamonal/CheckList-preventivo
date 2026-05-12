import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { supabase } from '../../lib/supabase.js';
import Toast from '../../components/Toast.jsx';
import { clearAtmCache } from '../../hooks/useAtmLookup.js';

const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #334155' };
const TD = { padding: '10px 14px', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid #0f172a' };
const INP_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #334155', background: '#0f172a',
  color: '#f8fafc', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const LABEL_STYLE = { display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' };

const ATM_TIPOS = ['dispensador', 'depositos', 'multifuncion'];
const EMPTY_FORM = { id_atm: '', punto: '', cliente_id: '', marca_id: '', modelo_id: '', atm_tipo: 'dispensador' };

export default function AtmsPage() {
  const isMobile = useIsMobile();
  const [atms, setAtms] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [modelosFiltrados, setModelosFiltrados] = useState([]);
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

  // --- Net/hardware CSV update state ---
  const [showNetModal, setShowNetModal] = useState(false);
  const [netStep, setNetStep] = useState('pick');
  const [netRows, setNetRows] = useState([]);
  const [netUpdating, setNetUpdating] = useState(false);
  const [netResults, setNetResults] = useState(null);
  const netFileRef = useRef(null);

  // --- Import state ---
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState('pick');
  const [importRows, setImportRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [importFileError, setImportFileError] = useState('');
  const importFileRef = useRef(null);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [atmsRes, clientesRes, marcasRes, modelosRes] = await Promise.all([
      supabase.from('atms').select(`
        id, id_atm, punto, atm_tipo, activo,
        clientes(id, nombre),
        marcas(id, nombre),
        modelos(id, nombre)
      `).order('id_atm'),
      supabase.from('clientes').select('id, nombre').order('nombre'),
      supabase.from('marcas').select('id, nombre').order('nombre'),
      supabase.from('modelos').select('id, nombre, marca_id').order('nombre'),
    ]);
    setAtms(atmsRes.data || []);
    setClientes(clientesRes.data || []);
    setMarcas(marcasRes.data || []);
    setModelos(modelosRes.data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (form.marca_id) {
      setModelosFiltrados(modelos.filter(m => String(m.marca_id) === String(form.marca_id)));
    } else {
      setModelosFiltrados([]);
    }
  }, [form.marca_id, modelos]);

  function openCreate() { setEditRow(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); }

  function openEdit(atm) {
    setEditRow(atm);
    setForm({
      id_atm:     atm.id_atm,
      punto:      atm.punto,
      cliente_id: String(atm.clientes?.id || ''),
      marca_id:   String(atm.marcas?.id || ''),
      modelo_id:  String(atm.modelos?.id || ''),
      atm_tipo:   atm.atm_tipo,
    });
    setError('');
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditRow(null); setForm(EMPTY_FORM); setError(''); }

  function handleFormChange(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'marca_id') next.modelo_id = '';
      return next;
    });
  }

  async function handleSave() {
    const { id_atm, punto, cliente_id, marca_id, modelo_id, atm_tipo } = form;
    if (!id_atm.trim() || !punto.trim() || !cliente_id || !marca_id || !modelo_id || !atm_tipo) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { id_atm: id_atm.trim().toUpperCase(), punto: punto.trim(), cliente_id: Number(cliente_id), marca_id: Number(marca_id), modelo_id: Number(modelo_id), atm_tipo };
    let res;
    if (editRow) {
      res = await supabase.from('atms').update(payload).eq('id', editRow.id);
    } else {
      res = await supabase.from('atms').insert(payload);
    }
    setSaving(false);
    if (res.error) { setError(res.error.message); return; }
    closeModal();
    setToast({ msg: editRow ? 'ATM actualizado correctamente' : 'ATM creado correctamente', type: 'ok' });
    loadAll();
  }

  async function handleToggleActivo(atm) {
    const accion = atm.activo ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Confirmar ${accion} el ATM ${atm.id_atm}?`)) return;
    setTogglingId(atm.id);
    await supabase.from('atms').update({ activo: !atm.activo }).eq('id', atm.id);
    setTogglingId(null);
    setToast({ msg: `ATM ${atm.id_atm} ${atm.activo ? 'desactivado' : 'activado'}`, type: 'ok' });
    loadAll();
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

      if (raw.length === 0) { setImportFileError('El archivo no contiene filas de datos.'); return; }

      // Normalize keys to lowercase + trim, coerce values to string
      const rows = raw.map(r => {
        const n = {};
        Object.keys(r).forEach(k => { n[k.trim().toLowerCase()] = String(r[k]).trim(); });
        return n;
      }).filter(r => r.cliente || r.id_atm || r.punto || r.marca || r.modelo || r.tipo);

      const seenIds = new Set();
      const validated = rows.map(row => {
        const id_atm  = (row.id_atm  || '').toUpperCase();
        const cliente = (row.cliente || '').trim();
        const punto   = (row.punto   || '').trim();
        const marca   = (row.marca   || '').trim();
        const modelo  = (row.modelo  || '').trim();
        const tipo    = (row.tipo    || '').trim().toLowerCase();

        const missing = [!id_atm && 'id_atm', !cliente && 'cliente', !punto && 'punto', !marca && 'marca', !modelo && 'modelo', !tipo && 'tipo'].filter(Boolean);
        if (missing.length > 0) return { id_atm, cliente, punto, marca, modelo, tipo, _valid: false, _error: `Faltan: ${missing.join(', ')}` };
        if (!ATM_TIPOS.includes(tipo)) return { id_atm, cliente, punto, marca, modelo, tipo, _valid: false, _error: `Tipo inválido: "${tipo}"` };
        if (seenIds.has(id_atm)) return { id_atm, cliente, punto, marca, modelo, tipo, _valid: false, _error: 'id_atm duplicado en el archivo' };
        seenIds.add(id_atm);
        return { id_atm, cliente, punto, marca, modelo, tipo, _valid: true, _error: '' };
      });

      setImportRows(validated);
      setImportStep('preview');
    } catch {
      setImportFileError('No se pudo leer el archivo. Verifique que sea un .xlsx o .csv válido.');
    }
  }

  async function resolveAtmForeignKeys(validRows, currentClientes, currentMarcas, currentModelos) {
    // Build lookup maps (lowercase key → id)
    const clienteMap = new Map(currentClientes.map(c => [c.nombre.toLowerCase(), c.id]));
    const marcaMap   = new Map(currentMarcas.map(m => [m.nombre.toLowerCase(), m.id]));
    const modeloMap  = new Map(currentModelos.map(m => {
      const marcaNombre = currentMarcas.find(mk => mk.id === m.marca_id)?.nombre ?? '';
      return [`${marcaNombre.toLowerCase()}|||${m.nombre.toLowerCase()}`, m.id];
    }));

    // Collect missing entities
    const missingClientes = new Set();
    const missingMarcas   = new Set();
    validRows.forEach(r => {
      if (!clienteMap.has(r.cliente.toLowerCase())) missingClientes.add(r.cliente);
      if (!marcaMap.has(r.marca.toLowerCase()))     missingMarcas.add(r.marca);
    });

    // Insert missing clientes
    for (const nombre of missingClientes) {
      const { data, error } = await supabase.from('clientes').insert({ nombre }).select('id').single();
      if (error) throw new Error(`No se pudo crear cliente "${nombre}": ${error.message}`);
      clienteMap.set(nombre.toLowerCase(), data.id);
    }

    // Insert missing marcas
    for (const nombre of missingMarcas) {
      const { data, error } = await supabase.from('marcas').insert({ nombre }).select('id').single();
      if (error) throw new Error(`No se pudo crear marca "${nombre}": ${error.message}`);
      marcaMap.set(nombre.toLowerCase(), data.id);
    }

    // Collect and insert missing modelos
    const missingModelos = new Map();
    validRows.forEach(r => {
      const key = `${r.marca.toLowerCase()}|||${r.modelo.toLowerCase()}`;
      if (!modeloMap.has(key)) missingModelos.set(key, { marca: r.marca, modelo: r.modelo });
    });
    for (const [key, { marca, modelo }] of missingModelos) {
      const marca_id = marcaMap.get(marca.toLowerCase());
      const { data, error } = await supabase.from('modelos').insert({ nombre: modelo, marca_id }).select('id').single();
      if (error) throw new Error(`No se pudo crear modelo "${modelo}": ${error.message}`);
      modeloMap.set(key, data.id);
    }

    return { clienteMap, marcaMap, modeloMap };
  }

  async function handleConfirmImport() {
    const valid = importRows.filter(r => r._valid);
    if (valid.length === 0) return;
    setImporting(true);
    const results = { ok: 0, errors: [] };

    try {
      // Take a snapshot of current lookup state for FK resolution
      const [clientesSnap, marcasSnap, modelosSnap] = await Promise.all([
        supabase.from('clientes').select('id, nombre').then(r => r.data || []),
        supabase.from('marcas').select('id, nombre').then(r => r.data || []),
        supabase.from('modelos').select('id, nombre, marca_id').then(r => r.data || []),
      ]);

      const { clienteMap, marcaMap, modeloMap } = await resolveAtmForeignKeys(valid, clientesSnap, marcasSnap, modelosSnap);

      for (let i = 0; i < valid.length; i++) {
        const r = valid[i];
        const payload = {
          id_atm:     r.id_atm,
          punto:      r.punto,
          atm_tipo:   r.tipo,
          cliente_id: clienteMap.get(r.cliente.toLowerCase()),
          marca_id:   marcaMap.get(r.marca.toLowerCase()),
          modelo_id:  modeloMap.get(`${r.marca.toLowerCase()}|||${r.modelo.toLowerCase()}`),
        };
        const { error } = await supabase.from('atms').insert(payload);
        if (error) results.errors.push({ id_atm: r.id_atm, msg: error.message });
        else results.ok++;
      }
    } catch (fkError) {
      results.errors.push({ id_atm: '—', msg: fkError.message });
    }

    setImportResults(results);
    setImportStep('results');
    setImporting(false);
  }

  function handleImportClose() {
    closeImportModal();
    loadAll();
  }

  // ── Net/hardware CSV update ───────────────────────────────────
  function openNetModal() {
    setNetStep('pick');
    setNetRows([]);
    setNetResults(null);
    setShowNetModal(true);
    setTimeout(() => netFileRef.current?.click(), 100);
  }

  async function handleNetFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const rows = lines.slice(1).map(line => {
      const parts = line.split(';');
      return {
        id_atm:       (parts[0] || '').trim().toUpperCase(),
        nro_serie:    (parts[1] || '').trim(),
        ip_equipo:    (parts[2] || '').trim(),
        mascara_red:  (parts[3] || '').trim(),
        gateway:      (parts[4] || '').trim(),
        dns1:         (parts[5] || '').trim(),
        dns2:         (parts[6] || '').trim(),
        cpu_modelo:   (parts[7] || '').trim(),
        software_atm: (parts[8] || '').trim(),
        direccion:    parts.slice(9).join(';').trim(),
      };
    }).filter(r => r.id_atm);
    setNetRows(rows);
    setNetStep('preview');
  }

  async function handleNetConfirm() {
    setNetUpdating(true);
    const results = { ok: 0, skipped: 0, errors: [] };
    const BATCH = 20;
    for (let i = 0; i < netRows.length; i += BATCH) {
      await Promise.all(netRows.slice(i, i + BATCH).map(async r => {
        const { error } = await supabase.from('atms').update({
          nro_serie:    r.nro_serie    || null,
          ip_equipo:    r.ip_equipo    || null,
          mascara_red:  r.mascara_red  || null,
          gateway:      r.gateway      || null,
          dns1:         r.dns1         || null,
          dns2:         r.dns2         || null,
          cpu_modelo:   r.cpu_modelo   || null,
          software_atm: r.software_atm || null,
          direccion:    r.direccion    || null,
        }).eq('id_atm', r.id_atm);
        if (error) {
          if (error.code === '42703') {
            results.errors.push({ id_atm: r.id_atm, msg: '⚠ Columnas no encontradas — ejecuta primero el ALTER TABLE en SQL Editor' });
          } else {
            results.errors.push({ id_atm: r.id_atm, msg: error.message });
          }
        } else {
          results.ok++;
        }
      }));
    }
    clearAtmCache();
    setNetResults(results);
    setNetStep('results');
    setNetUpdating(false);
  }

  const filtered = atms.filter(a =>
    a.id_atm.toLowerCase().includes(search.toLowerCase()) ||
    a.punto.toLowerCase().includes(search.toLowerCase())
  );

  const validCount = importRows.filter(r => r._valid).length;
  const errorCount = importRows.filter(r => !r._valid).length;

  return (
    <AdminLayout>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>ATMs</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Gestion de cajeros automaticos</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={openNetModal}
            style={{ padding: '9px 18px', borderRadius: 8, border: '1.5px solid #1d4ed8', background: '#1e3a5f', color: '#93c5fd', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Actualizar datos de red
          </button>
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
            + Nuevo ATM
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Buscar por ID o punto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...INP_STYLE, maxWidth: 360, background: '#1e293b', border: '1px solid #334155' }}
        />
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              {['ID ATM', 'Punto', 'Cliente', 'Marca', 'Modelo', 'Tipo', 'Activo', 'Acciones'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ ...TD, textAlign: 'center', paddingTop: 32, paddingBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div style={{ width: 18, height: 18, border: '2px solid #334155', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    <span style={{ color: '#64748b', fontSize: 13 }}>Cargando...</span>
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ ...TD, textAlign: 'center', color: '#64748b', paddingTop: 32, paddingBottom: 32 }}>Sin resultados — intenta con otro término de búsqueda</td></tr>
            ) : filtered.map(a => (
              <tr
                key={a.id}
                onMouseEnter={() => setHoveredRow(a.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{ opacity: a.activo ? 1 : 0.5, background: hoveredRow === a.id ? '#263548' : 'transparent', transition: 'background 0.15s' }}
              >
                <td style={{ ...TD, fontWeight: 700, color: '#60a5fa' }}>{a.id_atm}</td>
                <td style={TD}>{a.punto}</td>
                <td style={TD}>{a.clientes?.nombre || '—'}</td>
                <td style={TD}>{a.marcas?.nombre || '—'}</td>
                <td style={TD}>{a.modelos?.nombre || '—'}</td>
                <td style={TD}>
                  <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 11, background: '#334155', color: '#94a3b8' }}>{a.atm_tipo}</span>
                </td>
                <td style={TD}>
                  <span style={{ color: a.activo ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 12 }}>{a.activo ? 'Si' : 'No'}</span>
                </td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => openEdit(a)} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: '#334155', color: '#e2e8f0', fontSize: 12, cursor: 'pointer', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#475569'}
                      onMouseLeave={e => e.currentTarget.style.background = '#334155'}
                    >Editar</button>
                    <button onClick={() => handleToggleActivo(a)} disabled={togglingId === a.id}
                      style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: a.activo ? '#7f1d1d' : '#14532d', color: a.activo ? '#fca5a5' : '#86efac', fontSize: 12, cursor: togglingId === a.id ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s' }}
                    >
                      {togglingId === a.id ? '...' : a.activo ? 'Desactivar' : 'Activar'}
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
          <div style={{ background: '#1e293b', borderRadius: 16, padding: isMobile ? 20 : 32, width: '100%', maxWidth: 480, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{editRow ? 'Editar ATM' : 'Nuevo ATM'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>ID ATM</label>
                <input type="text" value={form.id_atm} onChange={e => handleFormChange('id_atm', e.target.value)} placeholder="Ej: BBVA-0001" style={INP_STYLE} disabled={!!editRow} />
                {editRow && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>El ID ATM no puede modificarse</div>}
              </div>
              <div>
                <label style={LABEL_STYLE}>Punto / Ubicacion</label>
                <input type="text" value={form.punto} onChange={e => handleFormChange('punto', e.target.value)} placeholder="Ej: BBVA Miraflores" style={INP_STYLE} />
              </div>
              <div>
                <label style={LABEL_STYLE}>Cliente</label>
                <select value={form.cliente_id} onChange={e => handleFormChange('cliente_id', e.target.value)} style={{ ...INP_STYLE, cursor: 'pointer' }}>
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Marca</label>
                <select value={form.marca_id} onChange={e => handleFormChange('marca_id', e.target.value)} style={{ ...INP_STYLE, cursor: 'pointer' }}>
                  <option value="">Seleccionar marca</option>
                  {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Modelo</label>
                <select value={form.modelo_id} onChange={e => handleFormChange('modelo_id', e.target.value)} style={{ ...INP_STYLE, cursor: 'pointer' }} disabled={!form.marca_id}>
                  <option value="">{form.marca_id ? 'Seleccionar modelo' : 'Seleccione marca primero'}</option>
                  {modelosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL_STYLE}>Tipo de ATM</label>
                <select value={form.atm_tipo} onChange={e => handleFormChange('atm_tipo', e.target.value)} style={{ ...INP_STYLE, cursor: 'pointer' }}>
                  {ATM_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {error && <div style={{ color: '#f87171', fontSize: 12, marginTop: 16 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: saving ? '#334155' : '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Guardando...' : editRow ? 'Guardar cambios' : 'Crear ATM'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: isMobile ? 20 : 32, width: '100%', maxWidth: importStep === 'preview' ? 800 : 460, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* STEP: pick */}
            {importStep === 'pick' && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Importar ATMs</h2>
                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 6 }}>Columnas requeridas en el archivo:</p>
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
                  {[
                    { col: 'cliente', desc: 'Nombre del cliente (se crea si no existe)' },
                    { col: 'id_atm',  desc: 'Identificador único del ATM (se convierte a mayúsculas)' },
                    { col: 'punto',   desc: 'Ubicación o nombre del punto de instalación' },
                    { col: 'marca',   desc: 'Marca del ATM (se crea si no existe)' },
                    { col: 'modelo',  desc: 'Modelo del ATM (se crea si no existe)' },
                    { col: 'tipo',    desc: 'dispensador · depositos · multifuncion' },
                  ].map(({ col, desc }) => (
                    <div key={col} style={{ display: 'flex', gap: 12, marginBottom: 4, alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'monospace', color: '#60a5fa', minWidth: 76, flexShrink: 0 }}>{col}</span>
                      <span style={{ color: '#94a3b8' }}>{desc}</span>
                    </div>
                  ))}
                </div>
                <p style={{ color: '#64748b', fontSize: 11, marginBottom: 20 }}>Formatos aceptados: .xlsx, .xls, .csv — Si cliente, marca o modelo no existen, se crearán automáticamente.</p>
                {importFileError && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 16 }}>{importFileError}</div>}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={closeImportModal} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={() => importFileRef.current?.click()} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Seleccionar archivo
                  </button>
                </div>
              </>
            )}

            {/* STEP: preview */}
            {importStep === 'preview' && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Vista previa</h2>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                  <span style={{ color: '#22c55e', fontSize: 13, fontWeight: 600 }}>✓ {validCount} listos</span>
                  {errorCount > 0 && <span style={{ color: '#f87171', fontSize: 13, fontWeight: 600 }}>✗ {errorCount} con errores (se omitirán)</span>}
                </div>
                <div style={{ maxHeight: 380, overflowY: 'auto', borderRadius: 8, border: '1px solid #334155' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Cliente', 'ID ATM', 'Punto', 'Marca', 'Modelo', 'Tipo', 'Estado'].map(h => (
                          <th key={h} style={{ ...TH, position: 'sticky', top: 0, background: '#0f172a', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((r, i) => (
                        <tr key={i} style={{ background: r._valid ? 'transparent' : 'rgba(239,68,68,0.08)' }}>
                          <td style={TD}>{r.cliente}</td>
                          <td style={{ ...TD, fontFamily: 'monospace', color: '#60a5fa' }}>{r.id_atm}</td>
                          <td style={TD}>{r.punto}</td>
                          <td style={TD}>{r.marca}</td>
                          <td style={TD}>{r.modelo}</td>
                          <td style={TD}>{r.tipo}</td>
                          <td style={{ ...TD, color: r._valid ? '#22c55e' : '#f87171', fontSize: 11, whiteSpace: 'nowrap' }}>{r._valid ? 'OK' : r._error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                  <button onClick={closeImportModal} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleConfirmImport} disabled={importing || validCount === 0} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: importing || validCount === 0 ? '#334155' : '#3b82f6', color: importing || validCount === 0 ? '#64748b' : '#fff', fontSize: 13, fontWeight: 700, cursor: importing || validCount === 0 ? 'not-allowed' : 'pointer' }}>
                    {importing ? 'Importando...' : `Importar ${validCount} ATMs`}
                  </button>
                </div>
              </>
            )}

            {/* STEP: results */}
            {importStep === 'results' && importResults && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Importación completada</h2>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: '#22c55e', fontSize: 15, fontWeight: 700 }}>✓ {importResults.ok} ATMs importados</span>
                </div>
                {importResults.errors.length > 0 && (
                  <>
                    <div style={{ color: '#f87171', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>✗ {importResults.errors.length} errores:</div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0f172a', borderRadius: 8, padding: 12 }}>
                      {importResults.errors.map((e, i) => (
                        <div key={i} style={{ color: '#fca5a5', fontSize: 11, marginBottom: 4 }}>
                          <strong>{e.id_atm}</strong>: {e.msg}
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

      {/* Net/hardware CSV update modal */}
      {showNetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: netStep === 'preview' ? 760 : 460, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>

            {netStep === 'pick' && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Actualizar datos de red / hardware</h2>
                <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>Carga el CSV con punto y coma (;) con estas columnas en orden:</p>
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', marginBottom: 10, fontSize: 11, fontFamily: 'monospace', color: '#60a5fa', lineHeight: 1.8 }}>
                  ID ATM · N° SERIE · IP EQUIPO · MASCARA DE RED · GATEWAY · DNS 1 · DNS 2 · CPU · SOFTWARE ATM · DIRECCION
                </div>
                <p style={{ color: '#475569', fontSize: 11, marginBottom: 20 }}>Solo actualiza registros existentes. Los IDs que no estén en la BD se omiten. <strong style={{ color: '#f59e0b' }}>Requiere haber ejecutado el ALTER TABLE en SQL Editor previamente.</strong></p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowNetModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={() => netFileRef.current?.click()} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Seleccionar CSV</button>
                </div>
              </>
            )}

            {netStep === 'preview' && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Vista previa — {netRows.length} registros</h2>
                <div style={{ maxHeight: 380, overflowY: 'auto', borderRadius: 8, border: '1px solid #334155' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['ID ATM', 'N° Serie', 'IP Equipo', 'CPU', 'Software', 'Dirección'].map(h => (
                          <th key={h} style={{ ...TH, position: 'sticky', top: 0, background: '#0f172a', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {netRows.map((r, i) => (
                        <tr key={i}>
                          <td style={{ ...TD, fontFamily: 'monospace', color: '#60a5fa' }}>{r.id_atm}</td>
                          <td style={TD}>{r.nro_serie}</td>
                          <td style={{ ...TD, fontFamily: 'monospace' }}>{r.ip_equipo}</td>
                          <td style={TD}>{r.cpu_modelo}</td>
                          <td style={TD}>{r.software_atm}</td>
                          <td style={{ ...TD, fontSize: 11, color: '#94a3b8', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.direccion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowNetModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={handleNetConfirm} disabled={netUpdating} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: netUpdating ? '#334155' : '#1d4ed8', color: netUpdating ? '#64748b' : '#fff', fontSize: 13, fontWeight: 700, cursor: netUpdating ? 'not-allowed' : 'pointer' }}>
                    {netUpdating ? 'Actualizando...' : `Actualizar ${netRows.length} ATMs`}
                  </button>
                </div>
              </>
            )}

            {netStep === 'results' && netResults && (
              <>
                <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Actualización completada</h2>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: '#22c55e', fontSize: 15, fontWeight: 700 }}>✓ {netResults.ok} ATMs actualizados</span>
                </div>
                {netResults.errors.length > 0 && (
                  <>
                    <div style={{ color: '#f87171', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>✗ {netResults.errors.length} errores:</div>
                    <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0f172a', borderRadius: 8, padding: 12 }}>
                      {netResults.errors.map((e, i) => (
                        <div key={i} style={{ color: '#fca5a5', fontSize: 11, marginBottom: 4 }}>
                          <strong>{e.id_atm}</strong>: {e.msg}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button onClick={() => setShowNetModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cerrar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={importFileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleImportFile} />
      <input ref={netFileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleNetFile} />
    </AdminLayout>
  );
}
