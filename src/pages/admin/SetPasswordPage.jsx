import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase.js';

export default function SetPasswordPage() {
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase detecta automáticamente el token de invitación en el hash de la URL
    // y establece la sesión. Esperamos a que eso ocurra.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY' || event === 'INITIAL_SESSION') && session) {
        setSessionReady(true);
      }
    });
    // También verificar sesión existente (por si ya cargó)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { setError(error.message); return; }
    navigate('/admin/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, margin: '0 auto 16px' }}>🔑</div>
          <h1 style={{ color: '#f8fafc', fontSize: 22, fontWeight: 700 }}>Crear contraseña</h1>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Establece tu contraseña para acceder al panel</p>
        </div>

        {!sessionReady ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: 14, padding: 32 }}>
            <div style={{ width: 28, height: 28, border: '3px solid #1e293b', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            Verificando enlace de invitación...
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#1e293b', borderRadius: 16, padding: 32, boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Nueva contraseña</label>
              <input
                type="password" required autoFocus
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Confirmar contraseña</label>
              <input
                type="password" required
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="Repite la contraseña"
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            {error && <div style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, background: '#450a0a', color: '#ef4444', fontSize: 13 }}>{error}</div>}
            <button
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
            >
              {loading ? 'Guardando...' : 'Crear contraseña e ingresar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
