-- ============================================================
-- L27-DOCKET: Campos Marcas
-- Tabla: public.matter_trademark_details
-- ============================================================

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trademark_mark_type_enum') THEN
    CREATE TYPE public.trademark_mark_type_enum AS ENUM (
      'word','figurative','combined','3d','sound','motion','hologram','color','position','pattern','other'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trademark_opposition_status_enum') THEN
    CREATE TYPE public.trademark_opposition_status_enum AS ENUM (
      'none','pending','filed','decided'
    );
  END IF;
END $$;

-- Table
CREATE TABLE IF NOT EXISTS public.matter_trademark_details (
  matter_id uuid PRIMARY KEY
    REFERENCES public.matters(id) ON DELETE CASCADE,

  mark_type public.trademark_mark_type_enum,
  mark_text varchar(500),
  mark_description text,

  nice_classes integer[],
  goods_services jsonb,

  colors text[],
  disclaimers text[],

  acquired_distinctiveness boolean,
  collective_mark boolean,
  certification_mark boolean,
  series_mark boolean,

  convention_priority boolean,
  seniority_claimed boolean,
  seniority_details jsonb,

  logo_url text,
  logo_embedding vector(512),

  opposition_deadline date,
  opposition_status public.trademark_opposition_status_enum NOT NULL DEFAULT 'none',
  opposition_notes text,

  coexistence_agreements jsonb,
  renewal_history jsonb[]
);

-- Indexes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='matter_trademark_details' AND indexname='idx_mttd_nice_classes_gin'
  ) THEN
    CREATE INDEX idx_mttd_nice_classes_gin
      ON public.matter_trademark_details
      USING gin (nice_classes);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='matter_trademark_details' AND indexname='idx_mttd_goods_services_gin'
  ) THEN
    CREATE INDEX idx_mttd_goods_services_gin
      ON public.matter_trademark_details
      USING gin (goods_services);
  END IF;

  -- Vector index for visual search (pgvector)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='matter_trademark_details' AND indexname='idx_mttd_logo_embedding_ivfflat'
  ) THEN
    CREATE INDEX idx_mttd_logo_embedding_ivfflat
      ON public.matter_trademark_details
      USING ivfflat (logo_embedding vector_cosine_ops)
      WITH (lists = 100);
  END IF;
END $$;

-- RLS
ALTER TABLE public.matter_trademark_details ENABLE ROW LEVEL SECURITY;

-- Policies: authorize via membership on the parent matter's organization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='matter_trademark_details' AND policyname='View org trademark details'
  ) THEN
    CREATE POLICY "View org trademark details"
      ON public.matter_trademark_details
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.matters m
          JOIN public.memberships ms
            ON ms.organization_id = m.organization_id
          WHERE m.id = matter_id
            AND ms.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='matter_trademark_details' AND policyname='Create org trademark details'
  ) THEN
    CREATE POLICY "Create org trademark details"
      ON public.matter_trademark_details
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.matters m
          JOIN public.memberships ms
            ON ms.organization_id = m.organization_id
          WHERE m.id = matter_id
            AND ms.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='matter_trademark_details' AND policyname='Update org trademark details'
  ) THEN
    CREATE POLICY "Update org trademark details"
      ON public.matter_trademark_details
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1
          FROM public.matters m
          JOIN public.memberships ms
            ON ms.organization_id = m.organization_id
          WHERE m.id = matter_id
            AND ms.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.matters m
          JOIN public.memberships ms
            ON ms.organization_id = m.organization_id
          WHERE m.id = matter_id
            AND ms.user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='matter_trademark_details' AND policyname='Delete org trademark details'
  ) THEN
    CREATE POLICY "Delete org trademark details"
      ON public.matter_trademark_details
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.matters m
          JOIN public.memberships ms
            ON ms.organization_id = m.organization_id
          WHERE m.id = matter_id
            AND ms.user_id = auth.uid()
        )
      );
  END IF;
END $$;