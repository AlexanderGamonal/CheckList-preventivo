import React, { useState, useEffect } from 'react';

/* ── Paleta y tokens propios (independiente del tema de la app) ── */
const C = {
  bg:        '#f8fafc',
  surface:   '#ffffff',
  border:    '#e2e8f0',
  borderHi:  '#cbd5e1',
  text:      '#0f172a',
  textSub:   '#475569',
  textMuted: '#94a3b8',
  brand:     '#3b82f6',
  brandDim:  '#eff6ff',
  green:     '#16a34a',
  greenDim:  '#f0fdf4',
  amber:     '#b45309',
  amberDim:  '#fffbeb',
  red:       '#dc2626',
  redDim:    '#fef2f2',
  purple:    '#7c3aed',
  purpleDim: '#f5f3ff',
  code:      '#1e293b',
  codeBg:    '#0f172a',
};

const S = {
  page: {
    minHeight: '100vh',
    background: C.bg,
    color: C.text,
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    lineHeight: 1.6,
    fontSize: 15,
  },
  header: {
    background: C.surface,
    borderBottom: `1px solid ${C.border}`,
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    height: 56,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  main: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '40px 24px 80px',
  },
  section: {
    marginBottom: 52,
    scrollMarginTop: 72,
  },
  h1: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
    color: C.text,
    margin: '0 0 8px',
  },
  h2: {
    fontSize: 22,
    fontWeight: 700,
    color: C.text,
    margin: '0 0 16px',
    paddingBottom: 10,
    borderBottom: `2px solid ${C.brand}`,
    display: 'inline-block',
  },
  h3: {
    fontSize: 16,
    fontWeight: 700,
    color: C.text,
    margin: '24px 0 10px',
  },
  p: {
    margin: '0 0 14px',
    color: C.textSub,
  },
  badge: (color, bg) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color,
    background: bg,
    border: `1px solid ${color}33`,
  }),
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
    marginBottom: 16,
  },
  th: {
    background: '#f1f5f9',
    padding: '10px 14px',
    textAlign: 'left',
    fontWeight: 600,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
    color: C.textSub,
    borderBottom: `2px solid ${C.border}`,
  },
  td: {
    padding: '10px 14px',
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: 'top',
    color: C.textSub,
  },
  code: {
    background: '#f1f5f9',
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: '2px 8px',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    color: C.brand,
  },
  codeBlock: {
    background: C.codeBg,
    color: '#e2e8f0',
    borderRadius: 10,
    padding: '18px 20px',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    overflowX: 'auto',
    lineHeight: 1.7,
    margin: '12px 0',
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${C.border}`,
    margin: '40px 0',
  },
  toc: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${C.brand}`,
    borderRadius: '0 10px 10px 0',
    padding: '16px 20px',
    marginBottom: 40,
    fontSize: 14,
  },
  tocItem: {
    display: 'block',
    padding: '4px 0',
    color: C.brand,
    textDecoration: 'none',
    fontWeight: 500,
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  featureItem: {
    display: 'flex',
    gap: 10,
    padding: '6px 0',
    color: C.textSub,
    fontSize: 14,
  },
};

function Code({ children }) {
  return <code style={S.code}>{children}</code>;
}

function CodeBlock({ children }) {
  return <pre style={S.codeBlock}>{children}</pre>;
}

function Badge({ type, children }) {
  const map = {
    get:    [C.green,  C.greenDim],
    post:   [C.brand,  C.brandDim],
    warn:   [C.amber,  C.amberDim],
    ok:     [C.green,  C.greenDim],
    admin:  [C.purple, C.purpleDim],
    new:    [C.brand,  C.brandDim],
  };
  const [col, bg] = map[type] || [C.textSub, '#f1f5f9'];
  return <span style={S.badge(col, bg)}>{children}</span>;
}

function FeatureItem({ icon, children }) {
  return (
    <li style={S.featureItem}>
      <span style={{ flexShrink: 0, fontSize: 16 }}>{icon}</span>
      <span>{children}</span>
    </li>
  );
}

function SectionTitle({ id, children }) {
  return (
    <div id={id} style={S.section}>
      <h2 style={S.h2}>{children}</h2>
    </div>
  );
}

export default function SpecsPage() {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { rootMargin: '-60px 0px -70% 0px' }
    );
    document.querySelectorAll('[data-section]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const tocLinks = [
    { id: 'descripcion',   label: '1. Descripción general' },
    { id: 'modulos',       label: '2. Módulos' },
    { id: 'admin',         label: '3. Panel administrativo' },
    { id: 'flujo',         label: '4. Flujo de trabajo' },
    { id: 'stack',         label: '5. Stack tecnológico' },
    { id: 'arquitectura',  label: '6. Arquitectura' },
    { id: 'rutas',         label: '7. Rutas de la aplicación' },
    { id: 'datos',         label: '8. Almacenamiento y persistencia' },
    { id: 'pdf',           label: '9. Generación de PDF y correo' },
    { id: 'roles',         label: '10. Roles y permisos' },
  ];

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <header style={S.header}>
        <span style={{ fontSize: 20 }}>📄</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: C.text }}>GICE</span>
        <span style={{ color: C.border }}>|</span>
        <span style={{ color: C.textSub, fontSize: 14 }}>Especificaciones Técnicas</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge type="ok">v1.0</Badge>
          <span style={{ fontSize: 12, color: C.textMuted }}>Prosegur Cash</span>
        </div>
      </header>

      <main style={S.main}>

        {/* ── Hero ── */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={S.h1}>Gestión Integral de Canales Electrónicos</h1>
          <p style={{ fontSize: 17, color: C.textSub, margin: '8px 0 16px' }}>
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

        {/* ── Tabla de contenidos ── */}
        <div style={S.toc}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: C.textSub }}>
            Contenido
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2px 20px' }}>
            {tocLinks.map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                style={{
                  ...S.tocItem,
                  color: activeSection === link.id ? C.brand : C.textSub,
                  fontWeight: activeSection === link.id ? 700 : 500,
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <hr style={S.divider} />

        {/* ══════════════════════════════════════
            1. DESCRIPCIÓN GENERAL
        ══════════════════════════════════════ */}
        <section id="descripcion" data-section style={S.section}>
          <h2 style={S.h2}>1. Descripción General</h2>
          <p style={S.p}>
            <strong>GICE</strong> es una Progressive Web App (PWA) desarrollada para Prosegur Cash que permite
            a técnicos de campo documentar y reportar el estado de cajeros automáticos (ATM) durante
            visitas de mantenimiento preventivo y auditorías de recepción de equipos.
          </p>
          <p style={S.p}>
            La app genera reportes en PDF, los adjunta a un correo electrónico y los almacena en una base
            de datos centralizada. Funciona en dispositivos móviles bajo condiciones de campo: luz solar
            directa, conectividad variable y uso con guantes.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 20 }}>
            {[
              { icon: '📋', label: 'Módulo Mantenimiento Preventivo' },
              { icon: '📝', label: 'Módulo Auditoría de Recepción' },
              { icon: '📊', label: 'Dashboard administrativo con KPIs' },
              { icon: '📧', label: 'Envío automático de PDF por correo' },
              { icon: '📷', label: 'Evidencia fotográfica por dispositivo' },
              { icon: '📶', label: 'Borrador offline en localStorage' },
            ].map((item, i) => (
              <div key={i} style={{ ...S.card, display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', marginBottom: 0 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                <span style={{ fontSize: 13, color: C.textSub, lineHeight: 1.4 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════
            2. MÓDULOS
        ══════════════════════════════════════ */}
        <section id="modulos" data-section style={S.section}>
          <h2 style={S.h2}>2. Módulos</h2>

          {/* Check List MP */}
          <div style={{ ...S.card, borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>📋 Check List MP — Mantenimiento Preventivo</h3>
            <p style={{ ...S.p, marginBottom: 16 }}>
              Evalúa el estado general del ATM en el contexto de una visita de mantenimiento preventivo periódico.
              Cubre el equipamiento físico, las condiciones eléctricas y el estado del entorno (site).
            </p>

            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: C.text }}>Secciones del formulario</h4>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Sección</th>
                  <th style={S.th}>Contenido</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Identificación', 'ID ATM (búsqueda con autocompletado), técnico (número + nombre), fecha, tipo de ATM'],
                  ['Datos del equipo', 'Marca, modelo, tipo (retiro / depósito / multifunción), N° serie, dirección'],
                  ['Dispositivos', 'Estado (OK / Requiere mantenimiento / Requiere repuesto) + observaciones + fotos por dispositivo: dispensador, aceptador, cassettes, shutter, lectora, impresora, EPP, CPU, power supply, misceláneos, cableado'],
                  ['Voltajes', 'Medición L-T, L-N, N-T para ATM y UPS; validación automática del rango 209–231 V; fotos de evidencia si hay anomalías'],
                  ['Evidencia fotográfica del site', 'Fotos de estado general, cableado y condiciones ambientales'],
                  ['Cierre', 'Observaciones generales, firma digital'],
                ].map(([sec, desc]) => (
                  <tr key={sec}>
                    <td style={{ ...S.td, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{sec}</td>
                    <td style={S.td}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul style={S.featureList}>
              <FeatureItem icon="✅">Autocompletado de datos del ATM (marca, modelo, dirección, IP, etc.) al ingresar el ID</FeatureItem>
              <FeatureItem icon="✅">Barra de progreso en tiempo real basada en campos obligatorios completados</FeatureItem>
              <FeatureItem icon="✅">Borrador guardado automáticamente en localStorage (persiste entre sesiones)</FeatureItem>
              <FeatureItem icon="✅">Alerta si el localStorage se llena — versión lite sin fotos como respaldo</FeatureItem>
              <FeatureItem icon="✅">Generación de PDF y envío por correo con overlay de progreso por etapas</FeatureItem>
            </ul>
          </div>

          {/* Acta de Auditoría */}
          <div style={{ ...S.card, borderLeft: '4px solid #22c55e', marginTop: 16 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17 }}>📝 Acta de Auditoría — Recepción de Equipos</h3>
            <p style={{ ...S.p, marginBottom: 16 }}>
              Documenta la verificación técnica completa al momento de recepcionar un ATM. Incluye
              pruebas en línea, revisión de hardware, red, condiciones del site y evidencia fotográfica
              por dispositivo.
            </p>

            <h4 style={{ margin: '0 0 8px', fontSize: 14, color: C.text }}>Secciones del formulario</h4>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Sección</th>
                  <th style={S.th}>Contenido</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Datos generales', 'ID ATM, fecha (auto-rellena con hoy), hora inicio (auto-rellena al elegir ATM), hora fin (auto-rellena al enviar), punto, cliente, dirección'],
                  ['Estado del equipo', 'Equipo funcionando (Sí/No), observaciones'],
                  ['Pruebas en línea', 'Consulta de saldos, retiro de efectivo, depósito de efectivo — con estado y observaciones por prueba; resumen de pruebas exitosas'],
                  ['Datos de red', 'IP equipo, máscara de red, gateway, DNS 1, DNS 2, sistema operativo, software ATM'],
                  ['Datos del dispositivo', 'Marca, modelo, N° serie, tipo ATM, lector de tarjetas, impresora de recibos, EPP (teclado), CPU (dropdown con modelos), RAM, SSD, shutter, sistema de entintado, tipo de nose (condicional NCR SS23/SS27), tipo de presentador (condicional NCR SS22/SS26)'],
                  ['Estado del site', 'Cámaras, aire acondicionado, iluminación, exceso de polvo — cada uno con observaciones'],
                  ['Voltajes', 'Igual que en Check List MP; visualización de rangos y alertas'],
                  ['Evidencias de dispositivos', 'Fotos por dispositivo con estado (OK / Requiere mantenimiento / Requiere repuesto): Fascia y Pantalla (1–2 fotos), Gabinete de Comunicación (solo si no es oficina, 1–3 fotos), Dispensador, Aceptador, Cassettes 1–4/5, Shutter, Lectora, Impresora, EPP, CPU, Power Supply, Misceláneos, Cableado'],
                  ['Observaciones generales', 'Texto libre de cierre'],
                ].map(([sec, desc]) => (
                  <tr key={sec}>
                    <td style={{ ...S.td, fontWeight: 600, color: C.text, minWidth: 160 }}>{sec}</td>
                    <td style={S.td}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul style={S.featureList}>
              <FeatureItem icon="✅">Autocompletado de 15 campos al ingresar el ID ATM (incluye datos de red y hardware)</FeatureItem>
              <FeatureItem icon="✅">Fecha, hora de inicio y hora de fin auto-rellenadas (editables)</FeatureItem>
              <FeatureItem icon="✅">Memoria RAM y capacidad SSD pre-cargados con valores por defecto (8 GB / 250 GB)</FeatureItem>
              <FeatureItem icon="✅">Campos condicionales según marca/modelo (Tipo de Nose y Tipo de Presentador)</FeatureItem>
              <FeatureItem icon="✅">Botones separados de Cámara (capture="environment") y Galería por dispositivo</FeatureItem>
              <FeatureItem icon="✅">Sección Gabinete de Comunicación omitida si el punto es una oficina</FeatureItem>
              <FeatureItem icon="✅">Borrador persistente en localStorage con migración automática entre versiones</FeatureItem>
            </ul>
          </div>
        </section>

        {/* ══════════════════════════════════════
            3. PANEL ADMINISTRATIVO
        ══════════════════════════════════════ */}
        <section id="admin" data-section style={S.section}>
          <h2 style={S.h2}>3. Panel Administrativo</h2>
          <p style={S.p}>Accesible desde <Code>/admin</Code>. Requiere autenticación con Supabase Auth. Solo roles <Badge type="admin">admin</Badge> y <Badge type="admin">superadmin</Badge>.</p>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Ruta</th>
                <th style={S.th}>Sección</th>
                <th style={S.th}>Rol mínimo</th>
                <th style={S.th}>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['/admin/dashboard',      'Dashboard',          'admin',      'KPIs, gráficos de mantenimientos y auditorías por período'],
                ['/admin/mantenimientos', 'Mantenimientos',     'admin',      'Listado, filtros, exportación a Excel de todos los checklist MP enviados'],
                ['/admin/auditorias',     'Auditorías',         'admin',      'Listado, filtros y exportación de actas de auditoría'],
                ['/admin/atms',           'ATMs',               'superadmin', 'CRUD de cajeros; importación masiva de datos de red desde CSV'],
                ['/admin/tecnicos',       'Técnicos',           'superadmin', 'CRUD de técnicos de campo'],
                ['/admin/usuarios',       'Usuarios',           'superadmin', 'Invitación, asignación de roles (tecnico / admin / superadmin) y eliminación'],
                ['/admin/contactos',      'Contactos de email', 'superadmin', 'Lista de destinatarios para las notificaciones por correo'],
                ['/admin/reset',          'Reset de datos',     'superadmin', 'Eliminar registros de prueba y reiniciar secuencias'],
              ].map(([ruta, sec, rol, desc]) => (
                <tr key={ruta}>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 13, color: C.brand }}>{ruta}</td>
                  <td style={{ ...S.td, fontWeight: 600, color: C.text }}>{sec}</td>
                  <td style={S.td}><Badge type="admin">{rol}</Badge></td>
                  <td style={S.td}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ══════════════════════════════════════
            4. FLUJO DE TRABAJO
        ══════════════════════════════════════ */}
        <section id="flujo" data-section style={S.section}>
          <h2 style={S.h2}>4. Flujo de Trabajo</h2>

          <h3 style={S.h3}>Mantenimiento Preventivo</h3>
          <CodeBlock>{`1. Técnico abre la app → selecciona "Check List MP"
2. Ingresa ID ATM → autocompletado de datos del equipo
3. Completa las secciones: dispositivos, voltajes, fotos
4. Da clic en "Generar PDF y Enviar Correo"
   ├── Se muestra overlay con progreso por etapas
   ├── Se genera el PDF (html2canvas → jsPDF)
   ├── Se sube el PDF a Supabase Storage (temp/)
   └── Se envía email con PDF adjunto via Edge Function
5. Borrador se elimina automáticamente al enviar con éxito
6. Los datos quedan registrados en la tabla "mantenimientos"`}</CodeBlock>

          <h3 style={S.h3}>Acta de Auditoría</h3>
          <CodeBlock>{`1. Técnico abre la app → selecciona "Acta de Auditoría"
2. Fecha se rellena automáticamente con la fecha de hoy
3. Ingresa ID ATM → autocompletado de 15 campos (red, hardware, ubicación)
   └── Hora de inicio se registra automáticamente
4. Completa todas las secciones incluyendo evidencias fotográficas
5. Da clic en "Enviar Acta"
   ├── Hora de fin se registra automáticamente
   ├── Se genera y envía el PDF
   └── Registro guardado en tabla "auditorias"
6. El técnico puede capturar fotos con botón directo de Cámara
   o importar desde Galería (botones separados por dispositivo)`}</CodeBlock>
        </section>

        {/* ══════════════════════════════════════
            5. STACK TECNOLÓGICO
        ══════════════════════════════════════ */}
        <section id="stack" data-section style={S.section}>
          <h2 style={S.h2}>5. Stack Tecnológico</h2>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Capa</th>
                <th style={S.th}>Tecnología</th>
                <th style={S.th}>Versión</th>
                <th style={S.th}>Uso</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Frontend',    'React',              '18.2',  'SPA con hooks funcionales'],
                ['Frontend',    'React Router DOM',   '7.x',   'Routing del lado del cliente'],
                ['Frontend',    'Vite',               '5.x',   'Bundler y servidor de desarrollo'],
                ['Frontend',    'Recharts',           '3.x',   'Gráficos en el dashboard admin'],
                ['PWA',         'vite-plugin-pwa',    '1.x',   'Service worker, manifest, instalación'],
                ['PDF',         'html2canvas',        '1.4',   'Captura del DOM como imagen'],
                ['PDF',         'jsPDF',              '4.x',   'Conversión imagen → PDF'],
                ['Backend',     'Supabase',           '2.x',   'Base de datos (PostgreSQL), Auth, Storage, Edge Functions'],
                ['Email',       'Supabase Edge Fn.',  '—',     'Envío de correo con PDF adjunto (Deno + NodeMailer)'],
                ['Excel',       'xlsx (SheetJS)',     '0.18',  'Exportación de datos a Excel desde el admin'],
                ['Deploy',      'Vercel',             '—',     'Hosting de la SPA con despliegue automático desde Git'],
              ].map(row => (
                <tr key={row[0] + row[1]}>
                  {row.map((cell, i) => (
                    <td key={i} style={{ ...S.td, fontWeight: i === 1 ? 600 : 400, color: i === 1 ? C.text : C.textSub }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ══════════════════════════════════════
            6. ARQUITECTURA
        ══════════════════════════════════════ */}
        <section id="arquitectura" data-section style={S.section}>
          <h2 style={S.h2}>6. Arquitectura</h2>
          <CodeBlock>{`┌─────────────────────────────────────────────┐
│               Vercel (SPA / CDN)            │
│                                             │
│  React + Vite PWA                           │
│  ├── /src/pages/         Vistas principales │
│  ├── /src/components/    Componentes UI     │
│  ├── /src/hooks/         useAuth, useTheme  │
│  ├── /src/services/      PDF, email, CRUD   │
│  ├── /src/constants/     ATMs, dispositivos │
│  └── /src/lib/supabase   Cliente Supabase   │
└─────────────┬───────────────────────────────┘
              │ HTTPS
┌─────────────▼───────────────────────────────┐
│         Supabase (Backend as a Service)     │
│                                             │
│  PostgreSQL    tablas principales:          │
│  ├── atms           Catálogo de cajeros     │
│  ├── mantenimientos Checklist MP enviados   │
│  ├── auditorias     Actas enviadas          │
│  ├── tecnicos       Técnicos de campo       │
│  └── contactos_email Destinatarios          │
│                                             │
│  Storage    bucket: pdf-attachments/temp/   │
│  Auth       email + password, roles JWT     │
│  Edge Fn.   send-email (Deno)               │
└─────────────────────────────────────────────┘`}</CodeBlock>

          <h3 style={S.h3}>Estructura de archivos relevante</h3>
          <CodeBlock>{`src/
├── pages/
│   ├── HomePage.jsx          Selección de módulo
│   ├── App.jsx               Check List MP (formulario principal)
│   ├── AuditFormPage.jsx     Acta de Auditoría
│   ├── AuditPdfView.jsx      Template del PDF de auditoría
│   ├── PdfPreviewPage.jsx    Vista previa de PDF
│   ├── SpecsPage.jsx         Esta página
│   └── admin/
│       ├── DashboardPage.jsx
│       ├── MantenimientosPage.jsx
│       ├── AuditoriasPage.jsx
│       ├── AtmsPage.jsx
│       ├── TecnicosPage.jsx
│       ├── UsuariosPage.jsx
│       └── ContactosEmailPage.jsx
├── components/
│   ├── PhotoUploader.jsx     Fotos por dispositivo (Cámara / Galería)
│   ├── PhotoUpload.jsx       Fotos del Check List MP
│   ├── AtmIdInput.jsx        Input con búsqueda y autocompletado de ATM
│   ├── SectionBlock.jsx      Sección colapsable con progreso
│   ├── InstallPrompt.jsx     Banner de instalación PWA
│   └── Toast.jsx             Notificaciones temporales
├── hooks/
│   ├── useAtmLookup.js       Caché y búsqueda de ATMs
│   ├── useAuth.js            Sesión y roles
│   └── useTheme.js           Tema claro/oscuro
├── services/
│   ├── pdfService.js         Generación de PDF (html2canvas + jsPDF)
│   ├── emailService.js       Orquestación de envío de correo
│   ├── mantenimientoService.js  CRUD + email summary del Check List
│   └── auditoriaService.js  CRUD + email summary del Acta
├── tokens.css                Design tokens (colores, tipografía, sombras)
└── router.jsx                Definición de rutas`}</CodeBlock>
        </section>

        {/* ══════════════════════════════════════
            7. RUTAS DE LA APLICACIÓN
        ══════════════════════════════════════ */}
        <section id="rutas" data-section style={S.section}>
          <h2 style={S.h2}>7. Rutas de la Aplicación</h2>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Ruta</th>
                <th style={S.th}>Componente</th>
                <th style={S.th}>Acceso</th>
                <th style={S.th}>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['/',                    'HomePage',           'Público', 'Pantalla de inicio — selección de módulo'],
                ['/checklist',          'App (ChecklistApp)', 'Público', 'Formulario de Check List MP'],
                ['/auditoria',          'AuditFormPage',      'Público', 'Formulario de Acta de Auditoría'],
                ['/preview',            'PdfPreviewPage',     'Público', 'Vista previa del PDF generado'],
                ['/specs',              'SpecsPage',          'Público', 'Esta página de especificaciones'],
                ['/admin',              '→ /admin/dashboard', 'Redirect','Redirección automática'],
                ['/admin/login',        'LoginPage',          'Público', 'Autenticación'],
                ['/admin/set-password', 'SetPasswordPage',    'Público', 'Establecer contraseña por invitación'],
                ['/admin/dashboard',    'DashboardPage',      'Admin',   'KPIs y gráficos'],
                ['/admin/mantenimientos','MantenimientosPage','Admin',   'Historial de checklist MP'],
                ['/admin/auditorias',   'AuditoriasPage',     'Admin',   'Historial de actas de auditoría'],
                ['/admin/atms',         'AtmsPage',           'Superadmin','Gestión de cajeros'],
                ['/admin/tecnicos',     'TecnicosPage',       'Superadmin','Gestión de técnicos'],
                ['/admin/usuarios',     'UsuariosPage',       'Superadmin','Gestión de usuarios'],
                ['/admin/contactos',    'ContactosEmailPage', 'Superadmin','Destinatarios de correo'],
                ['/admin/reset',        'ResetDatosPage',     'Superadmin','Eliminación de datos de prueba'],
                ['/dev/colors',         'ColorSystemPreview', 'Público', 'Preview del sistema de diseño (dev)'],
              ].map(([ruta, comp, acc, desc]) => (
                <tr key={ruta}>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 13, color: C.brand }}>{ruta}</td>
                  <td style={{ ...S.td, fontSize: 13, color: C.text, fontWeight: 500 }}>{comp}</td>
                  <td style={S.td}>
                    <Badge type={acc === 'Admin' || acc === 'Superadmin' ? 'admin' : 'ok'}>{acc}</Badge>
                  </td>
                  <td style={{ ...S.td, fontSize: 13 }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ══════════════════════════════════════
            8. ALMACENAMIENTO Y PERSISTENCIA
        ══════════════════════════════════════ */}
        <section id="datos" data-section style={S.section}>
          <h2 style={S.h2}>8. Almacenamiento y Persistencia</h2>

          <h3 style={S.h3}>Base de datos (Supabase / PostgreSQL)</h3>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Tabla</th>
                <th style={S.th}>Campos principales</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['atms', 'id, id_atm, punto, atm_tipo, activo, marca_id, modelo_id, cliente_id, nro_serie, ip_equipo, mascara_red, gateway, dns1, dns2, cpu_modelo, software_atm, direccion'],
                ['mantenimientos', 'id, fecha, idAtm, tecnico, marca, modelo, dispositivos (JSONB), voltajes (JSONB), observaciones, created_at'],
                ['auditorias', 'id, fecha, horaInicio, horaFin, idAtm, punto, marcaEquipo, modeloEquipo, pruebas (JSONB), voltajes (JSONB), devFotos (JSONB), obsGenerales, created_at'],
                ['tecnicos', 'id, numero, nombre, activo'],
                ['contactos_email', 'id, nombre, email, activo'],
                ['marcas', 'id, nombre'],
                ['modelos', 'id, nombre'],
                ['clientes', 'id, nombre'],
              ].map(([tabla, campos]) => (
                <tr key={tabla}>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontWeight: 700, color: C.brand, whiteSpace: 'nowrap' }}>{tabla}</td>
                  <td style={{ ...S.td, fontSize: 13 }}>{campos}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={S.h3}>localStorage (borrador offline)</h3>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Clave</th>
                <th style={S.th}>Contenido</th>
                <th style={S.th}>Cuándo se elimina</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['checklist_draft', 'Estado completo del formulario del Check List MP (incluye fotos como WebP DataURL)', 'Al enviar con éxito o al reiniciar manualmente'],
                ['auditoria_draft', 'Estado completo del Acta de Auditoría (incluye fotos y voltajes)', 'Al enviar con éxito o al reiniciar manualmente'],
                ['gice_theme', '"dark" | "light" — preferencia de tema del usuario', 'Nunca (persiste entre sesiones)'],
              ].map(([key, val, when]) => (
                <tr key={key}>
                  <td style={{ ...S.td, fontFamily: 'monospace', color: C.brand }}>{key}</td>
                  <td style={S.td}>{val}</td>
                  <td style={S.td}>{when}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ ...S.card, background: C.amberDim, border: `1px solid ${C.amber}33`, marginTop: 8 }}>
            <strong style={{ color: C.amber }}>⚠ Límite de localStorage</strong>
            <p style={{ ...S.p, marginTop: 6, marginBottom: 0, fontSize: 13 }}>
              El almacenamiento local del navegador tiene un límite de ~5–10 MB. Si el espacio se agota,
              la app guarda automáticamente una versión <em>lite</em> del borrador sin fotos y muestra
              un banner de advertencia persistente. Las fotos se mantienen en memoria durante la sesión
              activa.
            </p>
          </div>

          <h3 style={S.h3}>Supabase Storage</h3>
          <p style={S.p}>
            Los PDFs generados se suben temporalmente al bucket <Code>pdf-attachments/temp/</Code> con un
            nombre único basado en timestamp. La Edge Function los lee para adjuntarlos al correo y
            pueden eliminarse automáticamente mediante políticas de retención.
          </p>
        </section>

        {/* ══════════════════════════════════════
            9. GENERACIÓN DE PDF Y CORREO
        ══════════════════════════════════════ */}
        <section id="pdf" data-section style={S.section}>
          <h2 style={S.h2}>9. Generación de PDF y Correo</h2>

          <h3 style={S.h3}>Pipeline de generación</h3>
          <CodeBlock>{`Form state
  │
  ▼
Template React (PdfView / AuditPdfView)
  │  Renderizado off-screen (left: -9999px, visibility: visible)
  ▼
html2canvas  →  Canvas (escala 1.5, calidad 0.88)
  │
  ▼
jsPDF  →  ArrayBuffer del PDF
  │
  ├──→  Descarga directa en el dispositivo del técnico
  └──→  Upload a Supabase Storage (temp/<timestamp>-<filename>.pdf)
            │
            ▼
        Supabase Edge Function "send-email" (Deno)
            │  lee el PDF desde Storage, construye multipart email
            ▼
        SMTP → destinatarios configurados en contactos_email`}</CodeBlock>

          <h3 style={S.h3}>Optimizaciones de rendimiento</h3>
          <ul style={S.featureList}>
            <FeatureItem icon="⚡">PDF renderizado off-screen: el técnico no ve parpadeos durante la generación</FeatureItem>
            <FeatureItem icon="⚡">Escala 1.5× en html2canvas (balance calidad / velocidad — antes era 2.0×)</FeatureItem>
            <FeatureItem icon="⚡">Overlay de pantalla completa con etapas: "Generando PDF… / Subiendo PDF… / Enviando correo…"</FeatureItem>
            <FeatureItem icon="⚡">Fotos comprimidas a WebP 1200×900 / calidad 0.82 antes de incluir en el PDF</FeatureItem>
          </ul>
        </section>

        {/* ══════════════════════════════════════
            10. ROLES Y PERMISOS
        ══════════════════════════════════════ */}
        <section id="roles" data-section style={S.section}>
          <h2 style={S.h2}>10. Roles y Permisos</h2>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Rol</th>
                <th style={S.th}>Acceso</th>
                <th style={S.th}>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['tecnico', 'Módulos /, /checklist, /auditoria, /preview', 'Técnico de campo. Solo puede completar y enviar formularios. Sin acceso al panel admin.'],
                ['admin', 'Todo lo anterior + /admin/dashboard, /admin/mantenimientos, /admin/auditorias', 'Supervisor o coordinador. Ve los reportes pero no puede modificar maestros ni usuarios.'],
                ['superadmin', 'Acceso completo incluyendo /admin/atms, /admin/tecnicos, /admin/usuarios, /admin/contactos, /admin/reset', 'Administrador del sistema. Gestión completa de maestros, usuarios e invitaciones.'],
              ].map(([rol, acc, desc]) => (
                <tr key={rol}>
                  <td style={S.td}><Badge type="admin">{rol}</Badge></td>
                  <td style={{ ...S.td, fontSize: 12, fontFamily: 'monospace', color: C.brand }}>{acc}</td>
                  <td style={{ ...S.td, fontSize: 13 }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ ...S.p, fontSize: 13 }}>
            Los roles se almacenan en <Code>user_metadata.role</Code> de Supabase Auth. El login redirige
            según el rol: <Code>admin</Code> / <Code>superadmin</Code> → <Code>/admin/dashboard</Code>;
            demás roles → <Code>/</Code>.
          </p>
        </section>

        <hr style={S.divider} />

        {/* Footer */}
        <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
          <p style={{ margin: 0 }}>
            GICE · Gestión Integral de Canales Electrónicos · Prosegur Cash
          </p>
          <p style={{ margin: '4px 0 0' }}>
            Última actualización: {new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

      </main>
    </div>
  );
}
