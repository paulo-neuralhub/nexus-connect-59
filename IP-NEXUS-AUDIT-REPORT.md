# IP-NEXUS — Audit Report (Estado actual)

> Generado: 2026-01-24
>
> Fuente (evidencia):
> - Routing: `src/App.tsx`
> - Backoffice shell: `src/layouts/backoffice-layout.tsx`
> - Documentación interna: `IP-NEXUS-TECHNICAL-DOCUMENTATION.md`
> - Supabase schema snapshot: `security--get_table_schema` (Total tablas: **391**)
> - Supabase linter: `supabase--linter` (**103 issues**)
> - Edge Functions: directorio `supabase/functions/*`

---

## 1) Resumen ejecutivo

### 1.1 ¿Qué es IP-NEXUS?

IP‑NEXUS es un **ecosistema multi‑tenant** para gestión de Propiedad Intelectual (PI) y operación del negocio, compuesto por:

- **APP (tenant)**: SaaS para despachos/empresas/agentes → `/app/*`
- **BACKOFFICE (staff)**: administración central (tenants, billing, AI Brain, auditoría) → `/backoffice/*`
- **Portal externo**: acceso de clientes finales → `/portal/:slug/*`
- **Firma pública**: flujo de firma sin login → `/sign/:token`

### 1.2 Propósito y público objetivo

- **Público APP**: despachos PI/Legal, equipos in‑house, agentes.
- **Público Backoffice**: equipo IP‑NEXUS (staff) para operar suscripciones, incidencias, métricas y control.

### 1.3 Stack tecnológico

**Frontend**

- React 18 + TypeScript + Vite
- React Router v6
- Tailwind CSS + shadcn/ui
- TanStack Query (server state)
- React Hook Form + Zod
- dnd‑kit (drag & drop)

**Backend (Supabase)**

- Postgres (RLS)
- Supabase Auth
- Supabase Storage
- Edge Functions (Deno)

---

## 2) Módulos implementados (por áreas + rutas)

> Criterio de “estado”:
> - ✅ **Funcional**: end‑to‑end observable
> - 🔶 **Parcial**: UI/queries existen pero flujo incompleto o depende de secrets/terceros
> - ⬜ **Placeholder/Mock**: UI existe pero simula
> - ❌ **No implementado**

### 2.1 Público (Landing/Auth)

| Módulo | Propósito | Rutas | Estado | Evidencia |
|---|---|---|:--:|---|
| Landing | Captación | `/` | 🔶 | `src/pages/Landing.tsx` |
| Pricing | Precios | `/pricing` | 🔶 | `src/pages/pricing.tsx` |
| Auth | Login/registro/reset | `/login`, `/register`, `/forgot-password`, `/reset-password` | ✅ | `src/pages/auth/*` |

### 2.2 APP (tenant) — Core

| Módulo | Propósito | Rutas (principales) | Estado |
|---|---|---|:--:|
| Dashboard | KPIs + accesos | `/app/dashboard` | 🔶 |
| Search | búsqueda global | `/app/search` | 🔶 |
| Settings | ajustes org/usuario | `/app/settings/*` | ✅/🔶 |
| Help | help center + tickets | `/app/help/*` | 🔶 |

### 2.3 APP — Docket (Expedientes)

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Docket | gestión de expedientes | `/app/docket`, `/app/docket/:id`, `/app/docket/new`, `/app/docket/:id/edit` | 🔶 |
| Deadlines | vencimientos/agenda | `/app/docket/deadlines` | 🔶 |

### 2.4 APP — CRM (v2)

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| CRM Dashboard | overview CRM | `/app/crm` | 🔶 |
| Accounts | empresas/cuentas | `/app/crm/accounts`, `/app/crm/accounts/:id` | 🔶 |
| Contacts | contactos | `/app/crm/contacts`, `/app/crm/contacts/:id` | 🔶 |
| Leads | leads | `/app/crm/leads` | 🔶 |
| Deals | oportunidades | `/app/crm/deals`, `/app/crm/deals/:id` | 🔶 |
| Pipelines | pipelines | `/app/crm/pipelines` | 🔶 |
| Interactions | interacciones | `/app/crm/interactions` | 🔶 |
| Tasks | tareas | `/app/crm/tasks` | 🔶 |

### 2.5 APP — Comunicaciones

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Inbox unificado | timeline multicanal | `/app/communications`, `/app/communications/:id` | 🔶 |
| WhatsApp | inbox WhatsApp | `/app/communications/whatsapp/*` | 🔶 |
| Email | inbox Email | `/app/communications/email/*` | 🔶 |

### 2.6 APP — Spider

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Spider | vigilancia/alertas | `/app/spider/*` | 🔶 |

### 2.7 APP — Genius (IA legal)

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Genius Chat | chat IA | `/app/genius` | 🔶 |
| Comparator | comparación | `/app/genius/comparator` | 🔶 |
| Opposition | oposición | `/app/genius/opposition` | 🔶 |
| Translator | traducción | `/app/genius/translator` | 🔶 |
| Docs | documentos IA | `/app/genius/documents` | 🔶 |
| Templates | plantillas | `/app/genius/templates/*` | 🔶 |

### 2.8 APP — Data Hub / Import / Migrator

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Data Hub | ingesta consolidada | `/app/data-hub` | ✅/🔶 |
| Import‑Export | legacy import/export | `/app/data-hub/import-export` | 🔶 |
| Migrator (legacy) | redirigido | `/app/migrator*` → `/app/data-hub?tab=migrator` | ✅ |

### 2.9 APP — Finance + Time Tracking

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Finance | costes, facturas, renovaciones | `/app/finance/*` | 🔶 |
| Time tracking | tiempos y rates | `/app/timetracking/*` | 🔶 |

### 2.10 APP — Workflows / Filing / Analytics / Collab

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Workflow | automatización de procesos | `/app/workflow/*` | 🔶 |
| Filing | filings/solicitudes | `/app/filing/*` | 🔶 |
| Analytics | analítica | `/app/analytics/*` | 🔶 |
| Collab | colaboración/portal interno | `/app/collab/*` | 🔶 |

### 2.11 APP — Legal Ops

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Legal Ops | operaciones PI + “cliente 360” | `/app/legal-ops/*` | 🔶 |
| Firmas (Legal Ops) | firmas internas | `/app/legal-ops/signatures/*` | 🔶 |

---

## 3) Backoffice / Admin (rutas)

| Módulo | Propósito | Rutas | Estado |
|---|---|---|:--:|
| Dashboard | KPIs globales | `/backoffice` | 🔶 |
| Tenants | gestión orgs | `/backoffice/tenants` | 🔶 |
| Users | usuarios | `/backoffice/users` | 🔶 |
| Billing | billing global | `/backoffice/billing` | 🔶 |
| IPO Registry | gestión oficinas | `/backoffice/ipo/*` | 🔶 |
| AI Brain | providers/router/finops | `/backoffice/ai` | 🔶 |
| Knowledge Bases | KB legal | `/backoffice/knowledge-bases` | 🔶 |
| Calendar | calendar admin | `/backoffice/calendar` | 🔶 |
| Comunicaciones | inbox staff | `/backoffice/communications/*` | 🔶 |
| VoIP | administración VoIP | `/backoffice/voip` | 🔶 |
| Logs del sistema | visor logs (compat) | `/backoffice/logs` | ✅ |
| Alertas | visor/acciones | `/backoffice/alerts` | ✅ |
| Eventos | event log | `/backoffice/events` | 🔶 |
| Audit Logs | auditoría | `/backoffice/audit` | 🔶 |
| Settings | ajustes | `/backoffice/settings` | 🔶 |
| Kill Switch | emergencias | `/backoffice/kill-switch` | 🔶 |

---

## 4) Funcionalidades por área (resumen real)

> Nota: esta sección sintetiza lo visible por rutas/hooks/DB; para profundidad por módulo, ver `IP-NEXUS-TECHNICAL-DOCUMENTATION.md`.

### 4.1 CRM

**Tablas base (observadas en schema):** `contacts`, `deals`, `pipelines`, `pipeline_stages`, `activities`.

- Contactos: CRUD y vistas (lista/detalle) (🔶)
- Cuentas/empresas (Accounts): vistas v2 (🔶)
- Deals: pipelines + etapas (🔶)
- Actividades (timeline): tipos email/call/whatsapp/meeting/note (tabla `activities`) (🔶)

### 4.2 Expedientes / Matters

**Tablas típicas (observadas en schema):** `matters`, `matter_documents`, `matter_deadlines` / `matter_deadline_summary` (view).

- CRUD expedientes + filtros básicos (🔶)
- Deadlines (🔶)
- Workflows conectables (ver módulo Workflow) (🔶)

### 4.3 VoIP / Telefonía

- Softphone widget persistente (Backoffice y App) (🔶)
- Tokens/transfer/webhook Twilio (Edge Functions: `twilio-voice-token`, `twilio-transfer-call`, `twilio-voice-webhook`) (🔶)
- Grabación/transcripción (tablas: `audio_transcriptions`, llamadas CRM: `crm_voip_calls` / `voip_*`) (🔶)

### 4.4 Comunicaciones

- WhatsApp inbox (🔶)
- Email inbox (🔶)
- Clasificación automática (Edge: `classify-communication`) (🔶)
- Templates seed (DB functions: `_crm_seed_default_email_templates`, `_crm_seed_default_whatsapp_templates`) (✅)

### 4.5 Documentos

- Storage + OCR/NER (Edge: `process-ocr`, `process-document-ner`, `parse-file`) (🔶)
- Document embeddings (tabla `document_embeddings`) (🔶; ver riesgo en Security Audit)

### 4.6 Calendario / Tareas

- Conexión + sync (Edge: `calendar-oauth-url`, `calendar-oauth-callback`, `calendar-sync`) (🔶)

### 4.7 Facturación / Billing

- Stripe: existe suite de Edge Functions (`stripe-*`) y tablas relacionadas, pero el flujo depende de secrets + configuración externa (🔶)

### 4.8 Backoffice / Admin

- Layout + gating staff (✅)
- Logs/Alertas (✅)
- AI Agent backoffice (✅ UI + Edge `backoffice-ai-agent`, motor configurable) (🔶)

---

## 5) Inteligencia Artificial (IA)

### 5.1 Dónde se usa IA (highlights por Edge Functions)

- **Genius chat**: `genius-chat`, `genius-chat-v2`, `genius-pro-chat`
- **Ayuda**: `nexus-guide-chat`, `genius-help`
- **RAG**: `rag-search`
- **Legal**: `ai-legal-translate`, `legal-run-crawler`, `legal-sync-wipo`
- **Documentos**: `process-ocr`, `process-document-ner`, `generate-document-ai`
- **Import/Migración**: `auto-map-columns`, `ai-analyze-mapping`, `analyze-import-file`, `analyze-migration-file`
- **Backoffice agent**: `backoffice-ai-agent`
- **AI Brain/FinOps** (DB RPC): `ai_route_request`, `ai_get_finops_dashboard`, `ai_log_transaction_with_billing`, etc.

### 5.2 Modelos / APIs

- Hay soporte multi-provider (p.ej. secret `ANTHROPIC_API_KEY` presente).
- El motor concreto del agente Backoffice se gestiona por Router (Backoffice AI Brain) → **pendiente de parametrizar por task**.

---

## 6) Integraciones externas

| Servicio | Propósito | Estado | Evidencia |
|---|---|:--:|---|
| Supabase | DB/Auth/Storage/Functions | ✅ | `src/integrations/supabase/*` |
| Stripe | pagos/suscripciones | 🔶 (bloqueado por secrets/webhooks) | `supabase/functions/stripe-*` |
| Twilio | VoIP | 🔶 | `supabase/functions/twilio-*` |
| AI Providers | Claude/Gemini/etc. | 🔶/✅ | `ai-*`, `genius-*`, `assistant-*` |
| Calendars (Google/MS) | OAuth + sync | 🔶 | `supabase/functions/calendar-*` |

---

## 7) Edge Functions (inventario)

- **Endpoint base**: `https://dcdbpmbzizzzzdfkvohl.supabase.co/functions/v1/<function>`
- Inventario completo: ver `docs/audit/EDGE-FUNCTIONS-INVENTORY.md`.

---

## 8) Sistema de eventos/logs

### 8.1 Logs

- Tabla base: `public.system_events` (existente)
- Capa compat prompt: `public.system_events_log` (**VIEW**) con campos estilo `occurred_at/category/...`
- UI Backoffice: `/backoffice/logs`

### 8.2 Alertas

- Tabla: `public.system_alerts`
- View: `public.v_active_alerts` (usada por Backoffice)
- UI Backoffice: `/backoffice/alerts`

### 8.3 Categorías de eventos

En `system_events_log` (compat) se mapean categorías típicas: `auth`, `subscription`, `payment`, `voip`, `crm`, `system`, `security`, `support`, `ai`.

---

## 9) Roles y permisos

### 9.1 Roles (app)

Roles por `memberships.role` (ver documentación interna): owner/admin/manager/member/viewer/external (modelo objetivo).

### 9.2 Seguridad DB / RLS

- RLS ampliamente habilitado.
- Linter: **103 issues** (ver `SECURITY-AUDIT-REPORT-2026-01-22.md`).
- Hallazgos críticos destacados:
  - RLS sin policies en `api_rate_limits`, `webhook_events` (patrón deny-all recomendado)
  - Policies peligrosas con `WITH CHECK true` en algunas tablas
  - `invoices` demasiado abierto (requiere RBAC)
  - `document_embeddings.chunk_text` potencialmente sensible

---

## 10) UI/UX

### 10.1 Design system

- Tokens HSL en `src/index.css`
- Tailwind tokens en `tailwind.config.ts` (semantic tokens: `primary`, `secondary`, `background`, `module.*`, `backoffice.*`)
- Tipografías: Inter + JetBrains Mono

### 10.2 Responsive

- App layout incluye mobile header + bottom nav.
- Backoffice es principalmente desktop-first (sidebar fijo).

---

## 11) Gaps y placeholders (lo más relevante)

- **Stripe**: flujo completo depende de secrets + webhooks externos (🔶)
- **Embeddings KB**: existe `match_knowledge` + columna vector; falta pipeline de generación/refresh de embeddings (🔶)
- **Hardening seguridad**: hay deuda en policies/RLS/search_path según audit (🔶)
- **Varios módulos**: UI extensa pero parte de los conectores/sync y migraciones están en estado parcial o mock según documentación interna (🔶/⬜)

---

## 12) Métricas y analytics

- UI: `/app/analytics`, `/backoffice/product-analytics` (🔶)
- Tablas/funciones: `analytics_*`, `aggregate-analytics`, `generate-report`, `analytics-run-report` (🔶)

---

## Totales (snapshot)

- Tablas (public): **391**
- Edge Functions (carpetas): ver inventario (doc)
- Linter issues: **103**

---

## Anexos

- `docs/audit/EDGE-FUNCTIONS-INVENTORY.md` — listado completo de Edge Functions (con endpoint)
- `docs/audit/DB-SCHEMA-EXPORT.sql` — SQL para exportar columnas/relaciones desde Supabase (para generar un inventario “full”) 
