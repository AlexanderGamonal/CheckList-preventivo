# CheckList ATM — Mantenimiento Preventivo

Aplicación web para la gestión y registro de mantenimientos preventivos de cajeros automáticos (ATM). Permite al técnico completar un checklist estructurado en campo, generar un informe PDF y enviarlo por correo electrónico, todo desde el navegador. Incluye un panel de administración con dashboard, historial de mantenimientos, gestión de ATMs, técnicos y usuarios.

---

## Características principales

### Formulario de checklist
- Registro guiado por secciones: **Información general**, **Site**, **Voltajes**, **Dispositivos**, **Cierre** y **Fotos**
- Indicadores visuales por tab del estado de completitud
- Validación de secciones obligatorias antes de habilitar el envío
- **Borrador automático** en `localStorage` — el progreso se conserva si se cierra el navegador accidentalmente
- Carga de fotos (antes y después) directamente desde el dispositivo
- Generación de **PDF profesional** con logo, tabla de dispositivos y observaciones
- Envío del informe por **correo electrónico** vía Supabase Edge Function

### Panel de administración (`/admin`)
- **Dashboard** con KPIs (total de mantenimientos, operativos, con observaciones, inoperativos) y gráficos de tendencia por período
- **Mantenimientos** — historial completo con filtros por fecha, ID ATM, punto, marca, técnico y estado; exportación a CSV
- **ATMs** — gestión de cajeros con cliente, marca y modelo
- **Técnicos** — registro de técnicos de mantenimiento
- **Usuarios** — invitación por email, asignación de roles (Admin / Superadmin) y eliminación de cuentas
- **Contactos Email** — lista de destinatarios para el envío automático de informes
- **Reset de datos** — borrado seguro de datos de prueba con confirmación por texto antes de cargar datos reales
- Control de acceso por roles: **Admin** (solo lectura de mantenimientos) y **Superadmin** (acceso total)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router DOM v7 |
| Gráficos | Recharts |
| Exportación | jsPDF + html2canvas (PDF), xlsx (CSV) |
| Backend / Auth / DB | Supabase (PostgreSQL + RLS + Auth) |
| Funciones serverless | Supabase Edge Functions (Deno) |
| Despliegue | Vercel |

---

## Estructura del proyecto

```
├── public/
│   └── robots.txt
├── src/
│   ├── admin/              # Layout y ProtectedRoute
│   ├── components/         # Componentes reutilizables
│   ├── constants/          # Definición de ATMs, dispositivos y voltajes
│   ├── hooks/              # useAuth, useAtmLookup, useTecnicos
│   ├── lib/                # Cliente Supabase
│   ├── pages/
│   │   ├── admin/          # Dashboard, Mantenimientos, ATMs, Técnicos, Usuarios, etc.
│   │   └── PdfPreviewPage.jsx
│   ├── services/           # pdfService, emailService, mantenimientoService, csvExport
│   ├── App.jsx             # Formulario principal de checklist
│   ├── router.jsx          # Rutas con lazy loading
│   └── main.jsx
├── supabase/
│   ├── functions/
│   │   ├── manage-users/   # Edge Function: gestión de usuarios Auth
│   │   └── send-email/     # Edge Function: envío de correos
│   └── seed/               # Scripts SQL: schema, políticas RLS, datos iniciales
├── vercel.json             # Headers de seguridad HTTP + rewrite SPA
└── vite.config.js          # Code splitting por vendor chunks
```

---

## Instalación y desarrollo local

### Requisitos previos
- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- CLI de Supabase (`npm install -g supabase`)

### 1. Clonar el repositorio

```bash
git clone https://github.com/AlexanderGamonal/CheckList-preventivo.git
cd CheckList-preventivo
npm install
```

### 2. Configurar variables de entorno

Crear el archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
VITE_SUPABASE_FUNCTIONS_URL=https://<tu-proyecto>.supabase.co/functions/v1
VITE_SUPABASE_ANON_KEY_PUBLIC=<tu-anon-key>
```

### 3. Configurar la base de datos

En el **SQL Editor** de Supabase, ejecutar en orden:

```
supabase/seed/schema.sql           -- Tablas y relaciones
supabase/seed/add_delete_policies.sql  -- Políticas RLS de eliminación
supabase/seed/seed.sql             -- Datos iniciales opcionales
```

### 4. Desplegar las Edge Functions

```bash
npx supabase functions deploy manage-users --no-verify-jwt
npx supabase functions deploy send-email
```

Agregar los siguientes **Secrets** en Supabase → Edge Functions → Secrets:

| Secret | Valor |
|---|---|
| `ALLOWED_ORIGIN` | URL de producción (ej. `https://mi-app.vercel.app`) |
| `RESEND_API_KEY` | API key de [Resend](https://resend.com) |

### 5. Iniciar en desarrollo

```bash
npm run dev
```

---

## Despliegue en Vercel

1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Agregar las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
3. Vercel detecta automáticamente Vite — no requiere configuración adicional
4. En Supabase → Authentication → URL Configuration, actualizar:
   - **Site URL**: `https://mi-app.vercel.app`
   - **Redirect URLs**: `https://mi-app.vercel.app/admin/set-password`

---

## Roles de usuario

| Rol | Permisos |
|---|---|
| **Admin** | Ver mantenimientos, exportar CSV |
| **Superadmin** | Acceso total: ATMs, técnicos, usuarios, contactos, reset de datos |

Los usuarios son invitados por email desde el panel `/admin/usuarios`. El primer superadmin debe crearse directamente desde el dashboard de Supabase.

---

## Seguridad

- Las credenciales sensibles nunca se incluyen en el repositorio (`.gitignore`)
- La `service_role_key` de Supabase solo existe como secret en las Edge Functions, nunca en el frontend
- Todas las tablas tienen políticas **Row Level Security (RLS)** activas
- Headers HTTP de seguridad configurados en `vercel.json`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`
- `robots.txt` bloquea la indexación por motores de búsqueda (uso interno)

---

## Licencia

Uso interno — todos los derechos reservados.
