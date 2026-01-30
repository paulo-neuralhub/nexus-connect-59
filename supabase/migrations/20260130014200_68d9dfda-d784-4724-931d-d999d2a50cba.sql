-- Add missing tax_id column to crm_accounts
ALTER TABLE crm_accounts 
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Add index for tax_id search
CREATE INDEX IF NOT EXISTS idx_crm_accounts_tax_id 
ON crm_accounts(tax_id) 
WHERE tax_id IS NOT NULL;