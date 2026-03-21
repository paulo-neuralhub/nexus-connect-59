
-- ============================================================
-- FINANCE-01 FASE 1 — Base de datos financiera IP-NEXUS
-- ============================================================

-- 1. ALTER invoices — columnas IP-específicas faltantes
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS matter_id uuid REFERENCES matters(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS crm_account_id uuid REFERENCES crm_accounts(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS crm_deal_id uuid REFERENCES crm_deals(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS series text DEFAULT 'A';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS full_number text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS official_fees_subtotal numeric(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS professional_fees_subtotal numeric(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS expenses_subtotal numeric(10,2) DEFAULT 0;

-- 2. ALTER time_entries — FKs a CRM
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS crm_account_id uuid REFERENCES crm_accounts(id);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS crm_deal_id uuid REFERENCES crm_deals(id);

-- 3. CREATE invoice_items
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  line_type text NOT NULL DEFAULT 'service',
  description text NOT NULL,
  detail text,
  matter_id uuid REFERENCES matters(id),
  jurisdiction_code text,
  nice_class integer,
  quantity numeric(10,4) DEFAULT 1,
  unit text DEFAULT 'unit',
  unit_price numeric(10,2) NOT NULL,
  discount_pct numeric(5,2) DEFAULT 0,
  subtotal numeric(10,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 21.00,
  tax_amount numeric(10,2) DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 4. CREATE invoice_payments
CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text,
  reference text,
  notes text,
  stripe_payment_id text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- 5. CREATE invoice_sequences
CREATE TABLE IF NOT EXISTS invoice_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  series text NOT NULL DEFAULT 'A',
  year integer NOT NULL DEFAULT EXTRACT(year FROM now())::integer,
  last_number integer DEFAULT 0,
  prefix text DEFAULT '',
  format text DEFAULT '{SERIES}-{YEAR}-{NUMBER:04d}',
  UNIQUE(organization_id, series, year)
);

-- 6. CREATE quotes
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  quote_number text,
  crm_account_id uuid REFERENCES crm_accounts(id),
  crm_deal_id uuid REFERENCES crm_deals(id),
  client_name text NOT NULL,
  client_email text,
  subtotal numeric(10,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  total_amount numeric(10,2) DEFAULT 0,
  currency text DEFAULT 'EUR',
  jurisdictions jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft',
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  converted_to_invoice_id uuid REFERENCES invoices(id),
  notes text,
  terms text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. CREATE quote_items
CREATE TABLE IF NOT EXISTS quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  line_type text DEFAULT 'service',
  description text NOT NULL,
  jurisdiction_code text,
  quantity numeric(10,4) DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  subtotal numeric(10,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 21.00,
  sort_order integer DEFAULT 0
);

-- 8. CREATE expenses
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid REFERENCES profiles(id),
  matter_id uuid REFERENCES matters(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  invoice_id uuid REFERENCES invoices(id),
  description text NOT NULL,
  category text,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  amount_eur numeric(10,2),
  expense_date date DEFAULT CURRENT_DATE,
  is_billable boolean DEFAULT true,
  is_billed boolean DEFAULT false,
  receipt_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 9. RLS en todas las tablas nuevas
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items_org_isolation" ON invoice_items
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "invoice_payments_org_isolation" ON invoice_payments
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "invoice_sequences_org_isolation" ON invoice_sequences
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "quotes_org_isolation" ON quotes
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "quote_items_org_isolation" ON quote_items
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "expenses_org_isolation" ON expenses
  FOR ALL USING (organization_id = public.get_user_org_id());

-- 10. Función get_next_invoice_number con FOR UPDATE (race-condition safe)
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(
  p_org_id uuid, p_series text DEFAULT 'A'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year integer := EXTRACT(year FROM now())::integer;
  v_next integer;
BEGIN
  -- Upsert para asegurar que la secuencia existe
  INSERT INTO invoice_sequences (organization_id, series, year, last_number)
  VALUES (p_org_id, p_series, v_year, 0)
  ON CONFLICT (organization_id, series, year) DO NOTHING;

  -- SELECT FOR UPDATE para evitar race conditions
  SELECT last_number + 1 INTO v_next
  FROM invoice_sequences
  WHERE organization_id = p_org_id AND series = p_series AND year = v_year
  FOR UPDATE;

  UPDATE invoice_sequences
  SET last_number = v_next
  WHERE organization_id = p_org_id AND series = p_series AND year = v_year;

  RETURN p_series || '-' || v_year || '-' || lpad(v_next::text, 4, '0');
END;
$$;

-- 11. Índices críticos
CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_matter ON invoices(matter_id);
CREATE INDEX IF NOT EXISTS idx_invoices_crm_account ON invoices(crm_account_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_org_date ON time_entries(organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_matter ON time_entries(matter_id);
CREATE INDEX IF NOT EXISTS idx_expenses_matter ON expenses(matter_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON expenses(organization_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org_status ON quotes(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON quote_items(quote_id);
