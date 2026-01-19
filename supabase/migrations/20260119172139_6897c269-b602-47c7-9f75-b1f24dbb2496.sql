
-- ============================================
-- SEARCH SYSTEM - ADD COLUMNS FIRST
-- ============================================

-- Add search_vector columns
ALTER TABLE matters ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN indexes
CREATE INDEX IF NOT EXISTS idx_matters_search ON matters USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_contacts_search ON contacts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_deals_search ON deals USING GIN(search_vector);

-- Trigger for matters
CREATE OR REPLACE FUNCTION update_matter_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.mark_name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.reference, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.application_number, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.registration_number, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.goods_services, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.owner_name, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_matter_search_vector ON matters;
CREATE TRIGGER trigger_matter_search_vector
  BEFORE INSERT OR UPDATE ON matters
  FOR EACH ROW EXECUTE FUNCTION update_matter_search_vector();

-- Trigger for contacts
CREATE OR REPLACE FUNCTION update_contact_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.company_name, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.email, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.phone, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.city, '')), 'C') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_contact_search_vector ON contacts;
CREATE TRIGGER trigger_contact_search_vector
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_contact_search_vector();

-- Trigger for deals
CREATE OR REPLACE FUNCTION update_deal_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deal_search_vector ON deals;
CREATE TRIGGER trigger_deal_search_vector
  BEFORE INSERT OR UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_deal_search_vector();

-- Update existing records
UPDATE matters SET search_vector = 
  setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(mark_name, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(reference, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(application_number, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(registration_number, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(goods_services, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(owner_name, '')), 'B') ||
  setweight(to_tsvector('spanish', COALESCE(notes, '')), 'C');

UPDATE contacts SET search_vector = 
  setweight(to_tsvector('spanish', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(company_name, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(email, '')), 'B');

UPDATE deals SET search_vector = 
  setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('spanish', COALESCE(description, '')), 'B');

-- ============================================
-- SEARCH FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION search_all(
  p_organization_id UUID,
  p_query TEXT,
  p_entity_types TEXT[] DEFAULT NULL,
  p_filters JSONB DEFAULT '{}',
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  title TEXT,
  subtitle TEXT,
  metadata JSONB,
  rank FLOAT,
  highlight TEXT
) AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  IF p_query IS NULL OR p_query = '' THEN
    RETURN;
  END IF;
  
  v_tsquery := plainto_tsquery('spanish', p_query);
  
  RETURN QUERY
  
  -- Matters
  SELECT 
    'matter'::TEXT as entity_type,
    m.id as entity_id,
    COALESCE(m.title, m.mark_name, 'Sin título') as title,
    CONCAT(m.type, ' · ', m.status, ' · ', COALESCE(m.jurisdiction_code, '')) as subtitle,
    jsonb_build_object(
      'type', m.type,
      'status', m.status,
      'jurisdiction_code', m.jurisdiction_code,
      'application_number', m.application_number,
      'registration_number', m.registration_number
    ) as metadata,
    ts_rank(m.search_vector, v_tsquery) as rank,
    ts_headline('spanish', COALESCE(m.title, '') || ' ' || COALESCE(m.mark_name, ''), v_tsquery, 'MaxWords=30, MinWords=10') as highlight
  FROM matters m
  WHERE m.organization_id = p_organization_id
    AND m.search_vector IS NOT NULL
    AND (p_entity_types IS NULL OR 'matter' = ANY(p_entity_types))
    AND m.search_vector @@ v_tsquery
  
  UNION ALL
  
  -- Contacts
  SELECT 
    'contact'::TEXT as entity_type,
    c.id as entity_id,
    c.name as title,
    CONCAT(c.type, ' · ', COALESCE(c.company_name, c.email)) as subtitle,
    jsonb_build_object(
      'type', c.type,
      'company_name', c.company_name,
      'email', c.email,
      'country', c.country
    ) as metadata,
    ts_rank(c.search_vector, v_tsquery) as rank,
    ts_headline('spanish', COALESCE(c.name, '') || ' ' || COALESCE(c.company_name, ''), v_tsquery, 'MaxWords=30, MinWords=10') as highlight
  FROM contacts c
  WHERE c.organization_id = p_organization_id
    AND c.search_vector IS NOT NULL
    AND (p_entity_types IS NULL OR 'contact' = ANY(p_entity_types))
    AND c.search_vector @@ v_tsquery
  
  UNION ALL
  
  -- Deals
  SELECT 
    'deal'::TEXT as entity_type,
    d.id as entity_id,
    d.title as title,
    CONCAT(d.status, ' · ', COALESCE(d.value::TEXT, '0'), ' ', d.currency) as subtitle,
    jsonb_build_object(
      'status', d.status,
      'value', d.value,
      'currency', d.currency
    ) as metadata,
    ts_rank(d.search_vector, v_tsquery) as rank,
    ts_headline('spanish', COALESCE(d.title, '') || ' ' || COALESCE(d.description, ''), v_tsquery, 'MaxWords=30, MinWords=10') as highlight
  FROM deals d
  WHERE d.organization_id = p_organization_id
    AND d.search_vector IS NOT NULL
    AND (p_entity_types IS NULL OR 'deal' = ANY(p_entity_types))
    AND d.search_vector @@ v_tsquery
  
  ORDER BY rank DESC
  LIMIT p_limit
  OFFSET p_offset;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_facets(
  p_organization_id UUID,
  p_query TEXT
)
RETURNS TABLE (
  entity_type TEXT,
  count BIGINT
) AS $$
DECLARE
  v_tsquery tsquery;
BEGIN
  IF p_query IS NULL OR p_query = '' THEN
    RETURN;
  END IF;
  
  v_tsquery := plainto_tsquery('spanish', p_query);
  
  RETURN QUERY
  SELECT 'matter'::TEXT, COUNT(*)::BIGINT
  FROM matters WHERE organization_id = p_organization_id AND search_vector IS NOT NULL AND search_vector @@ v_tsquery
  UNION ALL
  SELECT 'contact'::TEXT, COUNT(*)::BIGINT
  FROM contacts WHERE organization_id = p_organization_id AND search_vector IS NOT NULL AND search_vector @@ v_tsquery
  UNION ALL
  SELECT 'deal'::TEXT, COUNT(*)::BIGINT
  FROM deals WHERE organization_id = p_organization_id AND search_vector IS NOT NULL AND search_vector @@ v_tsquery;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
