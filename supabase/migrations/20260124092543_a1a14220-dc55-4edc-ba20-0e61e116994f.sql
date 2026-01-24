-- L33-PAGOS: Fix policies creation (Postgres doesn't support CREATE POLICY IF NOT EXISTS)

-- 1) Enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_link_status') THEN
    CREATE TYPE public.payment_link_status AS ENUM ('active','completed','expired','cancelled');
  END IF;
END $$;

-- 2) Tables (idempotent)
CREATE TABLE IF NOT EXISTS public.payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT,
  stripe_url TEXT,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  status public.payment_link_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  qr_code_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_links_org ON public.payment_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_invoice ON public.payment_links(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_links_status ON public.payment_links(status);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_payment_links_invoice_active
ON public.payment_links(invoice_id)
WHERE status = 'active';

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public'
      AND tablename='payment_links'
      AND policyname='Payment links are viewable by org members'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "Payment links are viewable by org members"
      ON public.payment_links
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.organization_id = payment_links.organization_id
            AND m.user_id = auth.uid()
        )
      )
    $POL$;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  payment_link_id UUID REFERENCES public.payment_links(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
  method TEXT DEFAULT 'stripe',
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_org ON public.invoice_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public'
      AND tablename='invoice_payments'
      AND policyname='Invoice payments are viewable by org members'
  ) THEN
    EXECUTE $POL$
      CREATE POLICY "Invoice payments are viewable by org members"
      ON public.invoice_payments
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.organization_id = invoice_payments.organization_id
            AND m.user_id = auth.uid()
        )
      )
    $POL$;
  END IF;
END $$;
