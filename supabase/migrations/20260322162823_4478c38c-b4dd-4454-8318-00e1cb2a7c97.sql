
-- Phase 4A: Add timezone columns
ALTER TABLE genius_tenant_config
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Madrid';

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Europe/Madrid';

-- Add last_briefing_date if not exists
ALTER TABLE genius_tenant_config
  ADD COLUMN IF NOT EXISTS last_briefing_date text;

ALTER TABLE genius_tenant_config
  ADD COLUMN IF NOT EXISTS last_briefing_at timestamptz;

-- Validation trigger for timezone values
CREATE OR REPLACE FUNCTION public.validate_timezone()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  valid_timezones text[] := ARRAY[
    'Europe/Madrid','Europe/London','Europe/Paris',
    'Europe/Berlin','Europe/Lisbon','Europe/Amsterdam',
    'America/New_York','America/Chicago','America/Denver',
    'America/Los_Angeles','America/Mexico_City',
    'America/Sao_Paulo','America/Buenos_Aires',
    'Asia/Tokyo','Asia/Shanghai','Asia/Singapore',
    'Asia/Dubai','Asia/Kolkata','Australia/Sydney',
    'Pacific/Auckland'
  ];
BEGIN
  IF NEW.timezone IS NOT NULL AND NOT (NEW.timezone = ANY(valid_timezones)) THEN
    RAISE EXCEPTION 'Invalid timezone: %', NEW.timezone;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_timezone_gtc ON genius_tenant_config;
CREATE TRIGGER trg_validate_timezone_gtc
  BEFORE INSERT OR UPDATE ON genius_tenant_config
  FOR EACH ROW EXECUTE FUNCTION validate_timezone();

DROP TRIGGER IF EXISTS trg_validate_timezone_org ON organizations;
CREATE TRIGGER trg_validate_timezone_org
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION validate_timezone();
