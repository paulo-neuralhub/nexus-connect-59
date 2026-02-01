# 🔍 IP-NEXUS — AUDITORÍA INTEGRAL DEL SISTEMA
## Fecha: 2026-02-01

---

# 📊 RESUMEN EJECUTIVO

## Métricas Generales del Sistema

| Métrica | Valor | Estado |
|---------|-------|--------|
| **Total Tablas** | 550 | ✅ Robusto |
| **Total Hooks** | 309 archivos | ✅ Extenso |
| **Total Componentes** | 59 carpetas de módulos | ✅ Modular |
| **Total Edge Functions** | 130+ funciones | ✅ Completo |
| **Total Funciones RPC** | 453 | ✅ Extenso |
| **Total Vistas** | 18 | ✅ Adecuado |
| **Total Índices** | 2,053 | ✅ Optimizado |
| **Total Políticas RLS** | 1,017 | ✅ Seguro |
| **Storage Buckets** | 13 | ✅ Organizado |

---

## 🏗️ Arquitectura por Módulos

### Distribución de Tablas por Dominio

| Módulo | Tablas | % del Total |
|--------|--------|-------------|
| 📦 OTHER | 233 | 42.4% |
| 🤖 AI BRAIN | 49 | 8.9% |
| 📄 DOCUMENTS | 40 | 7.3% |
| 📁 MATTERS | 27 | 4.9% |
| 📊 CRM | 26 | 4.7% |
| 👤 USERS/ORGS | 21 | 3.8% |
| 📧 COMMUNICATIONS | 20 | 3.6% |
| 🔗 INTEGRATIONS | 20 | 3.6% |
| ⏰ WORKFLOW | 18 | 3.3% |
| 💰 BILLING | 18 | 3.3% |
| 🔒 AUDIT/SECURITY | 18 | 3.3% |
| 🌍 MASTER DATA | 14 | 2.5% |
| 👥 CLIENTS | 13 | 2.4% |
| 📈 ANALYTICS | 12 | 2.2% |
| 🌐 PORTAL | 11 | 2.0% |
| 🕷️ VIGILANCIA | 10 | 1.8% |

---

## 🔒 SEGURIDAD

### Estado de Row Level Security (RLS)

| Métrica | Valor | Estado |
|---------|-------|--------|
| Tablas CON RLS | 544 | ✅ 98.9% |
| Tablas SIN RLS | 6 | ⚠️ A revisar |
| Políticas RLS totales | 1,017 | ✅ |

### ⚠️ Tablas con RLS habilitado PERO sin políticas (BLOQUEADAS)

Estas tablas tienen RLS activado pero ninguna política, lo que significa que **nadie puede acceder a los datos**:

| Tabla | Riesgo | Acción Requerida |
|-------|--------|------------------|
| `api_rate_limits` | 🟡 Bajo | Añadir policy o desactivar RLS |
| `webhook_events` | 🟡 Bajo | Añadir policy o desactivar RLS |

> **Nota:** Estas tablas son internas/sistema. El comportamiento de "deny all" puede ser intencional (solo acceso via service role).

### 🔴 Hallazgos del Linter de Seguridad

**Total Issues: 162**

| Tipo | Cantidad | Severidad |
|------|----------|-----------|
| Security Definer Views | 18 | 🔴 ERROR |
| RLS Enabled No Policy | 2 | 🟡 INFO |
| Otros | 142 | 🟡 WARN |

#### Vistas SIN `security_invoker` (ejecutan con permisos del creador)

Todas las 18 vistas del sistema ejecutan con permisos del creador, no del usuario que consulta:

```
1. matter_deadline_summary
2. organization_usage_stats
3. ipo_health_overview
4. ipo_expiring_credentials
5. signature_stats
6. ai_usage_monthly
7. sidebar_menu_view
8. backoffice_tenant_crm
9. crm_client_360_view
10. v_voip_calls_with_contact
11. v_voip_user_stats
12. v_pending_events
13. v_event_stats
14. v_voip_billing_summary
15. v_voip_global_stats
16. v_active_alerts
17. system_events_log
18. system_test_summary
```

**Recomendación:** Añadir `WITH (security_invoker = true)` a las vistas que exponen datos sensibles basados en el usuario actual.

---

## 📈 RENDIMIENTO

### Tablas con Mayor Indexación (Top 10)

| Tabla | Índices | Uso |
|-------|---------|-----|
| matters | 22 | Core del sistema |
| market_users | 14 | Marketplace |
| matters_v2 | 13 | Migración |
| help_articles | 13 | Documentación |
| crm_deals | 13 | CRM |
| system_events | 13 | Auditoría |
| contacts | 13 | CRM |
| crm_voip_calls | 12 | Telefonía |
| document_templates | 12 | Documentos |
| invoices | 10 | Facturación |

### Storage Buckets Configurados

| Bucket | Público | Límite | Tipos MIME |
|--------|---------|--------|------------|
| matters | ❌ | Sin límite | Todos |
| verification-documents | ❌ | 20MB | image/*, PDF |
| branding | ✅ | 2MB | Imágenes |
| comm_attachments | ❌ | Sin límite | Todos |
| demo-documents | ✅ | Sin límite | Todos |
| spider-logos | ✅ | 5MB | Imágenes |
| templates | ❌ | 20MB | Docs |
| documents | ❌ | 10MB | Docs + imágenes |
| images | ✅ | 5MB | Imágenes |
| matter-documents | ❌ | 10MB | Docs + imágenes |
| client-documents | ❌ | 10MB | Docs + imágenes |
| invoices | ❌ | 10MB | PDF |
| logos | ✅ | 5MB | Imágenes |

---

## 💻 CALIDAD DE CÓDIGO

### Métricas de Código

| Métrica | Valor | Estado |
|---------|-------|--------|
| Uso de `: any` | ~1,942 ocurrencias | 🟡 Refactor gradual |
| `console.log` | ~71 ocurrencias | 🟡 Limpiar antes de prod |
| TODO/FIXME/HACK | ~1,959 ocurrencias* | ⚠️ Revisar |
| Componentes con loading | 251+ archivos | ✅ Buen patrón |
| Componentes con error handling | 209+ archivos | ✅ Buen patrón |

> *Nota: Muchos matches de TODO son falsos positivos (palabras como "Todos", "todo" en español).

### Archivos con `console.log` (para limpiar)

```
src/pages/app/crm/v2/accounts/AccountDetail.tsx
src/hooks/useServiceCatalogManagement.ts
src/hooks/legal-ops/useClientDetail.ts
src/components/matters/wizard/ClientSelector.tsx
src/components/legal-ops/ClientTimeline.tsx
src/lib/portalAuth.ts
src/lib/performance/PerformanceMonitor.ts
src/lib/monitoring/sentry.ts
src/lib/logger.ts
src/hooks/use-matters-v2.ts
```

---

## 🏛️ ESTRUCTURA DE CARPETAS

### Hooks (src/hooks/) - 27 subcarpetas + archivos

```
├── admin/
├── ai-brain/          ← Sistema de IA
├── ai/
├── analytics/
├── audit/
├── backoffice/
├── collab/            ← Colaboración en tiempo real
├── communications/
├── crm/
├── docket/            ← Expedientes avanzados
├── filing/            ← Presentaciones oficiales
├── finance/
├── genius/            ← IA generativa
├── help/
├── import-export/
├── integrations/
├── legal-ops/
├── legal/
├── market/            ← Marketplace
├── signatures/
├── spider/            ← Vigilancia
├── timetracking/
├── tours/             ← Onboarding
├── voip/              ← Telefonía
├── whatsapp/
├── workflow/
└── 130+ archivos hook individuales
```

### Componentes (src/components/) - 59 carpetas

```
├── alerts/
├── analytics/
├── assistant/
├── auth/
├── automations/
├── backoffice/
├── branding/
├── clients/
├── collaboration/
├── common/
├── communications/
├── crm/
├── dashboard/
├── deadlines/
├── demo/
├── docket/
├── documents/
├── features/          ← Componentes de funcionalidades
├── genius/
├── help/
├── import-export/
├── inbox/
├── landing-pro/
├── landing/
├── layout/
├── legal-ops/
├── market/
├── matters/
├── mobile/
├── modules/
├── nexus-guide/
├── notifications/
├── offices/
├── onboarding/
├── portal-admin/
├── portal/
├── pwa/
├── quotes/
├── search/
├── service-catalog/
├── services/
├── settings/
├── shared/
├── signatures/
├── spider/
├── subscription/
├── super-admin/
├── telephony/
├── timetracking/
├── tours/
├── ui/               ← Componentes base shadcn
├── upgrade/
├── voip/
├── whatsapp/
├── widgets/
├── workflow/
└── workflows/
```

### Edge Functions (supabase/functions/) - 130+ funciones

Organizadas por dominio:
- **AI:** ai-analyze-mapping, ai-discover-models, ai-legal-translate, ai-validate-data, genius-chat-v2, etc.
- **Filing:** filing-calculate-fees, filing-submit, filing-validate
- **Documents:** extract-document-data, generate-document-ai, generate-document-pdf, generate-invoice-pdf
- **Integrations:** euipo-search, oepm-search, tmview-search, wipo-madrid-search
- **Telephony:** telephony-*, twilio-*, voip
- **Stripe:** stripe-checkout, stripe-webhook, stripe-portal
- **Demo:** seed-demo-* (10+ funciones de demo data)

---

## 🔗 INTEGRACIONES

### APIs Externas Configuradas

| Servicio | Propósito | Edge Function |
|----------|-----------|---------------|
| **Stripe** | Pagos | stripe-webhook, stripe-checkout |
| **Twilio** | VoIP/SMS | twilio-voice-*, send-sms |
| **WhatsApp** | Mensajería | whatsapp-webhook, send-whatsapp |
| **EUIPO** | Búsqueda marcas EU | euipo-search |
| **OEPM** | Búsqueda marcas ES | oepm-search |
| **TMView** | Búsqueda global | tmview-search |
| **WIPO Madrid** | Marcas internacionales | wipo-madrid-search |
| **Calendar (Google/Outlook)** | Sync calendarios | calendar-sync, calendar-oauth-* |
| **Resend/SendGrid** | Email | send-email |
| **Blockchain** | Timestamps | submit-timestamp |
| **SII/TicketBAI/Verifactu** | Facturación electrónica ES | submit-sii, submit-ticketbai, submit-verifactu |

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 🔴 Críticos (Requieren Acción Inmediata)

1. **18 Vistas sin `security_invoker`**
   - Riesgo: Las vistas ejecutan con permisos del creador
   - Impacto: Potencial exposición de datos entre tenants
   - Acción: Auditar cada vista y añadir `security_invoker = true` donde corresponda

2. **2 Tablas con RLS sin policies**
   - `api_rate_limits` y `webhook_events`
   - Impacto: Datos completamente inaccesibles
   - Acción: Añadir policy de "deny all" explícita o policy para service role

### 🟡 Importantes (Planificar para Sprint)

1. **~50 Tablas sin `organization_id`**
   - Algunas son master data (correcto)
   - Otras son sistema AI/Agent (correcto)
   - Revisar: tablas de automation, chatbot, analytics que podrían necesitarlo

2. **~30 Tablas sin `created_at`**
   - Dificulta auditoría y debugging
   - Acción: Añadir columna con trigger de auto-update

3. **~71 console.log en producción**
   - Impacto: Logs innecesarios, posible exposición de datos
   - Acción: Limpiar antes de release

### 🟢 Menores (Mejora Continua)

1. **~1,942 usos de `: any`**
   - Debilita type safety
   - Acción: Refactor gradual, priorizar hooks y componentes críticos

2. **Documentación de APIs**
   - Algunas Edge Functions sin documentación clara
   - Acción: Añadir JSDoc y README por función

---

## ✅ FORTALEZAS DEL SISTEMA

### Arquitectura
- ✅ Multi-tenant robusto con isolation por `organization_id`
- ✅ 98.9% de tablas con RLS habilitado
- ✅ Hooks modulares con React Query
- ✅ Componentes organizados por dominio
- ✅ Edge Functions bien organizadas

### Seguridad
- ✅ 1,017 políticas RLS activas
- ✅ Sistema de roles granular (RBAC)
- ✅ Auditoría de accesos implementada
- ✅ Storage con políticas por bucket

### Rendimiento
- ✅ 2,053 índices optimizados
- ✅ Vistas materializadas para reportes
- ✅ Queries optimizadas con índices compuestos

### Funcionalidad
- ✅ Sistema de IA completo (AI Brain)
- ✅ Integraciones con oficinas de PI
- ✅ Facturación electrónica española
- ✅ Portal de clientes
- ✅ VoIP integrado
- ✅ Marketplace

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Sprint Inmediato (1-2 días)

1. [ ] Auditar y corregir las 18 vistas sin `security_invoker`
2. [ ] Añadir policies a `api_rate_limits` y `webhook_events`
3. [ ] Eliminar console.log de los 10 archivos identificados

### Sprint Siguiente (1 semana)

1. [ ] Revisar tablas sin `organization_id` y añadir donde corresponda
2. [ ] Añadir `created_at` a las 30 tablas que lo necesitan
3. [ ] Refactorizar top 20 archivos con más uso de `any`

### Mejora Continua (Mensual)

1. [ ] Reducir uso de `any` en 50 archivos por sprint
2. [ ] Documentar Edge Functions
3. [ ] Añadir tests para funciones críticas
4. [ ] Revisar índices según query patterns

---

## 📁 ARCHIVOS RELACIONADOS

- `/docs/audit/DB-SCHEMA-EXPORT.sql` - Queries de exportación de schema
- `/SECURITY-AUDIT-REPORT-2026-01-22.md` - Auditoría de seguridad anterior
- `/memory/architecture/security-and-database-integrity-v2.md` - Notas de arquitectura

---

*Generado automáticamente por IP-NEXUS Audit Tool*
*Versión: 1.0 | Fecha: 2026-02-01*
