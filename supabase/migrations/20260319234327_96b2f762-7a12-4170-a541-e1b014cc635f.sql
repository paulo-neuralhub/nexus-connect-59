-- Add digitalization_level column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ipo_offices' AND column_name = 'digitalization_level'
  ) THEN
    ALTER TABLE ipo_offices ADD COLUMN digitalization_level text;
  END IF;
END $$;

-- Populate digitalization_level from automation_level
UPDATE ipo_offices SET digitalization_level = CASE
  WHEN automation_level = 'A' THEN 'FULL_DIGITAL'
  WHEN automation_level = 'B' THEN 'AVANZADA'
  WHEN automation_level = 'C' THEN 'PARCIAL'
  WHEN automation_level = 'D' THEN 'BASICA'
  WHEN automation_level = 'E' THEN 'MANUAL'
  WHEN automation_level IN ('FULL_DIGITAL','AVANZADA','PARCIAL','BASICA','MANUAL') THEN automation_level
  ELSE 'MANUAL'
END
WHERE digitalization_level IS NULL OR digitalization_level = '';

-- Add digital_maturity_score column if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ipo_offices' AND column_name = 'digital_maturity_score'
  ) THEN
    ALTER TABLE ipo_offices ADD COLUMN digital_maturity_score numeric;
  END IF;
END $$;

-- Populate digital_maturity_score from automation_percentage
UPDATE ipo_offices SET digital_maturity_score = ROUND(COALESCE(automation_percentage, 0) / 10)
WHERE digital_maturity_score IS NULL;

-- Add data_completeness_score if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ipo_offices' AND column_name = 'data_completeness_score'
  ) THEN
    ALTER TABLE ipo_offices ADD COLUMN data_completeness_score numeric DEFAULT 0;
  END IF;
END $$;

-- Add handles_* booleans
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipo_offices' AND column_name = 'handles_trademarks') THEN
    ALTER TABLE ipo_offices ADD COLUMN handles_trademarks boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipo_offices' AND column_name = 'handles_patents') THEN
    ALTER TABLE ipo_offices ADD COLUMN handles_patents boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipo_offices' AND column_name = 'handles_designs') THEN
    ALTER TABLE ipo_offices ADD COLUMN handles_designs boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipo_offices' AND column_name = 'handles_utility_models') THEN
    ALTER TABLE ipo_offices ADD COLUMN handles_utility_models boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipo_offices' AND column_name = 'requires_local_agent') THEN
    ALTER TABLE ipo_offices ADD COLUMN requires_local_agent boolean;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipo_offices' AND column_name = 'agent_requirement_type') THEN
    ALTER TABLE ipo_offices ADD COLUMN agent_requirement_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ipo_offices' AND column_name = 'website_main') THEN
    ALTER TABLE ipo_offices ADD COLUMN website_main text;
  END IF;
END $$;

-- Populate handles_* from supported_ip_types array
UPDATE ipo_offices SET
  handles_trademarks = 'trademark' = ANY(COALESCE(supported_ip_types, '{}')),
  handles_patents = 'patent' = ANY(COALESCE(supported_ip_types, '{}')),
  handles_designs = 'design' = ANY(COALESCE(supported_ip_types, '{}')),
  handles_utility_models = 'utility_model' = ANY(COALESCE(supported_ip_types, '{}'))
WHERE handles_trademarks = false AND supported_ip_types IS NOT NULL AND array_length(supported_ip_types, 1) > 0;

-- Set website_main from website_official (tm_online_filing_url field)
UPDATE ipo_offices SET website_main = website_official WHERE website_main IS NULL AND website_official IS NOT NULL;
