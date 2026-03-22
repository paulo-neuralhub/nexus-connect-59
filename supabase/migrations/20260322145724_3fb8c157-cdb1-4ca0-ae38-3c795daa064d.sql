-- ============================================================
-- INTERNAL-CHAT-01 — FASE 1A: Tablas, RLS, Índices
-- ============================================================

-- ========================
-- BLOQUE 1: profiles — 4 columnas nuevas
-- ========================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS position_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS chat_status text DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- ========================
-- BLOQUE 2: internal_channels
-- ========================
CREATE TABLE IF NOT EXISTS public.internal_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  channel_type text NOT NULL DEFAULT 'general'
    CHECK (channel_type IN ('general','matter','direct','announcement','project')),
  is_default boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  matter_id uuid REFERENCES public.matters(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, slug)
);

ALTER TABLE public.internal_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal_channels_tenant_isolation" ON public.internal_channels
  FOR ALL USING (organization_id = public.get_user_org_id());

-- ========================
-- BLOQUE 3: internal_channel_members
-- ========================
CREATE TABLE IF NOT EXISTS public.internal_channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.internal_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin','member')),
  is_muted boolean DEFAULT false,
  last_read_at timestamptz,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

ALTER TABLE public.internal_channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "channel_members_tenant_isolation" ON public.internal_channel_members
  FOR ALL USING (organization_id = public.get_user_org_id());

-- ========================
-- BLOQUE 4: internal_messages (coexiste con comm_internal_messages)
-- ========================
CREATE TABLE IF NOT EXISTS public.internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.internal_channels(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text','rich','system','file')),
  reply_to_id uuid REFERENCES public.internal_messages(id) ON DELETE SET NULL,
  mentions uuid[] DEFAULT '{}',
  attachments jsonb DEFAULT '[]',
  reactions jsonb DEFAULT '{}',
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.internal_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "internal_messages_tenant_isolation" ON public.internal_messages
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Constraint: NO DELETE — soft delete only
CREATE OR REPLACE RULE internal_messages_no_delete AS
  ON DELETE TO public.internal_messages DO INSTEAD
  UPDATE public.internal_messages SET is_deleted = true WHERE id = OLD.id;

-- ========================
-- BLOQUE 5: internal_message_reads
-- ========================
CREATE TABLE IF NOT EXISTS public.internal_message_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.internal_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  read_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.internal_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "message_reads_tenant_isolation" ON public.internal_message_reads
  FOR ALL USING (organization_id = public.get_user_org_id());

-- ========================
-- BLOQUE 6: staff_notifications
-- ========================
CREATE TABLE IF NOT EXISTS public.staff_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('mention','channel_invite','deadline','assignment','system','matter_update','chat')),
  title text NOT NULL,
  body text,
  icon text,
  link text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  source_type text,
  source_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.staff_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_notifications_own_only" ON public.staff_notifications
  FOR ALL USING (
    organization_id = public.get_user_org_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "staff_notifications_insert_org" ON public.staff_notifications
  FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());

-- ========================
-- BLOQUE 7: matter_timeline_events
-- ========================
CREATE TABLE IF NOT EXISTS public.matter_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'status_change','filing','publication','grant','registration',
    'renewal','opposition','deadline_met','deadline_missed',
    'document_added','note','assignment','communication','system'
  )),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}',
  is_internal boolean DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.matter_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "timeline_events_tenant_isolation" ON public.matter_timeline_events
  FOR ALL USING (organization_id = public.get_user_org_id());

COMMENT ON COLUMN public.matter_timeline_events.is_internal IS
  'internal_notes_not_in_portal: When true, this event MUST NOT be shown in the client portal.';

CREATE OR REPLACE RULE timeline_events_no_delete AS
  ON DELETE TO public.matter_timeline_events DO INSTEAD NOTHING;

-- ========================
-- BLOQUE 8: plan_definitions
-- ========================
CREATE TABLE IF NOT EXISTS public.plan_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  tier integer DEFAULT 0,
  monthly_price_eur numeric(10,2) DEFAULT 0,
  annual_price_eur numeric(10,2) DEFAULT 0,
  max_users integer DEFAULT 1,
  max_matters integer DEFAULT 50,
  max_contacts integer DEFAULT 100,
  max_storage_gb integer DEFAULT 5,
  max_genius_queries_monthly integer DEFAULT 0,
  genius_pro_models_allowed jsonb DEFAULT '[]',
  max_spider_alerts_monthly integer DEFAULT 0,
  max_jurisdictions integer DEFAULT 3,
  included_modules text[] DEFAULT '{}',
  features jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.plan_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plan_definitions_read_all" ON public.plan_definitions
  FOR SELECT TO authenticated USING (true);

-- ========================
-- BLOQUE 8B: plan_usage_counters
-- ========================
CREATE TABLE IF NOT EXISTS public.plan_usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  current_matters integer DEFAULT 0,
  current_contacts integer DEFAULT 0,
  current_users integer DEFAULT 0,
  current_storage_mb integer DEFAULT 0,
  genius_queries_this_month integer DEFAULT 0,
  spider_alerts_this_month integer DEFAULT 0,
  month_reset_at timestamptz DEFAULT date_trunc('month', now()),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.plan_usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_counters_tenant_isolation" ON public.plan_usage_counters
  FOR ALL USING (organization_id = public.get_user_org_id());

-- ========================
-- BLOQUE 8C: plan_feature_overrides
-- ========================
CREATE TABLE IF NOT EXISTS public.plan_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  override_value jsonb NOT NULL,
  reason text,
  granted_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, feature_key)
);

ALTER TABLE public.plan_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_overrides_tenant_isolation" ON public.plan_feature_overrides
  FOR ALL USING (organization_id = public.get_user_org_id());

-- ========================
-- BLOQUE 9: Función reset_monthly_plan_counters()
-- ========================
CREATE OR REPLACE FUNCTION public.reset_monthly_plan_counters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.plan_usage_counters
  SET
    genius_queries_this_month = 0,
    spider_alerts_this_month = 0,
    month_reset_at = date_trunc('month', now()),
    updated_at = now()
  WHERE month_reset_at < date_trunc('month', now());
END;
$$;

-- ========================
-- BLOQUE 10: ÍNDICES (11 total)
-- ========================

CREATE INDEX IF NOT EXISTS idx_internal_channels_org_type
  ON public.internal_channels (organization_id, channel_type);

CREATE INDEX IF NOT EXISTS idx_internal_channels_matter
  ON public.internal_channels (matter_id) WHERE matter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_internal_channel_members_user
  ON public.internal_channel_members (user_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_internal_messages_channel_created
  ON public.internal_messages (channel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_messages_org
  ON public.internal_messages (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_internal_messages_content_fts
  ON public.internal_messages USING gin (to_tsvector('spanish', content));

CREATE INDEX IF NOT EXISTS idx_internal_message_reads_user
  ON public.internal_message_reads (user_id, message_id);

CREATE INDEX IF NOT EXISTS idx_staff_notifications_user_unread
  ON public.staff_notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matter_timeline_matter
  ON public.matter_timeline_events (matter_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_matter_timeline_org_type
  ON public.matter_timeline_events (organization_id, event_type);

CREATE INDEX IF NOT EXISTS idx_plan_usage_counters_org
  ON public.plan_usage_counters (organization_id);

-- ========================
-- NOTA: MIGRACIÓN comm_internal_messages → nuevo sistema
-- Se ejecutará en Fase 1B como parte de la creación retroactiva
-- de canales. NO ejecutar ahora — solo anotar el plan.
-- Los datos de comm_internal_messages se mapearán a:
--   room_id → internal_channels.slug
--   room_type → internal_channels.channel_type  
--   Mensajes → internal_messages con channel_id correspondiente
-- ========================