-- LIMPIEZA COMPLETA DE DATOS DE NEGOCIO (con manejo de errores)
-- Preserva: organizations, profiles, memberships, catálogos, templates de sistema

DO $$
DECLARE
  tables_to_clean TEXT[] := ARRAY[
    -- Logs y ejecuciones
    'automation_executions', 'email_queue', 'activity_log',
    'demo_seed_entities', 'demo_seed_runs',
    'analytics_events', 'analytics_daily_metrics',
    'help_rule_execution_log',
    -- Matter relacionados
    'matter_deadlines', 'matter_phases', 'matter_timeline', 'matter_events',
    'matter_holders', 'matter_classes', 'matter_designs', 
    'matter_documents', 'matter_financial',
    -- Comunicaciones
    'communications', 'activities',
    -- Financiero
    'invoice_items', 'invoices', 'time_entries', 'expenses',
    'quote_lines', 'quotes', 'billing_clients',
    -- CRM
    'crm_interactions', 'crm_activities', 'crm_tasks', 
    'crm_deals', 'crm_leads', 'crm_contacts', 'crm_accounts',
    -- Market
    'market_offers', 'market_transactions', 'market_inquiries',
    'market_favorites', 'market_listings', 'market_assets',
    -- Vigilancia
    'surveillance_alerts', 'surveillance_monitors',
    -- AI
    'ai_messages', 'ai_conversations', 'ai_usage_logs',
    -- Entidades principales
    'matters', 'contacts', 'clients',
    -- Tenant automations
    'tenant_automations'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_to_clean LOOP
    BEGIN
      EXECUTE format('DELETE FROM %I WHERE true', t);
      RAISE NOTICE 'Cleaned: %', t;
    EXCEPTION WHEN undefined_table THEN
      RAISE NOTICE 'Table not found (skipped): %', t;
    WHEN OTHERS THEN
      RAISE NOTICE 'Error cleaning % (skipped): %', t, SQLERRM;
    END;
  END LOOP;
END $$;

-- Re-provisionar automatizaciones para todas las organizaciones
INSERT INTO tenant_automations (
  organization_id, master_template_id, name, description, category,
  is_active, is_locked, trigger_type, trigger_config, conditions, actions, custom_params
)
SELECT 
  o.id, 
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
FROM organizations o
CROSS JOIN automation_master_templates mt
WHERE mt.is_published = true 
  AND mt.visibility != 'system'
ON CONFLICT DO NOTHING;