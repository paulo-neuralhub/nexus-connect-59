-- ════════════════════════════════════════════════
-- COPILOT-PRO-01 — Fase 1: Base de datos completa
-- ════════════════════════════════════════════════

-- ─── BLOQUE 1: Extensiones a genius_tenant_config ───
ALTER TABLE genius_tenant_config
  ADD COLUMN IF NOT EXISTS copilot_mode text DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS copilot_avatar_url text,
  ADD COLUMN IF NOT EXISTS copilot_name text DEFAULT 'CoPilot Nexus',
  ADD COLUMN IF NOT EXISTS briefing_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS briefing_hour integer DEFAULT 8,
  ADD COLUMN IF NOT EXISTS last_briefing_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_briefing_date date,
  ADD COLUMN IF NOT EXISTS proactive_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS model_basic text DEFAULT 'claude-haiku-4-5-20251001',
  ADD COLUMN IF NOT EXISTS model_pro text DEFAULT 'claude-sonnet-4-20250514',
  ADD COLUMN IF NOT EXISTS context_page_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS guide_mode_enabled boolean DEFAULT true;

-- Validation trigger for copilot_mode and briefing_hour
CREATE OR REPLACE FUNCTION validate_copilot_mode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.copilot_mode IS NOT NULL AND NEW.copilot_mode NOT IN ('basic', 'pro') THEN
    RAISE EXCEPTION 'copilot_mode must be basic or pro';
  END IF;
  IF NEW.briefing_hour IS NOT NULL AND (NEW.briefing_hour < 0 OR NEW.briefing_hour > 23) THEN
    RAISE EXCEPTION 'briefing_hour must be between 0 and 23';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_copilot_mode ON genius_tenant_config;
CREATE TRIGGER trg_validate_copilot_mode
  BEFORE INSERT OR UPDATE ON genius_tenant_config
  FOR EACH ROW EXECUTE FUNCTION validate_copilot_mode();

-- ─── BLOQUE 2: genius_daily_briefings ───
CREATE TABLE IF NOT EXISTS genius_daily_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid REFERENCES profiles(id),
  briefing_date date NOT NULL DEFAULT CURRENT_DATE,
  content_json jsonb NOT NULL DEFAULT '{}',
  total_items integer DEFAULT 0,
  urgent_items integer DEFAULT 0,
  was_read boolean DEFAULT false,
  read_at timestamptz,
  read_by uuid REFERENCES profiles(id),
  model_used text,
  generation_seconds numeric(5,2),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_briefings_org_date
  ON genius_daily_briefings(organization_id, briefing_date)
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_briefings_user_date
  ON genius_daily_briefings(organization_id, user_id, briefing_date)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_briefings_unread
  ON genius_daily_briefings(organization_id, was_read, briefing_date DESC)
  WHERE was_read = false;

-- ─── BLOQUE 3: copilot_guide_steps ───
CREATE TABLE IF NOT EXISTS copilot_guide_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id text NOT NULL,
  step_order integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  target_selector text,
  target_route text,
  action_type text DEFAULT 'highlight',
  copilot_message text,
  is_skippable boolean DEFAULT true,
  requires_pro boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(guide_id, step_order)
);

INSERT INTO copilot_guide_steps
  (guide_id, step_order, title, content, target_route, copilot_message, is_skippable) VALUES
('first_matter', 1, 'Tu primer expediente',
  'Vamos a crear tu primer expediente de PI.',
  '/app/matters/new',
  '¡Bienvenido! Te guío para crear tu primer expediente paso a paso.',
  false),
('first_matter', 2, 'Tipo de propiedad',
  'Selecciona el tipo: marca, patente o diseño.',
  '/app/matters/new',
  'Primero dime qué tipo de derecho quieres registrar.',
  true),
('first_client', 1, 'Añade tu primer cliente',
  'El CRM gestiona todos tus clientes y contactos.',
  '/app/crm',
  'Vamos a añadir tu primer cliente al sistema.',
  false),
('setup_spider', 1, 'Activa la vigilancia',
  'IP-SPIDER monitoriza marcas similares en tiempo real.',
  '/app/spider',
  '¿Quieres que vigile esta marca automáticamente?',
  true)
ON CONFLICT (guide_id, step_order) DO NOTHING;

-- ─── BLOQUE 4: copilot_user_preferences ───
CREATE TABLE IF NOT EXISTS copilot_user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  copilot_visible boolean DEFAULT true,
  copilot_position text DEFAULT 'bottom-right',
  copilot_size text DEFAULT 'bubble',
  guide_dismissed_ids text[] DEFAULT '{}',
  briefing_dismissed_dates date[] DEFAULT '{}',
  preferred_response_length text DEFAULT 'normal',
  show_rag_sources boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ─── BLOQUE 5: Función de sincronización ───
CREATE OR REPLACE FUNCTION sync_plan_to_genius_config(p_plan_code text)
RETURNS integer AS $$
DECLARE
  pd plan_definitions%ROWTYPE;
  affected_count integer := 0;
BEGIN
  SELECT * INTO pd FROM plan_definitions
  WHERE plan_code = p_plan_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  UPDATE genius_tenant_config gtc SET
    max_queries_per_month = pd.genius_basic_queries_month + pd.genius_pro_queries_month,
    max_documents_per_month = pd.genius_pro_docs_month,
    feature_document_generation = pd.feature_genius_pro,
    feature_proactive_analysis = pd.feature_genius_pro,
    copilot_mode = CASE
      WHEN pd.feature_genius_pro THEN 'pro'
      ELSE 'basic'
    END,
    copilot_name = CASE
      WHEN pd.feature_genius_pro THEN 'IP-Genius CoPilot'
      ELSE 'CoPilot Nexus'
    END,
    updated_at = now()
  WHERE gtc.plan_code = p_plan_code;

  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en plan_definitions
CREATE OR REPLACE FUNCTION trg_sync_plan_to_genius()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM sync_plan_to_genius_config(NEW.plan_code);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_plan_definitions_sync_genius'
  ) THEN
    CREATE TRIGGER trg_plan_definitions_sync_genius
      AFTER UPDATE ON plan_definitions
      FOR EACH ROW
      EXECUTE FUNCTION trg_sync_plan_to_genius();
  END IF;
END $$;

-- ─── BLOQUE 6: RLS ───
ALTER TABLE genius_daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_guide_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gdb_org_read" ON genius_daily_briefings
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "gdb_org_update" ON genius_daily_briefings
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "cgs_read_all" ON copilot_guide_steps
  FOR SELECT USING (true);

CREATE POLICY "cup_self" ON copilot_user_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "cup_org_read" ON copilot_user_preferences
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- ─── BLOQUE 7: Índices ───
CREATE INDEX IF NOT EXISTS idx_gtc_org_mode
  ON genius_tenant_config(organization_id, copilot_mode);

CREATE INDEX IF NOT EXISTS idx_gdb_org_date
  ON genius_daily_briefings(organization_id, briefing_date DESC);

CREATE INDEX IF NOT EXISTS idx_cup_user
  ON copilot_user_preferences(user_id, organization_id);