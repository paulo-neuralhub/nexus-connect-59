INSERT INTO genius_tenant_config (
  organization_id,
  is_active,
  disclaimer_accepted,
  disclaimer_accepted_at,
  disclaimer_accepted_by,
  plan_code,
  max_queries_per_month,
  max_documents_per_month,
  max_actions_per_month
) VALUES (
  '1187fb92-0b65-44ba-91cc-7955af6a08d0',
  true,
  true,
  now(),
  '6ffb4fd0-b6bd-4844-8d69-c97cba524455',
  'genius_starter',
  500,
  50,
  100
) ON CONFLICT (organization_id) DO UPDATE SET
  is_active = true,
  disclaimer_accepted = true,
  disclaimer_accepted_at = now();