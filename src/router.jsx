import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './admin/ProtectedRoute.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';

// Checklist principal — carga inmediata (es la ruta raíz)
import App from './App.jsx';

// Lazy: se descargan solo cuando el usuario navega a esa ruta
const PdfPreviewPage       = lazy(() => import('./pages/PdfPreviewPage.jsx'));
const LoginPage            = lazy(() => import('./pages/admin/LoginPage.jsx'));
const DashboardPage        = lazy(() => import('./pages/admin/DashboardPage.jsx'));
const MantenimientosPage   = lazy(() => import('./pages/admin/MantenimientosPage.jsx'));
const AtmsPage             = lazy(() => import('./pages/admin/AtmsPage.jsx'));
const TecnicosPage         = lazy(() => import('./pages/admin/TecnicosPage.jsx'));
const UsuariosPage         = lazy(() => import('./pages/admin/UsuariosPage.jsx'));
const ContactosEmailPage   = lazy(() => import('./pages/admin/ContactosEmailPage.jsx'));
const SetPasswordPage      = lazy(() => import('./pages/admin/SetPasswordPage.jsx'));
const ResetDatosPage       = lazy(() => import('./pages/admin/ResetDatosPage.jsx'));
const ColorSystemPreview   = lazy(() => import('./pages/ColorSystemPreview.jsx'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1e293b', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <span style={{ color: '#475569', fontSize: 13 }}>Cargando...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <InstallPrompt />
      <Routes>
        {/* Public checklist */}
        <Route path="/" element={<App />} />

        {/* PDF preview */}
        <Route path="/preview" element={<PdfPreviewPage />} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/admin/mantenimientos" element={
          <ProtectedRoute><MantenimientosPage /></ProtectedRoute>
        } />
        <Route path="/admin/atms" element={
          <ProtectedRoute requireSuperadmin><AtmsPage /></ProtectedRoute>
        } />
        <Route path="/admin/tecnicos" element={
          <ProtectedRoute requireSuperadmin><TecnicosPage /></ProtectedRoute>
        } />
        <Route path="/admin/usuarios" element={
          <ProtectedRoute requireSuperadmin><UsuariosPage /></ProtectedRoute>
        } />
        <Route path="/admin/contactos" element={
          <ProtectedRoute requireSuperadmin><ContactosEmailPage /></ProtectedRoute>
        } />

        {/* Reset de datos de prueba */}
        <Route path="/admin/reset" element={
          <ProtectedRoute requireSuperadmin><ResetDatosPage /></ProtectedRoute>
        } />

        {/* Invitación — establecer contraseña */}
        <Route path="/admin/set-password" element={<SetPasswordPage />} />

        {/* Design system preview — solo desarrollo */}
        <Route path="/dev/colors" element={<ColorSystemPreview />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
