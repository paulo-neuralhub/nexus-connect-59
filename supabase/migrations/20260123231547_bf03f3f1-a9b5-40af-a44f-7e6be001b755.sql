-- P-SYSTEM-01: Sistema de Event Log

-- Extensions
create extension if not exists pgcrypto;

-- ============================================
-- TABLE: event_type_catalog
-- ============================================
create table if not exists public.event_type_catalog (
  id uuid primary key default gen_random_uuid(),
  code varchar(100) unique not null,
  category varchar(50) not null,
  name varchar(100) not null,
  description text,
  default_severity varchar(20) default 'info' check (default_severity in ('debug','info','warning','error','critical')),
  auto_alert boolean default false,
  retention_days integer default 90,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.event_type_catalog enable row level security;

-- Readable by authenticated (needed for UI labels)
create policy "Event types readable by authenticated"
on public.event_type_catalog
for select
to authenticated
using (true);

-- Only superadmins can manage catalog
create policy "Superadmins manage event types"
on public.event_type_catalog
for all
to authenticated
using (
  exists (
    select 1 from public.superadmins sa
    where sa.user_id = auth.uid() and sa.is_active = true
  )
)
with check (
  exists (
    select 1 from public.superadmins sa
    where sa.user_id = auth.uid() and sa.is_active = true
  )
);

-- ============================================
-- TABLE: system_events
-- ============================================
create table if not exists public.system_events (
  id uuid primary key default gen_random_uuid(),

  event_type varchar(100) not null,
  event_category varchar(50) not null,
  severity varchar(20) default 'info' check (severity in ('debug','info','warning','error','critical')),

  organization_id uuid references public.organizations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,

  title varchar(255) not null,
  description text,
  event_data jsonb default '{}'::jsonb,

  source varchar(50) not null default 'system',

  ip_address inet,
  user_agent text,
  request_id varchar(100),

  tags text[] default '{}'::text[],

  related_entity_type varchar(50),
  related_entity_id uuid,

  requires_action boolean default false,
  action_status varchar(20) default 'none' check (action_status in ('none','pending','in_progress','resolved','ignored')),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolution_notes text,

  created_at timestamptz default now(),

  search_vector tsvector generated always as (
    setweight(to_tsvector('spanish', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('spanish', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('spanish', coalesce(event_data::text, '')), 'C')
  ) stored
);

-- Indexes
create index if not exists idx_system_events_type on public.system_events(event_type);
create index if not exists idx_system_events_category on public.system_events(event_category);
create index if not exists idx_system_events_severity on public.system_events(severity);
create index if not exists idx_system_events_org on public.system_events(organization_id);
create index if not exists idx_system_events_user on public.system_events(user_id);
create index if not exists idx_system_events_created on public.system_events(created_at desc);
create index if not exists idx_system_events_source on public.system_events(source);
create index if not exists idx_system_events_requires_action on public.system_events(requires_action) where requires_action = true;
create index if not exists idx_system_events_action_status on public.system_events(action_status) where action_status <> 'none';
create index if not exists idx_system_events_tags on public.system_events using gin(tags);
create index if not exists idx_system_events_data on public.system_events using gin(event_data);
create index if not exists idx_system_events_search on public.system_events using gin(search_vector);
create index if not exists idx_system_events_entity on public.system_events(related_entity_type, related_entity_id);

alter table public.system_events enable row level security;

-- SELECT policies
create policy "Superadmins can view all system events"
on public.system_events
for select
to authenticated
using (
  exists (
    select 1 from public.superadmins sa
    where sa.user_id = auth.uid() and sa.is_active = true
  )
);

create policy "Users can view their org system events"
on public.system_events
for select
to authenticated
using (
  organization_id is not null and exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.organization_id = system_events.organization_id
  )
);

-- INSERT policy (allows app-side logging; service role + triggers bypass anyway)
create policy "Users can insert system events for their org"
on public.system_events
for insert
to authenticated
with check (
  (user_id is null or user_id = auth.uid())
  and (organization_id is null or exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.organization_id = system_events.organization_id
  ))
);

-- UPDATE policy (restricted; resolve_event uses SECURITY DEFINER but keep policy strict)
create policy "Superadmins can update system events"
on public.system_events
for update
to authenticated
using (
  exists (
    select 1 from public.superadmins sa
    where sa.user_id = auth.uid() and sa.is_active = true
  )
)
with check (
  exists (
    select 1 from public.superadmins sa
    where sa.user_id = auth.uid() and sa.is_active = true
  )
);

-- ============================================
-- FUNCTION: log_event
-- ============================================
create or replace function public.log_event(
  p_event_type varchar,
  p_title varchar,
  p_description text default null,
  p_organization_id uuid default null,
  p_user_id uuid default null,
  p_event_data jsonb default '{}'::jsonb,
  p_source varchar default 'system',
  p_related_entity_type varchar default null,
  p_related_entity_id uuid default null,
  p_tags text[] default '{}'::text[],
  p_ip_address inet default null,
  p_user_agent text default null,
  p_request_id varchar default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
  v_catalog record;
  v_severity varchar(20);
  v_category varchar(50);
  v_requires_action boolean;
begin
  select * into v_catalog
  from public.event_type_catalog
  where code = p_event_type and is_active = true;

  v_severity := coalesce(v_catalog.default_severity, 'info');
  v_category := coalesce(v_catalog.category, split_part(p_event_type, '.', 1));
  v_requires_action := coalesce(v_catalog.auto_alert, false) or v_severity in ('error','critical');

  insert into public.system_events (
    event_type, event_category, severity,
    organization_id, user_id,
    title, description, event_data,
    source, related_entity_type, related_entity_id,
    tags, requires_action, action_status,
    ip_address, user_agent, request_id
  ) values (
    p_event_type, v_category, v_severity,
    p_organization_id, p_user_id,
    p_title, p_description, coalesce(p_event_data, '{}'::jsonb),
    coalesce(p_source, 'system'), p_related_entity_type, p_related_entity_id,
    coalesce(p_tags, '{}'::text[]), v_requires_action,
    case when v_requires_action then 'pending' else 'none' end,
    p_ip_address, p_user_agent, p_request_id
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

-- ============================================
-- FUNCTION: resolve_event
-- ============================================
create or replace function public.resolve_event(
  p_event_id uuid,
  p_resolution_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.system_events
  set
    action_status = 'resolved',
    resolved_at = now(),
    resolved_by = auth.uid(),
    resolution_notes = p_resolution_notes
  where id = p_event_id
    and requires_action = true;

  return found;
end;
$$;

-- ============================================
-- VIEW: v_pending_events
-- ============================================
create or replace view public.v_pending_events as
select
  e.*, 
  o.name as organization_name,
  c.name as event_type_name,
  c.description as event_type_description
from public.system_events e
left join public.organizations o on e.organization_id = o.id
left join public.event_type_catalog c on e.event_type = c.code
where e.requires_action = true
  and e.action_status in ('pending','in_progress')
order by
  case e.severity
    when 'critical' then 1
    when 'error' then 2
    when 'warning' then 3
    else 4
  end,
  e.created_at desc;

-- ============================================
-- VIEW: v_event_stats
-- ============================================
create or replace view public.v_event_stats as
select
  date_trunc('day', created_at) as event_date,
  event_category,
  severity,
  count(*) as event_count,
  count(*) filter (where requires_action) as action_required_count,
  count(*) filter (where action_status = 'resolved') as resolved_count
from public.system_events
where created_at >= now() - interval '30 days'
group by date_trunc('day', created_at), event_category, severity
order by event_date desc, event_category;

-- ============================================
-- Seed: event_type_catalog
-- (idempotent via on conflict)
-- ============================================
insert into public.event_type_catalog (code, category, name, description, default_severity, auto_alert)
values
  -- PAGOS
  ('payment.checkout.started','payment','Checkout iniciado','Usuario ha iniciado proceso de pago','info',false),
  ('payment.checkout.completed','payment','Checkout completado','Pago procesado correctamente','info',false),
  ('payment.checkout.abandoned','payment','Checkout abandonado','Usuario abandonó el checkout','warning',false),
  ('payment.invoice.created','payment','Factura creada','Nueva factura generada','info',false),
  ('payment.invoice.paid','payment','Factura pagada','Pago recibido correctamente','info',false),
  ('payment.invoice.failed','payment','Pago fallido','No se pudo cobrar la factura','error',true),
  ('payment.invoice.retry','payment','Reintento de pago','Stripe reintentará el cobro','warning',true),
  ('payment.refund.created','payment','Reembolso procesado','Se ha emitido un reembolso','warning',true),
  ('payment.dispute.created','payment','Disputa abierta','Cliente ha disputado un cargo','critical',true),
  ('payment.method.updated','payment','Método de pago actualizado','Cliente actualizó su tarjeta','info',false),

  -- SUSCRIPCIONES
  ('subscription.created','subscription','Suscripción creada','Nueva suscripción activada','info',true),
  ('subscription.upgraded','subscription','Plan mejorado','Cliente subió de plan','info',false),
  ('subscription.downgraded','subscription','Plan reducido','Cliente bajó de plan','warning',false),
  ('subscription.renewed','subscription','Suscripción renovada','Renovación mensual exitosa','info',false),
  ('subscription.cancelled','subscription','Suscripción cancelada','Cliente canceló su plan','warning',true),
  ('subscription.suspended','subscription','Suscripción suspendida','Suspendida por impago','critical',true),
  ('subscription.reactivated','subscription','Suscripción reactivada','Reactivada tras pago','info',true),

  -- VOIP
  ('voip.call.initiated','voip','Llamada iniciada','Se inició una llamada','debug',false),
  ('voip.call.connected','voip','Llamada conectada','Llamada en curso','debug',false),
  ('voip.call.completed','voip','Llamada completada','Llamada finalizada','info',false),
  ('voip.call.failed','voip','Llamada fallida','Error en la llamada','warning',false),
  ('voip.call.missed','voip','Llamada perdida','Llamada entrante no atendida','info',false),
  ('voip.minutes.warning','voip','Minutos bajos','Menos del 20% de minutos restantes','warning',true),
  ('voip.minutes.exhausted','voip','Minutos agotados','Sin minutos disponibles','error',true),
  ('voip.recording.completed','voip','Grabación lista','Grabación procesada','debug',false),
  ('voip.transcription.completed','voip','Transcripción lista','Transcripción generada','debug',false),
  ('voip.number.provisioned','voip','Número asignado','Nuevo número telefónico','info',false),

  -- USUARIOS
  ('user.registered','user','Usuario registrado','Nuevo usuario en el sistema','info',false),
  ('user.login','user','Inicio de sesión','Usuario autenticado','debug',false),
  ('user.login.failed','user','Login fallido','Intento de login incorrecto','warning',false),
  ('user.logout','user','Cierre de sesión','Usuario desconectado','debug',false),
  ('user.invited','user','Usuario invitado','Invitación enviada','info',false),
  ('user.role.changed','user','Rol modificado','Cambio de permisos','info',false),
  ('user.password.reset','user','Password reseteado','Solicitud de reset','info',false),

  -- ORGANIZACIONES
  ('org.created','organization','Organización creada','Nueva organización','info',true),
  ('org.updated','organization','Organización actualizada','Datos modificados','info',false),
  ('org.member.added','organization','Miembro añadido','Nuevo miembro en org','info',false),
  ('org.member.removed','organization','Miembro eliminado','Miembro dado de baja','info',false),

  -- CRM
  ('crm.contact.created','crm','Contacto creado','Nuevo contacto','debug',false),
  ('crm.contact.updated','crm','Contacto actualizado','Datos modificados','debug',false),
  ('crm.deal.created','crm','Oportunidad creada','Nueva oportunidad','info',false),
  ('crm.deal.stage.changed','crm','Fase cambiada','Oportunidad movida','info',false),
  ('crm.deal.won','crm','Oportunidad ganada','Venta cerrada','info',false),
  ('crm.deal.lost','crm','Oportunidad perdida','Venta perdida','info',false),
  ('crm.activity.created','crm','Actividad registrada','Nueva actividad','debug',false),

  -- SISTEMA
  ('system.startup','system','Sistema iniciado','Aplicación arrancada','info',false),
  ('system.error','system','Error del sistema','Error interno','error',true),
  ('system.maintenance.started','system','Mantenimiento iniciado','En mantenimiento','warning',false),
  ('system.maintenance.completed','system','Mantenimiento completado','Servicio restaurado','info',false),
  ('system.backup.completed','system','Backup completado','Copia realizada','info',false),
  ('system.edge_function.error','system','Error Edge Function','Fallo serverless','error',true),

  -- SOPORTE
  ('support.ticket.created','support','Ticket creado','Nueva incidencia','info',true),
  ('support.ticket.updated','support','Ticket actualizado','Ticket modificado','info',false),
  ('support.ticket.resolved','support','Ticket resuelto','Incidencia cerrada','info',false),

  -- IA
  ('ai.analysis.completed','ai','Análisis IA completado','Análisis finalizado','debug',false),
  ('ai.agent.query','ai','Consulta al agente','Usuario preguntó al agente','debug',false),
  ('ai.recommendation','ai','Recomendación IA','Sugerencia generada','info',false)
on conflict (code) do update set
  category = excluded.category,
  name = excluded.name,
  description = excluded.description,
  default_severity = excluded.default_severity,
  auto_alert = excluded.auto_alert,
  retention_days = coalesce(excluded.retention_days, public.event_type_catalog.retention_days),
  is_active = true;

-- ============================================
-- TRIGGERS
-- ============================================

-- VoIP subscription changes
create or replace function public.log_voip_subscription_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_minutes numeric;
  v_new_minutes numeric;
begin
  if tg_op = 'INSERT' then
    perform public.log_event(
      'subscription.created',
      'Nueva suscripción VoIP activada',
      null,
      new.organization_id,
      null,
      jsonb_build_object('plan_id', new.plan_id, 'status', new.status),
      'system',
      'voip_subscription',
      new.id
    );
  elsif tg_op = 'UPDATE' then
    -- Status change
    if old.status is distinct from new.status then
      perform public.log_event(
        case new.status
          when 'active' then 'subscription.reactivated'
          when 'cancelled' then 'subscription.cancelled'
          when 'canceled' then 'subscription.cancelled'
          when 'suspended' then 'subscription.suspended'
          when 'past_due' then 'payment.invoice.failed'
          else 'subscription.updated'
        end,
        'Estado de suscripción: ' || old.status || ' → ' || new.status,
        null,
        new.organization_id,
        null,
        jsonb_build_object('old_status', old.status, 'new_status', new.status),
        'system',
        'voip_subscription',
        new.id
      );
    end if;

    -- Plan change
    if old.plan_id is distinct from new.plan_id then
      v_old_minutes := coalesce(old.minutes_included, 0);
      v_new_minutes := coalesce(new.minutes_included, 0);

      perform public.log_event(
        case when v_new_minutes > v_old_minutes then 'subscription.upgraded' else 'subscription.downgraded' end,
        'Plan modificado',
        null,
        new.organization_id,
        null,
        jsonb_build_object('old_plan', old.plan_id, 'new_plan', new.plan_id),
        'system',
        'voip_subscription',
        new.id
      );
    end if;

    -- Minutes warning
    if coalesce(new.minutes_included, 0) > 0
       and new.minutes_used >= (new.minutes_included * 0.8)
       and coalesce(old.minutes_used, 0) < (old.minutes_included * 0.8) then
      perform public.log_event(
        'voip.minutes.warning',
        'Minutos bajos: ' || (new.minutes_included - new.minutes_used) || ' restantes',
        'La organización ha consumido más del 80% de sus minutos',
        new.organization_id,
        null,
        jsonb_build_object(
          'minutes_used', new.minutes_used,
          'minutes_included', new.minutes_included,
          'percentage', round((new.minutes_used::numeric / nullif(new.minutes_included,0)) * 100)
        ),
        'system',
        'voip_subscription',
        new.id
      );
    end if;

    -- Minutes exhausted
    if coalesce(new.minutes_included, 0) > 0
       and new.minutes_used >= new.minutes_included
       and coalesce(old.minutes_used, 0) < old.minutes_included then
      perform public.log_event(
        'voip.minutes.exhausted',
        'Minutos agotados',
        'La organización ha agotado sus minutos incluidos',
        new.organization_id,
        null,
        jsonb_build_object(
          'minutes_used', new.minutes_used,
          'minutes_included', new.minutes_included
        ),
        'system',
        'voip_subscription',
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_log_voip_subscription on public.voip_subscriptions;
create trigger trigger_log_voip_subscription
after insert or update on public.voip_subscriptions
for each row
execute function public.log_voip_subscription_changes();

-- VoIP call events
create or replace function public.log_voip_call_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_event(
      'voip.call.initiated',
      'Llamada ' || new.direction || ': ' || new.to_number,
      null,
      new.organization_id,
      new.user_id,
      jsonb_build_object(
        'direction', new.direction,
        'from', new.from_number,
        'to', new.to_number,
        'call_sid', new.call_sid
      ),
      'twilio',
      'voip_call',
      new.id
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'completed' then
      perform public.log_event(
        'voip.call.completed',
        'Llamada completada: ' || coalesce(new.duration_seconds, 0) || 's',
        null,
        new.organization_id,
        new.user_id,
        jsonb_build_object(
          'duration_seconds', new.duration_seconds,
          'direction', new.direction,
          'recording_enabled', new.recording_enabled
        ),
        'twilio',
        'voip_call',
        new.id
      );
    elsif new.status = 'failed' then
      perform public.log_event(
        'voip.call.failed',
        'Llamada fallida a ' || new.to_number,
        null,
        new.organization_id,
        new.user_id,
        jsonb_build_object('direction', new.direction, 'to', new.to_number),
        'twilio',
        'voip_call',
        new.id
      );
    elsif new.status in ('no-answer','no_answer','noanswer') then
      perform public.log_event(
        'voip.call.missed',
        'Llamada no contestada: ' || new.from_number,
        null,
        new.organization_id,
        new.user_id,
        jsonb_build_object('from', new.from_number, 'direction', new.direction),
        'twilio',
        'voip_call',
        new.id
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_log_voip_calls on public.crm_voip_calls;
create trigger trigger_log_voip_calls
after insert or update on public.crm_voip_calls
for each row
execute function public.log_voip_call_events();

-- Organization events
create or replace function public.log_organization_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_event(
      'org.created',
      'Nueva organización: ' || new.name,
      null,
      new.id,
      null,
      jsonb_build_object('name', new.name),
      'system',
      'organization',
      new.id
    );
  elsif tg_op = 'UPDATE' and old.name is distinct from new.name then
    perform public.log_event(
      'org.updated',
      'Organización renombrada: ' || old.name || ' → ' || new.name,
      null,
      new.id,
      null,
      jsonb_build_object('old_name', old.name, 'new_name', new.name),
      'system',
      'organization',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_log_organizations on public.organizations;
create trigger trigger_log_organizations
after insert or update on public.organizations
for each row
execute function public.log_organization_events();
