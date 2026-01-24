-- L34-PAGOS: Catálogo de servicios para portal

CREATE TABLE IF NOT EXISTS public.service_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  base_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Stripe pre-created price (opcional)
  stripe_price_id TEXT,
  
  display_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_catalog_org ON public.service_catalog(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON public.service_catalog(category);

ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='service_catalog'
      AND policyname='Service catalog viewable by org members'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "Service catalog viewable by org members"
      ON public.service_catalog
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.organization_id = service_catalog.organization_id
            AND m.user_id = auth.uid()
        )
      )
    $POL$;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='service_catalog'
      AND policyname='Service catalog manageable by org members'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "Service catalog manageable by org members"
      ON public.service_catalog
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.organization_id = service_catalog.organization_id
            AND m.user_id = auth.uid()
        )
      )
    $POL$;
  END IF;
END $$;
