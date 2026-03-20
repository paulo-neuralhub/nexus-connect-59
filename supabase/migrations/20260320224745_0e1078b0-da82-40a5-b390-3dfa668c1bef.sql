-- Add missing columns to crm_accounts needed by ClientGeneralTab and EditClientCompanyDialog
ALTER TABLE public.crm_accounts
  ADD COLUMN IF NOT EXISTS address_line1 text,
  ADD COLUMN IF NOT EXISTS address_line2 text,
  ADD COLUMN IF NOT EXISTS state_province text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'ES',
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS fax text,
  ADD COLUMN IF NOT EXISTS trade_name text,
  ADD COLUMN IF NOT EXISTS tax_id_type text DEFAULT 'CIF',
  ADD COLUMN IF NOT EXISTS tax_country text DEFAULT 'ES',
  ADD COLUMN IF NOT EXISTS agent_license_number text,
  ADD COLUMN IF NOT EXISTS agent_jurisdictions text[],
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS payment_terms integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS credit_limit numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR';

-- Migrate existing 'address' data to address_line1 if present
UPDATE public.crm_accounts SET address_line1 = address WHERE address IS NOT NULL AND address_line1 IS NULL;

-- Migrate existing 'country_code' to 'country' if present
UPDATE public.crm_accounts SET country = country_code WHERE country_code IS NOT NULL AND country IS NULL;