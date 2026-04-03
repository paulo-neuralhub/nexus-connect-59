-- ============================================================
-- Portal Security Fixes Migration
-- Addresses: branding anon access, race condition prevention,
-- reserved subdomains, color validation, composite index,
-- updated_at trigger, RLS hardening
-- ============================================================

-- 1. FUNCTION: get_portal_branding (anon-safe, SECURITY DEFINER)
-- Returns ONLY safe branding fields for white-label login pages
CREATE OR REPLACE FUNCTION public.get_portal_branding(p_subdomain text)
RETURNS TABLE(
  portal_name text,
  portal_welcome_title text,
  portal_welcome_message text,
  portal_footer_text text,
  portal_show_ipnexus_branding boolean,
  portal_chatbot_name text,
  portal_chatbot_welcome text,
  logo_url text,
  portal_logo_dark_url text,
  portal_favicon_url text,
  primary_color text,
  secondary_color text
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    o.portal_name,
    o.portal_welcome_title,
    o.portal_welcome_message,
    o.portal_footer_text,
    o.portal_show_ipnexus_branding,
    o.portal_chatbot_name,
    o.portal_chatbot_welcome,
    o.logo_url,
    o.portal_logo_dark_url,
    o.portal_favicon_url,
    o.primary_color,
    o.secondary_color
  FROM organizations o
  WHERE o.portal_subdomain = p_subdomain
    AND o.portal_enabled = true
  LIMIT 1;
$$;

-- Grant to anon so unauthenticated portal login pages can fetch branding
GRANT EXECUTE ON FUNCTION public.get_portal_branding(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_portal_branding(text) TO authenticated;


-- 2. FUNCTION: claim_portal_invitation (atomic, prevents race condition)
CREATE OR REPLACE FUNCTION public.claim_portal_invitation(p_token text)
RETURNS portal_invitations
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_inv portal_invitations;
BEGIN
  SELECT * INTO v_inv
  FROM portal_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE SKIP LOCKED;

  IF v_inv IS NULL THEN
    RAISE EXCEPTION 'invalid_or_expired_token';
  END IF;

  UPDATE portal_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_inv.id;

  RETURN v_inv;
END;
$$;

-- Only service role should call this (via edge function)
REVOKE EXECUTE ON FUNCTION public.claim_portal_invitation(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_portal_invitation(text) FROM authenticated;


-- 3. Reserved subdomain blocklist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'portal_subdomain_not_reserved'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT portal_subdomain_not_reserved
      CHECK (portal_subdomain NOT IN (
        'app', 'api', 'www', 'cdn', 'ftp', 'mail', 'smtp',
        'admin', 'portal', 'staging', 'dev', 'test', 'demo',
        'help', 'support', 'status', 'docs', 'blog', 'shop',
        'store', 'auth', 'login', 'register', 'dashboard',
        'billing', 'payments', 'internal', 'system', 'root'
      ));
  END IF;
END $$;


-- 4. Color validation constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'primary_color_hex_format'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT primary_color_hex_format
      CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9a-fA-F]{6}$');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'secondary_color_hex_format'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT secondary_color_hex_format
      CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9a-fA-F]{6}$');
  END IF;
END $$;


-- 5. Composite index for portal subdomain lookup
CREATE INDEX IF NOT EXISTS idx_org_portal_lookup
  ON organizations(portal_subdomain, portal_enabled)
  WHERE portal_subdomain IS NOT NULL AND portal_enabled = true;


-- 6. updated_at on portal_access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'portal_access' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE portal_access ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS portal_access_updated_at ON portal_access;
CREATE TRIGGER portal_access_updated_at
  BEFORE UPDATE ON portal_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- 7. RLS: ensure organizations table has proper policies
-- (Only add if missing — don't duplicate existing ones)

-- Public branding read (for anon portal login pages)
-- This is handled by the SECURITY DEFINER function above,
-- so we do NOT need an anon SELECT policy on the table itself.

-- Admin update policy (add if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organizations' AND policyname = 'admin_update_own_org'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "admin_update_own_org"
        ON organizations FOR UPDATE
        TO authenticated
        USING (
          id IN (
            SELECT organization_id FROM memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND status = 'active'
          )
        )
        WITH CHECK (
          id IN (
            SELECT organization_id FROM memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND status = 'active'
          )
        )
    $policy$;
  END IF;
END $$;
