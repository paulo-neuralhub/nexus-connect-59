
-- 1. Add columns
ALTER TABLE matters
  ADD COLUMN IF NOT EXISTS crm_account_id UUID
  REFERENCES crm_accounts(id) ON DELETE SET NULL;

ALTER TABLE communications
  ADD COLUMN IF NOT EXISTS crm_account_id UUID
  REFERENCES crm_accounts(id) ON DELETE SET NULL;

-- 2. Migrate matters: direct UUID match
UPDATE matters
SET crm_account_id = client_id
WHERE client_id IS NOT NULL
AND EXISTS (SELECT 1 FROM crm_accounts WHERE id = matters.client_id);

-- 3. Migrate matters: email match via subquery
UPDATE matters
SET crm_account_id = (
  SELECT ca.id FROM contacts c
  JOIN crm_accounts ca ON ca.email = c.email AND ca.organization_id = matters.organization_id
  WHERE c.id = matters.client_id
  LIMIT 1
)
WHERE client_id IS NOT NULL
AND crm_account_id IS NULL;

-- 4. Migrate communications: direct UUID match
UPDATE communications
SET crm_account_id = client_id
WHERE client_id IS NOT NULL
AND EXISTS (SELECT 1 FROM crm_accounts WHERE id = communications.client_id);

-- 5. Migrate communications: email match via subquery
UPDATE communications
SET crm_account_id = (
  SELECT ca.id FROM contacts c
  JOIN crm_accounts ca ON ca.email = c.email AND ca.organization_id = communications.organization_id
  WHERE c.id = communications.client_id
  LIMIT 1
)
WHERE client_id IS NOT NULL
AND crm_account_id IS NULL;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_matters_crm_account_id ON matters(crm_account_id);
CREATE INDEX IF NOT EXISTS idx_matters_org_crm_account ON matters(organization_id, crm_account_id);
CREATE INDEX IF NOT EXISTS idx_comm_crm_account_id ON communications(crm_account_id);

-- 7. Unified view
CREATE OR REPLACE VIEW matters_view AS
SELECT
  m.*,
  COALESCE(m.crm_account_id, m.client_id) AS resolved_account_id,
  ca.name AS account_name,
  ca.country_code AS account_country
FROM matters m
LEFT JOIN crm_accounts ca ON ca.id = COALESCE(m.crm_account_id, m.client_id);
