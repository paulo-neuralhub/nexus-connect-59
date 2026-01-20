-- Drop existing function first
DROP FUNCTION IF EXISTS provision_pack_modules(uuid, varchar, varchar);

-- Recreate function with fixed column references
CREATE OR REPLACE FUNCTION provision_pack_modules(
  p_organization_id UUID,
  p_pack_code VARCHAR(50),
  p_billing_cycle VARCHAR(20) DEFAULT 'monthly'
)
RETURNS TABLE(
  module_code VARCHAR,
  tier_code VARCHAR,
  result_status VARCHAR
) AS $$
DECLARE
  v_pack RECORD;
  v_module RECORD;
  v_module_config JSONB;
BEGIN
  -- Get pack
  SELECT * INTO v_pack FROM subscription_packs WHERE code = p_pack_code;
  
  IF v_pack IS NULL THEN
    RAISE EXCEPTION 'Pack not found: %', p_pack_code;
  END IF;
  
  -- Deactivate existing licenses using table alias to avoid ambiguity
  UPDATE organization_module_licenses AS oml
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE oml.organization_id = p_organization_id AND oml.status = 'active';
  
  -- Create licenses for each module in pack
  FOR v_module_config IN SELECT * FROM jsonb_array_elements(v_pack.included_modules)
  LOOP
    -- Find module
    SELECT * INTO v_module 
    FROM platform_modules 
    WHERE code = v_module_config->>'module_code';
    
    IF v_module IS NOT NULL THEN
      INSERT INTO organization_module_licenses (
        organization_id,
        module_id,
        license_type,
        tier_code,
        billing_cycle,
        status,
        activated_at
      ) VALUES (
        p_organization_id,
        v_module.id,
        CASE WHEN v_pack.pack_type = 'standalone' THEN 'standalone' ELSE 'included' END,
        v_module_config->>'tier',
        p_billing_cycle,
        'active',
        NOW()
      )
      ON CONFLICT (organization_id, module_id) DO UPDATE SET
        tier_code = EXCLUDED.tier_code,
        license_type = EXCLUDED.license_type,
        status = 'active',
        activated_at = NOW(),
        updated_at = NOW();
      
      -- Return result
      module_code := v_module.code;
      tier_code := v_module_config->>'tier';
      result_status := 'provisioned';
      RETURN NEXT;
    END IF;
  END LOOP;
  
  -- Update organization's plan
  UPDATE organizations AS o
  SET plan = p_pack_code, updated_at = NOW()
  WHERE o.id = p_organization_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute
GRANT EXECUTE ON FUNCTION provision_pack_modules TO authenticated;


-- Provision starter licenses for existing organizations
DO $$
DECLARE
  v_org RECORD;
BEGIN
  FOR v_org IN 
    SELECT o.id FROM organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM organization_module_licenses oml 
      WHERE oml.organization_id = o.id AND oml.status = 'active'
    )
  LOOP
    PERFORM provision_pack_modules(v_org.id, 'starter', 'monthly');
  END LOOP;
END $$;


-- Auto-provision trigger for new orgs
CREATE OR REPLACE FUNCTION auto_provision_starter_modules()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM provision_pack_modules(NEW.id, 'starter', 'monthly');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_provision_starter_modules ON organizations;
CREATE TRIGGER trigger_provision_starter_modules
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_provision_starter_modules();