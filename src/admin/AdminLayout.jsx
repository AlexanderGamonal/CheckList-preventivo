import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../hooks/useAuth.js';
import { useIsMobile } from '../hooks/useIsMobile.js';

const LINKS_ALL = [
  { to: '/admin/dashboard',       label: 'Dashboard' },
  { to: '/admin/mantenimientos',  label: 'Mantenimientos' },
  { to: '/admin/auditorias',      label: 'Auditorías' },
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
  const isMobile = useIsMobile();
  const { theme, toggle: toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(null);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    navigate('/admin/login');
  }

  const links = isSuperadmin ? [...LINKS_ALL, ...LINKS_SUPERADMIN] : LINKS_ALL;

  const sidebar = (
    <aside style={{
      width: 220,
      background: 'var(--bg-secondary)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
      ...(isMobile ? {
        position: 'fixed',
        top: 0,
        left: sidebarOpen ? 0 : -220,
        height: '100vh',
        zIndex: 3000,
        transition: 'left 0.25s ease',
        boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
      } : {}),
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--border-default)', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', overflow: 'hidden', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: 6 }}>
          <img
            src="/logo.png"
            alt="CheckList ATM"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-light)' }}>CheckList ATM</div>
        <div style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 2 }}>Panel de Administracion</div>
      </div>
      <nav style={{ flex: 1, padding: '16px 0' }}>
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={() => isMobile && setSidebarOpen(false)}
            onMouseEnter={() => setHoveredLink(l.to)}
            onMouseLeave={() => setHoveredLink(null)}
            style={({ isActive }) => ({
              display: 'block', padding: '9px 20px', fontSize: 13, textDecoration: 'none',
              color: isActive ? 'var(--text-primary)' : hoveredLink === l.to ? 'var(--text-secondary)' : 'var(--text-muted)',
              background: isActive ? 'var(--selected-bg)' : hoveredLink === l.to ? 'var(--hover-overlay)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
              fontWeight: isActive ? 700 : 400,
              paddingLeft: isActive ? 17 : 20,
              transition: 'background 0.15s, color 0.15s',
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--text-disabled)', wordBreak: 'break-all', flex: 1, marginRight: 8 }}>
            {session?.user?.email}
          </div>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '2px 4px', lineHeight: 1, opacity: 0.75, flexShrink: 0 }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
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
          ← Ir al Inicio
        </NavLink>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-secondary)' }}>
      {sidebar}

      {/* Overlay para cerrar sidebar en mobile */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 2999, transition: 'opacity 0.25s',
          }}
        />
      )}

      {/* Main content */}
      <main style={{ flex: 1, padding: isMobile ? 16 : 32, overflowY: 'auto', minWidth: 0 }}>
        {/* Botón hamburger mobile */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{
              marginBottom: 16, padding: '8px 12px', borderRadius: 8, border: 'none',
              background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
              fontSize: 18, cursor: 'pointer', lineHeight: 1,
            }}
          >
            ☰
          </button>
        )}
        {children}
      </main>
    </div>
  );
}
