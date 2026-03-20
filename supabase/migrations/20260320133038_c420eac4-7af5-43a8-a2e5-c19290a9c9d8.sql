-- Add description and category columns to ai_providers
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'llm';
ALTER TABLE ai_providers ADD COLUMN IF NOT EXISTS website TEXT;

-- Unique constraint on code for idempotent inserts
CREATE UNIQUE INDEX IF NOT EXISTS ai_providers_code_unique ON ai_providers (code);

-- Add unique constraint on ai_models (provider_id, model_id) for idempotent inserts
CREATE UNIQUE INDEX IF NOT EXISTS ai_models_provider_model_unique ON ai_models (provider_id, model_id);

-- Add description column to ai_models if missing
ALTER TABLE ai_models ADD COLUMN IF NOT EXISTS family TEXT;

-- Add columns to ai_tasks for richer data
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS module TEXT;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS primary_model TEXT;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS primary_provider TEXT;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS temperature NUMERIC DEFAULT 0.3;
ALTER TABLE ai_tasks ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 4096;