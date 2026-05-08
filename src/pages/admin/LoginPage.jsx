import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useTheme } from '../../hooks/useTheme.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    if (session) navigate('/admin/dashboard');
  }, [session, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else navigate('/admin/dashboard');
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: 40, width: '100%', maxWidth: 380,
        boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <img
            src="/logo.png"
            alt="CheckList ATM"
            style={{ width: 96, height: 96, objectFit: 'contain', background: '#fff', borderRadius: 12, padding: 4 }}
          />
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, opacity: 0.7 }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 6 }}>
          Panel Administracion
        </h1>
        <p style={{ color: 'var(--text-disabled)', fontSize: 13, marginBottom: 28 }}>CheckList ATM</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                border: '1.5px solid ' + (focusedField === 'email' ? 'var(--brand)' : 'var(--border-default)'),
                background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color var(--transition-fast)',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
              Contrasena
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                border: '1.5px solid ' + (focusedField === 'password' ? 'var(--brand)' : 'var(--border-default)'),
                background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color var(--transition-fast)',
              }}
            />
          </div>
          {error && <div style={{ color: 'var(--status-critical)', fontSize: 12, marginBottom: 16 }}>{error}</div>}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: 'var(--radius-sm)', border: 'none',
              background: loading ? 'var(--bg-tertiary)' : 'var(--brand)', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background var(--transition-fast)',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
