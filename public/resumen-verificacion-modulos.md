# IP‑NEXUS — Resumen de verificación (módulos + linter)

Fecha: 2026-01-20  
Alcance: verificación rápida de módulos (LEGAL‑OPS, COLLAB, ONBOARDING, NOTIFICATIONS) + pendientes menores del linter + ajuste de navegación Backoffice + **CONSOLIDACIÓN IMPORT**.

---

## 1) Pendientes menores del linter

### 1.1 79 funciones sin `search_path` definido (WARN)
- **¿Causa problemas ahora?** Normalmente **no rompe** el funcionamiento diario.
- **Riesgo real:** es una **recomendación de seguridad/higiene** para evitar que una función ejecute objetos de un esquema inesperado si el `search_path` cambia.
- **Cuándo sí puede doler:** si existen funciones **SECURITY DEFINER** o si hay esquemas/objetos con nombres "sombrados" (shadowing) que puedan ser explotados.

**Recomendación:** ir corrigiéndolo progresivamente (especialmente en funciones `SECURITY DEFINER`) añadiendo `SET search_path = public` (o el/los esquemas estrictos que correspondan).

### 1.2 2 tablas con RLS habilitado pero sin políticas - **RESUELTO**

| Tabla | Tiene org_id | Uso |
|-------|--------------|-----|
| `webhook_events` | ❌ No | Eventos de webhooks entrantes (source/event_type) |
| `api_rate_limits` | ❌ No (via api_key_id) | Rate limiting por API key |

**Análisis:** Ambas tablas son de **uso interno** (Edge Functions con `service_role`). No tienen `organization_id` directo.

**Decisión:** Mantener RLS habilitado **sin policies** = deny all desde cliente (comportamiento correcto). Solo accesibles via Edge Functions.

---

## 2) Verificación de módulos

### 2.1 LEGAL‑OPS
- **Estado:** existe (carpetas/páginas/componentes/hooks presentes).
- **Madurez:** UI bastante completa; **lógica parcial** (hay hooks o flujos aún con comportamiento incompleto/mocks en algunos puntos).
- **Observación clave:** **solapamiento** importante con CRM por la visión tipo "Cliente 360°".

**Recomendación:** definir frontera clara (LEGAL‑OPS vs CRM) o plan de convergencia para evitar duplicación funcional.

### 2.2 COLLAB
- **Estado:** existe (páginas/componentes/hooks).
- **Madurez:** UI completa y **conectada a Supabase**.
- **Solapamiento:** parcial; potencial integración con Legal‑Ops (portal/colaboración vs operaciones internas).

**Recomendación:** mantener, y diseñar puntos de integración (timeline, portal, permisos EXTERNAL).

### 2.3 ONBOARDING
- **Estado:** hay **dos sistemas**:
  - Onboarding de **organización/tenant**.
  - Onboarding de **cliente** dentro de Legal‑Ops.
- **Duplicación:** **no**; cubren propósitos distintos.

**Recomendación:** mantener separados, pero unificar copy/UX si comparten pasos (consistencia).

### 2.4 NOTIFICATIONS
- **Estado:** sistema unificado (hooks principales para notificaciones y push).
- **Duplicación:** **no**; `portal_notifications` aparece como variante específica del portal/Collab.

**Recomendación:** OK; revisar solo preferencias por rol/owner_type cuando se amplíen módulos.

---

## 3) Backoffice — Navegación

### Cambio aplicado
- Se añadió **Calendar** al sidebar del **Backoffice** apuntando a:
  - `/backoffice/calendar`
- **Exclusividad:** solo aparece en el menú del Backoffice (no en la App).

---

## 4) CONSOLIDACIÓN SISTEMA DE IMPORT (PROMPT-FIX-2) ✅

### Estado: COMPLETADO

Se consolidaron **3 sistemas** de ingesta de datos en el **Data Hub**:

| Sistema Original | Función | Destino |
|-----------------|---------|---------|
| `/app/data-hub` | Imports CSV/Excel básicos + Conectores | Hub principal |
| `/app/import` | Framework universal multi-source | `/app/data-hub?tab=universal` |
| `/app/migrator` | Migraciones avanzadas PI (Anaqua, PatSnap) | `/app/data-hub?tab=migrator` |

### Tabs Consolidados en Data Hub

| Tab | Función |
|-----|---------|
| Vista General | Dashboard rápido + acciones |
| Importaciones | Historial de imports CSV/Excel |
| Conectores | APIs externas (EUIPO, WIPO, etc.) |
| Sincronización | Jobs de sync programados |
| **Migrator** | Proyectos de migración PI |
| **Universal** | Import multi-source + Shadow Mode |

### Cambios en Sidebar

- ❌ **Migrator removido** del menú (ahora es tab en Data Hub)
- ✅ **Collab** visible en menú principal

### Archivos Creados

```
src/pages/app/data-hub/migrator-tab.tsx   # UI de migraciones PI
src/pages/app/data-hub/universal-tab.tsx  # UI de import universal
src/pages/app/migrator/redirect.tsx       # Redirect legacy
src/pages/app/import/redirect.tsx         # Redirect legacy
```

### Rutas Actualizadas en App.tsx

```tsx
// Redirects automáticos:
/app/migrator     → /app/data-hub?tab=migrator
/app/migrator/new → /app/data-hub?tab=migrator
/app/migrator/:id → /app/data-hub?tab=migrator
```

---

## 5) Rutas Huérfanas - VERIFICADAS ✅

| Ruta | Estado | Acceso |
|------|--------|--------|
| `/app/analytics` | ✅ Existe | Via rutas, añadir a sidebar si deseado |
| `/app/reports` | ✅ Existe | Via rutas |
| `/app/filing` | ✅ Existe | Via rutas |
| `/app/workflow` | ✅ Existe | Via rutas |

---

## 6) Siguientes Pasos (Opcionales)

1. ~~Consolidar sistemas de import~~ ✅ HECHO
2. Añadir Analytics/Reports/Filing/Workflow al sidebar (si se desea visibilidad directa)
3. Priorizar `search_path` en funciones sensibles (SECURITY DEFINER / auth / billing)
4. Limpiar archivos legacy de `/app/migrator` y `/app/import` (opcional, redirects activos)

---

Última actualización: 2026-01-20
