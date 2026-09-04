# 🏧 CheckList Preventivo & Auditoría ATM

![React](https://img.shields.io/badge/React-18.2.0-blue.svg?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF.svg?style=for-the-badge&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-DB_%26_Auth-3ECF8E.svg?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000.svg?style=for-the-badge&logo=vercel)

Aplicación web integral para la **gestión, registro y auditoría de cajeros automáticos (ATM)**. Diseñada para uso en campo (técnicos y auditores), permite completar formularios estructurados, capturar evidencias fotográficas, generar informes PDF profesionales multipágina y enviarlos por correo electrónico directamente desde el navegador.

---

## 🚀 Módulos Principales

El sistema se divide en **tres módulos de campo** orientados al personal técnico, más un panel de control administrativo (backoffice).

### 1. 📋 Check List (Mantenimiento Preventivo)
Formulario paso a paso para mantenimientos de rutina (ruta `/checklist`).
- **Flujo Guiado por Tabs**: Información general, Site, Voltajes, Dispositivos, Cierre y captura de fotos (Antes/Después).
- **Dispositivos Dinámicos**: Las secciones de equipos a revisar (Lectora, Dispensador, Aceptador, CPU, Monitor, etc.) se arman automáticamente según el tipo de ATM (dispensador / depósito / multifunción) y la marca (NCR, Diebold, GRG, Hyosung).
- **Voltajes con Detección de "Sin Acceso"**: si el técnico deja las 3 mediciones (L-N, L-T, N-T) de un punto en 0, se interpreta como que no hubo acceso a esa medición (no como voltaje fuera de rango).
- **Borrador Automático**: el progreso se guarda en `localStorage` en cada cambio, para no perder datos ante un cierre accidental.
- **PDF Dinámico Multipágina**: tablas de dispositivos y evidencia fotográfica (grid de 3 columnas) se paginan automáticamente — genera tantas hojas como haga falta sin cortar fotos ni texto.

### 2. 📥 Check List Cash Today (C2D)
Formulario para mantenimiento de cajeros de depósito/reciclaje de efectivo (ruta `/checklist-c2d`).
- **Estado del Site**: checklist de condiciones generales del entorno/cabina.
- **Dispositivos con Evidencia Antes/Después**: dispositivos fijos del equipo más un dispositivo opcional de "Cash Control", cada uno con su propio set de fotos antes/después (comprimidas en cliente).
- **Pruebas de Depósito**: batería de pruebas funcionales específicas del flujo de depósito de efectivo.
- **Borrador Automático y PDF Dinámico**: mismo patrón de autosave y de paginación dinámica de fotos que el resto de los módulos.

### 3. 📝 Acta de Auditoría
Módulo avanzado para auditorías profundas de hardware y software (ruta `/auditoria`).
- **Análisis Eléctrico**: Captura y validación inteligente de voltajes L-T, L-N y N-T tanto para ATM como para UPS, con la misma lógica de "sin acceso" ante mediciones en 0.
- **Evidencias por Componente**: Captura de fotografías independientes (comprimidas en WebP) para Dispensador, Aceptador, Lectora, CPU, Shutter, etc.
- **Cassettes Dinámicos**: Configuración automática de la cantidad de cassettes (4 o 5) dependiendo de la marca del equipo (NCR, GRG, Hyosung vs Diebold).
- **Estados Rápidos**: Clasificación visual rápida por dispositivo (✅ OK, ⚠ Mantenimiento, ❌ Cambio de repuesto).
- **PDF Dinámico Multipágina**: Algoritmo de renderizado que calcula el espacio disponible en tiempo real para agrupar fotos sin cortes de página.

### 4. 🛡️ Panel de Administración (Backoffice)
Centro de control para coordinadores y supervisores (ruta base `/admin`, protegido con autenticación).
- **Dashboard Estadístico**: KPIs en tiempo real y gráficos de tendencia sobre el estado operativo de la red.
- **Historial por Módulo**: listados filtrables de intervenciones de Mantenimiento (MP), Mantenimiento C2D y Auditorías, cada uno con su propia vista de detalle.
- **Gestión Integral** *(requiere rol `superadmin`)*: ABM (Alta, Baja, Modificación) de ATMs, Técnicos, Usuarios y Contactos de correo (grupos de notificación por evento).
- **Reset de Datos de Prueba** *(`superadmin`)*: utilidad para limpiar datos de ambientes de prueba.
- **Exportación**: exportación de la data cruda de cada módulo a CSV/Excel.
- **Roles y Permisos**: accesos jerárquicos vía `useAuth.js` + `ProtectedRoute.jsx` — `admin` para lectura/reportes, `superadmin` para configuración y datos maestros.

---

## ✨ Características Técnicas Destacadas

* **Offline-First (Borrador Automático)**: El progreso de los formularios se guarda continuamente en el `localStorage` del navegador, previniendo la pérdida de datos ante cierres accidentales. En el módulo de Mantenimiento Preventivo esta lógica vive en hooks dedicados (`useMpDraft`, `useMpSubmit`); C2D y Auditoría la manejan directamente en su página de formulario.
* **Motor de Renderizado PDF Híbrido**: `html2canvas` captura cada hoja como una imagen sobre un nodo DOM oculto (`#pdf-root`), y `jsPDF` las combina en un único documento — logrando reportes corporativos con texto y tablas nítidos.
* **Paginación Dinámica del PDF**: en los tres módulos, el propio código en el navegador estima cuánto espacio ocupa cada bloque de contenido (tabla de dispositivos, fila de fotos) y decide en tiempo real cuántas hojas generar, para que ninguna tabla ni foto se corte al pasar de página — sin importar cuántas fotos suba el técnico.
* **Dispositivos y Marcas Configurados por Datos**: las secciones de equipos a inspeccionar no están hardcodeadas por ATM — se calculan a partir del tipo de cajero y la marca (`constants/devices.js`, `constants/atm.jsx`), con normalización de mayúsculas/minúsculas para tolerar inconsistencias de la base de datos.
* **Theme Switcher**: Soporte nativo para modo Claro/Oscuro optimizado para visibilidad en exteriores e interiores.
* **Compresión de Imágenes en Cliente**: Todas las fotografías tomadas se redimensionan (máx. 1200×900) y convierten a formato `WebP` antes de ser adjuntadas, ahorrando ancho de banda y reduciendo dramáticamente el peso final del reporte.
* **PWA (Progressive Web App)**: instalable en dispositivos móviles de campo vía `vite-plugin-pwa`, con app shell precacheado.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18.2, Vite 5, CSS Vanilla (Design System) |
| **Enrutamiento** | React Router DOM 7 (rutas con lazy loading) |
| **Visualización de Datos** | Recharts 3.8 |
| **Exportación & Reportes** | jsPDF 4.2, html2canvas 1.4, SheetJS (xlsx) 0.18 |
| **PWA / Offline Shell** | vite-plugin-pwa |
| **Backend & Base de Datos** | Supabase (PostgreSQL, Row Level Security, Auth) |
| **Funciones Serverless** | Supabase Edge Functions (Deno): `manage-users`, `send-email` |
| **Despliegue (Hosting)** | Vercel |

---

## 📂 Estructura del Proyecto

```text
├── public/                    # Assets estáticos (Logos, favicons)
├── src/
│   ├── admin/                 # Layout y guard de rutas del backoffice (AdminLayout, ProtectedRoute)
│   ├── components/            # UI reutilizable (PhotoUploader, SectionBlock, ItemCard, PdfPhotoGrid, Toast...)
│   │   └── checklist/         # Tabs y layout del formulario de Mantenimiento Preventivo
│   ├── constants/              # Diccionarios de datos: ATMs/marcas (atm.jsx), dispositivos por tipo (devices.js),
│   │                           # lógica de voltajes/"sin acceso" (voltages.js), grupos de email (emailGrupos.js)
│   ├── hooks/                  # Custom hooks (useAuth, useTheme, useIsMobile, useAtmLookup, useTecnicos,
│   │                           # useMpDraft, useMpSubmit)
│   ├── lib/                    # Configuración de clientes externos (cliente Supabase)
│   ├── pages/                  # Vistas de la app: HomePage, *FormPage (MP/C2D/Auditoría), *PdfView, PdfPreviewPage
│   │   └── admin/               # Páginas del backoffice (Dashboard, Mantenimientos, C2D, ATMs, Técnicos, Usuarios...)
│   │       └── auditorias/       # Vistas de detalle/listado propias del módulo de Auditorías
│   ├── services/                # Lógica de negocio: mantenimientoService, c2dService, auditoriaService,
│   │                             # pdfService (generación), emailService (envío), csvExport
│   ├── App.jsx                  # Formulario de Mantenimiento Preventivo (orquesta los tabs de checklist/)
│   ├── router.jsx               # Árbol de rutas de la SPA (lazy loading por página)
│   └── main.jsx                 # Entry point de React
├── supabase/                   # Configuración Backend
│   ├── functions/               # Código fuente Deno para Edge Functions
│   └── seed/                    # Esquema base, políticas RLS y migraciones incrementales (C2D, auditorías,
│                                 # normalización de marcas/clientes, etc.)
├── vercel.json                  # Reglas de enrutamiento SPA y Cabeceras de Seguridad
└── vite.config.js               # Configuración del bundler y PWA
```

---

## ⚙️ Instalación y Configuración Local

### Requisitos Previos
- [Node.js](https://nodejs.org/) (v18 o superior)
- CLI de Supabase (`npm i -g supabase`)

### 1. Clonar el repositorio

```bash
git clone https://github.com/AlexanderGamonal/CheckList-preventivo.git
cd CheckList-preventivo
npm install
```

### 2. Variables de Entorno

Crear un archivo `.env.local` en la raíz del proyecto con la configuración de tu proyecto Supabase:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
VITE_SUPABASE_FUNCTIONS_URL=https://<tu-proyecto>.supabase.co/functions/v1
VITE_SUPABASE_ANON_KEY_PUBLIC=<tu-anon-key>
```

### 3. Configuración de Base de Datos (Supabase)

Desde el **SQL Editor** de Supabase, ejecuta los scripts de `supabase/seed/` en orden cronológico: empezando por `schema.sql` (esquema base) y `seed.sql` (datos semilla), seguido de las migraciones incrementales (soporte de Auditorías, tabla y columnas de C2D, políticas de borrado, modelos Hyosung, normalización de marcas/clientes, prefijos BBVA, etc.) en el orden en que fueron agregadas al repositorio.

### 4. Despliegue de Edge Functions (Opcional para uso local)

Para habilitar la invitación de usuarios y el envío de correos, despliega las funciones en tu proyecto Supabase:

```bash
npx supabase functions deploy manage-users --no-verify-jwt
npx supabase functions deploy send-email
```

**Variables (Secrets) requeridas en Supabase:**
- `ALLOWED_ORIGIN`: URL del frontend.
- `GMAIL_USER` / `GMAIL_APP_PASSWORD`: Credenciales SMTP.

### 5. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Rutas útiles durante el desarrollo:
- `/preview` — vista previa del PDF de Mantenimiento Preventivo con datos de muestra (sin depender del formulario real).
- `/specs` — especificaciones técnicas del proyecto.
- `/dev/colors` — preview del design system (paleta de colores, solo en desarrollo).

---

## 🔒 Seguridad y Compliance

- **Cero Credenciales en Código**: Uso estricto de variables de entorno para llaves públicas. Las llaves privilegiadas (`service_role_key`) existen exclusivamente en el entorno aislado de las Edge Functions.
- **Row Level Security (RLS)**: El acceso a los datos está segmentado a nivel de base de datos en PostgreSQL. Los técnicos solo pueden insertar registros, pero la lectura y modificación requiere autenticación obligatoria.
- **Cabeceras HTTP Restrictivas**: Configuración activa en `vercel.json` contra ataques comunes (Clickjacking, XSS, Sniffing).

---

> Propiedad Intelectual — Uso interno reservado.
