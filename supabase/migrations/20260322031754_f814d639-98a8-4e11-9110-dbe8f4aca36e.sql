
-- =============================================
-- MIGRATION: B2B2B Phase 1B — New tables
-- =============================================

-- Stub tables for missing FKs (will be fully implemented in Portal phase)
CREATE TABLE IF NOT EXISTS portal_client_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE portal_client_instructions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS portal_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE portal_service_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS portal_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  portal_user_id uuid REFERENCES auth.users(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE portal_access ENABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE 1: account_relationships
-- =============================================
CREATE TABLE IF NOT EXISTS account_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  agent_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  client_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  relationship_type text NOT NULL DEFAULT 'manages'
    CHECK (relationship_type IN ('manages','represents','billing_for','resells','sub_agent')),
  billing_party text DEFAULT 'agent'
    CHECK (billing_party IN ('agent','client','split')),
  billing_split_pct numeric(5,2) DEFAULT 100,
  agent_client_reference text,
  access_level text DEFAULT 'full'
    CHECK (access_level IN ('full','limited','billing_only','read_only')),
  standard_instructions jsonb DEFAULT '{}',
  notify_agent_on_updates boolean DEFAULT true,
  notify_client_on_updates boolean DEFAULT false,
  valid_from date DEFAULT CURRENT_DATE,
  valid_until date,
  is_active boolean DEFAULT true,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, agent_account_id, client_account_id)
);

-- =============================================
-- TABLE 2: matter_families
-- =============================================
CREATE TABLE IF NOT EXISTS matter_families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  family_name text NOT NULL,
  family_type text DEFAULT 'trademark_portfolio'
    CHECK (family_type IN ('trademark_portfolio','trademark_series','patent_family','design_family','mixed')),
  description text,
  owner_account_id uuid REFERENCES crm_accounts(id),
  covered_jurisdictions text[] DEFAULT '{}',
  pending_jurisdictions text[] DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add FK from matters.family_id to matter_families
ALTER TABLE matters
  ADD CONSTRAINT matters_family_id_fkey
  FOREIGN KEY (family_id) REFERENCES matter_families(id);

-- =============================================
-- TABLE 3: matter_field_permissions
-- =============================================
CREATE TABLE IF NOT EXISTS matter_field_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  account_id uuid NOT NULL REFERENCES crm_accounts(id),
  matter_id uuid REFERENCES matters(id),
  field_name text NOT NULL,
  can_read boolean DEFAULT true,
  can_write boolean DEFAULT false,
  requires_approval boolean DEFAULT true,
  granted_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matter_field_perm_global
  ON matter_field_permissions(organization_id, account_id, field_name)
  WHERE matter_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_matter_field_perm_specific
  ON matter_field_permissions(organization_id, account_id, matter_id, field_name)
  WHERE matter_id IS NOT NULL;

-- =============================================
-- TABLE 4: matter_field_change_proposals
-- =============================================
CREATE TABLE IF NOT EXISTS matter_field_change_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  matter_id uuid NOT NULL REFERENCES matters(id),
  proposed_by_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  proposed_by_user_id uuid REFERENCES auth.users(id),
  field_name text NOT NULL,
  current_value jsonb,
  proposed_value jsonb NOT NULL,
  change_reason text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','auto_applied')),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  rejection_reason text,
  applied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE 5: bulk_instructions
-- =============================================
CREATE TABLE IF NOT EXISTS bulk_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  sent_by uuid NOT NULL REFERENCES profiles(id),
  instruction_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_type text NOT NULL DEFAULT 'matters',
  target_ids uuid[] NOT NULL DEFAULT '{}',
  target_family_id uuid REFERENCES matter_families(id),
  status text DEFAULT 'draft'
    CHECK (status IN ('draft','sent','partially_executed','completed','cancelled')),
  total_targets integer DEFAULT 0,
  executed_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  deadline_date date,
  is_urgent boolean DEFAULT false,
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bulk_instruction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_instruction_id uuid NOT NULL REFERENCES bulk_instructions(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  matter_id uuid REFERENCES matters(id),
  account_id uuid REFERENCES crm_accounts(id),
  jurisdiction_code text,
  assigned_agent_account_id uuid REFERENCES crm_accounts(id),
  specific_instruction text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','sent','confirmed','executed','failed')),
  response_text text,
  confirmed_at timestamptz,
  executed_at timestamptz,
  client_instruction_id uuid REFERENCES portal_client_instructions(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE 6: agent_portal_sessions
-- =============================================
CREATE TABLE IF NOT EXISTS agent_portal_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  agent_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  portal_user_id uuid NOT NULL REFERENCES auth.users(id),
  active_client_account_id uuid REFERENCES crm_accounts(id),
  active_filters jsonb DEFAULT '{}',
  view_preferences jsonb DEFAULT '{}',
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(portal_user_id)
);

-- =============================================
-- TABLE 7: service_storefront_items
-- =============================================
CREATE TABLE IF NOT EXISTS service_storefront_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  service_catalog_id uuid REFERENCES services_catalog(id),
  title text NOT NULL,
  description text NOT NULL,
  short_description text,
  category text NOT NULL,
  price_type text DEFAULT 'fixed'
    CHECK (price_type IN ('fixed','from','quote','free')),
  base_price_eur numeric(10,2),
  includes_official_fees boolean DEFAULT false,
  official_fees_estimate_eur numeric(10,2),
  estimated_days_min integer,
  estimated_days_max integer,
  available_jurisdictions text[] DEFAULT '{}',
  nice_classes integer[] DEFAULT '{}',
  intake_form_schema jsonb DEFAULT '{}',
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  available_for_direct_clients boolean DEFAULT true,
  available_for_agents boolean DEFAULT true,
  available_for_corporate boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE 8: storefront_orders
-- =============================================
CREATE TABLE IF NOT EXISTS storefront_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  buyer_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  buyer_portal_user_id uuid NOT NULL REFERENCES auth.users(id),
  on_behalf_of_account_id uuid REFERENCES crm_accounts(id),
  storefront_item_id uuid NOT NULL REFERENCES service_storefront_items(id),
  intake_data jsonb NOT NULL DEFAULT '{}',
  quoted_price_eur numeric(10,2),
  includes_official_fees boolean DEFAULT false,
  status text DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','quoted','accepted','in_progress','completed','cancelled')),
  converted_to_matter_id uuid REFERENCES matters(id),
  converted_to_service_request_id uuid REFERENCES portal_service_requests(id),
  converted_at timestamptz,
  converted_by uuid REFERENCES profiles(id),
  payment_required boolean DEFAULT false,
  payment_status text DEFAULT 'not_required',
  stripe_payment_intent_id text,
  paid_at timestamptz,
  buyer_notes text,
  despacho_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- TABLE 9: ipo_incoming_documents
-- =============================================
CREATE TABLE IF NOT EXISTS ipo_incoming_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  source_type text NOT NULL DEFAULT 'email',
  source_email_from text,
  source_ipo_code text,
  raw_email_content text,
  raw_xml_content text,
  raw_json_content text,
  file_storage_path text,
  parsed_data jsonb DEFAULT '{}',
  parsing_confidence numeric(5,2) DEFAULT 0,
  parsing_status text DEFAULT 'pending'
    CHECK (parsing_status IN ('pending','parsed','low_confidence','error','manual_review')),
  matched_matter_id uuid REFERENCES matters(id),
  match_confidence numeric(5,2),
  auto_matched boolean DEFAULT false,
  matched_at timestamptz,
  matched_by uuid REFERENCES profiles(id),
  action_taken text,
  deadlines_created jsonb DEFAULT '[]',
  processing_status text DEFAULT 'unprocessed'
    CHECK (processing_status IN ('unprocessed','processed','partial','failed')),
  processed_at timestamptz,
  processed_by uuid REFERENCES profiles(id),
  received_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- RLS on all new tables
-- =============================================
ALTER TABLE account_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_field_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_field_change_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_instruction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_portal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_storefront_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storefront_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipo_incoming_documents ENABLE ROW LEVEL SECURITY;

-- Org-based RLS policies
CREATE POLICY "account_relationships_org" ON account_relationships FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "matter_families_org" ON matter_families FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "matter_field_permissions_org" ON matter_field_permissions FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "matter_field_change_proposals_org" ON matter_field_change_proposals FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "bulk_instructions_org" ON bulk_instructions FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "bulk_instruction_items_org" ON bulk_instruction_items FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "agent_portal_sessions_org" ON agent_portal_sessions FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "service_storefront_items_org" ON service_storefront_items FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "storefront_orders_org" ON storefront_orders FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "ipo_incoming_documents_org" ON ipo_incoming_documents FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "portal_client_instructions_org" ON portal_client_instructions FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "portal_service_requests_org" ON portal_service_requests FOR ALL USING (organization_id = public.get_user_org_id());
CREATE POLICY "portal_access_org" ON portal_access FOR ALL USING (organization_id = public.get_user_org_id());

-- Portal-specific policies
CREATE POLICY "account_rel_agent_portal" ON account_relationships
  FOR SELECT USING (
    agent_account_id IN (
      SELECT crm_account_id FROM portal_access
      WHERE portal_user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "storefront_client_order" ON storefront_orders
  FOR ALL USING (buyer_portal_user_id = auth.uid());

-- =============================================
-- Trigger: sync family jurisdictions
-- =============================================
CREATE OR REPLACE FUNCTION sync_family_jurisdictions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.family_id IS DISTINCT FROM NEW.family_id THEN
    IF OLD.family_id IS NOT NULL THEN
      UPDATE matter_families SET
        covered_jurisdictions = ARRAY(
          SELECT DISTINCT jurisdiction FROM matters
          WHERE family_id = OLD.family_id AND status = 'registered'
        ),
        pending_jurisdictions = ARRAY(
          SELECT DISTINCT jurisdiction FROM matters
          WHERE family_id = OLD.family_id AND status != 'registered'
        ),
        updated_at = now()
      WHERE id = OLD.family_id;
    END IF;
  END IF;
  IF NEW.family_id IS NOT NULL THEN
    UPDATE matter_families SET
      covered_jurisdictions = ARRAY(
        SELECT DISTINCT jurisdiction FROM matters
        WHERE family_id = NEW.family_id AND status = 'registered'
      ),
      pending_jurisdictions = ARRAY(
        SELECT DISTINCT jurisdiction FROM matters
        WHERE family_id = NEW.family_id AND status != 'registered'
      ),
      updated_at = now()
    WHERE id = NEW.family_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_family_jurisdictions ON matters;
CREATE TRIGGER trg_sync_family_jurisdictions
  AFTER INSERT OR UPDATE ON matters
  FOR EACH ROW EXECUTE FUNCTION sync_family_jurisdictions();

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_account_relationships_agent ON account_relationships(organization_id, agent_account_id, is_active);
CREATE INDEX IF NOT EXISTS idx_account_relationships_client ON account_relationships(organization_id, client_account_id, is_active);
CREATE INDEX IF NOT EXISTS idx_bulk_instructions_status ON bulk_instructions(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ipo_incoming_parsing ON ipo_incoming_documents(organization_id, parsing_status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_storefront_orders_status ON storefront_orders(organization_id, status, created_at DESC);

-- =============================================
-- Materialized view: agent_portfolio_analytics
-- =============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS agent_portfolio_analytics AS
SELECT
  ar.organization_id,
  ar.agent_account_id,
  ar.client_account_id,
  ca_client.name AS client_name,
  COUNT(DISTINCT m.id) AS total_matters,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'registered') AS registered_matters,
  COUNT(DISTINCT m.id) FILTER (WHERE m.status NOT IN ('registered','abandoned','expired')) AS active_matters,
  COUNT(DISTINCT md.id) FILTER (WHERE md.deadline_date <= CURRENT_DATE + 30 AND md.status = 'pending') AS deadlines_next_30d,
  COUNT(DISTINCT md.id) FILTER (WHERE md.deadline_date <= CURRENT_DATE + 90 AND md.status = 'pending') AS deadlines_next_90d,
  COUNT(DISTINCT md.id) FILTER (WHERE md.deadline_date < CURRENT_DATE AND md.status = 'pending') AS overdue_deadlines,
  COALESCE(SUM(i.total) FILTER (WHERE i.status = 'pending'), 0) AS pending_invoices_eur,
  COALESCE(SUM(i.total) FILTER (WHERE i.invoice_date >= date_trunc('year', CURRENT_DATE)), 0) AS invoiced_ytd_eur,
  MAX(m.updated_at) AS last_matter_update
FROM account_relationships ar
JOIN crm_accounts ca_client ON ar.client_account_id = ca_client.id
LEFT JOIN matters m ON (m.intermediate_agent_id = ar.agent_account_id
  AND m.owner_account_id = ar.client_account_id)
LEFT JOIN matter_deadlines md ON md.matter_id = m.id
LEFT JOIN invoices i ON (i.billing_account_id = ar.agent_account_id
  AND i.owner_account_id = ar.client_account_id)
WHERE ar.is_active = true
GROUP BY ar.organization_id, ar.agent_account_id, ar.client_account_id, ca_client.name
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_portfolio_analytics_unique
  ON agent_portfolio_analytics(organization_id, agent_account_id, client_account_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_agent_portfolio_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agent_portfolio_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
