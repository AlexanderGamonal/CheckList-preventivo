# 🏧 CheckList Preventivo & Auditoría ATM

![React](https://img.shields.io/badge/React-18.2.0-blue.svg?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5.0.8-646CFF.svg?style=for-the-badge&logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-DB_%26_Auth-3ECF8E.svg?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000.svg?style=for-the-badge&logo=vercel)

Aplicación web integral para la **gestión, registro y auditoría de cajeros automáticos (ATM)**. Diseñada para uso en campo (técnicos y auditores), permite completar formularios estructurados, capturar evidencias fotográficas, generar informes PDF profesionales multipágina y enviarlos por correo electrónico directamente desde el navegador.

---

## 🚀 Módulos Principales

El sistema se divide en dos grandes módulos operativos orientados al personal en campo, más un panel de control administrativo.

### 1. 📋 Check List (Mantenimiento Preventivo)
Formulario paso a paso para mantenimientos de rutina.
- **Flujo Guiado**: Información general, Site, Voltajes, Dispositivos, Cierre y captura de fotos (Antes/Después).
- **Control de Estado**: Indicadores visuales y validación estricta de campos obligatorios.
- **Reporte Rápido**: Generación de PDF consolidado de 1 a 2 páginas con resumen ejecutivo.

### 2. 📝 Acta de Auditoría (Nueva Funcionalidad)
Módulo avanzado para auditorías profundas de hardware y software.
- **Análisis Eléctrico**: Captura y validación inteligente de voltajes L-T, L-N y N-T tanto para ATM como para UPS.
- **Evidencias por Componente**: Captura de fotografías independientes (comprimidas en WebP) para Dispensador, Aceptador, Lectora, CPU, Shutter, etc.
- **Cassettes Dinámicos**: Configuración automática de la cantidad de cassettes (4 o 5) dependiendo de la marca del equipo (NCR, GRG, Hyosung vs Diebold).
- **Estados Rápidos**: Clasificación visual rápida por dispositivo (✅ OK, ⚠ Mantenimiento, ❌ Cambio de repuesto).
- **PDF Dinámico Multipágina**: Algoritmo de renderizado que calcula el espacio disponible en tiempo real para agrupar fotos sin cortes de página.

### 3. 🛡️ Panel de Administración (Backoffice)
Centro de control para coordinadores y supervisores (Ruta: `/admin`).
- **Dashboard Estadístico**: KPIs en tiempo real y gráficos de tendencia sobre el estado operativo de la red.
- **Gestión Integral**: ABM (Alta, Baja, Modificación) de ATMs, Técnicos, Usuarios y Contactos de correo.
- **Historial y Exportación**: Filtrado avanzado de intervenciones y exportación de data cruda a CSV.
- **Roles y Permisos**: Accesos jerárquicos (`Admin` para lectura/reportes y `Superadmin` para configuración total).

---

## ✨ Características Técnicas Destacadas

*   **Offline-First (Borrador Automático)**: El progreso de los formularios se guarda continuamente en el `localStorage` del navegador, previniendo la pérdida de datos ante cierres accidentales.
*   **Motor de Renderizado PDF Híbrido**: Utiliza `html2canvas` (escalado a 2x de resolución) sobre un nodo DOM oculto combinado con `jsPDF` para asegurar documentos estéticos, corporativos y con textos nítidos.
*   **Theme Switcher**: Soporte nativo para modo Claro/Oscuro optimizado para visibilidad en exteriores e interiores.
*   **Compresión de Imágenes en Cliente**: Todas las fotografías tomadas se redimensionan y convierten a formato `WebP` antes de ser adjuntadas, ahorrando ancho de banda y reduciendo dramáticamente el peso final del reporte.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18, Vite, CSS Vanilla (Design System) |
| **Enrutamiento** | React Router DOM v7 |
| **Visualización de Datos**| Recharts |
| **Exportación & Reportes**| jsPDF, html2canvas, SheetJS (xlsx) |
| **Backend & Base de Datos**| Supabase (PostgreSQL, Row Level Security, Auth) |
| **Funciones Serverless** | Supabase Edge Functions (Deno) |
| **Despliegue (Hosting)** | Vercel |

---

## 📂 Estructura del Proyecto

```text
├── public/                 # Assets estáticos (Logos, favicons)
├── src/
│   ├── admin/              # Layout y Rutas protegidas (Backoffice)
│   ├── components/         # UI Components reutilizables (Inputs, Cards, PhotoUploader)
│   ├── constants/          # Diccionarios de datos (ATMs, Modelos, Validaciones)
│   ├── hooks/              # Custom Hooks (useTheme, useAuth, useIsMobile)
│   ├── lib/                # Configuración de clientes externos (Supabase)
│   ├── pages/              # Vistas de la aplicación (Home, Formulario, Admin)
│   ├── services/           # Lógica de negocio (pdfService, emailService, bdService)
│   ├── App.jsx             # Punto de entrada de Formularios
│   ├── router.jsx          # Configuración del árbol de rutas (Lazy Loading)
│   └── main.jsx            # Entry point de React
├── supabase/               # Configuración Backend
│   ├── functions/          # Código fuente Deno para Edge Functions
│   └── seed/               # Migraciones SQL, Políticas RLS y Datos Semilla
├── vercel.json             # Reglas de enrutamiento SPA y Cabeceras de Seguridad
└── vite.config.js          # Configuración del bundler y PWA
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

Desde el **SQL Editor** de Supabase, ejecuta los scripts de migración ubicados en `supabase/seed/` en el siguiente orden sugerido:

1. `schema.sql` (Esquema base y tablas primarias)
2. `add_auditorias_table.sql` / `add_auditorias_missing_fields.sql` (Módulo de Auditorías)
3. `add_delete_policies.sql` (Políticas de seguridad RLS)
4. `add_hyosung_models.sql` (Datos base)

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

---

## 🔒 Seguridad y Compliance

- **Cero Credenciales en Código**: Uso estricto de variables de entorno para llaves públicas. Las llaves privilegiadas (`service_role_key`) existen exclusivamente en el entorno aislado de las Edge Functions.
- **Row Level Security (RLS)**: El acceso a los datos está segmentado a nivel de base de datos en PostgreSQL. Los técnicos solo pueden insertar registros, pero la lectura y modificación requiere autenticación obligatoria.
- **Cabeceras HTTP Restrictivas**: Configuración activa en `vercel.json` contra ataques comunes (Clickjacking, XSS, Sniffing).

---

> Propiedad Intelectual — Uso interno reservado.
