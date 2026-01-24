-- ============================================================
-- L30-CRM: Pipeline Kanban (reuse existing tables)
-- Tables used:
--   - public.pipelines
--   - public.pipeline_stages
--   - public.deals
-- Adds missing deal fields + triggers and seeds default pipeline on org creation.
-- ============================================================

-- 1) Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'crm_deal_source_enum') THEN
    CREATE TYPE public.crm_deal_source_enum AS ENUM (
      'referral','website','cold_call','event','other'
    );
  END IF;
END $$;

-- 2) Extend deals (non-breaking)
ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS stage_entered_at timestamptz,
  ADD COLUMN IF NOT EXISTS probability integer,
  ADD COLUMN IF NOT EXISTS actual_close_date date,
  ADD COLUMN IF NOT EXISTS won boolean,
  ADD COLUMN IF NOT EXISTS source public.crm_deal_source_enum,
  ADD COLUMN IF NOT EXISTS stale_days integer;

-- Basic constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'deals_probability_0_100'
  ) THEN
    ALTER TABLE public.deals
      ADD CONSTRAINT deals_probability_0_100
      CHECK (probability IS NULL OR (probability >= 0 AND probability <= 100));
  END IF;
END $$;

-- 3) Triggers: stage_entered_at + stale_days refresh on stage changes
CREATE OR REPLACE FUNCTION public.deals_set_stage_entered_at()
RETURNS trigger AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.stage_entered_at IS NULL THEN
      NEW.stage_entered_at := now();
    END IF;
    IF NEW.stale_days IS NULL AND NEW.stage_entered_at IS NOT NULL THEN
      NEW.stale_days := 0;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.stage_id IS DISTINCT FROM OLD.stage_id THEN
    NEW.stage_entered_at := now();
    NEW.stale_days := 0;
  ELSIF NEW.stage_entered_at IS DISTINCT FROM OLD.stage_entered_at AND NEW.stage_entered_at IS NOT NULL THEN
    -- Recalculate on manual edits
    NEW.stale_days := GREATEST(0, (CURRENT_DATE - NEW.stage_entered_at::date));
  END IF;

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_deals_stage_entered_at') THEN
    CREATE TRIGGER trg_deals_stage_entered_at
    BEFORE INSERT OR UPDATE ON public.deals
    FOR EACH ROW
    EXECUTE FUNCTION public.deals_set_stage_entered_at();
  END IF;
END $$;

-- 4) Indexes (Kanban performance)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='deals' AND indexname='idx_deals_pipeline'
  ) THEN
    CREATE INDEX idx_deals_pipeline ON public.deals (pipeline_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='deals' AND indexname='idx_deals_stage'
  ) THEN
    CREATE INDEX idx_deals_stage ON public.deals (stage_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='deals' AND indexname='idx_deals_stage_entered_at'
  ) THEN
    CREATE INDEX idx_deals_stage_entered_at ON public.deals (stage_entered_at);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='pipelines' AND indexname='idx_pipelines_org_owner_default'
  ) THEN
    CREATE INDEX idx_pipelines_org_owner_default ON public.pipelines (organization_id, owner_type, is_default);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='pipeline_stages' AND indexname='idx_pipeline_stages_pipeline_pos'
  ) THEN
    CREATE INDEX idx_pipeline_stages_pipeline_pos ON public.pipeline_stages (pipeline_id, position);
  END IF;
END $$;

-- 5) Seed default pipeline + stages (on new organizations)
CREATE OR REPLACE FUNCTION public.crm_seed_default_pipeline(p_org_id uuid)
RETURNS uuid AS $seed$
DECLARE
  v_pipeline_id uuid;
BEGIN
  -- If already exists, return it
  SELECT id INTO v_pipeline_id
  FROM public.pipelines
  WHERE organization_id = p_org_id
    AND owner_type = 'tenant'
    AND is_default = true
  LIMIT 1;

  IF v_pipeline_id IS NOT NULL THEN
    RETURN v_pipeline_id;
  END IF;

  INSERT INTO public.pipelines (organization_id, owner_type, name, is_default, position)
  VALUES (p_org_id, 'tenant', 'Ventas', true, 0)
  RETURNING id INTO v_pipeline_id;

  -- Stages: Lead → Contactado → Propuesta → Negociación → Ganado/Perdido
  INSERT INTO public.pipeline_stages (pipeline_id, name, color, position, probability, is_won_stage, is_lost_stage)
  VALUES
    (v_pipeline_id, 'Lead', '#64748B', 0, 10, false, false),
    (v_pipeline_id, 'Contactado', '#0EA5E9', 1, 25, false, false),
    (v_pipeline_id, 'Propuesta', '#F97316', 2, 50, false, false),
    (v_pipeline_id, 'Negociación', '#8B5CF6', 3, 75, false, false),
    (v_pipeline_id, 'Ganado', '#22C55E', 4, 100, true, false),
    (v_pipeline_id, 'Perdido', '#EF4444', 5, 0, false, true);

  RETURN v_pipeline_id;
END;
$seed$ LANGUAGE plpgsql SET search_path = public;

-- Trigger on organizations insert
CREATE OR REPLACE FUNCTION public.crm_seed_default_pipeline_on_org_insert()
RETURNS trigger AS $trg$
BEGIN
  PERFORM public.crm_seed_default_pipeline(NEW.id);
  RETURN NEW;
END;
$trg$ LANGUAGE plpgsql SET search_path = public;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_org_seed_crm_default_pipeline') THEN
    CREATE TRIGGER trg_org_seed_crm_default_pipeline
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.crm_seed_default_pipeline_on_org_insert();
  END IF;
END $$;