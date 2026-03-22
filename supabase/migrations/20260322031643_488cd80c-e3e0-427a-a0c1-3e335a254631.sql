
-- =============================================
-- MIGRATION: B2B2B Phase 1A — Extend existing tables
-- =============================================

-- 1. crm_accounts: account_type constraint + agent flags
ALTER TABLE crm_accounts
  DROP CONSTRAINT IF EXISTS crm_accounts_account_type_check;

ALTER TABLE crm_accounts
  ADD CONSTRAINT crm_accounts_account_type_check
  CHECK (account_type IN (
    'individual','company','agent','agent_company',
    'agent_network','law_firm','direct'
  ));

ALTER TABLE crm_accounts
  ADD COLUMN IF NOT EXISTS is_agent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_licensed_agent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS agent_license_type text,
  ADD COLUMN IF NOT EXISTS agent_license_number text,
  ADD COLUMN IF NOT EXISTS agent_license_jurisdictions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS agent_license_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS agent_license_expiry date,
  ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'per_matter',
  ADD COLUMN IF NOT EXISTS billing_period_day integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS billing_consolidation_day integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS billing_grace_days integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS discount_pct numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portal_type text DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS agent_portal_slug text,
  ADD COLUMN IF NOT EXISTS agent_portal_branding jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS market_agent_id uuid REFERENCES market_agents(id);

ALTER TABLE crm_accounts
  ADD CONSTRAINT crm_accounts_billing_type_check
  CHECK (billing_type IN ('per_matter','consolidated','retainer'));

ALTER TABLE crm_accounts
  ADD CONSTRAINT crm_accounts_portal_type_check
  CHECK (portal_type IN ('client','agent','corporate'));

-- Unique on agent_portal_slug (partial — only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_accounts_agent_portal_slug
  ON crm_accounts(agent_portal_slug) WHERE agent_portal_slug IS NOT NULL;

-- 2. matters: owner/agent/billing/family columns
ALTER TABLE matters
  ADD COLUMN IF NOT EXISTS owner_account_id uuid REFERENCES crm_accounts(id),
  ADD COLUMN IF NOT EXISTS intermediate_agent_id uuid REFERENCES crm_accounts(id),
  ADD COLUMN IF NOT EXISTS billing_account_id uuid REFERENCES crm_accounts(id),
  ADD COLUMN IF NOT EXISTS agent_matter_reference text,
  ADD COLUMN IF NOT EXISTS notify_billing_account boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_owner_account boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_portal_visible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS family_id uuid,
  ADD COLUMN IF NOT EXISTS family_role text DEFAULT 'standalone',
  ADD COLUMN IF NOT EXISTS parent_matter_id uuid REFERENCES matters(id);

ALTER TABLE matters
  ADD CONSTRAINT matters_family_role_check
  CHECK (family_role IN ('standalone','parent','member','divisional','continuation'));

-- 3. invoices: billing/owner/consolidation columns
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS billing_account_id uuid REFERENCES crm_accounts(id),
  ADD COLUMN IF NOT EXISTS owner_account_id uuid REFERENCES crm_accounts(id),
  ADD COLUMN IF NOT EXISTS is_consolidated_invoice boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS consolidation_period text,
  ADD COLUMN IF NOT EXISTS consolidation_matters jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS agent_client_breakdown jsonb DEFAULT '[]';

-- 4. organizations: B2B2B feature flags
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS feature_b2b2b_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_agent_portal_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_smart_inbox_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_matter_families_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_storefront_enabled boolean DEFAULT false;

-- 5. Migrate existing matters: owner = client_id where null
UPDATE matters
SET owner_account_id = client_id, billing_account_id = client_id
WHERE owner_account_id IS NULL AND client_id IS NOT NULL;

-- 6. Trigger: sync is_agent flag
CREATE OR REPLACE FUNCTION sync_is_agent()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_type IN ('agent','agent_company','agent_network') THEN
    NEW.is_agent := true;
    IF NEW.portal_type = 'client' THEN
      NEW.portal_type := 'agent';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_is_agent ON crm_accounts;
CREATE TRIGGER trg_sync_is_agent
  BEFORE INSERT OR UPDATE ON crm_accounts
  FOR EACH ROW EXECUTE FUNCTION sync_is_agent();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_matters_owner ON matters(organization_id, owner_account_id);
CREATE INDEX IF NOT EXISTS idx_matters_agent ON matters(organization_id, intermediate_agent_id);
CREATE INDEX IF NOT EXISTS idx_matters_family ON matters(family_id) WHERE family_id IS NOT NULL;
