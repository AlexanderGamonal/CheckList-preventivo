import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import { EMAIL_GRUPOS, EMAIL_GRUPO_LABEL, EMAIL_GRUPO_COLOR } from '../../constants/emailGrupos.js';

const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #334155' };
const TD = { padding: '10px 14px', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid #0f172a' };
const INP_STYLE = {
  width: '100%', padding: '9px 12px', borderRadius: 8,
  border: '1.5px solid #334155', background: '#0f172a',
  color: '#f8fafc', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const LABEL_STYLE = { display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' };

const EMPTY_FORM = { nombre: '', email: '', grupos: ['atm_bbva'] };

export default function ContactosEmailPage() {
  const isMobile = useIsMobile();
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');

  useEffect(() => { loadContactos(); }, []);

  async function loadContactos() {
    setLoading(true);
    const { data } = await supabase
      .from('email_contactos')
      .select('id, nombre, email, activo, grupos')
      .order('nombre');
    setContactos(data || []);
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function openCreate() {
    setEditRow(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowModal(true);
  }

  function openEdit(c) {
    setEditRow(c);
    setForm({ nombre: c.nombre, email: c.email, grupos: c.grupos?.length ? c.grupos : ['atm_bbva'] });
    setError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditRow(null);
    setForm(EMPTY_FORM);
    setError('');
  }

  function toggleGrupo(key) {
    setForm(p => ({
      ...p,
      grupos: p.grupos.includes(key) ? p.grupos.filter(g => g !== key) : [...p.grupos, key],
    }));
  }

  async function handleSave() {
    const { nombre, email, grupos } = form;
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingrese un email valido.');
      return;
    }
    if (!grupos || grupos.length === 0) {
      setError('Seleccione al menos un grupo.');
      return;
    }
    setSaving(true);
    setError('');
    const payload = { nombre: nombre.trim(), email: email.trim().toLowerCase(), grupos };
    let res;
    if (editRow) {
      res = await supabase.from('email_contactos').update(payload).eq('id', editRow.id);
    } else {
      res = await supabase.from('email_contactos').insert(payload);
    }
    setSaving(false);
    if (res.error) {
      if (res.error.code === '23505') {
        setError('Ese email ya existe en la lista.');
      } else {
        setError(res.error.message);
      }
      return;
    }
    closeModal();
    showToast(editRow ? 'Contacto actualizado correctamente.' : 'Contacto creado correctamente.');
    loadContactos();
  }

  async function handleToggleActivo(c) {
    setTogglingId(c.id);
    const { error } = await supabase
      .from('email_contactos')
      .update({ activo: !c.activo })
      .eq('id', c.id);
    setTogglingId(null);
    if (error) {
      showToast('Error al actualizar el contacto.');
    } else {
      showToast(`Contacto ${!c.activo ? 'activado' : 'desactivado'} correctamente.`);
      loadContactos();
    }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Eliminar el contacto "${c.nombre}" (${c.email})? Esta accion no se puede deshacer.`)) return;
    setDeletingId(c.id);
    const { error } = await supabase.from('email_contactos').delete().eq('id', c.id);
    setDeletingId(null);
    if (error) {
      showToast('Error al eliminar el contacto.');
    } else {
      showToast('Contacto eliminado.');
      loadContactos();
    }
  }

  const filtrados = useMemo(() => (
    filtroGrupo ? contactos.filter(c => (c.grupos || []).includes(filtroGrupo)) : contactos
  ), [contactos, filtroGrupo]);

  const activeCount = filtrados.filter(c => c.activo).length;

  const countsPorGrupo = useMemo(() => {
    const acc = {};
    EMAIL_GRUPOS.forEach(g => { acc[g.key] = 0; });
    contactos.forEach(c => {
      if (!c.activo) return;
      (c.grupos || []).forEach(g => { if (acc[g] !== undefined) acc[g]++; });
    });
    return acc;
  }, [contactos]);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Contactos Email</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
            Destinatarios para notificaciones — separados por grupo (BBVA, Scotiabank, JV LATM, C2D)
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          + Nuevo Contacto
        </button>
      </div>

      {/* KPIs por grupo */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          {EMAIL_GRUPOS.map(g => (
            <button
              key={g.key}
              onClick={() => setFiltroGrupo(filtroGrupo === g.key ? '' : g.key)}
              style={{
                padding: '14px 16px', borderRadius: 12, textAlign: 'left', cursor: 'pointer',
                background: filtroGrupo === g.key ? g.color + '22' : '#1e293b',
                border: `1.5px solid ${filtroGrupo === g.key ? g.color : '#334155'}`,
                borderLeft: `4px solid ${g.color}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ color: g.color, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{g.label}</div>
              <div style={{ color: '#f8fafc', fontSize: 26, fontWeight: 800, marginTop: 4 }}>{countsPorGrupo[g.key]}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{g.description}</div>
            </button>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div style={{ background: '#1e293b', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ color: '#64748b', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Filtro:</span>
        <button
          onClick={() => setFiltroGrupo('')}
          style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            border: '1px solid #334155',
            background: !filtroGrupo ? '#3b82f6' : 'transparent',
            color: !filtroGrupo ? '#fff' : '#94a3b8',
          }}
        >
          Todos ({contactos.length})
        </button>
        {EMAIL_GRUPOS.map(g => (
          <button
            key={g.key}
            onClick={() => setFiltroGrupo(g.key)}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: '1px solid ' + (filtroGrupo === g.key ? g.color : '#334155'),
              background: filtroGrupo === g.key ? g.color : 'transparent',
              color: filtroGrupo === g.key ? '#fff' : '#94a3b8',
            }}
          >
            {g.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 12 }}>
          {activeCount} activo{activeCount !== 1 ? 's' : ''}
        </span>
      </div>

      {toast && (
        <div style={{ marginBottom: 16, padding: '10px 16px', background: '#1e293b', borderRadius: 8, color: '#10b981', fontSize: 13, borderLeft: '3px solid #10b981' }}>
          {toast}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              {['Nombre', 'Email', 'Grupos', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#64748b' }}>Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ ...TD, textAlign: 'center', color: '#64748b', padding: '32px 14px' }}>
                  {filtroGrupo
                    ? `No hay contactos en el grupo "${EMAIL_GRUPO_LABEL[filtroGrupo]}".`
                    : 'No hay contactos configurados. Agrega el primero.'}
                </td>
              </tr>
            ) : filtrados.map(c => (
              <tr key={c.id} style={{ opacity: c.activo ? 1 : 0.5 }}>
                <td style={{ ...TD, fontWeight: 600 }}>{c.nombre}</td>
                <td style={{ ...TD, color: '#60a5fa', fontFamily: 'monospace' }}>{c.email}</td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(c.grupos || []).map(g => (
                      <span key={g} style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                        background: (EMAIL_GRUPO_COLOR[g] || '#334155') + '22',
                        color: EMAIL_GRUPO_COLOR[g] || '#94a3b8',
                        border: `1px solid ${EMAIL_GRUPO_COLOR[g] || '#334155'}`,
                      }}>
                        {EMAIL_GRUPO_LABEL[g] || g}
                      </span>
                    ))}
                    {(!c.grupos || c.grupos.length === 0) && (
                      <span style={{ color: '#64748b', fontSize: 11 }}>—</span>
                    )}
                  </div>
                </td>
                <td style={TD}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: c.activo ? '#14532d' : '#1e293b',
                    color: c.activo ? '#86efac' : '#64748b',
                    border: c.activo ? 'none' : '1px solid #334155',
                  }}>
                    {c.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={TD}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openEdit(c)}
                      style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#334155', color: '#e2e8f0', fontSize: 12, cursor: 'pointer' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggleActivo(c)}
                      disabled={togglingId === c.id}
                      style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: c.activo ? '#7f1d1d' : '#14532d', color: c.activo ? '#fca5a5' : '#86efac', fontSize: 12, cursor: 'pointer' }}
                    >
                      {togglingId === c.id ? '...' : c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      disabled={deletingId === c.id}
                      style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #7f1d1d', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}
                    >
                      {deletingId === c.id ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, padding: isMobile ? 20 : 32, width: '100%', maxWidth: 480,
            boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
          }}>
            <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 24 }}>
              {editRow ? 'Editar Contacto' : 'Nuevo Contacto'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>Nombre / Descripcion</label>
                <input
                  type="text" value={form.nombre}
                  onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Coordinacion ATM"
                  style={INP_STYLE}
                  autoFocus
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Email</label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="Ej: coordinacion@empresa.com"
                  style={INP_STYLE}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Grupos * (recibirá correos de:)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {EMAIL_GRUPOS.map(g => (
                    <label
                      key={g.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        padding: '9px 12px', borderRadius: 8,
                        background: form.grupos.includes(g.key) ? g.color + '18' : '#0f172a',
                        border: `1px solid ${form.grupos.includes(g.key) ? g.color : '#334155'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.grupos.includes(g.key)}
                        onChange={() => toggleGrupo(g.key)}
                        style={{ accentColor: g.color }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: form.grupos.includes(g.key) ? g.color : '#e2e8f0', fontWeight: 700, fontSize: 13 }}>{g.label}</div>
                        <div style={{ color: '#64748b', fontSize: 11 }}>{g.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {error && <div style={{ color: '#f87171', fontSize: 12, marginTop: 16 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                onClick={closeModal}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#334155', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: saving ? '#334155' : '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Guardando...' : editRow ? 'Guardar cambios' : 'Crear Contacto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
