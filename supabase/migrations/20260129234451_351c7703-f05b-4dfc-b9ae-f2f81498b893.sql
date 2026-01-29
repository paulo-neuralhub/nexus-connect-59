-- Add missing columns to organizations for onboarding
ALTER TABLE organizations 
  ADD COLUMN IF NOT EXISTS org_code VARCHAR(3),
  ADD COLUMN IF NOT EXISTS preferred_jurisdictions TEXT[] DEFAULT '{}';

-- Add unique constraint for org_code per organization (can't duplicate within same org)
-- Note: org_code doesn't need to be globally unique, just per tenant

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_organizations_org_code 
  ON organizations(org_code) WHERE org_code IS NOT NULL;

COMMENT ON COLUMN organizations.org_code IS 'Short 3-char code used in matter references (e.g., TM-ES-...-ABC-...)';
COMMENT ON COLUMN organizations.preferred_jurisdictions IS 'Array of preferred jurisdiction codes (ES, EU, US, etc.)';