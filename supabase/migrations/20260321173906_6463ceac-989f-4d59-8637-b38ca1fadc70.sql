-- =============================================
-- KNOWLEDGE-01 PHASE 1C — genius_knowledge_coverage + update queue/log
-- =============================================

-- Coverage map
CREATE TABLE IF NOT EXISTS genius_knowledge_coverage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid REFERENCES ipo_offices(id) ON DELETE CASCADE,
  jurisdiction_code text NOT NULL UNIQUE,
  jurisdiction_name text NOT NULL,
  flag_emoji text,
  region text,
  tm_coverage_level text DEFAULT 'none',
  patent_coverage_level text DEFAULT 'none',
  design_coverage_level text DEFAULT 'none',
  cov_oa_response text DEFAULT 'none',
  cov_opposition text DEFAULT 'none',
  cov_license text DEFAULT 'none',
  cov_assignment text DEFAULT 'none',
  cov_cease_desist text DEFAULT 'none',
  cov_search_report text DEFAULT 'none',
  cov_portfolio_report text DEFAULT 'none',
  cov_renewal text DEFAULT 'none',
  cov_legislation text DEFAULT 'none',
  cov_deadlines text DEFAULT 'none',
  cov_fees text DEFAULT 'none',
  cov_procedures text DEFAULT 'none',
  cov_jurisprudence text DEFAULT 'none',
  cov_exam_criteria text DEFAULT 'none',
  cov_rep_requirements text DEFAULT 'none',
  supported_presentation_languages text[] DEFAULT '{}',
  total_kb_chunks integer DEFAULT 0,
  verified_official_chunks integer DEFAULT 0,
  verified_secondary_chunks integer DEFAULT 0,
  ai_researched_chunks integer DEFAULT 0,
  unverified_chunks integer DEFAULT 0,
  coverage_score integer DEFAULT 0,
  effective_score integer DEFAULT 0,
  coverage_level text DEFAULT 'none',
  quality_penalty_applied boolean DEFAULT false,
  has_outdated_content boolean DEFAULT false,
  outdated_since timestamptz,
  alerts text[] DEFAULT '{}',
  last_kb_update timestamptz,
  last_verification timestamptz,
  next_scheduled_update timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Initialize from ipo_offices
INSERT INTO genius_knowledge_coverage
  (office_id, jurisdiction_code, jurisdiction_name, flag_emoji, region)
SELECT id, code, COALESCE(name_en, name_official, code), flag_emoji, region
FROM ipo_offices WHERE is_active = true
ON CONFLICT (jurisdiction_code) DO NOTHING;

ALTER TABLE genius_knowledge_coverage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "genius_coverage_read" ON genius_knowledge_coverage
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "genius_coverage_write" ON genius_knowledge_coverage
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_genius_coverage_level ON genius_knowledge_coverage(coverage_level, effective_score DESC);
CREATE INDEX IF NOT EXISTS idx_genius_coverage_region ON genius_knowledge_coverage(region, coverage_level);

-- Update queue
CREATE TABLE IF NOT EXISTS genius_kb_update_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code text NOT NULL,
  jurisdiction_name text,
  operation_type text NOT NULL,
  status text DEFAULT 'pending',
  locked_by uuid REFERENCES profiles(id),
  locked_at timestamptz,
  lock_expires_at timestamptz,
  proposed_chunks jsonb DEFAULT '[]',
  proposed_office_updates jsonb DEFAULT '{}',
  research_prompt text,
  research_result_raw text,
  perplexity_sources jsonb DEFAULT '[]',
  confidence_level text DEFAULT 'medium',
  requires_expert_review boolean DEFAULT true,
  estimated_cost_eur numeric(10,4) DEFAULT 0,
  approved_chunk_ids uuid[] DEFAULT '{}',
  rejected_chunk_count integer DEFAULT 0,
  processing_error text,
  requested_by uuid REFERENCES profiles(id),
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE genius_kb_update_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_queue_superadmin" ON genius_kb_update_queue
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));
CREATE INDEX IF NOT EXISTS idx_kb_queue_status ON genius_kb_update_queue(status, created_at DESC);

-- Update log (IMMUTABLE — no updated_at)
CREATE TABLE IF NOT EXISTS genius_kb_update_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES genius_kb_update_queue(id),
  jurisdiction_code text,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  performed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE genius_kb_update_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kb_log_superadmin" ON genius_kb_update_log
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));