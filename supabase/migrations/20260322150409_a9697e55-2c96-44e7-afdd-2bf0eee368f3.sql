-- ============================================================
-- INTERNAL-CHAT-01 — FASE 1B: Schema gaps + Seeds + Triggers + Migration
-- ============================================================

-- ========================
-- BLOQUE 0: SCHEMA GAPS — columnas faltantes
-- ========================

-- internal_channels: add crm_account_id + update channel_type CHECK
ALTER TABLE public.internal_channels
  ADD COLUMN IF NOT EXISTS crm_account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL;

-- Drop old check and add new one with 'client'
ALTER TABLE public.internal_channels DROP CONSTRAINT IF EXISTS internal_channels_channel_type_check;
ALTER TABLE public.internal_channels ADD CONSTRAINT internal_channels_channel_type_check
  CHECK (channel_type IN ('general','matter','direct','announcement','project','client'));

-- Auto-generate slug trigger for internal_channels
CREATE OR REPLACE FUNCTION public.generate_channel_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;
  base_slug := public.slugify(COALESCE(NEW.name, 'channel'));
  final_slug := base_slug;
  LOOP
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.internal_channels
      WHERE organization_id = NEW.organization_id AND slug = final_slug AND id != NEW.id
    );
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_channel_slug ON public.internal_channels;
CREATE TRIGGER trg_generate_channel_slug
  BEFORE INSERT ON public.internal_channels
  FOR EACH ROW EXECUTE FUNCTION public.generate_channel_slug();

-- internal_messages: add missing columns
ALTER TABLE public.internal_messages
  ADD COLUMN IF NOT EXISTS sender_role_snapshot text DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS referenced_matter_id uuid REFERENCES public.matters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_classification text DEFAULT 'operational',
  ADD COLUMN IF NOT EXISTS user_indexing_decision text DEFAULT 'not_applicable';

-- matter_timeline_events: add missing columns
ALTER TABLE public.matter_timeline_events
  ADD COLUMN IF NOT EXISTS source_table text,
  ADD COLUMN IF NOT EXISTS source_id uuid,
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_type text DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS is_visible_in_portal boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS event_date timestamptz DEFAULT now();

-- Drop old event_type check and add expanded one
ALTER TABLE public.matter_timeline_events DROP CONSTRAINT IF EXISTS matter_timeline_events_event_type_check;
ALTER TABLE public.matter_timeline_events ADD CONSTRAINT matter_timeline_events_event_type_check
  CHECK (event_type IN (
    'status_change','status_changed','filing','publication','grant','registration',
    'renewal','opposition','deadline_met','deadline_missed',
    'document_added','note','internal_note','assignment','communication','system'
  ));

-- plan_definitions: add missing feature columns
ALTER TABLE public.plan_definitions
  ADD COLUMN IF NOT EXISTS portal_clients_limit integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS genius_basic_queries_month integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS genius_pro_queries_month integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS genius_pro_docs_month integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS feature_genius_pro boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_b2b2b boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_marketing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_ip_chain boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_data_hub boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_api_access boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_advanced_analytics boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_internal_chat boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS feature_portal boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS highlight_label text;

-- Index for crm_account_id on channels
CREATE INDEX IF NOT EXISTS idx_internal_channels_crm_account
  ON public.internal_channels (crm_account_id) WHERE crm_account_id IS NOT NULL;

-- ========================
-- BLOQUE 1: SEED DE 4 PLANES
-- ========================
INSERT INTO plan_definitions (
  code, name, description,
  monthly_price_eur, annual_price_eur,
  max_matters, max_contacts, max_users,
  portal_clients_limit, max_storage_gb,
  genius_basic_queries_month, genius_pro_queries_month,
  genius_pro_docs_month, genius_pro_models_allowed,
  feature_genius_pro, feature_b2b2b, feature_marketing,
  feature_ip_chain, feature_data_hub, feature_api_access,
  feature_advanced_analytics, feature_internal_chat,
  feature_portal, is_active, is_public, sort_order, highlight_label
) VALUES
('free','Free','Para explorar IP-NEXUS',
  0,0,50,100,2,0,1,25,0,0,'["haiku"]',
  false,false,false,false,false,false,false,true,false,true,true,1,null),
('starter','Starter','Para agentes independientes',
  79,790,200,500,3,5,10,200,0,0,'["haiku","sonnet"]',
  false,false,false,false,false,false,false,true,true,true,true,2,null),
('professional','Professional','Para despachos en crecimiento',
  249,2490,1000,2000,10,20,50,500,300,50,'["haiku","sonnet","opus"]',
  true,true,true,true,false,false,true,true,true,true,true,3,'Más popular'),
('enterprise','Enterprise','Sin límites para grandes despachos',
  749,7490,999999,999999,999999,999999,500,
  999999,999999,999999,'["haiku","sonnet","opus"]',
  true,true,true,true,true,true,true,true,true,true,true,4,'Enterprise')
ON CONFLICT (code) DO UPDATE SET
  monthly_price_eur = EXCLUDED.monthly_price_eur,
  annual_price_eur = EXCLUDED.annual_price_eur,
  updated_at = now();

-- ========================
-- BLOQUE 2: TRIGGERS AUTO-CREACIÓN DE CANALES
-- ========================

-- Trigger para matters nuevos
CREATE OR REPLACE FUNCTION public.create_matter_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_creator_id uuid;
BEGIN
  SELECT id INTO v_creator_id FROM profiles
  WHERE organization_id = NEW.organization_id
  AND role IN ('admin','superadmin')
  LIMIT 1;

  IF v_creator_id IS NULL THEN
    v_creator_id := COALESCE(NEW.assigned_to, NEW.created_by);
  END IF;

  IF v_creator_id IS NOT NULL THEN
    INSERT INTO internal_channels (
      organization_id, channel_type, name,
      matter_id, created_by
    ) VALUES (
      NEW.organization_id,
      'matter',
      '# ' || COALESCE(NEW.reference,'EXP') || ' — '
        || COALESCE(NEW.title,'Expediente'),
      NEW.id,
      v_creator_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_matter_channel ON public.matters;
CREATE TRIGGER trg_create_matter_channel
  AFTER INSERT ON matters
  FOR EACH ROW EXECUTE FUNCTION create_matter_channel();

-- Trigger para clientes nuevos
CREATE OR REPLACE FUNCTION public.create_client_channel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_creator_id uuid;
BEGIN
  SELECT id INTO v_creator_id FROM profiles
  WHERE organization_id = NEW.organization_id
  AND role IN ('admin','superadmin')
  LIMIT 1;

  IF v_creator_id IS NOT NULL THEN
    INSERT INTO internal_channels (
      organization_id, channel_type, name,
      crm_account_id, created_by
    ) VALUES (
      NEW.organization_id,
      'client',
      '@ ' || NEW.name,
      NEW.id,
      v_creator_id
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_client_channel ON public.crm_accounts;
CREATE TRIGGER trg_create_client_channel
  AFTER INSERT ON crm_accounts
  FOR EACH ROW EXECUTE FUNCTION create_client_channel();

-- Trigger automático en matter_timeline_events cuando cambia status
CREATE OR REPLACE FUNCTION public.auto_matter_timeline_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO matter_timeline_events (
      organization_id, matter_id, event_type,
      title, description,
      source_table, source_id,
      actor_id, actor_type, is_visible_in_portal,
      metadata
    ) VALUES (
      NEW.organization_id, NEW.id, 'status_changed',
      'Estado actualizado: ' || COALESCE(NEW.status,'desconocido'),
      'Cambió de ' || COALESCE(OLD.status,'—') || ' a ' || COALESCE(NEW.status,'—'),
      'matters', NEW.id,
      auth.uid(), 'staff', true,
      jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_timeline_status ON public.matters;
CREATE TRIGGER trg_auto_timeline_status
  AFTER UPDATE OF status ON matters
  FOR EACH ROW EXECUTE FUNCTION auto_matter_timeline_status_change();

-- ========================
-- BLOQUE 3: CANALES RETROACTIVOS
-- ========================

-- Canal general + anuncios para cada organización existente
DO $$
DECLARE
  org RECORD;
  v_creator uuid;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    SELECT id INTO v_creator FROM profiles
    WHERE organization_id = org.id
    AND role IN ('admin','superadmin') LIMIT 1;

    IF v_creator IS NOT NULL THEN
      INSERT INTO internal_channels (
        organization_id, channel_type, name, is_default, created_by
      ) VALUES (
        org.id, 'general', '# general', true, v_creator
      ) ON CONFLICT DO NOTHING;

      INSERT INTO internal_channels (
        organization_id, channel_type, name,
        description, created_by
      ) VALUES (
        org.id, 'announcement', '📢 anuncios',
        'Solo administradores pueden publicar aquí',
        v_creator
      ) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Canal para cada matter existente sin canal
DO $$
DECLARE
  m RECORD;
  v_creator uuid;
BEGIN
  FOR m IN
    SELECT ma.* FROM matters ma
    WHERE NOT EXISTS (
      SELECT 1 FROM internal_channels ic
      WHERE ic.matter_id = ma.id
    )
  LOOP
    SELECT id INTO v_creator FROM profiles
    WHERE organization_id = m.organization_id
    AND role IN ('admin','superadmin') LIMIT 1;

    IF v_creator IS NOT NULL THEN
      INSERT INTO internal_channels (
        organization_id, channel_type, name,
        matter_id, created_by
      ) VALUES (
        m.organization_id, 'matter',
        '# ' || COALESCE(m.reference,'EXP')
          || ' — ' || COALESCE(m.title,'Expediente'),
        m.id, v_creator
      ) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Canal para cada cliente existente sin canal
DO $$
DECLARE
  c RECORD;
  v_creator uuid;
BEGIN
  FOR c IN
    SELECT ca.* FROM crm_accounts ca
    WHERE NOT EXISTS (
      SELECT 1 FROM internal_channels ic
      WHERE ic.crm_account_id = ca.id
    )
  LOOP
    SELECT id INTO v_creator FROM profiles
    WHERE organization_id = c.organization_id
    AND role IN ('admin','superadmin') LIMIT 1;

    IF v_creator IS NOT NULL THEN
      INSERT INTO internal_channels (
        organization_id, channel_type, name,
        crm_account_id, created_by
      ) VALUES (
        c.organization_id, 'client',
        '@ ' || c.name,
        c.id, v_creator
      ) ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- ========================
-- BLOQUE 4: MIGRACIÓN DE comm_internal_messages
-- ========================
DO $$
DECLARE
  msg RECORD;
  v_channel_id uuid;
  v_role_snapshot text;
BEGIN
  FOR msg IN
    SELECT * FROM comm_internal_messages
    ORDER BY created_at ASC
  LOOP
    IF msg.matter_id IS NOT NULL THEN
      SELECT id INTO v_channel_id FROM internal_channels
      WHERE matter_id = msg.matter_id
      AND organization_id = msg.organization_id
      LIMIT 1;
    ELSIF msg.crm_account_id IS NOT NULL THEN
      SELECT id INTO v_channel_id FROM internal_channels
      WHERE crm_account_id = msg.crm_account_id
      AND organization_id = msg.organization_id
      LIMIT 1;
    ELSE
      SELECT id INTO v_channel_id FROM internal_channels
      WHERE channel_type = 'general'
      AND organization_id = msg.organization_id
      LIMIT 1;
    END IF;

    SELECT COALESCE(role, 'member') INTO v_role_snapshot
    FROM profiles WHERE id = msg.sender_id;

    IF v_channel_id IS NOT NULL AND msg.sender_id IS NOT NULL THEN
      INSERT INTO internal_messages (
        organization_id, channel_id, sender_id,
        sender_role_snapshot, content, content_type,
        attachments, mentions,
        referenced_matter_id,
        ai_classification, user_indexing_decision,
        created_at
      ) VALUES (
        msg.organization_id,
        v_channel_id,
        msg.sender_id,
        COALESCE(v_role_snapshot, 'member'),
        msg.content,
        COALESCE(msg.content_type, 'text'),
        COALESCE(msg.attachments, '[]'),
        COALESCE(msg.mentions, '{}'),
        msg.matter_id,
        'operational',
        'not_applicable',
        msg.created_at
      )
      ON CONFLICT DO NOTHING;

      IF msg.matter_id IS NOT NULL THEN
        INSERT INTO matter_timeline_events (
          organization_id, matter_id, event_type,
          title, source_table, source_id,
          actor_id, actor_type, is_visible_in_portal,
          event_date
        ) VALUES (
          msg.organization_id, msg.matter_id,
          'internal_note',
          'Nota migrada del chat anterior',
          'comm_internal_messages', msg.id,
          msg.sender_id, 'staff', false,
          msg.created_at
        ) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END $$;