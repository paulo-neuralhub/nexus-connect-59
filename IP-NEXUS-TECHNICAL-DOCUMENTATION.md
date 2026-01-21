# IP-NEXUS — Documentación Técnica (Estado actual)

> **Objetivo**: referencia exhaustiva para analizar la app (QA, bugs, mejoras, nuevas funcionalidades) y entender qué está **✅ real**, **🔶 parcial**, **⬜ mock**, **❌ ausente**.
>
> **Fecha**: 2026-01-21

---

## Convenciones de estado

- ✅ **Funcional**: implementado end-to-end
- 🔶 **Parcial**: UI existe pero backend/DB/flujo incompleto
- ⬜ **Mock/Placeholder**: UI o Edge Function simula resultados
- ❌ **No implementado**

---

# PARTE 1: VISIÓN GENERAL

## 1.1 Descripción del proyecto

IP-NEXUS es un **ecosistema multi-tenant** (APP para clientes + BACKOFFICE para superadmins + Portal externo) construido sobre:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind + shadcn/ui + React Router v6
- **Server State**: TanStack Query
- **Backend**: Supabase (Postgres + Auth + Storage + Edge Functions Deno)

Arquitectura de routing (alto nivel):

- **Público**: `/`, `/login`, `/register`, `/pricing`, etc.
- **APP (tenant)**: `/app/*` (protegido por Auth + Organización)
- **BACKOFFICE**: `/backoffice/*` (protegido por Auth + rol superadmin)
- **Portal externo (clientes finales)**: `/portal/:slug/*` (auth propia portal)
- **Firma pública**: `/sign/:token`

---

## 1.2 Estructura de carpetas (resumen)

```
src/
  components/         UI y features (incluye layout, backoffice, data-hub, etc.)
  contexts/           Contextos (auth, organization, page, ...)
  hooks/              Hooks (React Query + lógica de módulos)
  integrations/       Cliente Supabase + integraciones
  layouts/            Layouts (Backoffice)
  lib/                Utils, constants, registry de módulos, etc.
  pages/              Páginas por routing (app, backoffice, auth, portal)
  types/              Tipos TS por dominio

supabase/
  functions/          Edge Functions (Deno)
  migrations/         (solo lectura en este entorno)
```

---

## 1.3 Configuración (lo observable desde el repo)

### Variables de entorno

- Frontend usa `import.meta.env.*` (ej. `import.meta.env.DEV` se usa en `OrganizationProvider`).
- Edge Functions usan `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (patrón estándar) + secrets específicos según integración.

> ⚠️ Nota: el `.env` local existe en root, pero no se documentan valores aquí por seguridad.

### Dependencias clave (highlights)

- `react-router-dom` (routing)
- `@tanstack/react-query` (queries/mutations)
- `@supabase/supabase-js` (DB/Auth/Storage/Functions)
- `zod` (validación)
- `framer-motion` (animaciones)
- `@dnd-kit/*` (drag & drop)

---

# PARTE 2: AUTENTICACIÓN Y USUARIOS

## 2.1 Sistema de autenticación

**Archivo principal**: `src/contexts/auth-context.tsx`

### Flujo

- `AuthProvider` escucha `supabase.auth.onAuthStateChange`.
- Mantiene `user`, `session`, y un `profile` que se obtiene de la tabla `public.users`.
- Login: `supabase.auth.signInWithPassword({ email, password })`
- Registro: `supabase.auth.signUp(...)` con `emailRedirectTo`.
- Reset password: `supabase.auth.resetPasswordForEmail`.

**Estado**: ✅ (base auth funcional)

### Tabla de perfil usada

- **No usa** `profiles`; usa `public.users`.
- `fetchProfile(userId)` → `supabase.from('users').select('*').eq('id', userId)`.

> ⚠️ Señal de deuda técnica: la app mezcla conceptos de `users` (tabla propia) con `auth.users` (Supabase Auth). Hay que validar RLS/policies para evitar exposición.

---

## 2.2 Multi-tenant: organizaciones y memberships

**Archivo**: `src/contexts/organization-context.tsx`

### Flujo

- Carga memberships del usuario: `from('memberships').select('*').eq('user_id', effectiveUser.id)`
- Luego carga organizaciones: `from('organizations').select('*').in('id', orgIds)`
- Guarda organización actual en `localStorage` (`ip-nexus-current-org`).

### Roles/Permisos (simplificado)

- `hasPermission(module, action)` basado en `ROLES` (de `src/lib/constants`).
- `hasAddon(addon)` tiene una excepción importante:
  - En `DEV`, devuelve **true** para todo (TODO para producción).

**Estado**: 🔶 (funcional, pero con bypass en DEV y sin permisos granulares por módulo en DB)

---

## 2.3 Rutas protegidas

- `src/components/layout/auth-guard` (protección auth)
- `src/components/layout/org-guard` (protección por organización)
- `src/components/layout/app-layout.tsx` encapsula todo `/app/*` con ambos guards.
- Backoffice se protege con `AuthGuard` + `useIsSuperadmin()` dentro del layout.

**Estado**: ✅

---

# PARTE 3: NAVEGACIÓN Y LAYOUT

## 3.1 Estructura completa de rutas (App.tsx)

**Archivo**: `src/App.tsx`

### Tabla de rutas principales

| Ruta | Componente | Protegida | Notas |
|---|---|---:|---|
| `/` | `Landing` | No | Landing |
| `/market` | `MarketLandingPage` | No | Landing market |
| `/pricing` | `PricingPage` | No | Pricing |
| `/login` | `Login` | No | Auth |
| `/register` | `Register` | No | Auth |
| `/forgot-password` | `ForgotPassword` | No | Auth |
| `/reset-password` | `ResetPassword` | No | Auth |
| `/onboarding` | `Onboarding` | Sí (auth) | Sin org requerida |
| `/app/*` | `AppLayout` | Sí (auth + org) | Área principal |
| `/backoffice/*` | `BackofficeLayout` | Sí (auth + superadmin) | Admin |
| `/portal/:slug/*` | `PortalLayout` | Sí (portal auth) | Portal externo |
| `/sign/:token` | `SignDocumentPage` | No | Firma pública |

### Subrutas `/app/*` (extracto relevante)

- `/app/dashboard` → Dashboard
- `/app/docket/*` → Docket (matters/deadlines)
- `/app/data-hub` → DataHub (consolidación de ingesta)
- `/app/data-hub/import-export` → pantalla import/export legacy
- `/app/spider/*`, `/app/crm/*`, `/app/marketing/*`, `/app/market/*`, `/app/genius/*`, `/app/finance/*`, `/app/timetracking/*`
- `/app/reports`, `/app/alerts/*`, `/app/help/*`, `/app/settings/*`
- `/app/workflow/*`, `/app/filing/*`, `/app/collab/*`, `/app/analytics/*`
- `/app/migrator/*` → **redirige** a `'/app/data-hub?tab=migrator'`

**Estado**: ✅

---

## 3.2 Layouts

### App layout (tenant)

**Archivo**: `src/components/layout/app-layout.tsx`

- Mobile:
  - `MobileHeader`, `MobileBottomNav`, `OfflineBanner`, `PWAInstallPrompt`
  - contenido en `<main>` scrollable
- Desktop:
  - `DynamicSidebar` + `Header` + `<Outlet />`
  - `TrialBanner` + `NexusGuideButton`

**Estado**: ✅

### Backoffice layout

**Archivo**: `src/layouts/backoffice-layout.tsx`

- Sidebar estático con secciones: Core, Registry, Tools, Compliance, System
- Gate: `useIsSuperadmin()`; si no → redirect a `/app`

**Estado**: ✅

---

## 3.3 Sidebar (APP)

**Archivo**: `src/components/layout/DynamicSidebar.tsx`

### Items definidos

**Core**
- Dashboard → `/app/dashboard`

**Modules (licencia requerida)**
- Docket → `/app/docket`
- Data Hub → `/app/data-hub`
- Spider → `/app/spider`
- CRM → `/app/crm`
- Marketing → `/app/marketing`
- Market → `/app/market`
- Genius → `/app/genius`
- Finance → `/app/finance`
- Tiempo → `/app/timetracking` (usa módulo finance)
- Legal Ops → `/app/legal-ops`
- Firmas → `/app/legal-ops/signatures` (badge: pending)
- Workflow → `/app/workflow` (core)

**Utilities**
- Alertas IA → `/app/alerts` (badge: predictive alerts)
- Migrator → `/app/migrator` (pero en routing redirige a Data Hub)
- Ayuda → `/app/help`

**Settings**
- Configuración → `/app/settings`

**Estado**: 🔶 (funcional, pero contiene colores hardcodeados en varios items; además el ítem “Migrator” lleva a ruta redirigida)

---

## 3.4 Sidebar (BACKOFFICE)

**Archivo**: `src/layouts/backoffice-layout.tsx`

Secciones:

- **Core**: Dashboard, Tenants, Users, Billing
- **Registry**: IPO Registry, AI Brain, Knowledge Bases
- **Tools**: Calendar, Feature Flags, API Keys, Announcements
- **Compliance**: KYC Review, Moderation, Compliance
- **System**: Audit Logs, Feedback, Settings, Kill Switch

**Estado**: ✅

---

# PARTE 4: MÓDULOS FUNCIONALES (APP)

> Nota: para “exhaustivo total”, se recomienda completar cada módulo con su checklist; aquí se documenta **lo observable por rutas/hooks/tipos** y estado general.

## 4.1 Data Hub (Ingesta de datos)

**Ubicación**: `/app/data-hub`

### Archivos

- Páginas: `src/pages/app/data-hub/*`
- Hooks:
  - `src/hooks/use-data-hub.ts` (imports v1 + connectors + sync)
  - `src/hooks/use-import-jobs.ts` (import_jobs universal)
  - `src/hooks/use-shadow-import.ts`
  - `src/hooks/import-export/use-import-jobs-v2.ts` (import_jobs_v2)
  - `src/hooks/import-export/use-migration.ts` (migration_configs / migration_jobs)
- Tipos:
  - `src/types/data-hub.ts`
  - `src/types/universal-import.ts`
  - `src/types/import-export.ts`

### Funcionalidades (actual)

| Funcionalidad | Estado | Notas |
|---|:---:|---|
| Crear import (subir fichero a Storage) | ✅ | `useCreateImport()` sube a bucket `matter-documents` |
| Parse file (CSV/JSON) | ✅ | Edge `parse-file` (Excel server-side no) |
| Guardar mapping y validar | 🔶 | Invoca `validate-import`; depende de implementación backend |
| Ejecutar import | 🔶 | Edge `execute-import` inserta demo/simulado en tables destino |
| Plantillas de import | ✅ | `import_templates` (system + per-org) |
| Conectores (CRUD) | ✅ | `data_connectors` + modal |
| Test conector | 🔶/⬜ | Edge `test-connector` suele ser simulado según conector |
| Sync conector | 🔶/⬜ | Edge `sync-connector` suele ser simulado según conector |
| Sync jobs monitor | ✅ | tabla `sync_jobs` |
| Consolidación migrator | ✅ | `/app/migrator` redirige a Data Hub |

### Wizard steps

- Import (wizard UI): **Upload → Configure → Mapping → Preview → Import** (según `src/pages/app/data-hub/import.tsx` resumen previo).

### Tipos de archivo

- ✅ CSV, JSON (server-side)
- 🔶 Excel: requiere procesamiento cliente (Edge `parse-file` devuelve error para Excel)

### Mapeo de campos (cómo funciona)

- Import v1: `imports.mapping` (JSON) + `imports.options`.
- Universal: `import_jobs.config` + `field_mappings` (según `universal-import.ts`).
- Migración: `migration_files.column_mapping` + `migration_files.transformations`.

---

## 4.2 Migrator (legacy / consolidado)

**Routing**:

- En `App.tsx`, `/app/migrator*` redirige a `'/app/data-hub?tab=migrator'`.
- Existe carpeta `src/pages/app/migrator/` (legacy) + wizard `src/pages/app/migrator/wizard.tsx`.

### Funcionalidades (hook principal)

**Archivo**: `src/hooks/use-migration.ts`

| Funcionalidad | Estado | Notas |
|---|:---:|---|
| Proyectos de migración (`migration_projects`) | ✅ | CRUD básico + polling por status |
| Subida de archivos (`migration_files`) | ✅ | Sube a bucket `migrations` |
| Análisis de archivo | 🔶 | Edge `analyze-migration-file` (depende implementación) |
| Validación de archivo | 🔶 | Edge `validate-migration-file` |
| Ejecutar migración | 🔶/⬜ | Edge `execute-migration` simula transform/insert |
| Cancelar migración | ✅ | update status |
| Logs | ✅ | `migration_logs` |
| Auto-mapeo AI | 🔶/⬜ | `auto-map-columns` existe, depende implementación/keys |

### Sistemas origen soportados

- Definiciones de sistemas: `src/lib/constants/migration-systems.ts`
- Pruebas de conexión: Edge `test-migration-connection` cubre varios `system_type`.

> ⚠️ Importante: “Portal Web user/pass” no ejecuta scraping real (Edge Functions no corren headless browser en este proyecto).

---

## 4.3 Universal Import + Shadow mode

**Modelo**: `import_sources` + `import_jobs` + `import_files` (+ `shadow_data` / `shadow_comparison` en `import_jobs`).

**Hook**: `src/hooks/use-import-jobs.ts`

| Funcionalidad | Estado | Notas |
|---|:---:|---|
| Crear job (`import_jobs`) | ✅ | status `pending/queued` |
| Start/resume job | 🔶 | llama a Edge `execute-import-job` (no aparece en listado de funciones; posible deuda/rename) |
| Pausar/cancelar | ✅ | updates DB |
| Rollback | 🔶 | llama a Edge `rollback-import-job` (validar existencia) |

**Shadow mode**

- Hook: `src/hooks/use-shadow-import.ts`
- Edge: `execute-shadow-import` + `apply-shadow-import` + `validate-shadow-data`
- Estado global: ⬜/🔶 (comparación y aplicación suelen ser mock/simuladas)

---

# PARTE 5: BACKOFFICE / ADMIN

## 5.1 Acceso

- Ruta base: `/backoffice/*`
- Protección:
  - `AuthGuard` a nivel de ruta
  - `BackofficeLayout` comprueba `useIsSuperadmin()` y redirige si no.

## 5.2 Módulos (por rutas)

| Ruta | Módulo | Estado |
|---|---|:---:|
| `/backoffice` | Dashboard | 🔶 (depende implementación página) |
| `/backoffice/tenants` | Tenants | 🔶 |
| `/backoffice/users` | Users | 🔶 |
| `/backoffice/billing` | Billing | 🔶 |
| `/backoffice/ipo/*` | IPO Registry | 🔶 |
| `/backoffice/ai` | AI Brain | 🔶 |
| `/backoffice/knowledge-bases` | Knowledge Bases | 🔶 |
| `/backoffice/calendar` | Calendar | 🔶 |
| `/backoffice/feature-flags` | Feature Flags | 🔶 |
| `/backoffice/api-keys` | API Keys | 🔶 |
| `/backoffice/announcements` | Announcements | 🔶 |
| `/backoffice/kyc-review` | KYC Review | 🔶 |
| `/backoffice/moderation` | Moderation | 🔶 |
| `/backoffice/compliance` | Compliance | 🔶 |
| `/backoffice/audit` | Audit Logs | 🔶 |
| `/backoffice/feedback` | Feedback | 🔶 |
| `/backoffice/settings` | Settings | 🔶 |
| `/backoffice/kill-switch` | Kill Switch | 🔶 |

> Nota: el estado exacto por módulo depende de cada página/hook. Esta tabla refleja presencia en routing + layout.

---

# PARTE 6: BASE DE DATOS

## 6.1 Resumen

- Total de tablas detectadas: **322** (según snapshot del schema)

Este documento **detalla completamente** las tablas más relevantes para:

1) **Multi-tenant/core** (users, organizations, memberships)
2) **Ingesta de datos** (imports/import_jobs/import_jobs_v2, connectors, migrator)
3) **Módulos con alto impacto** (CRM, workflow, filings, AI, etc.)

Para auditoría completa de todas las tablas, ver **Anexo A** (cómo regenerar inventario/policies vía SQL).

---

## 6.2 Tablas clave — Importación/Migración (detalladas)

> ⚠️ **Nota**: las columnas exactas/relaciones/RLS deben validarse contra el esquema real (DB). Este documento se basa en:
> - uso observado en hooks (queries a tablas)
> - tipos TS
> - snapshot de schema + linter

### Tabla: `imports`

**Usada por**: `src/hooks/use-data-hub.ts`

- Columnas usadas por la app (por TS `src/types/data-hub.ts`):
  - `id uuid`
  - `organization_id uuid`
  - `import_type text`
  - `source_type text`
  - `file_name text`, `file_url text`, `file_size int`
  - `mapping jsonb`
  - `options jsonb`
  - `status text`
  - `total_rows int`, `processed_rows int`, `success_rows int`, `error_rows int`, `skipped_rows int`
  - `errors jsonb`
  - `created_ids uuid[]`, `updated_ids uuid[]`
  - `started_at timestamptz`, `completed_at timestamptz`
  - `created_at timestamptz`, `created_by uuid`

**Relaciones**: (esperado) `organization_id → organizations.id`, `created_by → users.id`.

**RLS**: ⚠️ ver “Anexo A: policies”.

### Tabla: `import_templates`

**Usada por**: `useImportTemplates`, `useSaveTemplate`.

- Campos por TS: `organization_id?`, `is_system`, `mapping`, `options`, etc.

### Tabla: `data_connectors`

**Usada por**: `useDataConnectors`, `useCreateConnector`, `useTestConnector`, `useSyncConnector`.

- Campos por TS: `connector_type`, `config`, `credentials`, `sync_enabled`, `sync_frequency`, `connection_status`, `last_sync_at`, etc.

### Tabla: `sync_jobs`

**Usada por**: `useSyncJobs`, `useSyncJob`.

- Relación observada: `connector_id` join `data_connectors(id, name, connector_type)`.

### Tablas: `migration_projects`, `migration_files`, `migration_logs`, `migration_templates`

**Usadas por**: `src/hooks/use-migration.ts`

- `migration_files.project_id → migration_projects.id`
- Bucket storage: `migrations`

### Tablas: `migration_configs`, `migration_jobs`

**Usadas por**: `src/hooks/import-export/use-migration.ts`

- `migration_jobs.migration_config_id → migration_configs.id`

### Tablas: `import_sources`, `import_jobs`, `import_files` (universal)

**Usadas por**: `src/hooks/use-import-jobs.ts` y `src/hooks/use-shadow-import.ts`

- `import_jobs.source_id → import_sources.id` (join observado)

### Tablas: `import_jobs_v2`, `import_records`

**Usadas por**: `src/hooks/import-export/use-import-jobs-v2.ts`

- Rollback recorre `import_records` y borra en `matters`, `contacts`, `docket_entries`, `costs` según `entity_type`.

---

## 6.3 RLS / seguridad (estado y señales)

### Linter (Supabase)

- Issues detectados: **94**
- Tipos frecuentes:
  - `RLS Enabled No Policy` (info)
  - `Security Definer View` (error)
  - `Function Search Path Mutable` (warn)

**Estado**: 🔶 (hay señales de hardening pendiente; requiere revisión de policies y funciones)

---

## 6.4 Funciones SQL / Triggers / Views

No se listan aquí exhaustivamente (el proyecto tiene muchas). Ver **Anexo A** para queries que enumeran:

- funciones (`pg_proc` / `information_schema.routines`)
- triggers (`information_schema.triggers`)
- views (`information_schema.views`)

---

# PARTE 7: EDGE FUNCTIONS

## 7.1 Inventario (directorio)

**Ubicación**: `supabase/functions/*`

Funciones de **import/migración** (principalmente):

- `parse-file`
- `validate-import`
- `execute-import`
- `execute-shadow-import`
- `apply-shadow-import`
- `validate-shadow-data`
- `analyze-import-file`
- `analyze-migration-file`
- `validate-migration-file`
- `execute-migration`
- `execute-live-migration`
- `test-connector`
- `sync-connector`
- `test-migration-connection`
- `store-migration-credentials`
- `auto-map-columns`

> Nota: hay muchas más funciones (AI, Stripe, workflow, spider, etc.).

### Detalle (extracto) — Ingesta

#### `parse-file`
- **Archivo**: `supabase/functions/parse-file/index.ts`
- **Propósito**: parse CSV/JSON → `{ headers, rows, total_rows, preview }`
- **Input**: `multipart/form-data` con `file` y `options` (JSON)
- **Estado**: ✅ (CSV/JSON), ⚠️ Excel no soportado server-side

#### `execute-import`
- **Archivo**: `supabase/functions/execute-import/index.ts`
- **Input**: `{ import_id }`
- **Acción**: actualiza status + inserta datos demo/simulados en `matters` o `contacts`
- **Estado**: 🔶/⬜ (sirve de scaffolding; no es import productivo)

#### `execute-shadow-import`
- **Archivo**: `supabase/functions/execute-shadow-import/index.ts`
- **Input**: `{ organization_id, sourceId, fileIds, config, job_type }`
- **Output**: job con comparación mock
- **Estado**: ⬜ (simulación)

#### `execute-migration`
- **Archivo**: `supabase/functions/execute-migration/index.ts`
- **Input**: `{ project_id }`
- **Acción**: procesa archivos validados, transforma, inserta, loguea
- **Estado**: 🔶/⬜ (simulación parcial)

#### `execute-live-migration`
- **Archivo**: `supabase/functions/execute-live-migration/index.ts`
- **Input**: `{ connectionId, projectId, entities, options }`
- **Acción**: simula extracción live + inserta matters/contacts/deadlines
- **Estado**: ⬜ (simulado)

---

# PARTE 8: INTEGRACIONES EXTERNAS

## 8.1 Servicios

| Servicio | Propósito | Señales en repo | Estado |
|---|---|---|:---:|
| Supabase Auth | login/registro | `auth-context.tsx` | ✅ |
| Supabase DB | datos multi-tenant + módulos | múltiples hooks | ✅ |
| Supabase Storage | uploads imports/migraciones/docs | buckets `matter-documents`, `migrations` | ✅ |
| Stripe | billing | funciones `stripe-*` | 🔶 |
| AI Providers | chat/validación/mapeo | funciones `genius-*`, `ai-*`, `nexus-guide-chat` | 🔶 |
| IPO Search (EUIPO/TMView/WIPO) | búsqueda externa | `euipo-search`, `tmview-search`, `wipo-madrid-search` | 🔶/⬜ (según mocks) |
| Calendar (Google/Microsoft) | sync calendario | `calendar-*`, `sso-*` | 🔶 |
| Email | notificaciones | `send-email` | 🔶 |

> ⚠️ Según el estado actual, varias integraciones están preparadas pero aún con lógica simulada/heurística hasta añadir keys y lógica productiva.

---

# PARTE 9: HOOKS PERSONALIZADOS

La carpeta `src/hooks/` contiene muchos hooks por dominio (CRM, docket, finance, workflow, market, etc.).

Hooks directamente relevantes para ingesta/migración:

- `use-data-hub.ts`
- `use-import-jobs.ts`
- `use-shadow-import.ts`
- `import-export/use-import-jobs-v2.ts`
- `import-export/use-migration.ts`
- `use-migration.ts`

---

# PARTE 10: TIPOS TYPESCRIPT

Tipos clave por dominio:

- `src/types/data-hub.ts` → imports v1 + connectors + sync
- `src/types/universal-import.ts` → import universal + shadow
- `src/types/migration.ts` y `src/types/migration-advanced.ts` → migrator
- `src/types/import-export.ts` → import/export/migration wizard (legacy)

---

# PARTE 11: ESTADO GLOBAL (resumen)

| Área | UI | Backend | DB | Edge Fn | Estado |
|---|---:|---:|---:|---:|---|
| Auth + org | ✅ | ✅ | ✅ | N/A | ✅ |
| Navegación/layout | ✅ | N/A | N/A | N/A | ✅ |
| Data Hub (import v1) | ✅ | 🔶 | ✅ | 🔶 | 🔶 |
| Universal/Shadow | 🔶 | 🔶/⬜ | ✅ | ⬜ | 🔶/⬜ |
| Migrator (legacy) | ✅ | 🔶/⬜ | ✅ | 🔶/⬜ | 🔶 |
| Conectores IPO | ✅ | ⬜/🔶 | ✅ | 🔶/⬜ | 🔶/⬜ |
| Backoffice | ✅ | 🔶 | ✅ | 🔶 | 🔶 |

---

# PARTE 12: DEUDA TÉCNICA / RIESGOS

1) **Duplicación**: existen **3 modelos** de import (`imports`, `import_jobs`, `import_jobs_v2`) + migración legacy.
2) **Excel parsing**: Edge `parse-file` no soporta Excel; hay que definir estrategia (cliente, worker, conversión).
3) **RLS/policies**: linter indica múltiples casos con RLS sin policies + views SECURITY DEFINER.
4) **Colores hardcodeados**: `DynamicSidebar` usa colores directos en props (no tokens semánticos).
5) **Funciones Edge referenciadas pero no confirmadas**: `execute-import-job`, `rollback-import-job` (validar existencia/nombre).

---

# ANEXO A — Queries útiles para inventario DB (tablas, columnas, RLS, funciones)

> Ejecutar en Supabase SQL editor.

### A1) Tablas y si tienen RLS

```sql
select
  n.nspname as schema,
  c.relname as table,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'r'
  and n.nspname = 'public'
order by c.relname;
```

### A2) Policies

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

### A3) Columnas por tabla

```sql
select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

### A4) Foreign keys

```sql
select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as referenced_table,
  ccu.column_name as referenced_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by tc.table_name;
```

### A5) Funciones (RPC)

```sql
select
  routine_schema,
  routine_name,
  data_type as returns
from information_schema.routines
where routine_schema = 'public'
order by routine_name;
```
