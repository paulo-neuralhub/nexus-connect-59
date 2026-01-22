# IP-NEXUS — Security Audit Report (2026-01-22)

> Objetivo: convertir los hallazgos “FIX-CRITICAL” en una **lista accionable** (qué objetos están mal, riesgo, y SQL recomendado) **sin ejecutar cambios todavía**.

## 1) Snapshot

### 1.1 Señales automáticas

- Supabase DB Linter: **94 issues**
- Security scan: **109 findings**

### 1.2 Conteos relevantes (schema `public`)

- Funciones totales: **255**
- Funciones `SECURITY DEFINER`: **60**
- Funciones sin `search_path` fijo (riesgo): **204**

## 2) Hallazgos críticos confirmados (con objetos exactos)

### H1 — RLS habilitado sin policies (client-side)

**Tablas afectadas (RLS = true, policies = 0):**

- `public.api_rate_limits`
- `public.webhook_events`

**Riesgo:** si el cliente puede consultar estas tablas (aunque sea accidentalmente) se filtra telemetría, límites y eventos internos.

**Recomendación:** patrón **Deny All** (solo Edge Functions/service role).

> Nota: esto está alineado con vuestro estándar interno (“deny all” en tablas internas).

---

### H2 — Policies peligrosas (WITH CHECK true / USING true en writes)

Se han detectado policies con `WITH CHECK (true)` o `USING (true)` en operaciones de escritura (INSERT/UPDATE). Ejemplos:

- `public.access_audit_log` — `INSERT` con `with_check = true`
- `public.access_logs` — `INSERT` con `with_check = true`
- `public.analytics_events` — `INSERT` con `with_check = true`
- `public.analytics_feature_usage` — `INSERT` con `with_check = true`
- `public.organizations` — `INSERT` con `with_check = true` ("Users can create organizations")

**Riesgo:** si estas tablas son accesibles desde cliente, un usuario autenticado podría insertar datos arbitrarios.

**Recomendación:**
1) Para tablas internas: mover a **Deny All** (y solo inserción con service role).
2) Para `organizations` (onboarding): mantener la capacidad de crear org **pero** con validación robusta y evitando escalado a orgs ajenas.

---

### H3 — `invoices` demasiado abierto (exposición financiera)

**Policy actual:**

- `public.invoices` — `ALL` para `public` con `organization_id IN (memberships...)`

**Riesgo:** cualquier miembro de la org ve **todas** las facturas (cliente/importe/direcciones/IDs fiscales). El security scan lo marca como **error**.

**Recomendación (RBAC):** limitar `SELECT`/`UPDATE`/`DELETE` a roles (owner/admin/accounting) o a “asignado + manager”, según modelo.

---

### H4 — `document_embeddings.chunk_text` expone contenido sensible

**Tabla:** `public.document_embeddings`

**Columnas relevantes:**

- `organization_id` (NOT NULL)
- `chunk_text` (NOT NULL)
- `client_id` / `matter_id` (nullable)

**Estado RLS:** enabled ✅ (policy_count = 1)

**Riesgo:** aunque sea para búsqueda, `chunk_text` permite reconstruir documentos.

**Recomendación:** la política de `document_embeddings` debe **heredar** el mismo control de acceso que:

- el documento original (`matter_documents`/`client_documents`/`documents` según fuente)
- y/o el matter/client asociado

---

### H5 — `users` (perfiles) y riesgo de enumeración indirecta

**Policies actuales:**

- SELECT: "Users can view own profile" `USING (auth.uid() = id)`
- UPDATE: "Users can update own profile" `USING (auth.uid() = id)`
- INSERT: "Users can insert own profile" `WITH CHECK (id = auth.uid())`

**Comentario:** la tabla `users` en sí está razonablemente restringida, pero el scan alerta de riesgo por **joins** desde otras tablas que expongan `user_id` sin filtro correcto.

**Recomendación:** auditar tablas que contienen `user_id` + joins a `users` y asegurar que:

- o bien se selecciona solo `id`/campos no sensibles
- o se filtra por org/rol/assigned y no permite enumeración

## 3) Views: estado y discrepancia con linter

### 3.1 Views con `security_invoker=true` (OK)

- `public.ipo_expiring_credentials`
- `public.ipo_health_overview`
- `public.matter_deadline_summary`
- `public.organization_usage_stats`

### 3.2 Views sin `security_invoker` explícito (revisar)

- `public.signature_stats`

### 3.3 “Security Definer View” (linter)

El linter reporta al menos 1 **Security Definer View**, pero no se ha localizado vía `pg_class.reloptions` para `relkind='v'`/`'m'`.

**Hipótesis:**

1) es un objeto no cubierto por `pg_views` (p.ej. `relkind` distinto) o
2) el linter está detectando un patrón en el `viewdef` aunque no esté en `reloptions`.

**Acción siguiente:** ejecutar búsqueda ampliada en catálogos para localizar el objeto exacto.

## 4) SQL recomendado (NO ejecutado)

### 4.1 Base: helper org-membership (evita recursion)

> Nota: no aplicarlo a `memberships`/`organizations` sin revisar para evitar recursion.

```sql
-- Ejemplo de helper estable
create or replace function public.is_member_of_org(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_org
      and m.user_id = auth.uid()
  );
$$;
```

### 4.2 Deny All para tablas internas

```sql
-- Activar RLS (si no lo está) + denegar todo a authenticated/public
alter table public.api_rate_limits enable row level security;
alter table public.webhook_events enable row level security;

drop policy if exists "deny_all" on public.api_rate_limits;
create policy "deny_all" on public.api_rate_limits
  for all
  to public
  using (false)
  with check (false);

drop policy if exists "deny_all" on public.webhook_events;
create policy "deny_all" on public.webhook_events
  for all
  to public
  using (false)
  with check (false);
```

### 4.3 `invoices`: RBAC recomendado (borrador)

> Requiere decidir roles/fuentes (roles en `memberships.role` o `resource_permissions`).

```sql
-- Ejemplo: solo owner/admin/finance
-- (placeholder) create function public.has_org_role(...) ...
-- y policy en invoices usando esa función.
```

### 4.4 `document_embeddings`: herencia de permisos (borrador)

```sql
-- Objetivo: permitir SELECT solo si el usuario tiene acceso al matter/client/document original.
-- Implementación depende de la tabla fuente real y FK disponibles.
```

### 4.5 Fijar search_path (prioridad a SECURITY DEFINER)

```sql
-- Ejemplo de fix para una función
-- alter function public.check_module_access(uuid, varchar, varchar)
--   set search_path = public, pg_temp;
```

## 5) Próximas acciones (inmediatas)

1) Localizar el/los objetos del linter “Security Definer View” con una query ampliada.
2) Generar una **migración Fase A** (seguridad) lista para ejecutar:
   - Deny All (internas)
   - Fix search_path (security definer primero)
   - Ajuste `signature_stats` si procede
   - Primer corte RBAC de `invoices`
3) Re-ejecutar linter y security scan; objetivo: bajar errores críticos a **0** y warnings a una lista razonable.
