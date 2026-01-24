-- ============================================================
-- L29-DOCKET: Campos por Jurisdicción (FULL, idempotent)
-- Creates tables + updated_at triggers + RLS policies.
-- ============================================================

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='es_modalidad_enum') THEN
    CREATE TYPE public.es_modalidad_enum AS ENUM ('normal','urgente');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='euipo_second_language_enum') THEN
    CREATE TYPE public.euipo_second_language_enum AS ENUM ('en','de','fr','es','it');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='us_application_type_enum') THEN
    CREATE TYPE public.us_application_type_enum AS ENUM ('1a','1b','44d','44e','66a');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='epo_procedure_language_enum') THEN
    CREATE TYPE public.epo_procedure_language_enum AS ENUM ('en','de','fr');
  END IF;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS public.matter_jurisdiction_es (
  matter_id uuid PRIMARY KEY REFERENCES public.matters(id) ON DELETE CASCADE,
  modalidad public.es_modalidad_enum,
  tasa_pyme_aplicada boolean,
  examen_fondo_solicitado boolean,
  examen_fondo_fecha date,
  bopi_publicacion varchar,
  oposicion_fecha_limite date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.matter_jurisdiction_euipo (
  matter_id uuid PRIMARY KEY REFERENCES public.matters(id) ON DELETE CASCADE,
  second_language public.euipo_second_language_enum,
  fast_track boolean,
  seniority_member_state varchar(2),
  seniority_registration_number varchar,
  seniority_date date,
  proof_of_use_deadline date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.matter_jurisdiction_us (
  matter_id uuid PRIMARY KEY REFERENCES public.matters(id) ON DELETE CASCADE,
  application_type public.us_application_type_enum,
  specimen_filed boolean,
  specimen_url text,
  allegation_of_use_date date,
  section_8_deadline date,
  section_8_filed boolean,
  section_15_deadline date,
  section_15_filed boolean,
  section_9_deadline date,
  intent_to_use boolean,
  suspension_letter boolean,
  office_action_deadline date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.matter_jurisdiction_ep (
  matter_id uuid PRIMARY KEY REFERENCES public.matters(id) ON DELETE CASCADE,
  procedure_language public.epo_procedure_language_enum,
  designated_states text[],
  validation_deadline date,
  validated_countries text[],
  unitary_patent boolean,
  opposition_filed boolean,
  opposition_deadline date,
  appeal_pending boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.matter_jurisdiction_wipo (
  matter_id uuid PRIMARY KEY REFERENCES public.matters(id) ON DELETE CASCADE,
  basic_mark_office varchar(2),
  basic_mark_number varchar,
  dependency_period_end date,
  central_attack_risk boolean,
  designations jsonb[],
  subsequent_designations jsonb[],
  limitation_applied boolean,
  transformation_to_national boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_matter_jurisdiction_es_updated_at') THEN
    CREATE TRIGGER trg_matter_jurisdiction_es_updated_at
    BEFORE UPDATE ON public.matter_jurisdiction_es
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_matter_jurisdiction_euipo_updated_at') THEN
    CREATE TRIGGER trg_matter_jurisdiction_euipo_updated_at
    BEFORE UPDATE ON public.matter_jurisdiction_euipo
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_matter_jurisdiction_us_updated_at') THEN
    CREATE TRIGGER trg_matter_jurisdiction_us_updated_at
    BEFORE UPDATE ON public.matter_jurisdiction_us
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_matter_jurisdiction_ep_updated_at') THEN
    CREATE TRIGGER trg_matter_jurisdiction_ep_updated_at
    BEFORE UPDATE ON public.matter_jurisdiction_ep
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='trg_matter_jurisdiction_wipo_updated_at') THEN
    CREATE TRIGGER trg_matter_jurisdiction_wipo_updated_at
    BEFORE UPDATE ON public.matter_jurisdiction_wipo
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- RLS policies (only if table exists)
DO $$
DECLARE
  t text;
  p_select text;
  p_insert text;
  p_update text;
  p_delete text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'matter_jurisdiction_es',
    'matter_jurisdiction_euipo',
    'matter_jurisdiction_us',
    'matter_jurisdiction_ep',
    'matter_jurisdiction_wipo'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);

    p_select := format('View org %s', t);
    p_insert := format('Create org %s', t);
    p_update := format('Update org %s', t);
    p_delete := format('Delete org %s', t);

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=p_select) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.matters m JOIN public.memberships ms ON ms.organization_id = m.organization_id WHERE m.id = matter_id AND ms.user_id = auth.uid()));',
        p_select, t
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=p_insert) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.matters m JOIN public.memberships ms ON ms.organization_id = m.organization_id WHERE m.id = matter_id AND ms.user_id = auth.uid()));',
        p_insert, t
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=p_update) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR UPDATE USING (EXISTS (SELECT 1 FROM public.matters m JOIN public.memberships ms ON ms.organization_id = m.organization_id WHERE m.id = matter_id AND ms.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.matters m JOIN public.memberships ms ON ms.organization_id = m.organization_id WHERE m.id = matter_id AND ms.user_id = auth.uid()));',
        p_update, t
      );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname=p_delete) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR DELETE USING (EXISTS (SELECT 1 FROM public.matters m JOIN public.memberships ms ON ms.organization_id = m.organization_id WHERE m.id = matter_id AND ms.user_id = auth.uid()));',
        p_delete, t
      );
    END IF;
  END LOOP;
END $$;