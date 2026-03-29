import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../hooks/useAuth.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

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
      background: '#0f172a',
    }}>
      <div style={{
        background: '#1e293b', borderRadius: 16, padding: 40, width: '100%', maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <img
            src="/favicon.png"
            alt="CheckList ATM"
            style={{ width: 96, height: 96, objectFit: 'contain' }}
          />
        </div>
        <h1 style={{ color: '#f8fafc', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
          Panel Administracion
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 28 }}>CheckList ATM</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoFocus
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #334155',
                background: '#0f172a', color: '#f8fafc', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
              Contrasena
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #334155',
                background: '#0f172a', color: '#f8fafc', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          {error && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 16 }}>{error}</div>}
          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: 8, border: 'none',
              background: loading ? '#334155' : '#3b82f6', color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
