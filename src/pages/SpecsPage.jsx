import React, { useState, useEffect } from 'react';

/* ── Paleta ── */
const C = {
  bg:        '#f8fafc',
  surface:   '#ffffff',
  border:    '#e2e8f0',
  text:      '#0f172a',
  textSub:   '#475569',
  textMuted: '#94a3b8',
  brand:     '#3b82f6',
  brandDim:  '#eff6ff',
  green:     '#16a34a',
  greenDim:  '#f0fdf4',
  amber:     '#b45309',
  amberDim:  '#fffbeb',
  purple:    '#7c3aed',
  purpleDim: '#f5f3ff',
  codeBg:    '#0f172a',
};

/* ── CSS con media queries — inyectado vía <style> ── */
const CSS = `
  *,*::before,*::after { box-sizing: border-box; }
  .sp-page  { min-height:100vh; background:${C.bg}; color:${C.text};
               font-family:'Inter','Segoe UI',system-ui,sans-serif;
               line-height:1.6; font-size:15px; }
  .sp-header{ background:${C.surface}; border-bottom:1px solid ${C.border};
               padding:0 20px; position:sticky; top:0; z-index:100;
               display:flex; align-items:center; gap:10px; height:52px;
               box-shadow:0 1px 3px rgba(0,0,0,.06); overflow:hidden; }
  .sp-header-sub { color:${C.textSub}; font-size:13px; white-space:nowrap;
                   overflow:hidden; text-overflow:ellipsis; }
  .sp-main  { max-width:860px; margin:0 auto; padding:40px 24px 80px; }
  .sp-h1    { font-size:30px; font-weight:800; letter-spacing:-.5px;
               line-height:1.2; color:${C.text}; margin:0 0 8px; }
  .sp-h2    { font-size:21px; font-weight:700; color:${C.text};
               margin:0 0 16px; padding-bottom:10px;
               border-bottom:2px solid ${C.brand}; display:inline-block; }
  .sp-h3    { font-size:15px; font-weight:700; color:${C.text}; margin:22px 0 10px; }
  .sp-p     { margin:0 0 14px; color:${C.textSub}; }
  .sp-card  { background:${C.surface}; border:1px solid ${C.border};
               border-radius:12px; padding:20px 24px; margin-bottom:16px; }
  .sp-tbl-wrap { overflow-x:auto; -webkit-overflow-scrolling:touch;
                  border-radius:8px; border:1px solid ${C.border}; margin-bottom:16px; }
  .sp-tbl   { width:100%; border-collapse:collapse; font-size:14px; }
  .sp-th    { background:#f1f5f9; padding:10px 14px; text-align:left;
               font-weight:600; font-size:11px; text-transform:uppercase;
               letter-spacing:.4px; color:${C.textSub};
               border-bottom:2px solid ${C.border}; white-space:nowrap; }
  .sp-td    { padding:10px 14px; border-bottom:1px solid ${C.border};
               vertical-align:top; color:${C.textSub}; }
  .sp-td:last-child { min-width:160px; }
  .sp-code  { background:#f1f5f9; border:1px solid ${C.border}; border-radius:6px;
               padding:2px 7px; font-size:12px;
               font-family:'JetBrains Mono','Fira Code','Consolas',monospace;
               color:${C.brand}; word-break:break-all; }
  .sp-pre   { background:${C.codeBg}; color:#e2e8f0; border-radius:10px;
               padding:16px 18px; font-size:12px;
               font-family:'JetBrains Mono','Fira Code','Consolas',monospace;
               overflow-x:auto; -webkit-overflow-scrolling:touch;
               line-height:1.7; margin:12px 0; white-space:pre; }
  .sp-toc   { background:${C.surface}; border:1px solid ${C.border};
               border-left:4px solid ${C.brand}; border-radius:0 10px 10px 0;
               padding:14px 18px; margin-bottom:36px; font-size:14px; }
  .sp-toc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr));
                  gap:2px 16px; }
  .sp-toc-a { display:block; padding:4px 0; text-decoration:none; font-weight:500; }
  .sp-feat  { list-style:none; padding:0; margin:0; }
  .sp-feat li { display:flex; gap:10px; padding:6px 0; color:${C.textSub}; font-size:14px; }
  .sp-icon-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr));
                   gap:10px; margin-top:18px; }
  .sp-icon-card { background:${C.surface}; border:1px solid ${C.border}; border-radius:10px;
                   padding:12px 14px; display:flex; gap:10px; align-items:flex-start; }
  .sp-badge { display:inline-block; padding:2px 9px; border-radius:20px;
               font-size:11px; font-weight:600; white-space:nowrap; }
  .sp-divider { border:none; border-top:1px solid ${C.border}; margin:36px 0; }
  .sp-warn-box { background:${C.amberDim}; border:1px solid ${C.amber}33;
                  border-radius:10px; padding:14px 16px; margin-top:10px; }

  @media (max-width:640px) {
    .sp-header-sub { display:none; }
    .sp-main  { padding:24px 14px 60px; }
    .sp-h1    { font-size:22px; }
    .sp-h2    { font-size:18px; }
    .sp-card  { padding:14px 14px; }
    .sp-toc-grid { grid-template-columns:1fr; }
    .sp-icon-grid { grid-template-columns:1fr 1fr; }
    .sp-td    { font-size:12px; padding:8px 10px; }
    .sp-th    { font-size:10px; padding:8px 10px; }
    .sp-td:last-child { min-width:120px; }
    .sp-pre   { font-size:11px; padding:12px 14px; }
  }
  @media (max-width:400px) {
    .sp-icon-grid { grid-template-columns:1fr; }
  }
`;

function Code({ children }) {
  return <code className="sp-code">{children}</code>;
}

function CodeBlock({ children }) {
  return <pre className="sp-pre">{children}</pre>;
}

function Badge({ type, children }) {
  const map = {
    ok:    { color: C.green,  bg: C.greenDim  },
    admin: { color: C.purple, bg: C.purpleDim },
    new:   { color: C.brand,  bg: C.brandDim  },
  };
  const { color, bg } = map[type] || { color: C.textSub, bg: '#f1f5f9' };
  return (
    <span className="sp-badge" style={{ color, background: bg, border: `1px solid ${color}33` }}>
      {children}
    </span>
  );
}

function TableWrap({ children }) {
  return <div className="sp-tbl-wrap">{children}</div>;
}

export default function SpecsPage() {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }); },
      { rootMargin: '-56px 0px -70% 0px' }
    );
    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const tocLinks = [
    { id: 'descripcion',  label: '1. Descripción general' },
    { id: 'modulos',      label: '2. Módulos' },
    { id: 'admin',        label: '3. Panel administrativo' },
    { id: 'flujo',        label: '4. Flujo de trabajo' },
    { id: 'stack',        label: '5. Stack tecnológico' },
    { id: 'arquitectura', label: '6. Arquitectura' },
    { id: 'rutas',        label: '7. Rutas de la aplicación' },
    { id: 'datos',        label: '8. Almacenamiento y persistencia' },
    { id: 'pdf',          label: '9. Generación de PDF y correo' },
    { id: 'roles',        label: '10. Roles y permisos' },
  ];

  return (
    <div className="sp-page">
      <style>{CSS}</style>

      {/* ── Header ── */}
      <header className="sp-header">
        <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: C.text, flexShrink: 0 }}>GICE</span>
        <span style={{ color: C.border, flexShrink: 0 }}>|</span>
        <span className="sp-header-sub">Especificaciones Técnicas</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <Badge type="ok">v1.0</Badge>
          <span style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap' }}>Prosegur Cash</span>
        </div>
      </header>

      <main className="sp-main">

        {/* ── Hero ── */}
        <div style={{ marginBottom: 36 }}>
          <h1 className="sp-h1">Gestión Integral de Canales Electrónicos</h1>
          <p style={{ fontSize: 16, color: C.textSub, margin: '8px 0 14px', lineHeight: 1.5 }}>
            Plataforma interna para técnicos de campo — checklist de mantenimiento preventivo
            y acta de auditoría de cajeros automáticos ATM.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge type="ok">Producción</Badge>
            <Badge type="new">React 18</Badge>
            <Badge type="new">Supabase</Badge>
            <Badge type="new">PWA</Badge>
          </div>
        </div>

        {/* ── TOC ── */}
        <div className="sp-toc">
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.5px', color: C.textSub }}>
            Contenido
          </div>
          <div className="sp-toc-grid">
            {tocLinks.map(link => (
              <a key={link.id} href={`#${link.id}`} className="sp-toc-a"
                style={{ color: activeSection === link.id ? C.brand : C.textSub,
                         fontWeight: activeSection === link.id ? 700 : 500 }}>
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <hr className="sp-divider" />

        {/* ══ 1. DESCRIPCIÓN GENERAL ══ */}
        <section id="descripcion" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">1. Descripción General</h2>
          <p className="sp-p">
            <strong>GICE</strong> es una Progressive Web App (PWA) desarrollada para Prosegur Cash que permite
            a técnicos de campo documentar y reportar el estado de cajeros automáticos (ATM) durante
            visitas de mantenimiento preventivo y auditorías de recepción de equipos.
          </p>
          <p className="sp-p">
            La app genera reportes en PDF, los adjunta a un correo electrónico y los almacena en una base
            de datos centralizada. Funciona en dispositivos móviles bajo condiciones de campo: luz solar
            directa, conectividad variable y uso con guantes.
          </p>
          <div className="sp-icon-grid">
            {[
              ['📋', 'Módulo Mantenimiento Preventivo'],
              ['📝', 'Módulo Auditoría de Recepción'],
              ['📊', 'Dashboard administrativo con KPIs'],
              ['📧', 'Envío automático de PDF por correo'],
              ['📷', 'Evidencia fotográfica por dispositivo'],
              ['📶', 'Borrador offline en localStorage'],
            ].map(([icon, label], i) => (
              <div key={i} className="sp-icon-card">
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 13, color: C.textSub, lineHeight: 1.4 }}>{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══ 2. MÓDULOS ══ */}
        <section id="modulos" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">2. Módulos</h2>

          {/* Check List MP */}
          <div className="sp-card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>📋 Check List MP — Mantenimiento Preventivo</h3>
            <p className="sp-p" style={{ marginBottom: 14 }}>
              Evalúa el estado general del ATM en el contexto de una visita de mantenimiento preventivo periódico.
              Cubre el equipamiento físico, las condiciones eléctricas y el estado del entorno (site).
            </p>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: C.text }}>Secciones del formulario</h4>
            <TableWrap>
              <table className="sp-tbl">
                <thead>
                  <tr>
                    <th className="sp-th">Sección</th>
                    <th className="sp-th">Contenido</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Identificación', 'ID ATM (búsqueda con autocompletado), técnico (número + nombre), fecha, tipo de ATM'],
                    ['Datos del equipo', 'Marca, modelo, tipo (retiro / depósito / multifunción), N° serie, dirección'],
                    ['Dispositivos', 'Estado + observaciones + fotos por dispositivo: dispensador, aceptador, cassettes, shutter, lectora, impresora, EPP, CPU, power supply, misceláneos, cableado'],
                    ['Voltajes', 'Medición L-T, L-N, N-T para ATM y UPS; validación automática del rango 209–231 V; fotos si hay anomalías'],
                    ['Evidencia del site', 'Fotos de estado general, cableado y condiciones ambientales'],
                    ['Cierre', 'Observaciones generales, firma digital'],
                  ].map(([sec, desc]) => (
                    <tr key={sec}>
                      <td className="sp-td" style={{ fontWeight: 600, color: C.text, minWidth: 120 }}>{sec}</td>
                      <td className="sp-td">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <ul className="sp-feat">
              {[
                'Autocompletado de datos del ATM al ingresar el ID (marca, modelo, dirección, IP, etc.)',
                'Barra de progreso en tiempo real basada en campos obligatorios completados',
                'Borrador guardado automáticamente en localStorage (persiste entre sesiones)',
                'Alerta si el localStorage se llena — versión lite sin fotos como respaldo',
                'Generación de PDF y envío por correo con overlay de progreso por etapas',
              ].map((t, i) => <li key={i}><span style={{ flexShrink: 0 }}>✅</span><span>{t}</span></li>)}
            </ul>
          </div>

          {/* Acta de Auditoría */}
          <div className="sp-card" style={{ borderLeft: '4px solid #22c55e', marginTop: 14 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>📝 Acta de Auditoría — Recepción de Equipos</h3>
            <p className="sp-p" style={{ marginBottom: 14 }}>
              Documenta la verificación técnica completa al momento de recepcionar un ATM. Incluye
              pruebas en línea, revisión de hardware, red, condiciones del site y evidencia fotográfica
              por dispositivo.
            </p>
            <h4 style={{ margin: '0 0 8px', fontSize: 13, color: C.text }}>Secciones del formulario</h4>
            <TableWrap>
              <table className="sp-tbl">
                <thead>
                  <tr>
                    <th className="sp-th">Sección</th>
                    <th className="sp-th">Contenido</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Datos generales', 'ID ATM, fecha (auto), hora inicio (auto al elegir ATM), hora fin (auto al enviar), punto, cliente, dirección'],
                    ['Estado del equipo', 'Equipo funcionando (Sí/No), observaciones'],
                    ['Pruebas en línea', 'Consulta de saldos, retiro y depósito de efectivo — estado y observaciones por prueba'],
                    ['Datos de red', 'IP, máscara de red, gateway, DNS 1, DNS 2, sistema operativo, software ATM'],
                    ['Datos del dispositivo', 'Marca, modelo, N° serie, tipo ATM, lector, impresora, EPP, CPU, RAM, SSD, shutter, entintado, tipo de nose (condicional NCR SS23/SS27), tipo de presentador (condicional NCR SS22/SS26)'],
                    ['Estado del site', 'Cámaras, aire acondicionado, iluminación, exceso de polvo — con observaciones'],
                    ['Voltajes', 'Igual que en Check List MP; visualización de rangos y alertas'],
                    ['Evidencias de dispositivos', 'Fotos por dispositivo: Fascia y Pantalla (1–2), Gabinete de Comunicación (condicional, 1–3), Dispensador, Aceptador, Cassettes, Shutter, Lectora, Impresora, EPP, CPU, Power Supply, Misceláneos, Cableado'],
                    ['Observaciones generales', 'Texto libre de cierre'],
                  ].map(([sec, desc]) => (
                    <tr key={sec}>
                      <td className="sp-td" style={{ fontWeight: 600, color: C.text, minWidth: 130 }}>{sec}</td>
                      <td className="sp-td">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <ul className="sp-feat">
              {[
                'Autocompletado de 15 campos al ingresar el ID ATM (red, hardware, ubicación)',
                'Fecha, hora de inicio y hora de fin auto-rellenadas (editables)',
                'RAM y SSD pre-cargados con valores por defecto (8 GB / 250 GB)',
                'Campos condicionales según marca/modelo (Tipo de Nose y Tipo de Presentador)',
                'Botones separados de Cámara (capture="environment") y Galería por dispositivo',
                'Sección Gabinete de Comunicación omitida si el punto es una oficina',
                'Borrador persistente en localStorage con migración automática entre versiones',
              ].map((t, i) => <li key={i}><span style={{ flexShrink: 0 }}>✅</span><span>{t}</span></li>)}
            </ul>
          </div>
        </section>

        {/* ══ 3. PANEL ADMINISTRATIVO ══ */}
        <section id="admin" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">3. Panel Administrativo</h2>
          <p className="sp-p">
            Accesible desde <Code>/admin</Code>. Requiere autenticación con Supabase Auth.
            Solo roles <Badge type="admin">admin</Badge> y <Badge type="admin">superadmin</Badge>.
          </p>
          <TableWrap>
            <table className="sp-tbl">
              <thead>
                <tr>
                  <th className="sp-th">Ruta</th>
                  <th className="sp-th">Sección</th>
                  <th className="sp-th">Rol</th>
                  <th className="sp-th">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['/admin/dashboard',      'Dashboard',         'admin',      'KPIs, gráficos de mantenimientos y auditorías por período'],
                  ['/admin/mantenimientos', 'Mantenimientos',    'admin',      'Listado, filtros, exportación a Excel de todos los checklist MP'],
                  ['/admin/auditorias',     'Auditorías',        'admin',      'Listado, filtros y exportación de actas de auditoría'],
                  ['/admin/atms',           'ATMs',              'superadmin', 'CRUD de cajeros; importación masiva de datos de red desde CSV'],
                  ['/admin/tecnicos',       'Técnicos',          'superadmin', 'CRUD de técnicos de campo'],
                  ['/admin/usuarios',       'Usuarios',          'superadmin', 'Invitación, roles y eliminación de usuarios'],
                  ['/admin/contactos',      'Contactos email',   'superadmin', 'Lista de destinatarios para notificaciones por correo'],
                  ['/admin/reset',          'Reset de datos',    'superadmin', 'Eliminar registros de prueba y reiniciar secuencias'],
                ].map(([ruta, sec, rol, desc]) => (
                  <tr key={ruta}>
                    <td className="sp-td" style={{ fontFamily: 'monospace', color: C.brand, whiteSpace: 'nowrap' }}>{ruta}</td>
                    <td className="sp-td" style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{sec}</td>
                    <td className="sp-td"><Badge type="admin">{rol}</Badge></td>
                    <td className="sp-td">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </section>

        {/* ══ 4. FLUJO DE TRABAJO ══ */}
        <section id="flujo" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">4. Flujo de Trabajo</h2>
          <h3 className="sp-h3">Mantenimiento Preventivo</h3>
          <CodeBlock>{`1. Técnico abre la app → selecciona "Check List MP"
2. Ingresa ID ATM → autocompletado de datos del equipo
3. Completa las secciones: dispositivos, voltajes, fotos
4. Da clic en "Generar PDF y Enviar Correo"
   ├── Overlay con progreso por etapas
   ├── Se genera el PDF (html2canvas → jsPDF)
   ├── Se sube el PDF a Supabase Storage (temp/)
   └── Se envía email adjunto via Edge Function
5. Borrador se elimina al enviar con éxito
6. Datos registrados en la tabla "mantenimientos"`}</CodeBlock>

          <h3 className="sp-h3">Acta de Auditoría</h3>
          <CodeBlock>{`1. Técnico abre la app → selecciona "Acta de Auditoría"
2. Fecha se rellena automáticamente con la fecha de hoy
3. Ingresa ID ATM → autocompletado de 15 campos
   └── Hora de inicio se registra automáticamente
4. Completa todas las secciones + evidencias fotográficas
5. Da clic en "Enviar Acta"
   ├── Hora de fin se registra automáticamente
   ├── Se genera y envía el PDF
   └── Registro guardado en tabla "auditorias"
6. Botones separados: Cámara (directa) o Galería`}</CodeBlock>
        </section>

        {/* ══ 5. STACK TECNOLÓGICO ══ */}
        <section id="stack" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">5. Stack Tecnológico</h2>
          <TableWrap>
            <table className="sp-tbl">
              <thead>
                <tr>
                  <th className="sp-th">Capa</th>
                  <th className="sp-th">Tecnología</th>
                  <th className="sp-th">Versión</th>
                  <th className="sp-th">Uso</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Frontend',   'React',             '18.2', 'SPA con hooks funcionales'],
                  ['Frontend',   'React Router DOM',  '7.x',  'Routing del lado del cliente'],
                  ['Frontend',   'Vite',              '5.x',  'Bundler y servidor de desarrollo'],
                  ['Frontend',   'Recharts',          '3.x',  'Gráficos en el dashboard admin'],
                  ['PWA',        'vite-plugin-pwa',   '1.x',  'Service worker, manifest, instalación'],
                  ['PDF',        'html2canvas',       '1.4',  'Captura del DOM como imagen'],
                  ['PDF',        'jsPDF',             '4.x',  'Conversión imagen → PDF'],
                  ['Backend',    'Supabase',          '2.x',  'PostgreSQL, Auth, Storage, Edge Functions'],
                  ['Email',      'Edge Function',     '—',    'Envío de correo con PDF adjunto (Deno)'],
                  ['Excel',      'SheetJS (xlsx)',    '0.18', 'Exportación a Excel desde el admin'],
                  ['Deploy',     'Vercel',            '—',    'Hosting SPA con CI/CD automático desde Git'],
                ].map((row, ri) => (
                  <tr key={ri}>
                    <td className="sp-td" style={{ color: C.textMuted, whiteSpace: 'nowrap' }}>{row[0]}</td>
                    <td className="sp-td" style={{ fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{row[1]}</td>
                    <td className="sp-td" style={{ whiteSpace: 'nowrap' }}>{row[2]}</td>
                    <td className="sp-td">{row[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </section>

        {/* ══ 6. ARQUITECTURA ══ */}
        <section id="arquitectura" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">6. Arquitectura</h2>
          <CodeBlock>{`┌──────────────────────────────────────┐
│        Vercel  (SPA / CDN)           │
│  React + Vite PWA                    │
│  ├── /src/pages/    Vistas           │
│  ├── /src/components/ Componentes UI │
│  ├── /src/hooks/    useAuth, useTheme│
│  ├── /src/services/ PDF, email, CRUD │
│  └── /src/lib/      Cliente Supabase │
└──────────────┬───────────────────────┘
               │ HTTPS
┌──────────────▼───────────────────────┐
│   Supabase  (Backend as a Service)   │
│  PostgreSQL  atms, mantenimientos,   │
│              auditorias, tecnicos    │
│  Storage     pdf-attachments/temp/   │
│  Auth        email+password, JWT     │
│  Edge Fn.    send-email (Deno)       │
└──────────────────────────────────────┘`}</CodeBlock>

          <h3 className="sp-h3">Estructura de archivos relevante</h3>
          <CodeBlock>{`src/
├── pages/
│   ├── HomePage.jsx        Selección de módulo
│   ├── App.jsx             Check List MP
│   ├── AuditFormPage.jsx   Acta de Auditoría
│   ├── AuditPdfView.jsx    Template PDF auditoría
│   ├── SpecsPage.jsx       Esta página
│   └── admin/  Dashboard, Mantenimientos,
│               Auditorias, ATMs, Tecnicos...
├── components/
│   ├── PhotoUploader.jsx   Cámara / Galería
│   ├── AtmIdInput.jsx      Búsqueda ATM
│   ├── SectionBlock.jsx    Sección con progreso
│   └── Toast.jsx
├── hooks/
│   ├── useAtmLookup.js     Caché ATMs
│   └── useAuth.js
├── services/
│   ├── pdfService.js
│   ├── emailService.js
│   ├── mantenimientoService.js
│   └── auditoriaService.js
├── tokens.css              Design tokens
└── router.jsx              Rutas`}</CodeBlock>
        </section>

        {/* ══ 7. RUTAS DE LA APLICACIÓN ══ */}
        <section id="rutas" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">7. Rutas de la Aplicación</h2>
          <TableWrap>
            <table className="sp-tbl">
              <thead>
                <tr>
                  <th className="sp-th">Ruta</th>
                  <th className="sp-th">Componente</th>
                  <th className="sp-th">Acceso</th>
                  <th className="sp-th">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['/',                     'HomePage',          'Público',    'Pantalla de inicio'],
                  ['/checklist',            'ChecklistApp',      'Público',    'Formulario Check List MP'],
                  ['/auditoria',            'AuditFormPage',     'Público',    'Formulario Acta de Auditoría'],
                  ['/preview',              'PdfPreviewPage',    'Público',    'Vista previa del PDF'],
                  ['/specs',                'SpecsPage',         'Público',    'Esta página de especificaciones'],
                  ['/admin/login',          'LoginPage',         'Público',    'Autenticación'],
                  ['/admin/set-password',   'SetPasswordPage',   'Público',    'Contraseña por invitación'],
                  ['/admin/dashboard',      'DashboardPage',     'Admin',      'KPIs y gráficos'],
                  ['/admin/mantenimientos', 'MantenimientosPage','Admin',      'Historial Check List MP'],
                  ['/admin/auditorias',     'AuditoriasPage',    'Admin',      'Historial de auditorías'],
                  ['/admin/atms',           'AtmsPage',          'Superadmin', 'Gestión de cajeros'],
                  ['/admin/tecnicos',       'TecnicosPage',      'Superadmin', 'Gestión de técnicos'],
                  ['/admin/usuarios',       'UsuariosPage',      'Superadmin', 'Gestión de usuarios'],
                  ['/admin/contactos',      'ContactosEmailPage','Superadmin', 'Destinatarios de correo'],
                  ['/admin/reset',          'ResetDatosPage',    'Superadmin', 'Reset de datos de prueba'],
                ].map(([ruta, comp, acc, desc]) => (
                  <tr key={ruta}>
                    <td className="sp-td" style={{ fontFamily: 'monospace', color: C.brand, whiteSpace: 'nowrap' }}>{ruta}</td>
                    <td className="sp-td" style={{ fontWeight: 500, color: C.text, whiteSpace: 'nowrap' }}>{comp}</td>
                    <td className="sp-td" style={{ whiteSpace: 'nowrap' }}>
                      <Badge type={acc === 'Admin' || acc === 'Superadmin' ? 'admin' : 'ok'}>{acc}</Badge>
                    </td>
                    <td className="sp-td">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </section>

        {/* ══ 8. ALMACENAMIENTO Y PERSISTENCIA ══ */}
        <section id="datos" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">8. Almacenamiento y Persistencia</h2>

          <h3 className="sp-h3">Base de datos (Supabase / PostgreSQL)</h3>
          <TableWrap>
            <table className="sp-tbl">
              <thead>
                <tr>
                  <th className="sp-th">Tabla</th>
                  <th className="sp-th">Campos principales</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['atms', 'id, id_atm, punto, atm_tipo, activo, marca_id, modelo_id, cliente_id, nro_serie, ip_equipo, mascara_red, gateway, dns1, dns2, cpu_modelo, software_atm, direccion'],
                  ['mantenimientos', 'id, fecha, idAtm, tecnico, marca, modelo, dispositivos (JSONB), voltajes (JSONB), observaciones, created_at'],
                  ['auditorias', 'id, fecha, horaInicio, horaFin, idAtm, punto, marcaEquipo, modeloEquipo, pruebas (JSONB), voltajes (JSONB), devFotos (JSONB), obsGenerales, created_at'],
                  ['tecnicos', 'id, numero, nombre, activo'],
                  ['contactos_email', 'id, nombre, email, activo'],
                  ['marcas / modelos / clientes', 'id, nombre'],
                ].map(([tabla, campos]) => (
                  <tr key={tabla}>
                    <td className="sp-td" style={{ fontFamily: 'monospace', fontWeight: 700, color: C.brand, whiteSpace: 'nowrap' }}>{tabla}</td>
                    <td className="sp-td" style={{ fontSize: 13 }}>{campos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          <h3 className="sp-h3">localStorage (borrador offline)</h3>
          <TableWrap>
            <table className="sp-tbl">
              <thead>
                <tr>
                  <th className="sp-th">Clave</th>
                  <th className="sp-th">Contenido</th>
                  <th className="sp-th">Se elimina cuando</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['checklist_draft', 'Estado completo del Check List MP (incluye fotos como WebP DataURL)', 'Al enviar con éxito o al reiniciar manualmente'],
                  ['auditoria_draft', 'Estado completo del Acta de Auditoría', 'Al enviar con éxito o al reiniciar manualmente'],
                  ['gice_theme', '"dark" | "light"', 'Nunca (persiste entre sesiones)'],
                ].map(([key, val, when]) => (
                  <tr key={key}>
                    <td className="sp-td" style={{ fontFamily: 'monospace', color: C.brand, whiteSpace: 'nowrap' }}>{key}</td>
                    <td className="sp-td" style={{ fontSize: 13 }}>{val}</td>
                    <td className="sp-td" style={{ fontSize: 13 }}>{when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          <div className="sp-warn-box">
            <strong style={{ color: C.amber }}>⚠ Límite de localStorage</strong>
            <p className="sp-p" style={{ marginTop: 6, marginBottom: 0, fontSize: 13 }}>
              El almacenamiento local del navegador tiene un límite de ~5–10 MB. Si el espacio se agota,
              la app guarda una versión <em>lite</em> del borrador sin fotos y muestra un banner de
              advertencia persistente. Las fotos se mantienen en memoria durante la sesión activa.
            </p>
          </div>

          <h3 className="sp-h3">Supabase Storage</h3>
          <p className="sp-p">
            Los PDFs se suben temporalmente al bucket <Code>pdf-attachments/temp/</Code> con nombre único
            basado en timestamp. La Edge Function los lee para adjuntarlos al correo.
          </p>
        </section>

        {/* ══ 9. PDF Y CORREO ══ */}
        <section id="pdf" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">9. Generación de PDF y Correo</h2>
          <h3 className="sp-h3">Pipeline de generación</h3>
          <CodeBlock>{`Form state
  │
  ▼
Template React (PdfView / AuditPdfView)
  │  Off-screen: left:-9999px, visibility:visible
  ▼
html2canvas → Canvas (escala 1.5, calidad 0.88)
  │
  ▼
jsPDF → ArrayBuffer del PDF
  │
  ├──→ Descarga directa en el dispositivo
  └──→ Upload Supabase Storage temp/
            │
            ▼
       Edge Function "send-email" (Deno)
            │ lee PDF, construye multipart
            ▼
       SMTP → contactos_email`}</CodeBlock>

          <h3 className="sp-h3">Optimizaciones de rendimiento</h3>
          <ul className="sp-feat">
            {[
              'PDF renderizado off-screen: sin parpadeos visibles durante la generación',
              'Escala 1.5× en html2canvas (balance calidad/velocidad — antes era 2.0×)',
              'Overlay con etapas: "Generando PDF… / Subiendo PDF… / Enviando correo…"',
              'Fotos comprimidas a WebP 1200×900 / calidad 0.82 antes de incluir en el PDF',
            ].map((t, i) => <li key={i}><span style={{ flexShrink: 0 }}>⚡</span><span>{t}</span></li>)}
          </ul>
        </section>

        {/* ══ 10. ROLES Y PERMISOS ══ */}
        <section id="roles" data-section style={{ marginBottom: 48, scrollMarginTop: 64 }}>
          <h2 className="sp-h2">10. Roles y Permisos</h2>
          <TableWrap>
            <table className="sp-tbl">
              <thead>
                <tr>
                  <th className="sp-th">Rol</th>
                  <th className="sp-th">Acceso</th>
                  <th className="sp-th">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['tecnico',    '/, /checklist, /auditoria, /preview',             'Técnico de campo. Completa y envía formularios. Sin acceso al panel admin.'],
                  ['admin',      'Todo lo anterior + /admin/dashboard, /admin/mantenimientos, /admin/auditorias', 'Supervisor. Ve reportes pero no modifica maestros ni usuarios.'],
                  ['superadmin', 'Acceso completo incluido /admin/atms, /admin/usuarios, /admin/reset', 'Administrador del sistema. Gestión completa de maestros, usuarios e invitaciones.'],
                ].map(([rol, acc, desc]) => (
                  <tr key={rol}>
                    <td className="sp-td" style={{ whiteSpace: 'nowrap' }}><Badge type="admin">{rol}</Badge></td>
                    <td className="sp-td" style={{ fontSize: 12, fontFamily: 'monospace', color: C.brand }}>{acc}</td>
                    <td className="sp-td" style={{ fontSize: 13 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <p className="sp-p" style={{ fontSize: 13 }}>
            Los roles se almacenan en <Code>user_metadata.role</Code> de Supabase Auth. El login redirige
            según el rol: <Code>admin</Code> / <Code>superadmin</Code> → <Code>/admin/dashboard</Code>;
            demás roles → <Code>/</Code>.
          </p>
        </section>

        <hr className="sp-divider" />

        {/* Footer */}
        <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
          <p style={{ margin: 0 }}>GICE · Gestión Integral de Canales Electrónicos · Prosegur Cash</p>
          <p style={{ margin: '4px 0 0' }}>
            Última actualización:{' '}
            {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

      </main>
    </div>
  );
}
