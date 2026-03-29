import React, { useState, useEffect } from 'react';
import AdminLayout from '../../admin/AdminLayout.jsx';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../hooks/useAuth.js';

const TH = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #334155', whiteSpace: 'nowrap' };
const TD = { padding: '10px 14px', fontSize: 13, color: '#e2e8f0' };
const INPUT = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const BTN_PRIMARY = { padding: '9px 20px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' };
const BTN_GHOST = { padding: '6px 14px', borderRadius: 6, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' };

const ROL_COLOR = { superadmin: '#f59e0b', admin: '#22c55e' };
const ROL_LABEL = { superadmin: 'Superadmin', admin: 'Admin' };

function RolBadge({ role }) {
  const color = ROL_COLOR[role] || '#64748b';
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: color + '22', color, border: `1px solid ${color}44` }}>
      {ROL_LABEL[role] || role || 'Sin rol'}
    </span>
  );
}

async function callManageUsers(body) {
  // Usar fetch directo para control total de headers
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Sin sesión activa');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/functions/v1/manage-users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
  return json;
}

export default function UsuariosPage() {
  const { session } = useAuth();
  const currentUserId = session?.user?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal invitar
  const [showModal, setShowModal] = useState(false);
  const [invEmail, setInvEmail] = useState('');
  const [invRole, setInvRole] = useState('admin');
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState('');

  // Cambio de rol en tabla
  const [rolLoading, setRolLoading] = useState(null);

  // Eliminar
  const [deleteId, setDeleteId] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  const [toast, setToast] = useState('');

  useEffect(() => { if (session) loadUsers(); }, [session]);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const data = await callManageUsers({ action: 'list' });
      const sorted = (data.users || []).sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return (a.email || '').localeCompare(b.email || '');
      });
      setUsers(sorted);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleInvite(e) {
    e.preventDefault();
    setInvError('');
    setInvLoading(true);
    try {
      await callManageUsers({ action: 'invite', email: invEmail.trim(), role: invRole });
      showToast(`✓ Invitación enviada a ${invEmail.trim()}`);
      setShowModal(false);
      setInvEmail('');
      setInvRole('admin');
      loadUsers();
    } catch (e) {
      setInvError(e.message);
    } finally {
      setInvLoading(false);
    }
  }

  async function handleRolChange(userId, newRole) {
    setRolLoading(userId);
    try {
      await callManageUsers({ action: 'update_role', userId, role: newRole });
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, user_metadata: { ...u.user_metadata, role: newRole } }
        : u
      ));
      showToast('✓ Rol actualizado');
    } catch (e) {
      showToast('Error: ' + e.message);
    } finally {
      setRolLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDelLoading(true);
    try {
      await callManageUsers({ action: 'delete', userId: deleteId });
      setUsers(prev => prev.filter(u => u.id !== deleteId));
      showToast('✓ Usuario eliminado');
      setDeleteId(null);
    } catch (e) {
      showToast('Error: ' + e.message);
      setDeleteId(null);
    } finally {
      setDelLoading(false);
    }
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Usuarios Admin</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Gestión de accesos al panel de administración</p>
        </div>
        <button onClick={() => { setShowModal(true); setInvError(''); }} style={BTN_PRIMARY}>
          + Invitar usuario
        </button>
      </div>

      {toast && (
        <div style={{ marginBottom: 16, padding: '8px 14px', borderRadius: 8, background: '#0f2018', color: '#10b981', fontSize: 13, fontWeight: 600 }}>
          {toast}
        </div>
      )}

      {/* Roles legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ padding: '6px 14px', borderRadius: 8, background: '#f59e0b15', border: '1px solid #f59e0b33', fontSize: 12, color: '#94a3b8' }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>Superadmin</span> — Acceso total: ATMs, técnicos, usuarios, contactos
        </div>
        <div style={{ padding: '6px 14px', borderRadius: 8, background: '#22c55e15', border: '1px solid #22c55e33', fontSize: 12, color: '#94a3b8' }}>
          <span style={{ color: '#22c55e', fontWeight: 700 }}>Admin</span> — Solo ver mantenimientos y exportar CSV
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#1e293b', borderRadius: 12, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              {['Email', 'Rol', 'Estado', 'Creado', 'Último acceso', 'Acciones'].map(h => (
                <th key={h} style={TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#64748b', padding: 40 }}>Cargando...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#ef4444', padding: 40 }}>{error}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ ...TD, textAlign: 'center', color: '#64748b', padding: 40 }}>No hay usuarios</td></tr>
            ) : users.map((u, i) => {
              const role = u.user_metadata?.role;
              const isSelf = u.id === currentUserId;
              const confirmed = !!u.email_confirmed_at;
              const rowBg = i % 2 === 0 ? '#1e293b' : '#172033';
              return (
                <tr key={u.id} style={{ background: rowBg }}>
                  <td style={TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>
                        {(u.email || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#f8fafc' }}>{u.email}</div>
                        {isSelf && <div style={{ fontSize: 10, color: '#3b82f6', fontWeight: 700 }}>Tú</div>}
                      </div>
                    </div>
                  </td>
                  <td style={TD}>
                    {isSelf ? (
                      <RolBadge role={role} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select
                          value={role || ''}
                          onChange={e => handleRolChange(u.id, e.target.value)}
                          disabled={rolLoading === u.id}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12, cursor: 'pointer' }}
                        >
                          <option value="">Sin rol</option>
                          <option value="admin">Admin</option>
                          <option value="superadmin">Superadmin</option>
                        </select>
                        {rolLoading === u.id && <span style={{ color: '#64748b', fontSize: 11 }}>...</span>}
                      </div>
                    )}
                  </td>
                  <td style={TD}>
                    {confirmed
                      ? <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>● Activo</span>
                      : <span style={{ color: '#f59e0b', fontSize: 12, fontWeight: 600 }}>◌ Pendiente</span>
                    }
                  </td>
                  <td style={{ ...TD, color: '#64748b', fontSize: 12 }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('es') : '—'}
                  </td>
                  <td style={{ ...TD, color: '#64748b', fontSize: 12 }}>
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('es') : '—'}
                  </td>
                  <td style={TD}>
                    {!isSelf && (
                      <button
                        onClick={() => setDeleteId(u.id)}
                        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #ef444433', background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal — Invitar usuario */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Invitar usuario</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
              Se enviará un correo con un enlace para que el usuario establezca su contraseña.
            </p>
            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Email</label>
                <input
                  type="email" required autoFocus
                  value={invEmail} onChange={e => setInvEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  style={INPUT}
                />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Rol</label>
                <select value={invRole} onChange={e => setInvRole(e.target.value)}
                  style={{ ...INPUT, cursor: 'pointer' }}
                >
                  <option value="admin">Admin — solo lectura</option>
                  <option value="superadmin">Superadmin — acceso total</option>
                </select>
                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#0f172a', fontSize: 12, color: '#64748b' }}>
                  {invRole === 'admin'
                    ? 'Puede ver mantenimientos y exportar CSV. No puede crear ATMs, técnicos ni usuarios.'
                    : 'Acceso total al panel: puede crear/editar ATMs, técnicos, contactos y gestionar usuarios.'}
                </div>
              </div>
              {invError && <div style={{ marginBottom: 16, color: '#ef4444', fontSize: 13 }}>{invError}</div>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={BTN_GHOST}>
                  Cancelar
                </button>
                <button type="submit" disabled={invLoading} style={BTN_PRIMARY}>
                  {invLoading ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Confirmar eliminación */}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
          <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color: '#f8fafc', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Eliminar usuario</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>
              {users.find(u => u.id === deleteId)?.email}
            </p>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
              Esta acción es irreversible. El usuario perderá acceso inmediatamente.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={BTN_GHOST} disabled={delLoading}>
                Cancelar
              </button>
              <button
                onClick={handleDelete} disabled={delLoading}
                style={{ ...BTN_PRIMARY, background: '#ef4444' }}
              >
                {delLoading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
