-- ============================================================
-- Migration: Web Scraping Sessions + Credential Encryption
-- Purpose: Support DATA HUB web scraping for portals without API
-- ============================================================

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── 1. Scraping Sessions Table ──────────────────────────────

CREATE TABLE IF NOT EXISTS scraping_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_id UUID NOT NULL REFERENCES import_sources(id) ON DELETE CASCADE,

  -- Status machine
  status TEXT NOT NULL DEFAULT 'initializing'
    CHECK (status IN (
      'initializing',     -- Session created, not yet started
      'authenticating',   -- Logging into target portal
      'authenticated',    -- Login successful, ready to scrape
      'navigating',       -- Navigating to target pages
      'scraping',         -- Actively extracting data
      'paused',           -- User-initiated pause
      'completed',        -- All data extracted successfully
      'error',            -- Unrecoverable error
      'rate_limited',     -- Temporarily throttled
      'cancelled'         -- User-initiated cancellation
    )),

  -- Progress tracking
  current_page TEXT,
  current_entity TEXT,
  items_scraped INTEGER NOT NULL DEFAULT 0,
  items_total INTEGER,
  pages_processed INTEGER NOT NULL DEFAULT 0,
  requests_made INTEGER NOT NULL DEFAULT 0,

  -- Data & errors
  extracted_data JSONB NOT NULL DEFAULT '{}',
  error_log JSONB NOT NULL DEFAULT '[]',
  screenshots JSONB NOT NULL DEFAULT '[]',

  -- Browser service reference
  browser_session_id TEXT,

  -- Linked import job (when data is sent to process-import)
  import_job_id UUID REFERENCES import_jobs(id),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ DEFAULT now(),

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Row Level Security ───────────────────────────────────

ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT: org members can view their org's sessions
CREATE POLICY "scraping_sessions_select_org" ON scraping_sessions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- INSERT: org members can create sessions
CREATE POLICY "scraping_sessions_insert_org" ON scraping_sessions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- UPDATE: org members can update their org's sessions
CREATE POLICY "scraping_sessions_update_org" ON scraping_sessions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- DELETE: org members can delete their org's sessions
CREATE POLICY "scraping_sessions_delete_org" ON scraping_sessions
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- ── 3. Indexes ──────────────────────────────────────────────

CREATE INDEX idx_scraping_sessions_org
  ON scraping_sessions(organization_id);

CREATE INDEX idx_scraping_sessions_source
  ON scraping_sessions(source_id);

-- Partial index for active sessions (used by status polling)
CREATE INDEX idx_scraping_sessions_active
  ON scraping_sessions(status, last_activity_at)
  WHERE status NOT IN ('completed', 'cancelled', 'error');

CREATE INDEX idx_scraping_sessions_import_job
  ON scraping_sessions(import_job_id)
  WHERE import_job_id IS NOT NULL;

-- ── 4. Credentials Encryption ───────────────────────────────

-- Add encrypted credentials column to import_sources (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'import_sources'
    AND column_name = 'credentials_encrypted'
  ) THEN
    ALTER TABLE import_sources ADD COLUMN credentials_encrypted BYTEA;
  END IF;
END $$;

-- Add scraper_config column to import_sources for WebScraperConfig JSON
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'import_sources'
    AND column_name = 'scraper_config'
  ) THEN
    ALTER TABLE import_sources ADD COLUMN scraper_config JSONB;
  END IF;
END $$;

-- ── 5. Credential Encryption Functions (SECURITY DEFINER) ───
-- These functions run with elevated privileges to encrypt/decrypt
-- credentials. They are ONLY callable from edge functions via
-- service-role client. RLS prevents direct client access.

-- Encrypt credentials for a source
CREATE OR REPLACE FUNCTION encrypt_source_credentials(
  p_source_id UUID,
  p_credentials JSONB
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE import_sources
  SET credentials_encrypted = pgp_sym_encrypt(
    p_credentials::text,
    current_setting('app.scraper_encryption_key', true)
  ),
  updated_at = now()
  WHERE id = p_source_id;
END;
$$;

-- Decrypt credentials for a source (returns JSONB)
CREATE OR REPLACE FUNCTION decrypt_source_credentials(p_source_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result TEXT;
BEGIN
  SELECT pgp_sym_decrypt(
    credentials_encrypted,
    current_setting('app.scraper_encryption_key', true)
  ) INTO v_result
  FROM import_sources
  WHERE id = p_source_id
  AND credentials_encrypted IS NOT NULL;

  IF v_result IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_result::jsonb;
END;
$$;

-- ── 6. Updated_at Trigger ───────────────────────────────────

CREATE OR REPLACE FUNCTION update_scraping_session_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER scraping_sessions_updated_at
  BEFORE UPDATE ON scraping_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_scraping_session_timestamp();

-- ── 7. Comments ─────────────────────────────────────────────

COMMENT ON TABLE scraping_sessions IS 'Tracks web scraping sessions for DATA HUB portal imports';
COMMENT ON COLUMN scraping_sessions.browser_session_id IS 'External session ID from Browserbase/Browserless';
COMMENT ON COLUMN scraping_sessions.extracted_data IS 'Structured data keyed by entity type: { matters: [...], contacts: [...] }';
COMMENT ON COLUMN scraping_sessions.screenshots IS 'Array of { url, timestamp, step } for debugging';
COMMENT ON COLUMN import_sources.credentials_encrypted IS 'pgcrypto encrypted login credentials (username/password)';
COMMENT ON COLUMN import_sources.scraper_config IS 'WebScraperConfig JSON: login_url, navigation_config, extraction_rules, rate_limit';
COMMENT ON FUNCTION encrypt_source_credentials IS 'SECURITY DEFINER: Encrypts portal credentials. Only callable via service-role';
COMMENT ON FUNCTION decrypt_source_credentials IS 'SECURITY DEFINER: Decrypts portal credentials. Only callable via service-role';
