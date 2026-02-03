-- =====================================================================
-- TEMPLATES ADICIONALES — Completar categorías faltantes
-- Tabla real: automation_master_templates
-- =====================================================================

INSERT INTO automation_master_templates (
  code, name, name_en, description, description_en,
  category, icon, color, visibility, min_plan_tier,
  trigger_type, trigger_config, conditions, actions,
  configurable_params, is_published, is_active, sort_order
) VALUES

-- ═══════════════════════════════════════════════════════════════
-- VIGILANCIA DE PI (Categoría sin templates — CRÍTICA)
-- ═══════════════════════════════════════════════════════════════

(
  'similar_mark_alert',
  'Alerta marca similar detectada',
  'Similar trademark alert',
  'Monitoriza boletines oficiales y alerta cuando se publica una marca similar a las del cliente.',
  'Monitors official gazettes and alerts when a similar trademark is published.',
  'ip_surveillance', '🔍', '#7C3AED', 'optional', 'professional',
  'cron',
  '{"schedule": "0 6 * * 1-5", "timezone": "tenant", "description": "Lunes a viernes a las 6AM"}'::jsonb,
  '[{"field": "matter.type", "operator": "equals", "value": "trademark"}]'::jsonb,
  '[{"order": 1, "type": "send_notification", "config": {"title": "⚠️ Marca similar detectada", "message": "Se ha detectado una marca similar en el boletín oficial", "type": "warning"}}, {"order": 2, "type": "send_email", "config": {"template_code": "similar_mark_found", "to": "{{matter.assigned_to.email}}"}}]'::jsonb,
  '[{"key": "similarity_threshold", "label": "Umbral de similitud (%)", "label_en": "Similarity threshold (%)", "type": "number", "default_value": 70, "validation": {"min": 50, "max": 95}}]'::jsonb,
  true, true, 50
),

(
  'ip_office_status_monitor',
  'Monitor estado oficina de PI',
  'IP office status monitor',
  'Consulta periódicamente el estado de expedientes en oficinas de PI y actualiza automáticamente.',
  'Periodically checks case status at IP offices and automatically updates when changes occur.',
  'ip_surveillance', '🏛️', '#6D28D9', 'recommended', 'starter',
  'cron',
  '{"schedule": "0 7 * * *", "timezone": "tenant", "description": "Diario a las 7AM"}'::jsonb,
  '[{"field": "matter.status", "operator": "not_in", "value": ["closed", "archived"]}]'::jsonb,
  '[{"order": 1, "type": "update_field", "config": {"table": "matters", "field": "office_status", "value": "{{calculated.new_status}}"}}, {"order": 2, "type": "send_notification", "config": {"title": "📋 Estado actualizado", "message": "El estado del expediente ha cambiado", "type": "info"}}]'::jsonb,
  '[{"key": "check_frequency", "label": "Frecuencia de consulta", "type": "select", "default_value": "daily", "options": [{"value": "daily", "label": "Diario"}, {"value": "weekly", "label": "Semanal"}]}]'::jsonb,
  true, true, 51
),

(
  'opposition_deadline_monitor',
  'Monitor plazo de oposición',
  'Opposition deadline monitor',
  'Vigila las marcas en período de publicación y alerta sobre plazos de oposición.',
  'Monitors trademarks in publication period and alerts about opposition deadlines.',
  'ip_surveillance', '⚔️', '#9333EA', 'recommended', 'starter',
  'date_relative',
  '{"table": "matters", "date_field": "publication_date", "offset_days": 0, "repeat_offsets": [0, 30, 60, 85, 89]}'::jsonb,
  '[{"field": "matter.current_phase", "operator": "equals", "value": "publication"}]'::jsonb,
  '[{"order": 1, "type": "send_notification", "config": {"title": "📢 Período oposición activo", "message": "Días restantes: {{trigger.days_remaining}}", "type": "warning"}}, {"order": 2, "type": "send_email", "config": {"template_code": "opposition_period_alert", "to": "{{matter.assigned_to.email}}"}}]'::jsonb,
  '[{"key": "opposition_period_days", "label": "Duración período oposición (días)", "type": "number", "default_value": 90}]'::jsonb,
  true, true, 52
),

-- ═══════════════════════════════════════════════════════════════
-- PLAZOS — Prioridad París (faltaba)
-- ═══════════════════════════════════════════════════════════════

(
  'paris_priority_deadline',
  'Plazo prioridad París',
  'Paris Convention priority deadline',
  'Alerta del plazo de 6/12 meses de prioridad del Convenio de París.',
  'Alerts about the 6/12 month Paris Convention priority deadline.',
  'deadlines', '🌍', '#DC2626', 'mandatory', 'free',
  'date_relative',
  '{"table": "matters", "date_field": "filing_date", "offset_days": 150, "repeat_offsets": [90, 120, 150, 170, 178]}'::jsonb,
  '[{"field": "matter.type", "operator": "in", "value": ["trademark", "patent", "design"]}]'::jsonb,
  '[{"order": 1, "type": "send_email", "config": {"template_code": "paris_priority_warning", "to": "{{matter.assigned_to.email}}"}}, {"order": 2, "type": "send_notification", "config": {"title": "🌍 Prioridad París", "message": "Quedan {{trigger.days_remaining}} días", "type": "critical"}}, {"order": 3, "type": "create_task", "config": {"title": "Decisión prioridad París", "description": "Consultar con cliente sobre extensión a otras jurisdicciones", "priority": "high", "due_date_offset_days": 3}}]'::jsonb,
  '[{"key": "priority_months", "label": "Meses de prioridad", "type": "select", "default_value": "6", "options": [{"value": "6", "label": "6 meses (marcas)"}, {"value": "12", "label": "12 meses (patentes)"}]}]'::jsonb,
  true, true, 4
),

-- ═══════════════════════════════════════════════════════════════
-- GESTIÓN DE CASOS — Cierre automático
-- ═══════════════════════════════════════════════════════════════

(
  'auto_close_completed_case',
  'Cierre automático de caso completado',
  'Auto-close completed case',
  'Cierra automáticamente expedientes completados, facturados y sin tareas pendientes.',
  'Automatically closes cases that are completed, invoiced and have no pending tasks.',
  'case_management', '✅', '#16A34A', 'optional', 'starter',
  'cron',
  '{"schedule": "0 22 * * 0", "timezone": "tenant", "description": "Domingos a las 22:00"}'::jsonb,
  '[{"field": "matter.current_phase", "operator": "equals", "value": "completed"}]'::jsonb,
  '[{"order": 1, "type": "update_field", "config": {"table": "matters", "field": "status", "value": "archived"}}, {"order": 2, "type": "send_notification", "config": {"title": "📦 Caso archivado", "message": "Archivado automáticamente", "type": "info"}}]'::jsonb,
  '[{"key": "days_before_auto_close", "label": "Días tras completar para archivar", "type": "number", "default_value": 30}]'::jsonb,
  true, true, 23
),

-- ═══════════════════════════════════════════════════════════════
-- COMUNICACIÓN — Confirmación de encargo
-- ═══════════════════════════════════════════════════════════════

(
  'new_case_confirmation',
  'Confirmación de nuevo encargo',
  'New case confirmation email',
  'Envía email de confirmación al cliente cuando se crea un nuevo expediente.',
  'Sends confirmation email to client when a new case is created.',
  'communication', '📨', '#2563EB', 'recommended', 'free',
  'db_event',
  '{"table": "matters", "event": "INSERT"}'::jsonb,
  '[{"field": "contact.email", "operator": "not_empty"}]'::jsonb,
  '[{"order": 1, "type": "send_email", "config": {"template_code": "case_confirmation", "to": "{{matter.contact.email}}"}}, {"order": 2, "type": "send_notification", "config": {"title": "Nuevo caso creado", "message": "{{matter.title}}", "type": "info"}}]'::jsonb,
  '[{"key": "include_timeline", "label": "Incluir timeline estimado", "type": "boolean", "default_value": true}]'::jsonb,
  true, true, 13
),

-- ═══════════════════════════════════════════════════════════════
-- GESTIÓN INTERNA — Alerta carga de trabajo
-- ═══════════════════════════════════════════════════════════════

(
  'workload_overload_alert',
  'Alerta sobrecarga de trabajo',
  'Workload overload alert',
  'Detecta cuando un miembro del equipo tiene más casos activos que el umbral.',
  'Detects when a team member has more active cases than the threshold.',
  'internal', '📈', '#EA580C', 'optional', 'professional',
  'cron',
  '{"schedule": "0 9 * * 1", "timezone": "tenant", "description": "Lunes a las 9AM"}'::jsonb,
  '[]'::jsonb,
  '[{"order": 1, "type": "send_notification", "config": {"title": "📈 Sobrecarga detectada", "message": "Revisar distribución de carga de trabajo", "type": "warning"}}]'::jsonb,
  '[{"key": "max_active_cases", "label": "Máximo casos activos por persona", "type": "number", "default_value": 25}]'::jsonb,
  true, true, 42
),

-- ═══════════════════════════════════════════════════════════════
-- REPORTING — Informe mensual
-- ═══════════════════════════════════════════════════════════════

(
  'monthly_activity_report',
  'Informe mensual de actividad',
  'Monthly activity report',
  'Genera y envía un informe completo de actividad mensual.',
  'Generates and sends a complete monthly activity report.',
  'reporting', '📅', '#0369A1', 'optional', 'professional',
  'cron',
  '{"schedule": "0 8 1 * *", "timezone": "tenant", "description": "Día 1 de cada mes a las 8AM"}'::jsonb,
  '[]'::jsonb,
  '[{"order": 1, "type": "send_email", "config": {"template_code": "monthly_report", "to": "{{organization.admin_email}}"}}]'::jsonb,
  '[{"key": "report_recipients", "label": "Destinatarios", "type": "string_array", "default_value": []}, {"key": "include_financial_details", "label": "Incluir desglose financiero", "type": "boolean", "default_value": true}]'::jsonb,
  true, true, 53
),

-- ═══════════════════════════════════════════════════════════════
-- REPORTING — Resumen de plazos
-- ═══════════════════════════════════════════════════════════════

(
  'deadline_digest_weekly',
  'Resumen semanal de plazos',
  'Weekly deadline digest',
  'Envía un resumen semanal con todos los plazos próximos a vencer.',
  'Sends a weekly digest with all upcoming deadlines.',
  'reporting', '📆', '#0891B2', 'recommended', 'starter',
  'cron',
  '{"schedule": "0 8 * * 1", "timezone": "tenant", "description": "Lunes a las 8AM"}'::jsonb,
  '[]'::jsonb,
  '[{"order": 1, "type": "send_email", "config": {"template_code": "deadline_digest", "to": "{{user.email}}"}}, {"order": 2, "type": "send_notification", "config": {"title": "📆 Resumen de plazos", "message": "Revisa los plazos de esta semana", "type": "info"}}]'::jsonb,
  '[{"key": "days_ahead", "label": "Días a futuro incluidos", "type": "number", "default_value": 14}]'::jsonb,
  true, true, 54
)

ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- PROVISIONAR nuevos templates a tenants existentes
-- ═══════════════════════════════════════════════════════════════

INSERT INTO tenant_automations (
  organization_id,
  master_template_id,
  name,
  description,
  category,
  icon,
  is_active,
  is_locked,
  trigger_type,
  trigger_config,
  conditions,
  actions,
  custom_params
)
SELECT 
  o.id,
  mt.id,
  mt.name,
  mt.description,
  mt.category,
  mt.icon,
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
  AND o.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_automations ta
    WHERE ta.organization_id = o.id
    AND ta.master_template_id = mt.id
  )
ON CONFLICT DO NOTHING;