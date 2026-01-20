-- PROMPT 50: Grant full access to current superadmin user

-- 1. Ensure user is in superadmins table
INSERT INTO public.superadmins (user_id)
VALUES ('0090b656-5c9a-445c-91be-34228afb2b0f')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Get the user's organization
DO $$
DECLARE
  v_org_id UUID;
  v_module RECORD;
BEGIN
  -- Get organization
  SELECT organization_id INTO v_org_id
  FROM memberships
  WHERE user_id = '0090b656-5c9a-445c-91be-34228afb2b0f'
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    -- Grant all modules with enterprise tier
    FOR v_module IN SELECT id, code FROM platform_modules WHERE is_active = true LOOP
      INSERT INTO organization_module_licenses (
        organization_id,
        module_id,
        license_type,
        tier_code,
        billing_cycle,
        status
      ) VALUES (
        v_org_id,
        v_module.id,
        'included',
        'enterprise',
        'yearly',
        'active'
      )
      ON CONFLICT (organization_id, module_id) DO UPDATE SET
        tier_code = 'enterprise',
        license_type = 'included',
        status = 'active',
        updated_at = NOW();
    END LOOP;
    
    -- Update organization plan to enterprise
    UPDATE organizations
    SET plan = 'enterprise',
        updated_at = NOW()
    WHERE id = v_org_id;
  END IF;
END $$;

-- 3. Create function for backoffice to change organization plan
CREATE OR REPLACE FUNCTION public.admin_change_organization_plan(
  p_organization_id UUID,
  p_pack_code VARCHAR(50),
  p_billing_cycle VARCHAR(20) DEFAULT 'monthly'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_superadmin BOOLEAN;
  v_pack RECORD;
  v_module RECORD;
  v_module_config JSONB;
  v_result JSONB;
BEGIN
  -- Check if caller is superadmin
  SELECT EXISTS(
    SELECT 1 FROM superadmins WHERE user_id = auth.uid()
  ) INTO v_is_superadmin;

  IF NOT v_is_superadmin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Superadmin required');
  END IF;

  -- Get pack
  SELECT * INTO v_pack FROM subscription_packs sp WHERE sp.code = p_pack_code;

  IF v_pack IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pack not found: ' || p_pack_code);
  END IF;

  -- Cancel existing licenses
  UPDATE organization_module_licenses
  SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
  WHERE organization_id = p_organization_id AND status = 'active';

  -- Create new licenses for each module in the pack
  FOR v_module_config IN SELECT * FROM jsonb_array_elements(v_pack.included_modules) LOOP
    SELECT * INTO v_module 
    FROM platform_modules pm 
    WHERE pm.code = v_module_config->>'module_code';

    IF v_module IS NOT NULL THEN
      INSERT INTO organization_module_licenses (
        organization_id,
        module_id,
        license_type,
        tier_code,
        billing_cycle,
        status
      ) VALUES (
        p_organization_id,
        v_module.id,
        CASE WHEN v_pack.pack_type = 'standalone' THEN 'standalone' ELSE 'included' END,
        v_module_config->>'tier',
        p_billing_cycle,
        'active'
      )
      ON CONFLICT (organization_id, module_id) DO UPDATE SET
        tier_code = EXCLUDED.tier_code,
        license_type = EXCLUDED.license_type,
        billing_cycle = EXCLUDED.billing_cycle,
        status = 'active',
        cancelled_at = NULL,
        updated_at = NOW();
    END IF;
  END LOOP;

  -- Update organization plan
  UPDATE organizations
  SET plan = p_pack_code,
      updated_at = NOW()
  WHERE id = p_organization_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Plan updated successfully',
    'organization_id', p_organization_id,
    'new_plan', p_pack_code
  );
END;
$$;

-- Grant execute to authenticated users (function checks superadmin internally)
GRANT EXECUTE ON FUNCTION public.admin_change_organization_plan(UUID, VARCHAR, VARCHAR) TO authenticated;
