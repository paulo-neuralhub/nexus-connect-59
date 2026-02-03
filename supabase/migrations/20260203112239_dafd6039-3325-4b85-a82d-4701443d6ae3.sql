-- Crear trigger para provisionar automáticamente tenants NUEVOS con sus automatizaciones
CREATE OR REPLACE FUNCTION on_new_organization_provision_automations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO tenant_automations (
    organization_id,
    master_template_id,
    name,
    description,
    category,
    is_active,
    is_locked,
    trigger_type,
    trigger_config,
    conditions,
    actions,
    custom_params
  )
  SELECT 
    NEW.id,
    mt.id,
    mt.name,
    mt.description,
    mt.category,
    CASE WHEN mt.visibility IN ('mandatory', 'recommended') THEN true ELSE false END,
    CASE WHEN mt.visibility = 'mandatory' THEN true ELSE false END,
    mt.trigger_type,
    mt.trigger_config,
    mt.conditions,
    mt.actions,
    '{}'::jsonb
  FROM automation_master_templates mt
  WHERE mt.is_published = true
    AND mt.visibility != 'system'
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Crear trigger solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_provision_automations_on_new_org'
  ) THEN
    CREATE TRIGGER trg_provision_automations_on_new_org
      AFTER INSERT ON organizations
      FOR EACH ROW
      EXECUTE FUNCTION on_new_organization_provision_automations();
  END IF;
END;
$$;