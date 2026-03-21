-- ============================================================
-- FINANCE-02 PHASE 1 — Complete Database Schema
-- IP-FINANCE: Módulo Financiero Global
-- ============================================================

-- =============================================
-- 1. finance_module_config — Feature flags por tenant
-- =============================================
CREATE TABLE IF NOT EXISTS finance_module_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  finance_tier text DEFAULT 'basic',
  primary_country text DEFAULT 'ES',
  fiscal_year_start_month integer DEFAULT 1,
  functional_currency text DEFAULT 'EUR',
  feature_timesheet boolean DEFAULT true,
  feature_expenses boolean DEFAULT true,
  feature_provisions boolean DEFAULT true,
  feature_valuation boolean DEFAULT false,
  feature_accounting boolean DEFAULT false,
  feature_bank_reconciliation boolean DEFAULT false,
  feature_regulatory_reporting boolean DEFAULT false,
  default_payment_terms_days integer DEFAULT 30,
  default_invoice_language text DEFAULT 'es',
  invoice_footer_text text,
  invoice_series_default text DEFAULT 'F',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 2. fin_fiscal_configs — Configuración fiscal por tenant
-- =============================================
CREATE TABLE IF NOT EXISTS fin_fiscal_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  legal_name text NOT NULL DEFAULT '',
  tax_id text NOT NULL DEFAULT '',
  tax_id_type text DEFAULT 'NIF',
  vat_number text,
  country_code text NOT NULL DEFAULT 'ES',
  fiscal_address jsonb NOT NULL DEFAULT '{}',
  vat_regime text DEFAULT 'general',
  vat_registered boolean DEFAULT true,
  vat_registration_date date,
  applies_irpf boolean DEFAULT false,
  default_irpf_rate numeric(5,2) DEFAULT 15.00,
  accounting_standard text DEFAULT 'pgc',
  sii_enabled boolean DEFAULT false,
  verifactu_enabled boolean DEFAULT false,
  saft_enabled boolean DEFAULT false,
  mtd_enabled boolean DEFAULT false,
  bank_account_iban text,
  bank_account_bic text,
  bank_name text,
  digital_signature_enabled boolean DEFAULT false,
  digital_certificate_expiry date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 3. fin_tax_rates — Tipos impositivos por país
-- =============================================
CREATE TABLE IF NOT EXISTS fin_tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  country_code text NOT NULL,
  tax_type text NOT NULL,
  rate_name text NOT NULL,
  rate_pct numeric(5,2) NOT NULL,
  applies_to text[] DEFAULT '{}',
  is_default boolean DEFAULT false,
  is_exempt boolean DEFAULT false,
  exempt_reason text,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 4. services_catalog — Catálogo de servicios PI
-- =============================================
CREATE TABLE IF NOT EXISTS services_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  invoice_item_type text DEFAULT 'professional_fee',
  default_price numeric(10,2),
  default_currency text DEFAULT 'EUR',
  default_unit text DEFAULT 'service',
  default_vat_rate_pct numeric(5,2),
  default_irpf_rate_pct numeric(5,2),
  applicable_jurisdictions text[] DEFAULT '{}',
  nice_classes integer[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_system_template boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, code)
);

-- =============================================
-- 5. billing_rates — Tarifas por usuario/proyecto
-- =============================================
CREATE TABLE IF NOT EXISTS billing_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  rate_type text NOT NULL DEFAULT 'user',
  user_id uuid REFERENCES profiles(id),
  matter_type text,
  crm_account_id uuid REFERENCES crm_accounts(id),
  rate_name text NOT NULL,
  hourly_rate numeric(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  activity_type text,
  is_default boolean DEFAULT false,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 6. finance_costs — Costes operativos del despacho
-- =============================================
CREATE TABLE IF NOT EXISTS finance_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  cost_category text NOT NULL,
  description text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  amount_eur numeric(10,2),
  is_recurring boolean DEFAULT false,
  recurrence_period text,
  cost_date date NOT NULL DEFAULT CURRENT_DATE,
  period_from date,
  period_to date,
  vendor_name text,
  vendor_invoice_number text,
  receipt_storage_path text,
  vat_amount numeric(10,2) DEFAULT 0,
  is_vat_deductible boolean DEFAULT true,
  matter_id uuid REFERENCES matters(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 7. provision_movements — Movimientos de provisiones
-- =============================================
CREATE TABLE IF NOT EXISTS provision_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  provision_id uuid NOT NULL REFERENCES provisions(id),
  movement_type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'EUR',
  amount_eur numeric(10,2),
  description text NOT NULL,
  invoice_id uuid REFERENCES invoices(id),
  expense_id uuid REFERENCES expenses(id),
  balance_before numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 8. fin_countries_config — Configuración contable por país
-- =============================================
CREATE TABLE IF NOT EXISTS fin_countries_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL UNIQUE,
  country_name text NOT NULL,
  default_accounting_standard text,
  fiscal_year_start_month integer DEFAULT 1,
  has_vat boolean DEFAULT true,
  has_gst boolean DEFAULT false,
  has_sales_tax boolean DEFAULT false,
  has_withholding_tax boolean DEFAULT false,
  standard_vat_rate numeric(5,2),
  has_sii boolean DEFAULT false,
  has_verifactu boolean DEFAULT false,
  has_saft boolean DEFAULT false,
  has_mtd boolean DEFAULT false,
  has_fec boolean DEFAULT false,
  has_gobd boolean DEFAULT false,
  has_golden_tax boolean DEFAULT false,
  currency_code text,
  date_format text DEFAULT 'DD/MM/YYYY',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 9. fin_chart_of_accounts — Plan de cuentas (Advanced)
-- =============================================
CREATE TABLE IF NOT EXISTS fin_chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  account_code text NOT NULL,
  account_name text NOT NULL,
  account_type text NOT NULL,
  parent_account_code text,
  is_active boolean DEFAULT true,
  allows_entries boolean DEFAULT true,
  country_code text,
  accounting_standard text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, account_code)
);

-- =============================================
-- 10. fin_journal_entries — Asientos contables (Advanced, INMUTABLE)
-- =============================================
CREATE TABLE IF NOT EXISTS fin_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  entry_number text NOT NULL,
  entry_date date NOT NULL,
  accounting_period text NOT NULL,
  description text NOT NULL,
  entry_type text NOT NULL,
  source_type text,
  source_id uuid,
  lines jsonb NOT NULL DEFAULT '[]',
  total_debit numeric(12,2) NOT NULL,
  total_credit numeric(12,2) NOT NULL,
  is_balanced boolean GENERATED ALWAYS AS (total_debit = total_credit) STORED,
  status text DEFAULT 'posted',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT journal_entry_balanced
    CHECK (total_debit = total_credit OR status = 'draft')
);

-- =============================================
-- 11. fin_bank_accounts — Cuentas bancarias del tenant
-- =============================================
CREATE TABLE IF NOT EXISTS fin_bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  account_name text NOT NULL,
  bank_name text,
  iban text,
  bic_swift text,
  currency text DEFAULT 'EUR',
  current_balance numeric(12,2) DEFAULT 0,
  last_reconciled_at timestamptz,
  last_reconciled_balance numeric(12,2),
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  bank_connection_type text DEFAULT 'manual',
  bank_connection_id text,
  chart_account_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 12. fin_bank_transactions — Movimientos bancarios
-- =============================================
CREATE TABLE IF NOT EXISTS fin_bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  bank_account_id uuid NOT NULL REFERENCES fin_bank_accounts(id),
  transaction_date date NOT NULL,
  value_date date,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text DEFAULT 'EUR',
  amount_eur numeric(12,2),
  balance_after numeric(12,2),
  bank_reference text,
  bank_category text,
  reconciliation_status text DEFAULT 'unmatched',
  matched_invoice_id uuid REFERENCES invoices(id),
  matched_expense_id uuid REFERENCES expenses(id),
  matched_at timestamptz,
  matched_by uuid REFERENCES profiles(id),
  journal_entry_id uuid REFERENCES fin_journal_entries(id),
  import_batch_id text,
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- 13. verifactu_records — Registro de envíos Verifactu
-- =============================================
CREATE TABLE IF NOT EXISTS verifactu_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  verifactu_id text UNIQUE,
  chain_hash text NOT NULL,
  previous_hash text,
  submission_timestamp timestamptz DEFAULT now(),
  submission_status text DEFAULT 'pending',
  aeat_response jsonb,
  error_code text,
  error_description text,
  retry_count integer DEFAULT 0,
  verifactu_qr_data text,
  verification_code text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- ALTER existing tables — add missing columns
-- =============================================
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(15,6) DEFAULT 1.000000,
  ADD COLUMN IF NOT EXISTS exchange_rate_date date,
  ADD COLUMN IF NOT EXISTS exchange_rate_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS realized_fx_gain_loss numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invoice_item_type_summary jsonb DEFAULT '{}';

ALTER TABLE invoice_sequences
  ADD COLUMN IF NOT EXISTS last_verifactu_hash text,
  ADD COLUMN IF NOT EXISTS last_invoice_id uuid,
  ADD COLUMN IF NOT EXISTS verifactu_enabled boolean DEFAULT false;

ALTER TABLE time_entries
  ADD COLUMN IF NOT EXISTS billing_rate_id uuid;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS expense_item_type text DEFAULT 'expense',
  ADD COLUMN IF NOT EXISTS is_suplido boolean DEFAULT false;

-- =============================================
-- RLS on ALL new tables
-- =============================================
ALTER TABLE finance_module_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_fiscal_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provision_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_countries_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifactu_records ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================
CREATE POLICY "finance_module_config_org" ON finance_module_config
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "fin_fiscal_configs_org" ON fin_fiscal_configs
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "billing_rates_org" ON billing_rates
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "finance_costs_org" ON finance_costs
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "provision_movements_org" ON provision_movements
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "fin_chart_of_accounts_org" ON fin_chart_of_accounts
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "fin_bank_accounts_org" ON fin_bank_accounts
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "fin_bank_transactions_org" ON fin_bank_transactions
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "verifactu_records_org" ON verifactu_records
  FOR ALL TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "tax_rates_read" ON fin_tax_rates
  FOR SELECT TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_user_org_id());

CREATE POLICY "tax_rates_write" ON fin_tax_rates
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "tax_rates_update" ON fin_tax_rates
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "tax_rates_delete" ON fin_tax_rates
  FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "services_catalog_read" ON services_catalog
  FOR SELECT TO authenticated
  USING (organization_id IS NULL OR organization_id = public.get_user_org_id());

CREATE POLICY "services_catalog_insert" ON services_catalog
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "services_catalog_update" ON services_catalog
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id())
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "services_catalog_delete" ON services_catalog
  FOR DELETE TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "countries_config_read" ON fin_countries_config
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "journal_entries_org_read" ON fin_journal_entries
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "journal_entries_org_insert" ON fin_journal_entries
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_org_id());

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_fin_journal_org_period
  ON fin_journal_entries(organization_id, accounting_period, entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_bank_txn_account
  ON fin_bank_transactions(bank_account_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_bank_txn_reconciliation
  ON fin_bank_transactions(organization_id, reconciliation_status);
CREATE INDEX IF NOT EXISTS idx_services_catalog_category
  ON services_catalog(category, is_active) WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_billing_rates_user
  ON billing_rates(organization_id, user_id, is_default);
CREATE INDEX IF NOT EXISTS idx_provision_movements_provision
  ON provision_movements(provision_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_verifactu_org_status
  ON verifactu_records(organization_id, submission_status);
CREATE INDEX IF NOT EXISTS idx_finance_costs_org_date
  ON finance_costs(organization_id, cost_date DESC);
CREATE INDEX IF NOT EXISTS idx_fin_bank_accounts_org
  ON fin_bank_accounts(organization_id, is_active);

-- =============================================
-- FUNCTION: get_next_invoice_number (improved)
-- =============================================
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(
  p_org_id uuid,
  p_series text DEFAULT 'F',
  p_year integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next integer;
  v_full_number text;
BEGIN
  INSERT INTO invoice_sequences (organization_id, series, year, last_number)
  VALUES (p_org_id, p_series, p_year, 0)
  ON CONFLICT (organization_id, series, year) DO NOTHING;

  SELECT last_number + 1 INTO v_next
  FROM invoice_sequences
  WHERE organization_id = p_org_id AND series = p_series AND year = p_year
  FOR UPDATE;

  UPDATE invoice_sequences
  SET last_number = v_next
  WHERE organization_id = p_org_id AND series = p_series AND year = p_year;

  v_full_number := p_series || '-' || p_year || '-' || LPAD(v_next::text, 6, '0');
  RETURN v_full_number;
END;
$$;

-- =============================================
-- FUNCTION: generate_journal_entry_for_invoice
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_journal_entry_for_invoice(
  p_invoice_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_invoice record;
  v_entry_id uuid;
  v_entry_number text;
  v_lines jsonb;
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;
  IF v_invoice IS NULL THEN RETURN NULL; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM finance_module_config
    WHERE organization_id = v_invoice.organization_id
    AND feature_accounting = true
  ) THEN
    RETURN NULL;
  END IF;

  v_entry_number := 'ASIENTO-' ||
    EXTRACT(YEAR FROM v_invoice.invoice_date) || '-' ||
    LPAD(
      (SELECT COUNT(*) + 1 FROM fin_journal_entries
       WHERE organization_id = v_invoice.organization_id
       AND accounting_period = TO_CHAR(v_invoice.invoice_date, 'YYYY-MM')
      )::text, 6, '0'
    );

  v_lines := jsonb_build_array(
    jsonb_build_object(
      'account_code', '430',
      'account_name', 'Clientes',
      'debit', v_invoice.total,
      'credit', 0,
      'description', 'Factura ' || v_invoice.full_number
    ),
    jsonb_build_object(
      'account_code', '700',
      'account_name', 'Prestación de servicios',
      'debit', 0,
      'credit', v_invoice.subtotal,
      'description', 'Base imponible ' || v_invoice.full_number
    ),
    jsonb_build_object(
      'account_code', '477',
      'account_name', 'IVA repercutido',
      'debit', 0,
      'credit', COALESCE(v_invoice.vat_amount, 0),
      'description', 'IVA ' || v_invoice.full_number
    )
  );

  INSERT INTO fin_journal_entries (
    organization_id, entry_number, entry_date,
    accounting_period, description, entry_type,
    source_type, source_id, lines,
    total_debit, total_credit, status
  ) VALUES (
    v_invoice.organization_id,
    v_entry_number,
    v_invoice.invoice_date,
    TO_CHAR(v_invoice.invoice_date, 'YYYY-MM'),
    'Factura emitida ' || v_invoice.full_number,
    'invoice_issued',
    'invoice', p_invoice_id,
    v_lines,
    v_invoice.total,
    v_invoice.total,
    'posted'
  ) RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$;

-- =============================================
-- SEED: fin_countries_config
-- =============================================
INSERT INTO fin_countries_config
  (country_code, country_name, default_accounting_standard,
   has_vat, standard_vat_rate, has_sii, has_verifactu,
   has_saft, has_mtd, has_fec, has_gobd, currency_code)
VALUES
('ES','España','pgc',true,21.00,true,true,false,false,false,false,'EUR'),
('PT','Portugal','sncrf',true,23.00,false,false,true,false,false,false,'EUR'),
('FR','Francia','pcg',true,20.00,false,false,false,false,true,false,'EUR'),
('DE','Alemania','hgb',true,19.00,false,false,false,false,false,true,'EUR'),
('GB','Reino Unido','frs102',true,20.00,false,false,false,true,false,false,'GBP'),
('US','Estados Unidos','gaap_us',false,0.00,false,false,false,false,false,false,'USD'),
('CN','China','chinese_gaap',true,13.00,false,false,false,false,false,false,'CNY'),
('JP','Japón','j_gaap',true,10.00,false,false,false,false,false,false,'JPY'),
('BR','Brasil','nbr',false,0.00,false,false,false,false,false,false,'BRL'),
('MX','México','nif_mx',false,0.00,false,false,false,false,false,false,'MXN')
ON CONFLICT (country_code) DO NOTHING;

-- =============================================
-- SEED: fin_tax_rates (system-level, org=null)
-- =============================================
INSERT INTO fin_tax_rates
  (country_code, tax_type, rate_name, rate_pct, applies_to, is_default)
VALUES
('ES','vat','IVA General', 21.00, '{"professional_fees"}', true),
('ES','vat','IVA Reducido', 10.00, '{}', false),
('ES','vat','IVA Superreducido', 4.00, '{}', false),
('ES','vat','IVA Exento', 0.00, '{"official_fees"}', false),
('ES','irpf','IRPF General', 15.00, '{"professional_fees"}', true),
('ES','irpf','IRPF Nuevo Autónomo', 7.00, '{"professional_fees"}', false),
('PT','vat','IVA Normal', 23.00, '{"professional_fees"}', true),
('PT','vat','IVA Intermédio', 13.00, '{}', false),
('PT','vat','IVA Reduzido', 6.00, '{}', false),
('PT','vat','IVA Isento', 0.00, '{"official_fees"}', false),
('FR','vat','TVA Normale', 20.00, '{"professional_fees"}', true),
('FR','vat','TVA Réduite', 10.00, '{}', false),
('FR','vat','TVA Super Réduite', 5.50, '{}', false),
('DE','vat','MwSt Regulär', 19.00, '{"professional_fees"}', true),
('DE','vat','MwSt Ermäßigt', 7.00, '{}', false),
('GB','vat','VAT Standard', 20.00, '{"professional_fees"}', true),
('GB','vat','VAT Reduced', 5.00, '{}', false),
('GB','vat','VAT Zero', 0.00, '{"official_fees"}', false),
('US','sales_tax','No Federal Tax', 0.00, '{}', true),
('EM','vat','VAT Reverse Charge', 0.00, '{"official_fees"}', true)
ON CONFLICT DO NOTHING;

-- =============================================
-- SEED: services_catalog (system templates, org=null)
-- =============================================
INSERT INTO services_catalog
  (code, name, category, invoice_item_type,
   default_price, default_currency, default_unit,
   is_system_template, is_active)
VALUES
('TM-SEARCH','Búsqueda de marcas','ip_search','professional_fee',250,'EUR','service',true,true),
('TM-REG-EUIPO','Registro de marca EUIPO (1 clase)','trademark_registration','professional_fee',450,'EUR','service',true,true),
('TM-REG-EUIPO-FEE','Tasas EUIPO registro (1 clase)','trademark_registration','official_fee',850,'EUR','service',true,true),
('TM-REG-ES','Registro de marca OEPM (1 clase)','trademark_registration','professional_fee',250,'EUR','service',true,true),
('TM-REG-ES-FEE','Tasas OEPM registro','trademark_registration','official_fee',150,'EUR','service',true,true),
('TM-REG-US','Trademark Registration USPTO (1 class)','trademark_registration','professional_fee',600,'EUR','service',true,true),
('TM-REG-US-FEE','USPTO filing fee (per class)','trademark_registration','official_fee',250,'EUR','service',true,true),
('TM-OPP-EUIPO','Oposición EUIPO','trademark_opposition','professional_fee',800,'EUR','service',true,true),
('TM-OPP-EUIPO-FEE','Tasas oposición EUIPO','trademark_opposition','official_fee',320,'EUR','service',true,true),
('TM-REN-EUIPO','Renovación marca EUIPO (1 clase)','trademark_renewal','professional_fee',300,'EUR','service',true,true),
('TM-REN-EUIPO-FEE','Tasas renovación EUIPO (1 clase)','trademark_renewal','official_fee',850,'EUR','service',true,true),
('TM-OA-EUIPO','Respuesta Office Action EUIPO','trademark_registration','professional_fee',400,'EUR','service',true,true),
('TM-OA-USPTO','Response to Office Action USPTO','trademark_registration','professional_fee',500,'EUR','service',true,true),
('PAT-SEARCH','Búsqueda de estado de la técnica','ip_search','professional_fee',600,'EUR','service',true,true),
('PAT-FILE-EP','Solicitud patente EPO','patent_filing','professional_fee',1200,'EUR','service',true,true),
('PAT-FILE-EP-FEE','Tasas EPO filing','patent_filing','official_fee',1350,'EUR','service',true,true),
('PAT-PCT','Solicitud PCT (vía internacional)','patent_filing','professional_fee',2000,'EUR','service',true,true),
('DES-REG-EUIPO','Registro diseño EUIPO','design_registration','professional_fee',400,'EUR','service',true,true),
('DES-REG-EUIPO-FEE','Tasas registro diseño EUIPO','design_registration','official_fee',350,'EUR','service',true,true),
('CONS-HOUR','Consultoría PI (por hora)','ip_advice','professional_fee',200,'EUR','hour',true,true),
('CONS-AUDIT','Auditoría de portfolio PI','ip_advice','professional_fee',1500,'EUR','service',true,true),
('CONS-LIC','Contrato de licencia de marca','ip_advice','professional_fee',800,'EUR','service',true,true),
('CONS-CSD','Carta cease & desist','ip_advice','professional_fee',350,'EUR','service',true,true)
ON CONFLICT DO NOTHING;