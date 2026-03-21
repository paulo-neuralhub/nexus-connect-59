-- =============================================
-- KNOWLEDGE-01 PHASE 1B — ipo_automation_capabilities (15 phases)
-- Uses ipo_offices.code (not jurisdiction_code)
-- =============================================

CREATE TABLE IF NOT EXISTS ipo_automation_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid REFERENCES ipo_offices(id) ON DELETE CASCADE,
  jurisdiction_code text NOT NULL UNIQUE,
  jurisdiction_name text NOT NULL,
  region text,
  flag_emoji text,

  -- 15 PHASES OF IP LIFECYCLE
  search_clearance_status text DEFAULT 'unknown',
  search_clearance_api text,
  search_clearance_notes text,
  classification_status text DEFAULT 'unknown',
  classification_api text,
  classification_notes text,
  filing_status text DEFAULT 'unknown',
  filing_api text,
  filing_notes text,
  exam_formal_status text DEFAULT 'unknown',
  exam_formal_api text,
  exam_formal_notes text,
  exam_substantive_status text DEFAULT 'unknown',
  exam_substantive_api text,
  exam_substantive_notes text,
  tracking_status text DEFAULT 'unknown',
  tracking_api text,
  tracking_notes text,
  notifications_status text DEFAULT 'unknown',
  notifications_api text,
  notifications_notes text,
  opposition_status text DEFAULT 'unknown',
  opposition_api text,
  opposition_notes text,
  documents_status text DEFAULT 'unknown',
  documents_api text,
  documents_notes text,
  surveillance_status text DEFAULT 'unknown',
  surveillance_api text,
  surveillance_notes text,
  renewal_status text DEFAULT 'unknown',
  renewal_api text,
  renewal_notes text,
  enforcement_status text DEFAULT 'unknown',
  enforcement_api text,
  enforcement_notes text,
  assignments_status text DEFAULT 'unknown',
  assignments_api text,
  assignments_notes text,
  valuation_status text DEFAULT 'unknown',
  valuation_api text,
  valuation_notes text,
  expansion_status text DEFAULT 'unknown',
  expansion_api text,
  expansion_notes text,

  -- Operational
  requires_local_agent boolean DEFAULT false,
  local_agent_cost_eur_estimate numeric(10,2),
  official_fee_1class_eur numeric(10,2),
  avg_registration_months integer,
  madrid_member boolean DEFAULT false,
  hague_member boolean DEFAULT false,
  pct_member boolean DEFAULT false,

  -- Technical
  auth_type text,
  rate_limit_per_min integer,
  data_format text,

  -- Score
  overall_automation_pct integer DEFAULT 0,

  -- Audit
  last_verified_at timestamptz DEFAULT now(),
  verified_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Initialize from ipo_offices (using code as jurisdiction_code)
INSERT INTO ipo_automation_capabilities
  (office_id, jurisdiction_code, jurisdiction_name, region, flag_emoji,
   madrid_member, filing_status, search_clearance_status, surveillance_status)
SELECT
  o.id, o.code, COALESCE(o.name_en, o.name_official, o.code), o.region, o.flag_emoji,
  COALESCE(o.member_madrid_protocol, false),
  CASE WHEN o.e_filing_available = true THEN 'available' ELSE 'manual' END,
  CASE WHEN o.supports_search = true THEN 'available' ELSE 'manual' END,
  'manual'
FROM ipo_offices o
WHERE o.is_active = true
ON CONFLICT (jurisdiction_code) DO NOTHING;

-- RLS
ALTER TABLE ipo_automation_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ipo_auto_cap_read" ON ipo_automation_capabilities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ipo_auto_cap_write" ON ipo_automation_capabilities
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'));

-- Index
CREATE INDEX IF NOT EXISTS idx_ipo_auto_cap_jurisdiction
  ON ipo_automation_capabilities(jurisdiction_code);