
-- =====================================================================
-- SEED: 15 automatizaciones prioritarias para Fase 1
-- =====================================================================

INSERT INTO automation_master_templates (
  code, name, name_en, description, description_en,
  category, icon, color, visibility, min_plan_tier,
  trigger_type, trigger_config, conditions, actions,
  configurable_params, is_published, sort_order
) VALUES

-- PLAZOS Y VENCIMIENTOS

(
  'trademark_renewal_reminder',
  'Aviso renovación de marca',
  'Trademark renewal reminder',
  'Envía avisos automáticos cuando se acerca la fecha de vencimiento de una marca registrada.',
  'Sends automatic reminders when a registered trademark approaches its expiry date.',
  'deadlines', '🔔', '#EF4444', 'recommended', 'free',
  'date_relative',
  '{"table": "matters", "date_field": "expiry_date", "offset_days": -180, "repeat_offsets": [-180, -90, -30, -7], "filter": {"type": "trademark", "status": "registered"}}',
  '[{"field": "matter.status", "operator": "equals", "value": "registered"}, {"field": "contact.email", "operator": "not_empty"}]',
  '[{"order": 1, "type": "send_email", "config": {"template_code": "renewal_reminder", "to": "{{matter.contact.email}}"}}, {"order": 2, "type": "create_notification", "config": {"title": "Renovación: {{matter.title}}", "priority": "high", "recipient": "{{matter.assigned_to.id}}"}}, {"order": 3, "type": "create_task", "config": {"title": "Preparar renovación: {{matter.title}}", "due_date_offset_days": 7, "assignee": "{{matter.assigned_to.id}}"}}]',
  '[{"key": "days_before_expiry", "label": "Días de antelación", "type": "number_array", "default_value": [180, 90, 30, 7]}, {"key": "send_copy_to_responsible", "label": "Copia al responsable", "type": "boolean", "default_value": true}, {"key": "auto_create_renewal_task", "label": "Crear tarea automáticamente", "type": "boolean", "default_value": true}]',
  true, 1
),

(
  'office_response_deadline',
  'Plazo respuesta a oficina',
  'Office response deadline',
  'Alerta cuando se acerca el plazo para responder a un requerimiento de una oficina de PI.',
  'Alert when an IP office response deadline approaches.',
  'deadlines', '⏰', '#F59E0B', 'mandatory', 'free',
  'date_relative',
  '{"table": "matter_deadlines", "date_field": "due_date", "offset_days": -30, "repeat_offsets": [-30, -14, -7, -3, -1], "filter": {"deadline_type": "official", "status": "pending"}}',
  '[{"field": "deadline.status", "operator": "equals", "value": "pending"}]',
  '[{"order": 1, "type": "send_email", "config": {"template_code": "office_deadline_warning", "to": "{{matter.assigned_to.email}}"}}, {"order": 2, "type": "create_notification", "config": {"title": "⚠️ Plazo oficina: {{deadline.title}}", "priority": "critical", "recipient": "{{matter.assigned_to.id}}"}}]',
  '[{"key": "days_before_deadline", "label": "Días de antelación", "type": "number_array", "default_value": [30, 14, 7, 3, 1]}, {"key": "escalate_to_supervisor_days", "label": "Escalar al supervisor X días antes", "type": "number", "default_value": 3}]',
  true, 2
),

(
  'patent_annual_fees',
  'Tasas anuales de patente',
  'Patent annual fees',
  'Avisa de las tasas anuales de mantenimiento de patentes antes de su vencimiento.',
  'Reminds of patent annual maintenance fees before due date.',
  'deadlines', '💰', '#8B5CF6', 'recommended', 'starter',
  'date_relative',
  '{"table": "matter_deadlines", "date_field": "due_date", "offset_days": -90, "repeat_offsets": [-90, -60, -30, -14], "filter": {"deadline_type": "recurring", "status": "pending"}}',
  '[{"field": "matter.type", "operator": "equals", "value": "patent"}, {"field": "deadline.status", "operator": "equals", "value": "pending"}]',
  '[{"order": 1, "type": "send_email", "config": {"template_code": "patent_fee_reminder", "to": "{{matter.contact.email}}"}}, {"order": 2, "type": "create_notification", "config": {"title": "Tasa anual: {{matter.title}}", "recipient": "{{matter.assigned_to.id}}"}}, {"order": 3, "type": "create_task", "config": {"title": "Gestionar tasa anual: {{matter.title}}", "assignee": "{{matter.assigned_to.id}}"}}]',
  '[{"key": "days_before_fee", "label": "Días de antelación", "type": "number_array", "default_value": [90, 60, 30, 14]}, {"key": "auto_generate_invoice", "label": "Generar factura automáticamente", "type": "boolean", "default_value": false}]',
  true, 3
),

-- COMUNICACIÓN AUTOMÁTICA

(
  'client_welcome_email',
  'Email de bienvenida',
  'Client welcome email',
  'Envía un email de bienvenida automático cuando se crea un nuevo cliente.',
  'Sends an automatic welcome email when a new client is created.',
  'communication', '👋', '#10B981', 'recommended', 'free',
  'db_event',
  '{"table": "contacts", "event": "INSERT", "filter": {"contact_type": "client"}}',
  '[{"field": "contact.email", "operator": "not_empty"}]',
  '[{"order": 1, "type": "send_email", "config": {"template_code": "client_welcome", "to": "{{contact.email}}", "variables": {"client_name": "{{contact.name}}", "firm_name": "{{organization.name}}"}}}]',
  '[{"key": "welcome_email_template", "label": "Texto de bienvenida", "type": "textarea", "default_value": "Estimado/a {{client_name}}, bienvenido/a a {{firm_name}}. Es un placer contar con su confianza."}]',
  true, 10
),

(
  'case_status_update',
  'Notificación cambio de estado',
  'Case status update notification',
  'Informa al cliente automáticamente cuando su expediente cambia de estado.',
  'Automatically notifies client when their case changes status.',
  'communication', '📧', '#3B82F6', 'recommended', 'free',
  'field_change',
  '{"table": "matters", "field": "current_phase", "from": null, "to": null}',
  '[{"field": "contact.email", "operator": "not_empty"}]',
  '[{"order": 1, "type": "send_email", "config": {"template_code": "case_status_update", "to": "{{matter.contact.email}}", "variables": {"client_name": "{{matter.contact.name}}", "case_title": "{{matter.title}}", "new_status": "{{matter.current_phase}}"}}}]',
  '[{"key": "notify_on_all_phases", "label": "Notificar en TODOS los cambios de fase", "type": "boolean", "default_value": true}, {"key": "exclude_phases", "label": "Fases a excluir de notificación", "type": "string_array", "default_value": []}]',
  true, 11
),

(
  'payment_reminder',
  'Recordatorio de pago',
  'Payment reminder',
  'Envía recordatorios automáticos para facturas pendientes de pago.',
  'Sends automatic reminders for unpaid invoices.',
  'communication', '💳', '#F97316', 'optional', 'starter',
  'cron',
  '{"schedule": "0 9 * * 1", "timezone": "tenant"}',
  '[{"field": "invoice.status", "operator": "equals", "value": "unpaid"}, {"field": "invoice.days_overdue", "operator": "greater_than", "value_param": "days_overdue_threshold"}]',
  '[{"order": 1, "type": "send_email", "config": {"template_code": "payment_reminder", "to": "{{invoice.contact.email}}"}}]',
  '[{"key": "days_overdue_threshold", "label": "Días después del vencimiento", "type": "number", "default_value": 15, "validation": {"min": 1, "max": 90}}, {"key": "max_reminders", "label": "Máximo de recordatorios", "type": "number", "default_value": 3}]',
  true, 12
),

-- GESTIÓN DE CASOS

(
  'case_auto_assignment',
  'Asignación automática de casos',
  'Automatic case assignment',
  'Asigna automáticamente nuevos expedientes al responsable según tipo y jurisdicción.',
  'Automatically assigns new cases based on type and jurisdiction.',
  'case_management', '👤', '#6366F1', 'optional', 'professional',
  'db_event',
  '{"table": "matters", "event": "INSERT"}',
  '[]',
  '[{"order": 1, "type": "calculate", "config": {"operation": "find_best_assignee", "criteria": ["type", "jurisdiction", "workload"]}}, {"order": 2, "type": "update_field", "config": {"table": "matters", "field": "assigned_to", "value": "{{calculated.assignee_id}}"}}]',
  '[{"key": "assignment_rules", "label": "Reglas de asignación", "type": "textarea", "default_value": "round_robin"}]',
  true, 20
),

(
  'inactive_case_alert',
  'Alerta caso inactivo',
  'Inactive case alert',
  'Detecta expedientes sin actividad durante X días y notifica al responsable.',
  'Detects cases with no activity for X days and notifies the responsible person.',
  'case_management', '😴', '#EAB308', 'recommended', 'free',
  'cron',
  '{"schedule": "0 9 * * 1-5", "timezone": "tenant"}',
  '[{"field": "matter.status", "operator": "not_in", "value": ["closed", "archived"]}, {"field": "matter.days_since_activity", "operator": "greater_than", "value_param": "inactive_days_threshold"}]',
  '[{"order": 1, "type": "create_notification", "config": {"title": "⚠️ Caso inactivo: {{matter.title}}", "priority": "medium", "recipient": "{{matter.assigned_to.id}}"}}]',
  '[{"key": "inactive_days_threshold", "label": "Días sin actividad para alertar", "type": "number", "default_value": 14}, {"key": "escalate_after_days", "label": "Días para escalar al supervisor", "type": "number", "default_value": 30}]',
  true, 21
),

(
  'auto_priority_escalation',
  'Escalado automático de prioridad',
  'Automatic priority escalation',
  'Cambia automáticamente la prioridad a urgente cuando el plazo más próximo es menor a X días.',
  'Automatically escalates priority to urgent when closest deadline is less than X days.',
  'case_management', '🔥', '#DC2626', 'mandatory', 'free',
  'cron',
  '{"schedule": "0 7 * * *", "timezone": "tenant"}',
  '[{"field": "matter.status", "operator": "not_in", "value": ["closed", "archived"]}, {"field": "matter.priority", "operator": "not_equals", "value": "urgent"}]',
  '[{"order": 1, "type": "update_field", "config": {"table": "matters", "field": "priority", "value": "urgent"}}, {"order": 2, "type": "create_notification", "config": {"title": "🔥 Prioridad urgente: {{matter.title}}", "priority": "critical", "recipient": "{{matter.assigned_to.id}}"}}]',
  '[{"key": "urgent_threshold_days", "label": "Días para marcar como urgente", "type": "number", "default_value": 7}]',
  true, 22
),

-- FACTURACIÓN

(
  'auto_invoice_on_service',
  'Factura automática al completar servicio',
  'Auto-invoice on service completion',
  'Genera automáticamente una factura borrador cuando un servicio llega a fase de cierre.',
  'Automatically generates a draft invoice when a service reaches closing phase.',
  'billing', '🧾', '#059669', 'optional', 'professional',
  'field_change',
  '{"table": "matters", "field": "current_phase", "to": "completed"}',
  '[{"field": "matter.has_pending_invoice", "operator": "is_false"}]',
  '[{"order": 1, "type": "create_record", "config": {"table": "invoices", "data": {"matter_id": "{{matter.id}}", "contact_id": "{{matter.contact_id}}", "status": "draft"}}}, {"order": 2, "type": "create_notification", "config": {"title": "Factura borrador: {{matter.title}}", "recipient": "{{matter.assigned_to.id}}"}}]',
  '[{"key": "auto_send_to_client", "label": "Enviar factura al cliente automáticamente", "type": "boolean", "default_value": false}, {"key": "include_disbursements", "label": "Incluir gastos/tasas oficiales", "type": "boolean", "default_value": true}]',
  true, 30
),

(
  'overdue_payment_escalation',
  'Escalado por impago',
  'Overdue payment escalation',
  'Gestiona automáticamente el ciclo de cobro: recordatorio → segundo aviso → pausa.',
  'Automatically manages the collection cycle: reminder → second notice → pause.',
  'billing', '⚠️', '#B91C1C', 'optional', 'professional',
  'cron',
  '{"schedule": "0 10 * * 1-5", "timezone": "tenant"}',
  '[{"field": "invoice.status", "operator": "equals", "value": "overdue"}]',
  '[{"order": 1, "type": "condition", "config": {"if": {"field": "invoice.days_overdue", "operator": "between", "value": [30, 59]}, "then": [{"type": "send_email", "config": {"template_code": "payment_second_notice"}}]}}]',
  '[{"key": "second_notice_days", "label": "Días para segundo aviso", "type": "number", "default_value": 30}, {"key": "pause_services_days", "label": "Días para pausar servicios", "type": "number", "default_value": 60}]',
  true, 31
),

-- GESTIÓN INTERNA

(
  'task_assigned_notification',
  'Notificación tarea asignada',
  'Task assigned notification',
  'Notifica automáticamente cuando se asigna una tarea a un miembro del equipo.',
  'Automatically notifies when a task is assigned to a team member.',
  'internal', '📋', '#8B5CF6', 'mandatory', 'free',
  'db_event',
  '{"table": "tasks", "event": "INSERT"}',
  '[{"field": "task.assignee_id", "operator": "not_empty"}]',
  '[{"order": 1, "type": "create_notification", "config": {"title": "Nueva tarea: {{task.title}}", "body": "Asignada por {{task.created_by.name}}", "priority": "normal", "recipient": "{{task.assignee_id}}"}}]',
  '[{"key": "email_on_task_assignment", "label": "Enviar email además de notificación", "type": "boolean", "default_value": false}]',
  true, 40
),

(
  'task_chain_activation',
  'Cadena de tareas automática',
  'Automatic task chain',
  'Cuando se completa una tarea, activa automáticamente la siguiente en la secuencia.',
  'When a task is completed, automatically activates the next task in the sequence.',
  'internal', '⛓️', '#6366F1', 'recommended', 'starter',
  'field_change',
  '{"table": "tasks", "field": "status", "to": "completed"}',
  '[{"field": "task.next_task_id", "operator": "not_empty"}]',
  '[{"order": 1, "type": "update_field", "config": {"table": "tasks", "id": "{{task.next_task_id}}", "field": "status", "value": "active"}}]',
  '[]',
  true, 41
),

-- REPORTING

(
  'weekly_summary_report',
  'Resumen semanal',
  'Weekly summary report',
  'Genera y envía un resumen semanal de actividad a los responsables del despacho.',
  'Generates and sends a weekly activity summary to firm managers.',
  'reporting', '📊', '#0EA5E9', 'optional', 'professional',
  'cron',
  '{"schedule": "0 8 * * 1", "timezone": "tenant"}',
  '[]',
  '[{"order": 1, "type": "calculate", "config": {"operation": "generate_weekly_summary", "period": "last_7_days"}}, {"order": 2, "type": "send_email", "config": {"template_code": "weekly_summary", "to_param": "summary_recipients"}}]',
  '[{"key": "summary_recipients", "label": "Destinatarios del resumen", "type": "string_array", "default_value": []}, {"key": "include_financials", "label": "Incluir datos financieros", "type": "boolean", "default_value": true}, {"key": "include_deadlines", "label": "Incluir próximos vencimientos", "type": "boolean", "default_value": true}]',
  true, 50
)

ON CONFLICT (code) DO NOTHING;
