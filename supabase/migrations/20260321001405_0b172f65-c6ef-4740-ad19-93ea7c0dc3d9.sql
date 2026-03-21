
-- =============================================
-- TELEPHONY-01 FASE 1: Schema completo
-- =============================================

-- TABLA 1: Proveedores de telefonía (config global)
CREATE TABLE IF NOT EXISTS telephony_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false,
  priority integer DEFAULT 1,
  api_key_secret_name text,
  api_secret_name text,
  account_sid_secret_name text,
  master_account_id text,
  webhook_base_url text,
  supports_webrtc boolean DEFAULT true,
  supports_recording boolean DEFAULT true,
  supports_transcription boolean DEFAULT false,
  supports_subaccounts boolean DEFAULT true,
  cost_per_min_eu_landline decimal(10,4) DEFAULT 0.0040,
  cost_per_min_eu_mobile decimal(10,4) DEFAULT 0.0080,
  cost_per_min_us decimal(10,4) DEFAULT 0.0020,
  cost_per_min_latam decimal(10,4) DEFAULT 0.0120,
  cost_per_sms decimal(10,4) DEFAULT 0.0050,
  cost_per_number_month decimal(10,4) DEFAULT 1.0000,
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 2: Config de telefonía por tenant
CREATE TABLE IF NOT EXISTS telephony_tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  provider_code text REFERENCES telephony_providers(code),
  subaccount_id text,
  subaccount_auth_token text,
  is_active boolean DEFAULT false,
  is_trial boolean DEFAULT false,
  trial_minutes_remaining decimal(10,4) DEFAULT 0,
  addon_code text,
  included_minutes_monthly decimal(10,4) DEFAULT 0,
  minutes_used_this_month decimal(10,4) DEFAULT 0,
  minutes_reset_at timestamptz,
  default_caller_id text,
  record_calls boolean DEFAULT true,
  transcribe_calls boolean DEFAULT false,
  timezone text DEFAULT 'Europe/Madrid',
  max_concurrent_calls integer DEFAULT 3,
  max_call_duration_minutes integer DEFAULT 60,
  activated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 3: Números virtuales asignados
CREATE TABLE IF NOT EXISTS telephony_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  provider_code text NOT NULL,
  phone_number text NOT NULL,
  phone_number_sid text,
  friendly_name text,
  country_code text NOT NULL,
  number_type text DEFAULT 'local',
  monthly_cost decimal(10,4) NOT NULL,
  provider_cost decimal(10,4) NOT NULL,
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false,
  voice_url text,
  sms_url text,
  purchased_at timestamptz DEFAULT now(),
  released_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- TABLA 4: Wallet (billetera virtual por tenant)
CREATE TABLE IF NOT EXISTS telephony_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  current_balance decimal(10,4) NOT NULL DEFAULT 0.0000,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'active',
  low_balance_threshold decimal(10,4) DEFAULT 5.0000,
  alert_sent_at timestamptz,
  auto_recharge_enabled boolean DEFAULT false,
  auto_recharge_amount decimal(10,4) DEFAULT 20.0000,
  auto_recharge_threshold decimal(10,4) DEFAULT 2.0000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 5: Ledger (libro mayor INMUTABLE — SIN updated_at)
CREATE TABLE IF NOT EXISTS telephony_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES telephony_wallets(id),
  organization_id uuid NOT NULL,
  amount decimal(10,4) NOT NULL,
  balance_after decimal(10,4) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  transaction_type text NOT NULL,
  reference_id text,
  reference_type text,
  description text NOT NULL,
  provider_cost decimal(10,4),
  retail_price decimal(10,4),
  margin decimal(10,4),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- TABLA 6: Tarifas con markup
CREATE TABLE IF NOT EXISTS telephony_pricing_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_prefix text NOT NULL,
  destination_country text NOT NULL,
  destination_country_code text NOT NULL,
  number_type text DEFAULT 'landline',
  provider_cost_per_min decimal(10,4) NOT NULL,
  retail_price_per_min decimal(10,4) NOT NULL,
  margin_pct decimal(5,2),
  billing_increment_seconds integer DEFAULT 60,
  minimum_duration_seconds integer DEFAULT 0,
  is_active boolean DEFAULT true,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now()
);

-- TABLA 7: CDR - Call Detail Records
CREATE TABLE IF NOT EXISTS telephony_cdrs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  provider_call_sid text NOT NULL,
  provider_code text NOT NULL,
  from_number text NOT NULL,
  to_number text NOT NULL,
  direction text NOT NULL,
  duration_seconds integer DEFAULT 0,
  billable_minutes integer DEFAULT 0,
  provider_cost decimal(10,4) DEFAULT 0.0000,
  billed_amount decimal(10,4) DEFAULT 0.0000,
  status text DEFAULT 'initiated',
  answered_at timestamptz,
  ended_at timestamptz,
  recording_url text,
  recording_duration_seconds integer,
  recording_stored_path text,
  transcription_text text,
  transcription_status text,
  crm_account_id uuid,
  crm_contact_id uuid,
  crm_deal_id uuid,
  matter_id uuid,
  crm_activity_id uuid,
  user_id uuid,
  provider_metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 8: Sesiones WebRTC activas
CREATE TABLE IF NOT EXISTS telephony_webrtc_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  provider_code text NOT NULL,
  status text DEFAULT 'active',
  device_id text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- RLS EN TODAS LAS TABLAS
-- =============================================
ALTER TABLE telephony_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_pricing_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_cdrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE telephony_webrtc_sessions ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: telephony_providers
CREATE POLICY "providers_read" ON telephony_providers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "providers_superadmin_insert" ON telephony_providers
  FOR INSERT TO authenticated WITH CHECK (public.is_backoffice_staff());
CREATE POLICY "providers_superadmin_update" ON telephony_providers
  FOR UPDATE TO authenticated USING (public.is_backoffice_staff());
CREATE POLICY "providers_superadmin_delete" ON telephony_providers
  FOR DELETE TO authenticated USING (public.is_backoffice_staff());

-- POLÍTICAS: telephony_tenants
CREATE POLICY "tenants_org_select" ON telephony_tenants
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "tenants_org_update" ON telephony_tenants
  FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "tenants_backoffice_all" ON telephony_tenants
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

-- POLÍTICAS: telephony_numbers
CREATE POLICY "numbers_org_select" ON telephony_numbers
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "numbers_backoffice_all" ON telephony_numbers
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

-- POLÍTICAS: telephony_wallets
CREATE POLICY "wallets_org_select" ON telephony_wallets
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "wallets_backoffice_all" ON telephony_wallets
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

-- POLÍTICAS: telephony_ledger
CREATE POLICY "ledger_org_select" ON telephony_ledger
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "ledger_backoffice_select" ON telephony_ledger
  FOR SELECT TO authenticated
  USING (public.is_backoffice_staff());
-- No INSERT/UPDATE/DELETE para tenants — solo via funciones SECURITY DEFINER

-- POLÍTICAS: telephony_pricing_rates
CREATE POLICY "pricing_read" ON telephony_pricing_rates
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "pricing_superadmin_insert" ON telephony_pricing_rates
  FOR INSERT TO authenticated WITH CHECK (public.is_backoffice_staff());
CREATE POLICY "pricing_superadmin_update" ON telephony_pricing_rates
  FOR UPDATE TO authenticated USING (public.is_backoffice_staff());
CREATE POLICY "pricing_superadmin_delete" ON telephony_pricing_rates
  FOR DELETE TO authenticated USING (public.is_backoffice_staff());

-- POLÍTICAS: telephony_cdrs
CREATE POLICY "cdrs_org_select" ON telephony_cdrs
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "cdrs_backoffice_all" ON telephony_cdrs
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

-- POLÍTICAS: telephony_webrtc_sessions
CREATE POLICY "webrtc_org_select" ON telephony_webrtc_sessions
  FOR SELECT TO authenticated
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "webrtc_backoffice_all" ON telephony_webrtc_sessions
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

-- =============================================
-- ÍNDICES CRÍTICOS
-- =============================================
CREATE INDEX IF NOT EXISTS idx_telephony_cdrs_org ON telephony_cdrs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telephony_cdrs_account ON telephony_cdrs(crm_account_id);
CREATE INDEX IF NOT EXISTS idx_telephony_cdrs_matter ON telephony_cdrs(matter_id);
CREATE INDEX IF NOT EXISTS idx_telephony_cdrs_status ON telephony_cdrs(status);
CREATE INDEX IF NOT EXISTS idx_telephony_cdrs_provider_sid ON telephony_cdrs(provider_call_sid);
CREATE INDEX IF NOT EXISTS idx_telephony_ledger_wallet ON telephony_ledger(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telephony_ledger_org ON telephony_ledger(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_telephony_numbers_org ON telephony_numbers(organization_id);
CREATE INDEX IF NOT EXISTS idx_telephony_webrtc_user ON telephony_webrtc_sessions(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_telephony_pricing_prefix ON telephony_pricing_rates(destination_prefix, number_type) WHERE is_active = true;

-- =============================================
-- FUNCIÓN CRÍTICA: Cobrar llamada con LOCK
-- =============================================
CREATE OR REPLACE FUNCTION public.charge_call(
  p_org_id uuid,
  p_call_sid text,
  p_duration_seconds integer,
  p_destination_prefix text,
  p_number_type text DEFAULT 'landline'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet telephony_wallets%ROWTYPE;
  v_rate telephony_pricing_rates%ROWTYPE;
  v_billable_minutes integer;
  v_amount decimal(10,4);
  v_provider_cost decimal(10,4);
  v_new_balance decimal(10,4);
BEGIN
  SELECT * INTO v_rate
  FROM telephony_pricing_rates
  WHERE destination_prefix = p_destination_prefix
    AND number_type = p_number_type
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate not found for prefix ' || p_destination_prefix);
  END IF;

  v_billable_minutes := CEIL(p_duration_seconds::numeric / 60);
  v_amount := v_billable_minutes * v_rate.retail_price_per_min;
  v_provider_cost := v_billable_minutes * v_rate.provider_cost_per_min;

  -- LOCK para evitar race conditions
  SELECT * INTO v_wallet
  FROM telephony_wallets
  WHERE organization_id = p_org_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet not found for org');
  END IF;

  IF v_wallet.status = 'suspended' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet suspended');
  END IF;

  -- Si saldo insuficiente, cobrar lo que queda
  IF v_wallet.current_balance < v_amount AND v_wallet.current_balance >= 0 THEN
    v_amount := v_wallet.current_balance;
  END IF;

  v_new_balance := v_wallet.current_balance - v_amount;

  UPDATE telephony_wallets
  SET current_balance = v_new_balance,
      status = CASE
        WHEN v_new_balance <= 0 THEN 'frozen'
        WHEN v_new_balance < low_balance_threshold THEN 'active'
        ELSE 'active'
      END,
      updated_at = now()
  WHERE id = v_wallet.id;

  INSERT INTO telephony_ledger (
    wallet_id, organization_id, amount, balance_after,
    currency, transaction_type, reference_id, reference_type,
    description, provider_cost, retail_price, margin
  ) VALUES (
    v_wallet.id, p_org_id, -v_amount, v_new_balance,
    v_wallet.currency, 'call_charge', p_call_sid, 'call',
    format('Llamada %s min a %s', v_billable_minutes, p_destination_prefix),
    -v_provider_cost, -v_amount, v_amount - v_provider_cost
  );

  -- Actualizar minutos usados del tenant
  UPDATE telephony_tenants
  SET minutes_used_this_month = minutes_used_this_month + v_billable_minutes,
      updated_at = now()
  WHERE organization_id = p_org_id;

  RETURN jsonb_build_object(
    'success', true,
    'charged', v_amount,
    'new_balance', v_new_balance,
    'billable_minutes', v_billable_minutes,
    'provider_cost', v_provider_cost,
    'margin', v_amount - v_provider_cost
  );
END;
$$;

-- =============================================
-- FUNCIÓN: Calcular tiempo máximo de llamada
-- =============================================
CREATE OR REPLACE FUNCTION public.get_max_call_duration(
  p_org_id uuid,
  p_destination_prefix text,
  p_number_type text DEFAULT 'landline'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance decimal(10,4);
  v_rate decimal(10,4);
  v_max_minutes decimal(10,4);
  v_tenant_max integer;
BEGIN
  SELECT current_balance INTO v_balance
  FROM telephony_wallets
  WHERE organization_id = p_org_id AND status != 'suspended';

  IF v_balance IS NULL OR v_balance <= 0 THEN
    RETURN 0;
  END IF;

  SELECT retail_price_per_min INTO v_rate
  FROM telephony_pricing_rates
  WHERE destination_prefix = p_destination_prefix
    AND number_type = p_number_type
    AND is_active = true
  LIMIT 1;

  IF v_rate IS NULL OR v_rate = 0 THEN
    RETURN 0;
  END IF;

  v_max_minutes := FLOOR(v_balance / v_rate);

  SELECT max_call_duration_minutes INTO v_tenant_max
  FROM telephony_tenants
  WHERE organization_id = p_org_id AND is_active = true;

  IF v_tenant_max IS NOT NULL THEN
    v_max_minutes := LEAST(v_max_minutes, v_tenant_max);
  END IF;

  RETURN GREATEST(0, (v_max_minutes * 60)::integer);
END;
$$;

-- =============================================
-- SEED: Tarifas principales para PI
-- =============================================
INSERT INTO telephony_pricing_rates
  (destination_prefix, destination_country, destination_country_code,
   number_type, provider_cost_per_min, retail_price_per_min, margin_pct)
VALUES
('+34', 'España', 'ES', 'landline', 0.0040, 0.0250, 84.00),
('+34', 'España', 'ES', 'mobile', 0.0080, 0.0450, 82.22),
('+44', 'Reino Unido', 'GB', 'landline', 0.0040, 0.0250, 84.00),
('+44', 'Reino Unido', 'GB', 'mobile', 0.0090, 0.0480, 81.25),
('+49', 'Alemania', 'DE', 'landline', 0.0040, 0.0250, 84.00),
('+33', 'Francia', 'FR', 'landline', 0.0040, 0.0250, 84.00),
('+39', 'Italia', 'IT', 'landline', 0.0040, 0.0250, 84.00),
('+351', 'Portugal', 'PT', 'landline', 0.0040, 0.0250, 84.00),
('+31', 'Países Bajos', 'NL', 'landline', 0.0040, 0.0250, 84.00),
('+1', 'EEUU/Canadá', 'US', 'landline', 0.0020, 0.0180, 88.89),
('+1', 'EEUU/Canadá', 'US', 'mobile', 0.0020, 0.0180, 88.89),
('+52', 'México', 'MX', 'landline', 0.0060, 0.0350, 82.86),
('+55', 'Brasil', 'BR', 'landline', 0.0100, 0.0450, 77.78),
('+57', 'Colombia', 'CO', 'landline', 0.0120, 0.0500, 76.00),
('+54', 'Argentina', 'AR', 'landline', 0.0150, 0.0550, 72.73),
('+56', 'Chile', 'CL', 'landline', 0.0120, 0.0500, 76.00),
('+81', 'Japón', 'JP', 'landline', 0.0080, 0.0400, 80.00),
('+86', 'China', 'CN', 'landline', 0.0060, 0.0350, 82.86),
('+82', 'Corea del Sur', 'KR', 'landline', 0.0070, 0.0380, 81.58),
('+', 'Internacional', 'INT', 'landline', 0.0200, 0.0800, 75.00)
ON CONFLICT DO NOTHING;

-- SEED: Providers
INSERT INTO telephony_providers
  (code, name, is_active, is_primary, priority,
   api_key_secret_name, api_secret_name, account_sid_secret_name,
   supports_webrtc, supports_recording, supports_subaccounts,
   cost_per_min_eu_landline, cost_per_min_eu_mobile,
   cost_per_min_us, cost_per_number_month)
VALUES
('telnyx', 'Telnyx', true, true, 1,
 'TELNYX_API_KEY', null, null,
 true, true, true,
 0.0040, 0.0080, 0.0020, 1.0000),
('twilio', 'Twilio', true, false, 2,
 'TWILIO_AUTH_TOKEN', null, 'TWILIO_ACCOUNT_SID',
 true, true, true,
 0.0050, 0.0090, 0.0025, 1.1500),
('plivo', 'Plivo', true, false, 3,
 'PLIVO_AUTH_TOKEN', 'PLIVO_AUTH_ID', null,
 true, true, true,
 0.0045, 0.0085, 0.0022, 1.0500)
ON CONFLICT (code) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  priority = EXCLUDED.priority,
  updated_at = now();

-- Trigger updated_at para tablas que lo tienen
CREATE TRIGGER update_telephony_providers_updated_at
  BEFORE UPDATE ON telephony_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telephony_tenants_updated_at
  BEFORE UPDATE ON telephony_tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telephony_wallets_updated_at
  BEFORE UPDATE ON telephony_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_telephony_cdrs_updated_at
  BEFORE UPDATE ON telephony_cdrs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
