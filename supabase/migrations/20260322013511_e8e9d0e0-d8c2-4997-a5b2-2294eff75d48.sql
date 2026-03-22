
-- Create IP-NEXUS Platform organization if not exists
DO $$
DECLARE v_org_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations WHERE is_platform_owner = true LIMIT 1;
  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, slug, plan, is_platform_owner, organization_type)
    VALUES ('IP-NEXUS Platform', 'ip-nexus-platform', 'enterprise', true, 'platform');
  END IF;
END $$;
