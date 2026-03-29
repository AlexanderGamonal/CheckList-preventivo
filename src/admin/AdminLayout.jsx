import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../hooks/useAuth.js';

const LINKS_ALL = [
  { to: '/admin/dashboard',       label: 'Dashboard' },
  { to: '/admin/mantenimientos',  label: 'Mantenimientos' },
];

const LINKS_SUPERADMIN = [
  { to: '/admin/atms',      label: 'ATMs' },
  { to: '/admin/tecnicos',  label: 'Tecnicos' },
  { to: '/admin/usuarios',  label: 'Usuarios' },
  { to: '/admin/contactos', label: 'Contactos Email' },
  { to: '/admin/reset',     label: '⚠ Reset Datos' },
];

export default function AdminLayout({ children }) {
  const { isSuperadmin, session } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  const links = isSuperadmin ? [...LINKS_ALL, ...LINKS_SUPERADMIN] : LINKS_ALL;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: '#1e293b', display: 'flex', flexDirection: 'column',
        padding: '24px 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>CheckList ATM</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Panel de Administracion</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              style={({ isActive }) => ({
                display: 'block', padding: '9px 20px', fontSize: 13, textDecoration: 'none',
                color: isActive ? '#f8fafc' : '#94a3b8',
                background: isActive ? '#334155' : 'transparent',
                borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #334155' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8, wordBreak: 'break-all' }}>
            {session?.user?.email}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: '100%', padding: '7px', borderRadius: 6, border: 'none',
              background: '#334155', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
            }}
          >
            {loggingOut ? 'Cerrando...' : 'Cerrar sesion'}
          </button>
          <NavLink
            to="/"
            style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#60a5fa', textDecoration: 'none', textAlign: 'center' }}
          >
            Ir al Checklist
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
