# IP-NEXUS — Estado actual de Importación y Migración de Datos (Data Hub)

> **Fecha**: 2026-01-21  
> **Alcance**: Documenta el estado actual (código + BD + edge functions) de los sistemas de **Data Hub**, **Migrator** y **(legacy) Universal Import**.

---

## 0) Resumen ejecutivo (arquitectura actual)

Actualmente existen **dos “familias”** de ingesta de datos coexistiendo:

1) **Data Hub (simple / legacy consolidado)**
   - UI principal: `/app/data-hub`
   - Tab “Importaciones” usa tabla `imports` + edge functions `validate-import` y `execute-import`.
   - Tab “Conectores” usa tabla `data_connectors` + `sync_jobs` y edge functions `test-connector` y `sync-connector`.
   - Tab “Migrator” integra UI de migración y conexiones (tablas `migration_*`) dentro de Data Hub, pero **siguen existiendo páginas legacy** `/app/migrator/*` (redireccionadas).

2) **Universal Import (v2 / “shadow import”)**
   - Modelo de datos: `import_sources`, `import_jobs`, `import_files`, `import_snapshots`, `import_mapping_templates`, `import_scraping_rules`, `import_sync_configs`.
   - Edge functions: `execute-shadow-import`, `apply-shadow-import` (y varias auxiliares como `analyze-import-file`).
   - UI legacy: `/app/import` (actualmente *mock*) y un tab “Universal” dentro de Data Hub.

**Nota clave**: Aunque “Migrator” e “Import Universal” están **redirigidos hacia Data Hub** como punto único de entrada, todavía hay **duplicación de UI/código** (páginas legacy y tabs consolidados) y **duplicación de modelos** (tabla `imports` vs `import_jobs/import_files/...`).

---

## 1) ESTRUCTURA DE ARCHIVOS

### 1.1 Páginas (rutas y archivos)

#### Data Hub — `/app/data-hub`

- **Ruta**: `/app/data-hub`  
  **Archivo**: `src/pages/app/data-hub/index.tsx`

Sub-páginas dentro de `src/pages/app/data-hub/`:

- `src/pages/app/data-hub/import.tsx`
  - UI de “Nueva Importación” (pasos + modal del wizard)
  - *Usa* `useCreateImport()` (tabla `imports`)

- `src/pages/app/data-hub/connectors.tsx`
  - Gestión de conectores (lista + crear + sync + eliminar)
  - *Usa* `useDataConnectors()`, `useSyncConnector()`, `useDeleteConnector()`

- `src/pages/app/data-hub/history.tsx`
  - Historial de importaciones (tabla `imports`)

- `src/pages/app/data-hub/import-export.tsx`
  - Pantalla “Import/Export” (wizards) asociada a hooks `hooks/import-export/*` (no auditado en detalle en este documento)

Tabs internas (no son rutas separadas, viven dentro de `DataHubPage`):

- `src/pages/app/data-hub/migrator-tab.tsx`
  - “Migrator” consolidado (lista proyectos + conexiones)

- `src/pages/app/data-hub/universal-tab.tsx`
  - “Universal Import” consolidado (shadow mode)

Componentes locales (solo Data Hub):

- `src/pages/app/data-hub/components/import-wizard-modal.tsx`
- `src/pages/app/data-hub/components/connector-modal.tsx`
- `src/pages/app/data-hub/components/export-modal.tsx`

#### Migrator (legacy) — `/app/migrator`

**Enrutado en App.tsx**: se redirige a Data Hub:

- `/app/migrator` → `/app/data-hub?tab=migrator`
- `/app/migrator/new` → `/app/data-hub?tab=migrator`
- `/app/migrator/:id` → `/app/data-hub?tab=migrator`

Archivos legacy aún presentes:

- `src/pages/app/migrator/index.tsx` (UI completa legacy: proyectos, conexiones, agentes, syncs)
- `src/pages/app/migrator/MigrationDetail.tsx`
- `src/pages/app/migrator/new.tsx`
- `src/pages/app/migrator/wizard.tsx` (wizard UI **placeholder**)
- `src/pages/app/migrator/redirect.tsx`

#### Import Universal (legacy) — `/app/import`

**Enrutado**:

- `src/pages/app/import/redirect.tsx`: `/app/import` → `/app/data-hub?tab=universal`

UI legacy existente (actualmente mock):

- `src/pages/app/import/index.tsx` (usa `mockSources` y `mockJobs`)
- `src/pages/app/import/source/*` (no auditado en este documento)
- `src/pages/app/import/job/*` (no auditado en este documento)

---

### 1.2 Hooks utilizados

#### Data Hub (tabla `imports` + `data_connectors` + `sync_jobs`)

- `src/hooks/use-data-hub.ts`
  - Importaciones (tabla `imports`)
    - `useImports()`
    - `useImport(id)`
    - `useCreateImport()` (sube archivo a Storage + crea registro)
    - `useValidateImport()` (invoca edge `validate-import`)
    - `useExecuteImport()` (invoca edge `execute-import`)
    - `useUpdateImport()`, `useCancelImport()`, `useDeleteImport()`
  - Templates (tabla `import_templates`)
    - `useImportTemplates()`, `useSaveTemplate()`, `useDeleteTemplate()`
  - Conectores (tabla `data_connectors`)
    - `useDataConnectors()`, `useDataConnector(id)`
    - `useCreateConnector()`, `useUpdateConnector()`, `useDeleteConnector()`
    - `useTestConnector()` (edge `test-connector`)
    - `useSyncConnector()` (edge `sync-connector`)
  - Sync Jobs (tabla `sync_jobs`)
    - `useSyncJobs(connectorId?)`, `useSyncJob(id)`
  - Parser (edge `parse-file`)
    - `useParseFile()`

#### Universal Import (tabla `import_*`)

- `src/hooks/use-shadow-import.ts`
  - `useShadowImport()` → edge `execute-shadow-import`
  - `useShadowComparison(jobId)` → lee `import_jobs.shadow_comparison`
  - `useApplyShadowImport()` → edge `apply-shadow-import`
  - `useValidateShadowData()` → intenta invocar `validate-shadow-data` (**no encontrado en supabase/functions**, probable pendiente/legacy)

- `src/hooks/use-import-sources.ts` → tabla `import_sources` + edge `test-import-source` (**no auditado; probable pendiente/no existente**)
- `src/hooks/use-import-jobs.ts` → tabla `import_jobs` + edge `execute-import-job` (**no auditado; probable pendiente/no existente**)
- `src/hooks/use-import-files.ts` → tabla `import_files` + edge `analyze-import-file` / `process-import-file` (**process-import-file no auditado; ver estado abajo**)

#### Migrator (tablas `migration_*`)

- `src/hooks/use-migration.ts`
  - Proyectos: `migration_projects`
  - Archivos: `migration_files`
  - Logs: `migration_logs`
  - Templates: `migration_templates`
  - Ejecución: edge `execute-migration`
  - Auto-mapeo: edge `auto-map-columns`

- `src/hooks/use-migration-connections.ts`
  - Conexiones: `migration_connections`
    - guarda credenciales via edge `store-migration-credentials`
    - test via edge `test-migration-connection`
  - Agentes: `migration_agents` (generación de secret **sin hashing**: TODO)
  - Syncs: `migration_syncs` / `migration_sync_history`
    - run sync: invoca `execute-migration-sync` (**no auditado / no confirmado como existente**)
  - Live migration: edge `execute-live-migration`

---

### 1.3 Componentes

#### Data Hub

- UI principal:
  - `src/pages/app/data-hub/index.tsx` (Tabs: overview/imports/connectors/sync/migrator/universal)
- Modales:
  - `src/pages/app/data-hub/components/import-wizard-modal.tsx`
  - `src/pages/app/data-hub/components/connector-modal.tsx`
  - `src/pages/app/data-hub/components/export-modal.tsx`

#### Migrator

- UI “Migrator Tab” (dentro de Data Hub):
  - `src/pages/app/data-hub/migrator-tab.tsx`

- Componentes feature (reutilizados por Migrator legacy y Migrator tab):
  - `src/components/features/migrator/connection-wizard.tsx`
  - `src/components/features/migrator/agent-panel.tsx`
  - `src/components/features/migrator/sync-config.tsx`
  - `src/components/features/migrator/sync-history.tsx`
  - `src/components/features/migrator/ai-field-mapper.tsx`
  - `src/components/features/migrator/scraping-monitor.tsx`
  - `src/components/features/migrator/index.ts`

#### Universal Import

- Componentes:
  - `src/components/import/shadow-comparison-view.tsx`
  - `src/components/import/post-import-validation.tsx`
  - `src/components/import/index.ts`
  - Wizards (suite import-export):
    - `src/components/import-export/import-wizard/*`
    - `src/components/import-export/migration-wizard/*`
    - `src/components/import-export/export-wizard/*`

---

### 1.4 Tipos TypeScript definidos

#### Data Hub

- `src/types/data-hub.ts`
  - `Import`, `ImportTemplate`, `DataConnector`, `SyncJob`, etc.
- `src/lib/constants/data-hub.ts`
  - catálogos UI: `IMPORT_TYPES`, `CONNECTOR_TYPES`, estados, fields mapping UI.

#### Migrator

- **Modelo legacy** (proyectos/archivos): `src/types/migration.ts`
- **Modelo avanzado** (conexiones/agentes/sync/scraping): `src/types/migration-advanced.ts`
- Catálogo de sistemas: `src/lib/constants/migration-systems.ts`

#### Universal Import

- `src/types/universal-import.ts`
  - `ImportSource`, `ImportJob`, `ImportFile`, `ShadowComparison`, `ImportSyncConfig`, etc.

---

## 2) TABLAS DE BASE DE DATOS

> **Nota**: A continuación se listan tablas directamente relacionadas con importación/migración detectadas por nombre (`%import%`, `%migration%`, `%connector%`, `%sync%`).

### 2.1 Tablas “Data Hub” (simple)

#### `imports`
- **FKs**:
  - `imports.organization_id → organizations.id (CASCADE)`
  - `imports.created_by → users.id`
- **RLS**:
  - `Org imports` (ALL) con `organization_id IN memberships`.

#### `import_templates`
- **FKs**:
  - `import_templates.organization_id → organizations.id (CASCADE)`
- **RLS**:
  - SELECT: `Org or system import_templates` (is_system=true OR org in memberships)
  - INSERT: `Org import_templates insert`
  - UPDATE: `Org import_templates update` (solo si `is_system=false`)
  - DELETE: `Org import_templates delete` (solo si `is_system=false`)
- **Triggers**:
  - `update_import_templates_updated_at` → `update_updated_at_column()`

#### `data_connectors`
- **FKs**:
  - `data_connectors.organization_id → organizations.id (CASCADE)`
- **RLS**:
  - `Org data_connectors` (ALL) con `organization_id IN memberships`.
- **Triggers**:
  - `update_data_connectors_updated_at` → `update_updated_at_column()`

#### `sync_jobs`
- **FKs**:
  - `sync_jobs.organization_id → organizations.id (CASCADE)`
  - `sync_jobs.connector_id → data_connectors.id (CASCADE)`
- **RLS**:
  - `Org sync_jobs` (ALL) con `organization_id IN memberships`.

#### `data_imports` (tabla adicional)
- **Estado**: existe en BD pero **no aparece referenciada** por el hook `use-data-hub.ts` (en el código revisado). Probable legado/alternativa.
- **FKs**:
  - `data_imports.organization_id → organizations.id (CASCADE)`
  - `data_imports.created_by → auth.users.id`
- **RLS**:
  - `data_imports_all` (ALL)
  - `data_imports_select` (SELECT)

---

### 2.2 Tablas “Universal Import (v2 / shadow)”

#### `import_sources`
- **FKs**:
  - `import_sources.organization_id → organizations.id (CASCADE)`
  - `import_sources.created_by → auth.users.id`
- **RLS**:
  - `Members can manage sources` (ALL)
  - `Users can view own org sources` (SELECT)
- **Triggers**:
  - `update_import_sources_updated_at` → `update_import_updated_at()`

#### `import_jobs`
- **FKs**:
  - `import_jobs.organization_id → organizations.id (CASCADE)`
  - `import_jobs.source_id → import_sources.id (SET NULL)`
  - `import_jobs.parent_job_id → import_jobs.id`
  - `import_jobs.created_by → auth.users.id`
- **RLS**:
  - `Members can manage jobs` (ALL)
  - `Users can view own org jobs` (SELECT)

#### `import_files`
- **FKs**:
  - `import_files.organization_id → organizations.id (CASCADE)`
  - `import_files.job_id → import_jobs.id (SET NULL)`
  - `import_files.uploaded_by → auth.users.id`
- **RLS**:
  - `Members can manage files` (ALL)
  - `Users can view own org files` (SELECT)

#### `import_snapshots`
- **FKs**:
  - `import_snapshots.organization_id → organizations.id (CASCADE)`
  - `import_snapshots.job_id → import_jobs.id (CASCADE)`
- **RLS**:
  - `Members can manage snapshots` (ALL)
  - `Users can view own org snapshots` (SELECT)

#### `import_mapping_templates`
- **FKs**:
  - `import_mapping_templates.organization_id → organizations.id`
- **RLS**:
  - `Members can manage own org templates` (ALL)
  - `Users can view templates` (SELECT; permite system templates y templates del org)
- **Triggers**:
  - `update_import_mapping_templates_updated_at` → `update_import_updated_at()`

#### `import_scraping_rules`
- **FKs**:
  - `import_scraping_rules.source_id → import_sources.id (CASCADE)`
- **RLS**:
  - `Members can manage scraping rules` (ALL)
  - `Users can view own org scraping rules` (SELECT)
- **Triggers**:
  - `update_import_scraping_rules_updated_at` → `update_import_updated_at()`

#### `import_sync_configs`
- **FKs**:
  - `import_sync_configs.organization_id → organizations.id (CASCADE)`
  - `import_sync_configs.source_id → import_sources.id (CASCADE)`
  - `import_sync_configs.last_sync_job_id → import_jobs.id`
- **RLS**:
  - `Members can manage sync configs` (ALL)
  - `Users can view own org sync configs` (SELECT)
- **Triggers**:
  - `update_import_sync_configs_updated_at` → `update_import_updated_at()`

#### `importable_fields`
- **RLS**:
  - `Anyone can view importable fields` (SELECT, role authenticated)

---

### 2.3 Tablas “Migrator”

#### `migration_projects`
- **FKs**:
  - `migration_projects.organization_id → organizations.id (CASCADE)`
  - `migration_projects.created_by → users.id`
- **RLS**:
  - `migration_projects_org` (ALL)

#### `migration_files`
- **FKs**:
  - `migration_files.organization_id → organizations.id (CASCADE)`
  - `migration_files.project_id → migration_projects.id (CASCADE)`
- **RLS**:
  - `migration_files_org` (ALL)

#### `migration_logs`
- **FKs**:
  - `migration_logs.project_id → migration_projects.id (CASCADE)`
  - `migration_logs.file_id → migration_files.id (SET NULL)`
- **RLS**:
  - `migration_logs_org` (ALL)

#### `migration_id_mapping`
- **FKs**:
  - `migration_id_mapping.project_id → migration_projects.id (CASCADE)`
- **RLS**:
  - `migration_id_mapping_org` (ALL)

#### `migration_templates`
- **RLS**:
  - `migration_templates_read` (SELECT true)

#### `migration_learned_mappings`
- **RLS**:
  - `Anyone can read learned mappings` (SELECT true)
  - `System can manage learned mappings` (ALL true)
  - ⚠️ **Nota**: estas policies son muy permisivas; revisar si es intencional.

#### `migration_connections`
- **FKs**:
  - `migration_connections.organization_id → organizations.id (CASCADE)`
  - `migration_connections.agent_id → migration_agents.id`
  - `migration_connections.created_by → auth.users.id`
- **RLS**:
  - `Users can view own org connections` (SELECT)
  - `Admins can manage connections` (ALL; role owner/admin)

#### `migration_agents`
- **FKs**:
  - `migration_agents.organization_id → organizations.id (CASCADE)`
- **RLS**:
  - `Users can view own org agents` (SELECT)
  - `Admins can manage agents` (ALL; role owner/admin)

#### `migration_syncs`
- **FKs**:
  - `migration_syncs.organization_id → organizations.id (CASCADE)`
  - `migration_syncs.connection_id → migration_connections.id (CASCADE)`
- **RLS**:
  - `Users can view own org syncs` (SELECT)
  - `Admins can manage syncs` (ALL; role owner/admin)

#### `migration_sync_history`
- **FKs**:
  - `migration_sync_history.sync_id → migration_syncs.id (CASCADE)`
- **RLS**:
  - `Users can view sync history` (SELECT)

#### `migration_scraping_sessions`
- **FKs**:
  - `migration_scraping_sessions.connection_id → migration_connections.id (CASCADE)`
  - `migration_scraping_sessions.project_id → migration_projects.id`
- **RLS**:
  - `Users can view scraping sessions` (SELECT)
  - `Admins can manage scraping sessions` (ALL; role owner/admin)

---

### 2.4 Funciones SQL / Triggers relacionados

- `public.update_import_updated_at()` → trigger function (usada por varias tablas `import_*`).
- `public.update_updated_at_column()` → trigger function (usada por `data_connectors`, `import_templates`, etc.).

Triggers detectados:

- `data_connectors.update_data_connectors_updated_at` → `update_updated_at_column()`
- `import_mapping_templates.update_import_mapping_templates_updated_at` → `update_import_updated_at()`
- `import_scraping_rules.update_import_scraping_rules_updated_at` → `update_import_updated_at()`
- `import_sources.update_import_sources_updated_at` → `update_import_updated_at()`
- `import_sync_configs.update_import_sync_configs_updated_at` → `update_import_updated_at()`
- `import_templates.update_import_templates_updated_at` → `update_updated_at_column()`

---

## 3) CONECTORES IMPLEMENTADOS

### 3.1 Conectores “Data Hub” (tabla `data_connectors`)

Definidos en `src/lib/constants/data-hub.ts`:

| Conector | Tipo | Estado | Config requerida (UI) | Edge Function |
|---|---|---|---|---|
| EUIPO | API (simulado) | 🔶 Parcial | `username`, `password` | `test-connector`, `sync-connector` |
| WIPO | API Key (simulado) | 🔶 Parcial | `api_key` | `test-connector`, `sync-connector` |
| TMView | API Key (simulado) | 🔶 Parcial | `api_key` | `test-connector`, `sync-connector` |
| OEPM | Certificado (placeholder) | ⬜ Placeholder | `certificate`, `password` | (no específico) |
| EPO | API Key (placeholder) | ⬜ Placeholder | `api_key` | (no específico) |
| USPTO | API Key (placeholder) | ⬜ Placeholder | `api_key` | (no específico) |
| UKIPO | API Key (placeholder) | ⬜ Placeholder | `api_key` | (no específico) |
| INPI (Fr) | API Key (placeholder) | ⬜ Placeholder | `api_key` | (no específico) |
| Custom API | API genérica (simulado) | 🔶 Parcial | `base_url`, `auth_type`, `auth_value?` | `test-connector`, `sync-connector` |

**Notas de implementación**:

- `supabase/functions/test-connector`: prueba **simulada** (no realiza llamadas reales externas).
- `supabase/functions/sync-connector`: crea `sync_jobs` y hace “sync” **simulado**, actualizando métricas.

### 3.2 “Migrator Connections” (tabla `migration_connections`)

Catálogo en `src/lib/constants/migration-systems.ts`:

| Sistema | Tipo | Estado | Auth soportado | Edge Function |
|---|---|---|---|---|
| Portal Web (Login) | Manual asistido (sin scraping real) | 🔶 Parcial | `basic_auth`, `session_cookie` | `test-migration-connection` |
| PatSnap | API | 🔶 Parcial | `oauth2`, `api_key` | `test-migration-connection` |
| Anaqua | API | 🔶 Parcial | `oauth2`, `api_key`, `basic_auth` | `test-migration-connection` |
| CPA Global | API / Session / Agent | 🔶 Parcial | `api_key`, `session_cookie`, `agent` | `test-migration-connection` |
| Dennemeyer | API / Session | 🔶 Parcial | `api_key`, `basic_auth`, `session_cookie` | `test-migration-connection` |
| IPAN | DB/Agent | ⬜ Placeholder | `database`, `agent` | `test-migration-connection` |
| Orbit | API | 🔶 Parcial | `oauth2`, `api_key` | `test-migration-connection` |
| Corsearch / Clarivate / Darts-IP / etc. | API | 🔶 Parcial | varios | `test-migration-connection` |
| Custom API / Custom DB | API/DB | ⬜ Placeholder | varios | `test-migration-connection` |

**Nota técnica**: `test-migration-connection` incluye funciones por `system_type`, pero en su mayoría son **tests “soft”/simulados** (sin conectividad real). Para `web_portal`, valida solo presencia de `username/password/base_url/login_url`.

### 3.3 Universal Import sources (tabla `import_sources`)

Definición conceptual en `src/types/universal-import.ts` (no todo tiene UI completa):

- `api`, `database`, `web_scraper`, `file_upload`, `email_forward`, `watched_folder`, `agent`

Estado: en el código revisado, hay hooks para CRUD, pero la UI legacy `/app/import` es **mock** y el tab “Universal” en Data Hub actúa como **overview**.

---

## 4) FUNCIONALIDADES POR MÓDULO

### 4.1 Data Hub (`/app/data-hub`)

#### Funcionalidades implementadas

- ✅ Dashboard/Overview (estadísticas básicas a partir de `imports`, `data_connectors`, `sync_jobs`).
- ✅ Import Wizard modal (creación + validación + ejecución) basado en tabla `imports`.
- 🔶 Parsing de archivos
  - Existe edge function `parse-file` (CSV/JSON), pero **Excel no se parsea** en server (devuelve error).
- 🔶 Conectores
  - CRUD de `data_connectors`.
  - Test/sync **simulados**.
- ✅ Sync Jobs
  - Lista `sync_jobs`.
- 🔶 Export
  - UI existe (`ExportModal`) pero exportación está **simulada** (no genera archivo real).

#### Wizard steps (import)

- UI del modal `ImportWizardModal`:
  1. Upload
  2. Mapping
  3. Preview
  4. Importing
  5. Complete

**Limitación actual**: el wizard usa `sourceColumns` demo (`['Columna A'...'Columna E']`). No está conectado al parser real de archivos.

#### Tipos de archivo soportados

- En UI: `.xlsx/.xls`, `.csv`, `.json`.
- Edge `parse-file`:
  - ✅ CSV
  - ✅ JSON
  - ❌ Excel (requiere librería / procesamiento client-side)

#### Mapeo de campos (cómo funciona)

- **Nivel UI**: selección de campos destino desde `MATTER_FIELD_OPTIONS` / `CONTACT_FIELD_OPTIONS`.
- **Nivel backend actual**: `validate-import` y `execute-import` no aplican parsing real del archivo; operan en modo demo.

---

### 4.2 Migrator (`/app/migrator`) — legacy y consolidado

#### Sistemas origen soportados

- Definidos por catálogo en `src/lib/constants/migration-systems.ts`.
- En el tab consolidado, se muestra `web_portal` + varios (PatSnap, Anaqua, ...).

#### Funcionalidades implementadas

- ✅ Conexiones (`migration_connections`)
  - Crear conexión (wizard) + test de conexión.
- 🔶 Credenciales
  - Edge `store-migration-credentials` retorna un `vault_id` **placeholder**.
  - En `useCreateConnection`, si no hay vault real, se guardan credenciales en `connection_config._temp_credentials` (**riesgo de seguridad / placeholder**).
- ✅ Proyectos (`migration_projects`) + archivos (`migration_files`)
  - Upload de archivo a Storage bucket `migrations`.
  - Edge `analyze-migration-file` genera análisis **simulado**.
  - Edge `validate-migration-file` valida mapping y sample data.
- 🔶 Ejecución (`execute-migration`)
  - Inserta datos en tablas core (matters/contacts/...) usando sample data + simulación de filas restantes.
- 🔶 Live migration (`execute-live-migration`)
  - Simula extracción por `system_type` y escribe en `matters`/`contacts`.

#### Wizard steps

- `src/components/features/migrator/connection-wizard.tsx` (Conexión):
  1. Sistema
  2. Autenticación
  3. Credenciales
  4. Probar
  5. Completar

- `src/pages/app/migrator/wizard.tsx` (Migración legacy):
  - UI placeholder con pasos: source/upload/mapping/config/review.
  - No crea registros reales.

#### AI mapping

- `useAutoMapColumns()` invoca edge `auto-map-columns` (no auditada en este documento).
- Existe tabla `migration_learned_mappings` y hook `use-ai-field-mapping.ts` que la utiliza.

---

### 4.3 Import Universal (`/app/import`) — si existe

#### Fuentes soportadas

- Tipos definidos en `src/types/universal-import.ts`: API, DB, web scraper, file upload, etc.

#### Shadow mode (qué es y cómo funciona)

**Objetivo**: simular el impacto de una importación antes de aplicar cambios.

Flujo actual:

1) `useShadowImport()` → edge `execute-shadow-import`
   - Crea un registro `import_jobs` con `job_type=shadow_sync`.
   - Genera `shadow_data` y `shadow_comparison` **mock**.

2) `useShadowComparison(jobId)` → lee `import_jobs.shadow_comparison`.

3) `useApplyShadowImport()` → edge `apply-shadow-import`
   - Crea snapshot `import_snapshots`.
   - Crea un “real job” `import_jobs` con `job_type=full_import`.
   - **No inserta realmente datos** en tablas core; computa conteos.

#### Jobs y monitoreo

- Tabla `import_jobs` con `progress` y `results`.
- Polling en `useImportJobs()` mientras haya `running/queued`.

---

## 5) NAVEGACIÓN Y MENÚS

### 5.1 Sidebar

Hay dos implementaciones:

- `src/components/layout/DynamicSidebar.tsx` (principal / licencias)
  - Incluye **Data Hub** (`/app/data-hub`) y también un item **Migrator** (`/app/migrator`).
  - Nota: aunque exista el item Migrator, la ruta está redirigida en `App.tsx` hacia Data Hub.

- `src/components/layout/sidebar.tsx` (alternativa/legacy)
  - Incluye Data Hub pero **no** Migrator.

### 5.2 Rutas definidas en `App.tsx`

Archivo: `src/App.tsx`

- Data Hub:
  - `Route path="data-hub" element={<DataHubPage />}`
  - `Route path="data-hub/import-export" element={<ImportExportPage />}`

- Migrator (redirigido a Data Hub):
  - `Route path="migrator" element={<Navigate to="/app/data-hub?tab=migrator" replace />}`
  - `Route path="migrator/new" ...`
  - `Route path="migrator/:id" ...`

- Import (redirigido a Data Hub en su propio archivo `src/pages/app/import/redirect.tsx`).

### 5.3 Subrutas y navegación interna

- Data Hub navega por query param: `?tab=overview|imports|connectors|sync|migrator|universal`.

---

## 6) EDGE FUNCTIONS (importación/migración)

> **Nota**: Listado centrado en las funciones directamente usadas por los hooks arriba.

### Data Hub (simple)

- `supabase/functions/validate-import`
  - **Propósito**: Validar una importación basada en registro `imports`.
  - **Input**: `{ import_id: string }`
  - **Output**: `{ success, valid, total_rows, valid_rows, errors, warnings }` (simulado)

- `supabase/functions/execute-import`
  - **Propósito**: Ejecutar una importación (crea registros reales solo de demo para matters/contacts).
  - **Input**: `{ import_id: string }`
  - **Output**: `{ success, created, updated, errors, created_ids, updated_ids }`

- `supabase/functions/parse-file`
  - **Propósito**: Parsear archivo (CSV/JSON).
  - **Input**: `multipart/form-data` con `file` y opcional `options`.
  - **Output**: `{ headers, rows, total_rows, preview }`
  - **Limitación**: Excel no soportado (responde 400).

- `supabase/functions/test-connector`
  - **Propósito**: Probar conexión para `data_connectors`.
  - **Input**: `{ connector_id: string }`
  - **Output**: `{ success, connection_status, last_error, test_result }` (simulado)

- `supabase/functions/sync-connector`
  - **Propósito**: Ejecutar sync para `data_connectors` y crear `sync_jobs`.
  - **Input**: `{ connector_id: string, sync_type?: string, filters?: object }`
  - **Output**: `{ success, sync_job_id, total_items, new_items, updated_items, errors, result }` (simulado)

### Universal Import (shadow)

- `supabase/functions/execute-shadow-import`
  - **Propósito**: Crear un job de shadow y guardar `shadow_data` y `shadow_comparison`.
  - **Input**: `{ organization_id, sourceId?, fileIds?, config, job_type? }`
  - **Output**: `import_jobs` (registro creado)
  - **Estado**: mock (no parsea realmente archivos)

- `supabase/functions/apply-shadow-import`
  - **Propósito**: Aplicar shadow job creando snapshot + job real.
  - **Input**: `{ shadow_job_id: string }`
  - **Output**: `{ success, job_id, results }` (conteos)
  - **Estado**: mock (no escribe datos en tablas core)

### Migrator

- `supabase/functions/store-migration-credentials`
  - **Propósito**: simular almacenamiento seguro de credenciales; devuelve `vault_id`.
  - **Input**: `{ credentials: object }`
  - **Output**: `{ success, vault_id, message }`
  - **Estado**: placeholder (no usa Vault real)

- `supabase/functions/test-migration-connection`
  - **Propósito**: validar/testear `migration_connections` según `system_type`.
  - **Input**: `{ connection_id: string }`
  - **Output**: `{ success, message, metadata? }`
  - **Estado**: tests mayormente simulados; `web_portal` valida campos mínimos.

- `supabase/functions/analyze-migration-file`
  - **Propósito**: analizar un `migration_files`.
  - **Input**: `{ file_id: string }`
  - **Output**: `{ success, analysis }` (simulado)

- `supabase/functions/validate-migration-file`
  - **Propósito**: validar mapping + sample data.
  - **Input**: `{ file_id: string }`
  - **Output**: `{ success, status, errors, warnings, error_count, warning_count }`

- `supabase/functions/execute-migration`
  - **Propósito**: ejecutar migración por proyecto (`migration_projects`) + archivos.
  - **Input**: `{ project_id: string }`
  - **Output**: `{ success, stats, total_migrated, total_failed }`
  - **Estado**: parcial; inserta usando sample data y simula el resto.

- `supabase/functions/execute-live-migration`
  - **Propósito**: migración “en vivo” a partir de `migration_connections`.
  - **Input**: `{ connectionId, projectId, entities, options? }`
  - **Output**: `{ success, message, stats }`
  - **Estado**: mock (genera data de ejemplo)

---

## 7) ESTADO DE IMPLEMENTACIÓN (matriz)

### Data Hub

- ✅ UI principal (tabs, métricas básicas)
- 🔶 Import Wizard (UI completa, backend demo)
  - Validación: 🔶 (simulada)
  - Ejecución: 🔶 (crea pocos registros reales, resto simulado)
  - Mapeo real desde archivo: ❌ (no parse real conectado al wizard)
- 🔶 Conectores
  - CRUD `data_connectors`: ✅
  - Test/sync real contra APIs externas: ❌ (simulado)
- ⬜ Export real: ❌ (simulado)

### Migrator

- ✅ CRUD conexiones (`migration_connections`) + wizard
- 🔶 Credenciales “seguras”
  - Vault real: ❌
  - Fallback `_temp_credentials` en DB: ⬜/⚠️ (solo dev)
- 🔶 Migración por archivos (analyze/validate/execute)
  - Parse/análisis real de archivo: ❌ (simulado)
  - Validación: 🔶 (basada en sample_data)
  - Inserción final: 🔶
- 🔶 Live migration: 🔶 (mock)
- 🔶 Syncs: UI/hook existen, edge function de ejecución no confirmada (pendiente)

### Universal Import

- ✅ Tab “Universal” en Data Hub (overview)
- 🔶 Shadow mode
  - Simulación de comparación: ✅ (mock)
  - Aplicación de cambios a tablas core: ❌ (solo conteos)
- `/app/import` legacy: ⬜ (UI mock)

---

## 8) DEPENDENCIAS EXTERNAS / SERVICIOS

### 8.1 Backend

- **Supabase**
  - DB (PostgreSQL)
  - Storage
  - Edge Functions (Deno)

### 8.2 Buckets de Storage referenciados en código

- `matter-documents` (usado por `useCreateImport()` para subir archivos de `imports`)
- `migrations` (usado por `useUploadMigrationFile()`)
- `import-files` (usado por `useUploadImportFile()` para universal import)

### 8.3 APIs de terceros (preparadas / simuladas)

- EUIPO / WIPO / TMView y otros conectores de PI
  - Actualmente la conectividad está **simulada** en edge functions.

### 8.4 IA / procesamiento

- Existen edge functions relacionadas con análisis / auto-mapeo (ej. `auto-map-columns`, `ai-analyze-mapping`) pero no se documentan en detalle aquí.

---

## 9) Hallazgos y puntos de deuda técnica (para planificación)

1) **Duplicación de modelo**: `imports` vs `import_jobs/import_files/...`.
2) **Excel parsing** no soportado en server (`parse-file` falla para xlsx).
3) **Credenciales de migración**: Vault real no implementado; existe fallback en DB.
4) **Conectores y migraciones**: gran parte de la lógica de extracción/sync está **mock**.
5) **RLS permisiva** en `migration_learned_mappings` (SELECT true y ALL true) → revisar.
6) **Migrator en Sidebar** apunta a `/app/migrator` pero la ruta se redirige; conviene alinear UX (solo Data Hub).
