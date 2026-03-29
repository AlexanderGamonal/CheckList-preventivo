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
  const [hoveredLink, setHoveredLink] = useState(null);
  const [logoutHovered, setLogoutHovered] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  const links = isSuperadmin ? [...LINKS_ALL, ...LINKS_SUPERADMIN] : LINKS_ALL;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column',
        padding: '24px 0', flexShrink: 0,
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-light)' }}>CheckList ATM</div>
          <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>Panel de Administracion</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              onMouseEnter={() => setHoveredLink(l.to)}
              onMouseLeave={() => setHoveredLink(null)}
              style={({ isActive }) => ({
                display: 'block', padding: '9px 20px', fontSize: 13, textDecoration: 'none',
                color: isActive ? 'var(--text-primary)' : hoveredLink === l.to ? 'var(--text-secondary)' : 'var(--text-muted)',
                background: isActive ? 'var(--bg-tertiary)' : hoveredLink === l.to ? 'var(--hover-overlay)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                transition: 'background 0.15s, color 0.15s',
              })}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 8, wordBreak: 'break-all' }}>
            {session?.user?.email}
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            onMouseEnter={() => setLogoutHovered(true)}
            onMouseLeave={() => setLogoutHovered(false)}
            style={{
              width: '100%', padding: '8px', borderRadius: 6, border: 'none',
              background: logoutHovered ? 'var(--bg-overlay)' : 'var(--bg-tertiary)',
              color: logoutHovered ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontSize: 12, cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {loggingOut ? 'Cerrando...' : 'Cerrar sesion'}
          </button>
          <NavLink
            to="/"
            style={{ display: 'block', marginTop: 8, fontSize: 11, color: 'var(--brand-light)', textDecoration: 'none', textAlign: 'center' }}
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
