
-- Tablas adicionales de búsqueda
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  query TEXT,
  filters JSONB DEFAULT '{}',
  entity_types TEXT[] DEFAULT '{}',
  sort_by VARCHAR(50) DEFAULT 'relevance',
  sort_order VARCHAR(10) DEFAULT 'desc',
  is_shared BOOLEAN DEFAULT false,
  alert_enabled BOOLEAN DEFAULT false,
  alert_frequency VARCHAR(20),
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "saved_searches_select" ON saved_searches FOR SELECT
USING (user_id = auth.uid() OR is_shared = true);
CREATE POLICY "saved_searches_insert" ON saved_searches FOR INSERT
WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_searches_update" ON saved_searches FOR UPDATE
USING (user_id = auth.uid());
CREATE POLICY "saved_searches_delete" ON saved_searches FOR DELETE
USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  entity_types TEXT[] DEFAULT '{}',
  total_results INTEGER DEFAULT 0,
  source VARCHAR(30),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_history_select" ON search_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "search_history_insert" ON search_history FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "search_history_delete" ON search_history FOR DELETE USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS search_synonyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  term VARCHAR(100) NOT NULL,
  synonyms TEXT[] NOT NULL,
  synonym_type VARCHAR(30) DEFAULT 'custom',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE search_synonyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "search_synonyms_select" ON search_synonyms FOR SELECT
USING (organization_id IS NULL OR organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid()));

-- Insert default synonyms
INSERT INTO search_synonyms (term, synonyms, synonym_type) VALUES
('TM', ARRAY['trademark', 'marca', 'trade mark'], 'abbreviation'),
('PAT', ARRAY['patent', 'patente'], 'abbreviation'),
('EP', ARRAY['european patent', 'patente europea', 'epo'], 'abbreviation'),
('WO', ARRAY['wipo', 'pct', 'international'], 'abbreviation'),
('EM', ARRAY['euipo', 'eutm', 'marca europea'], 'abbreviation'),
('ES', ARRAY['spain', 'españa', 'oepm'], 'abbreviation')
ON CONFLICT DO NOTHING;
