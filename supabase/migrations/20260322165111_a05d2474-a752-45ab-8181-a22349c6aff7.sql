-- ============================================================
-- MARKETING-01 Fase 1: Base de datos completa
-- ============================================================

-- BLOQUE 2: Expandir marketing_campaigns
ALTER TABLE marketing_campaigns
  ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES comm_templates(id),
  ADD COLUMN IF NOT EXISTS campaign_subtype text,
  ADD COLUMN IF NOT EXISTS from_name text,
  ADD COLUMN IF NOT EXISTS from_email text,
  ADD COLUMN IF NOT EXISTS reply_to text,
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS list_id uuid,
  ADD COLUMN IF NOT EXISTS segment_filter jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS unsubscribe_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bounce_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS spam_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_recipients integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ab_test_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ab_test_variant_a jsonb,
  ADD COLUMN IF NOT EXISTS ab_test_split_pct integer DEFAULT 50;

-- BLOQUE 3: GDPR consent columns
ALTER TABLE crm_accounts
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_source text,
  ADD COLUMN IF NOT EXISTS email_unsubscribed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribe_reason text,
  ADD COLUMN IF NOT EXISTS email_bounced boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_email_opened_at timestamptz;

ALTER TABLE crm_contacts
  ADD COLUMN IF NOT EXISTS marketing_opt_in boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_unsubscribed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_bounced boolean DEFAULT false;

-- BLOQUE 4: marketing_lists
CREATE TABLE IF NOT EXISTS marketing_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  description text,
  list_type text DEFAULT 'static',
  filter_criteria jsonb DEFAULT '{}',
  member_count integer DEFAULT 0,
  active_count integer DEFAULT 0,
  unsubscribed_count integer DEFAULT 0,
  bounced_count integer DEFAULT 0,
  last_synced_at timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger for list_type
CREATE OR REPLACE FUNCTION validate_marketing_list_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.list_type NOT IN ('static','dynamic','smart') THEN
    RAISE EXCEPTION 'list_type must be static, dynamic, or smart';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_list_type ON marketing_lists;
CREATE TRIGGER trg_validate_list_type
  BEFORE INSERT OR UPDATE ON marketing_lists
  FOR EACH ROW EXECUTE FUNCTION validate_marketing_list_type();

-- FK from marketing_campaigns to marketing_lists
ALTER TABLE marketing_campaigns
  ADD CONSTRAINT fk_campaign_list
  FOREIGN KEY (list_id) REFERENCES marketing_lists(id);

-- BLOQUE 5: marketing_list_members
CREATE TABLE IF NOT EXISTS marketing_list_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  list_id uuid NOT NULL REFERENCES marketing_lists(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  crm_contact_id uuid REFERENCES crm_contacts(id),
  email text NOT NULL,
  name text,
  status text DEFAULT 'active',
  added_at timestamptz DEFAULT now(),
  added_by text DEFAULT 'manual',
  unsubscribed_at timestamptz,
  bounced_at timestamptz,
  custom_fields jsonb DEFAULT '{}',
  UNIQUE(list_id, email)
);

-- Validation triggers for marketing_list_members
CREATE OR REPLACE FUNCTION validate_mlm_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('active','unsubscribed','bounced','spam','pending') THEN
    RAISE EXCEPTION 'Invalid marketing_list_members status: %', NEW.status;
  END IF;
  IF NEW.crm_account_id IS NULL AND NEW.crm_contact_id IS NULL THEN
    RAISE EXCEPTION 'Either crm_account_id or crm_contact_id must be set';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_mlm ON marketing_list_members;
CREATE TRIGGER trg_validate_mlm
  BEFORE INSERT OR UPDATE ON marketing_list_members
  FOR EACH ROW EXECUTE FUNCTION validate_mlm_status();

-- BLOQUE 6: marketing_sends (immutable log)
CREATE TABLE IF NOT EXISTS marketing_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  campaign_id uuid NOT NULL REFERENCES marketing_campaigns(id),
  list_member_id uuid REFERENCES marketing_list_members(id),
  email text NOT NULL,
  name text,
  status text DEFAULT 'queued',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  unsubscribed_at timestamptz,
  message_id text,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  error_message text,
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_ms_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('queued','sending','sent','delivered','opened','clicked','bounced','spam','unsubscribed','failed') THEN
    RAISE EXCEPTION 'Invalid marketing_sends status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_ms ON marketing_sends;
CREATE TRIGGER trg_validate_ms
  BEFORE INSERT OR UPDATE ON marketing_sends
  FOR EACH ROW EXECUTE FUNCTION validate_ms_status();

-- BLOQUE 7: marketing_automations
CREATE TABLE IF NOT EXISTS marketing_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  description text,
  automation_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}',
  steps jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT false,
  total_triggered integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_converted integer DEFAULT 0,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_automation_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.automation_type NOT IN (
    'renewal_reminder','onboarding_sequence','matter_registered',
    'invoice_overdue','reactivation','birthday_anniversary',
    'portal_invitation','custom'
  ) THEN
    RAISE EXCEPTION 'Invalid automation_type: %', NEW.automation_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_automation ON marketing_automations;
CREATE TRIGGER trg_validate_automation
  BEFORE INSERT OR UPDATE ON marketing_automations
  FOR EACH ROW EXECUTE FUNCTION validate_automation_type();

-- BLOQUE 8: marketing_automation_runs (immutable log)
CREATE TABLE IF NOT EXISTS marketing_automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  automation_id uuid NOT NULL REFERENCES marketing_automations(id),
  trigger_type text NOT NULL,
  trigger_source_table text,
  trigger_source_id uuid,
  crm_account_id uuid REFERENCES crm_accounts(id),
  crm_contact_id uuid REFERENCES crm_contacts(id),
  email text NOT NULL,
  step_number integer NOT NULL DEFAULT 1,
  status text DEFAULT 'pending',
  scheduled_at timestamptz NOT NULL,
  executed_at timestamptz,
  send_id uuid REFERENCES marketing_sends(id),
  skip_reason text,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_mar_status()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status NOT IN ('pending','sent','skipped','failed','unsubscribed') THEN
    RAISE EXCEPTION 'Invalid marketing_automation_runs status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_mar ON marketing_automation_runs;
CREATE TRIGGER trg_validate_mar
  BEFORE INSERT OR UPDATE ON marketing_automation_runs
  FOR EACH ROW EXECUTE FUNCTION validate_mar_status();

-- BLOQUE 11: RLS
ALTER TABLE marketing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_automation_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_lists_org" ON marketing_lists
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "marketing_list_members_org" ON marketing_list_members
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "marketing_sends_org" ON marketing_sends
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "marketing_automations_org" ON marketing_automations
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "marketing_automation_runs_org" ON marketing_automation_runs
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "mlm_unsubscribe_self" ON marketing_list_members
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- BLOQUE 12: Indices
CREATE INDEX IF NOT EXISTS idx_mc_org_status ON marketing_campaigns(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_mc_scheduled ON marketing_campaigns(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_ml_org ON marketing_lists(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_mlm_list ON marketing_list_members(list_id, status);
CREATE INDEX IF NOT EXISTS idx_mlm_email ON marketing_list_members(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_ms_campaign ON marketing_sends(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_ms_idempotency ON marketing_sends(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ma_org_type ON marketing_automations(organization_id, automation_type, is_active);
CREATE INDEX IF NOT EXISTS idx_mar_scheduled ON marketing_automation_runs(scheduled_at, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_crm_opt_in ON crm_accounts(organization_id, marketing_opt_in, email_unsubscribed);

-- BLOQUE 9: Seed listas predefinidas
DO $$
DECLARE org RECORD;
DECLARE v_creator uuid;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    SELECT id INTO v_creator FROM profiles
    WHERE organization_id = org.id
    AND role IN ('admin','superadmin') LIMIT 1;

    IF v_creator IS NOT NULL THEN
      INSERT INTO marketing_lists (organization_id, name, description, list_type, filter_criteria, created_by)
      VALUES (org.id, 'Clientes activos', 'Todos los clientes con opt-in de marketing activo', 'dynamic',
        '{"marketing_opt_in": true, "email_unsubscribed": false}', v_creator)
      ON CONFLICT DO NOTHING;

      INSERT INTO marketing_lists (organization_id, name, description, list_type, filter_criteria, created_by)
      VALUES (org.id, 'Renovaciones próximas (90 días)', 'Clientes con marcas que vencen en los próximos 90 días', 'dynamic',
        '{"has_renewal_in_days": 90, "marketing_opt_in": true}', v_creator)
      ON CONFLICT DO NOTHING;

      INSERT INTO marketing_lists (organization_id, name, description, list_type, filter_criteria, created_by)
      VALUES (org.id, 'Clientes sin portal activo', 'Clientes que no han activado el portal cliente', 'dynamic',
        '{"portal_enabled": false, "marketing_opt_in": true}', v_creator)
      ON CONFLICT DO NOTHING;

      INSERT INTO marketing_lists (organization_id, name, description, list_type, filter_criteria, created_by)
      VALUES (org.id, 'Clientes inactivos', 'Clientes sin contacto en los últimos 60 días', 'dynamic',
        '{"last_contact_days": 60, "marketing_opt_in": true}', v_creator)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- BLOQUE 10: Seed automatizaciones base
DO $$
DECLARE org RECORD;
DECLARE v_creator uuid;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    SELECT id INTO v_creator FROM profiles
    WHERE organization_id = org.id
    AND role IN ('admin','superadmin') LIMIT 1;

    IF v_creator IS NOT NULL THEN
      INSERT INTO marketing_automations (organization_id, name, description, automation_type, trigger_config, steps, is_active, created_by)
      VALUES (org.id, 'Recordatorio de Renovación de Marca', 'Avisa al cliente cuando su marca está próxima a vencer',
        'renewal_reminder', '{"days_before": [90, 60, 30, 7]}',
        '[{"step":1,"delay_days":0,"subject":"Tu marca {marca} vence en 90 días","conditions":{"days_before":90}},{"step":2,"delay_days":0,"subject":"⚠️ {marca} vence en 30 días — Renueva ahora","conditions":{"days_before":30}},{"step":3,"delay_days":0,"subject":"🚨 URGENTE: {marca} vence en 7 días","conditions":{"days_before":7}}]',
        false, v_creator)
      ON CONFLICT DO NOTHING;

      INSERT INTO marketing_automations (organization_id, name, description, automation_type, trigger_config, steps, is_active, created_by)
      VALUES (org.id, 'Bienvenida nuevo cliente', 'Serie de emails de onboarding al añadir un nuevo cliente',
        'onboarding_sequence', '{"delays_days": [0, 3, 7]}',
        '[{"step":1,"delay_days":0,"subject":"Bienvenido a {despacho} 👋"},{"step":2,"delay_days":3,"subject":"¿Cómo va tu primer expediente?"},{"step":3,"delay_days":7,"subject":"Activa tu portal cliente gratuito"}]',
        false, v_creator)
      ON CONFLICT DO NOTHING;

      INSERT INTO marketing_automations (organization_id, name, description, automation_type, trigger_config, steps, is_active, created_by)
      VALUES (org.id, '🎉 ¡Tu marca ha sido registrada!', 'Email de felicitación cuando un expediente pasa a registered',
        'matter_registered', '{"delay_hours": 1}',
        '[{"step":1,"delay_days":0,"subject":"🎉 ¡Enhorabuena! Tu marca {marca} ha sido registrada"}]',
        false, v_creator)
      ON CONFLICT DO NOTHING;

      INSERT INTO marketing_automations (organization_id, name, description, automation_type, trigger_config, steps, is_active, created_by)
      VALUES (org.id, 'Recordatorio de Factura Vencida', 'Recordatorios automáticos para facturas impagadas',
        'invoice_overdue', '{"days_after": [1, 7, 15]}',
        '[{"step":1,"delay_days":1,"subject":"Recordatorio de pago — Factura {numero}"},{"step":2,"delay_days":7,"subject":"⚠️ Factura {numero} pendiente de pago"},{"step":3,"delay_days":15,"subject":"🚨 Último aviso — Factura {numero}"}]',
        false, v_creator)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;