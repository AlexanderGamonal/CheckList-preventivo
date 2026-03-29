import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

export default function ProtectedRoute({ children, requireSuperadmin = false }) {
  const { session, loading, isAdmin, isSuperadmin } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a', color: '#fff' }}>
        Cargando...
      </div>
    );
  }

  if (!session) return <Navigate to="/admin/login" replace />;
  if (requireSuperadmin && !isSuperadmin) return <Navigate to="/admin/dashboard" replace />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return children;
}
