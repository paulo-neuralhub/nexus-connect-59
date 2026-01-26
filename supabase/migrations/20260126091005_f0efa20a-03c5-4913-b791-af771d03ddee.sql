-- Add estimated_hours column to service_catalog for time tracking on matters
ALTER TABLE public.service_catalog 
ADD COLUMN IF NOT EXISTS estimated_hours numeric(6,2) DEFAULT NULL;

-- Add tax_rate column if not exists
ALTER TABLE public.service_catalog 
ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 21;

-- Add comment explaining the field
COMMENT ON COLUMN public.service_catalog.estimated_hours IS 'Estimated work hours for this service, used for time tracking on matters';
COMMENT ON COLUMN public.service_catalog.tax_rate IS 'Tax rate percentage (e.g., 21 for 21% VAT)';