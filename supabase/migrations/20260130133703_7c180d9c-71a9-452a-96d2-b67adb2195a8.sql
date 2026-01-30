-- Plantillas de comunicación profesionales
CREATE TABLE IF NOT EXISTS communication_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identificación
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Tipo y categoría
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'sms')),
  category TEXT NOT NULL CHECK (category IN ('bienvenida', 'seguimiento', 'plazos', 'facturacion', 'marketing', 'legal', 'notificaciones', 'recordatorios', 'confirmaciones')),
  
  -- Contenido
  subject TEXT,
  content_text TEXT NOT NULL,
  content_html TEXT,
  
  -- Configuración
  variables JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  thumbnail_url TEXT,
  tags TEXT[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_comm_templates_org ON communication_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_comm_templates_channel ON communication_templates(channel);
CREATE INDEX IF NOT EXISTS idx_comm_templates_category ON communication_templates(category);
CREATE INDEX IF NOT EXISTS idx_comm_templates_code ON communication_templates(code);

-- RLS
ALTER TABLE communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system and own templates" ON communication_templates
  FOR SELECT USING (
    is_system = TRUE OR 
    organization_id IN (SELECT unnest(get_user_organization_ids()))
  );

CREATE POLICY "Users can insert own templates" ON communication_templates
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT unnest(get_user_organization_ids()))
  );

CREATE POLICY "Users can update own templates" ON communication_templates
  FOR UPDATE USING (
    is_system = FALSE AND
    organization_id IN (SELECT unnest(get_user_organization_ids()))
  );

CREATE POLICY "Users can delete own templates" ON communication_templates
  FOR DELETE USING (
    is_system = FALSE AND
    organization_id IN (SELECT unnest(get_user_organization_ids()))
  );

-- Insertar plantillas del sistema profesionales (organization_id NULL para sistema)

-- ============ WHATSAPP TEMPLATES ============

INSERT INTO communication_templates (code, name, description, channel, category, content_text, variables, is_system, tags) VALUES
('wa_welcome_new_client', 'Bienvenida Nuevo Cliente', 'Mensaje de bienvenida para nuevos clientes', 'whatsapp', 'bienvenida',
'👋 ¡Hola {{client_name}}!

Bienvenido/a a *{{firm_name}}*. Es un placer tenerte como cliente.

📋 Tu expediente *{{matter_reference}}* ha sido creado y ya estamos trabajando en tu caso.

🔗 Accede a tu portal: {{portal_link}}

¿Tienes alguna pregunta? Estamos aquí para ayudarte.

Saludos cordiales,
{{agent_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "firm_name", "label": "Nombre del despacho", "required": true}, {"name": "matter_reference", "label": "Referencia del expediente", "required": true}, {"name": "portal_link", "label": "Enlace al portal", "required": false}, {"name": "agent_name", "label": "Nombre del agente", "required": true}]',
true, ARRAY['bienvenida', 'onboarding', 'nuevo-cliente']),

('wa_welcome_trademark', 'Bienvenida Marca', 'Bienvenida específica para registro de marcas', 'whatsapp', 'bienvenida',
'🎉 ¡Hola {{client_name}}!

Gracias por confiar en nosotros para el registro de tu marca *"{{trademark_name}}"*.

📝 *Próximos pasos:*
1️⃣ Búsqueda de anterioridades
2️⃣ Preparación de solicitud
3️⃣ Presentación en oficina

⏱️ Tiempo estimado: {{estimated_time}}

Te mantendremos informado/a en cada etapa.

{{agent_name}} | {{firm_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "trademark_name", "label": "Nombre de la marca", "required": true}, {"name": "estimated_time", "label": "Tiempo estimado", "required": true}, {"name": "agent_name", "label": "Nombre del agente", "required": true}, {"name": "firm_name", "label": "Nombre del despacho", "required": true}]',
true, ARRAY['bienvenida', 'marcas', 'trademark']),

('wa_status_update', 'Actualización de Estado', 'Notificación de cambio de estado del expediente', 'whatsapp', 'seguimiento',
'📢 *Actualización de tu expediente*

Hola {{client_name}},

Tu expediente *{{matter_reference}}* ha avanzado:

📌 *Estado anterior:* {{old_status}}
✅ *Nuevo estado:* {{new_status}}

📝 *Notas:* {{notes}}

¿Alguna duda? Contáctanos.

{{agent_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "matter_reference", "label": "Referencia", "required": true}, {"name": "old_status", "label": "Estado anterior", "required": true}, {"name": "new_status", "label": "Nuevo estado", "required": true}, {"name": "notes", "label": "Notas adicionales", "required": false}, {"name": "agent_name", "label": "Nombre del agente", "required": true}]',
true, ARRAY['seguimiento', 'estado', 'actualizacion']),

('wa_document_received', 'Documento Recibido', 'Confirmación de recepción de documentos', 'whatsapp', 'confirmaciones',
'✅ *Documento recibido*

Hola {{client_name}},

Hemos recibido correctamente:
📄 *{{document_name}}*

📋 *Documentos pendientes:*
{{pending_docs}}

Gracias,
{{agent_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "document_name", "label": "Nombre del documento", "required": true}, {"name": "pending_docs", "label": "Documentos pendientes", "required": false}, {"name": "agent_name", "label": "Nombre del agente", "required": true}]',
true, ARRAY['documentos', 'confirmacion', 'recepcion']),

('wa_deadline_reminder_7d', 'Recordatorio Plazo 7 días', 'Aviso de plazo próximo a vencer', 'whatsapp', 'plazos',
'⚠️ *Recordatorio de plazo*

Hola {{client_name}},

Te recordamos que tienes un plazo importante próximo:

📅 *Fecha límite:* {{deadline_date}}
📋 *Expediente:* {{matter_reference}}
📝 *Acción requerida:* {{action_required}}

⏰ Quedan *7 días* para completar esta acción.

💰 Pago requerido: {{amount}}

Contáctanos si necesitas ayuda.
{{agent_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "deadline_date", "label": "Fecha límite", "required": true}, {"name": "matter_reference", "label": "Referencia", "required": true}, {"name": "action_required", "label": "Acción requerida", "required": true}, {"name": "amount", "label": "Importe", "required": false}, {"name": "agent_name", "label": "Nombre del agente", "required": true}]',
true, ARRAY['plazos', 'recordatorio', 'urgente']),

('wa_deadline_urgent', 'Plazo Urgente', 'Aviso urgente de plazo inminente', 'whatsapp', 'plazos',
'🚨 *PLAZO URGENTE*

{{client_name}}, atención:

⏰ *VENCE EN {{days_remaining}} DÍAS*

📋 Expediente: {{matter_reference}}
📅 Fecha límite: {{deadline_date}}
📝 Acción: {{action_required}}

❗ Es crucial actuar de inmediato para evitar pérdida de derechos.

Llámanos: {{phone_number}}

{{agent_name}} | {{firm_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "days_remaining", "label": "Días restantes", "required": true}, {"name": "matter_reference", "label": "Referencia", "required": true}, {"name": "deadline_date", "label": "Fecha límite", "required": true}, {"name": "action_required", "label": "Acción requerida", "required": true}, {"name": "phone_number", "label": "Teléfono", "required": true}, {"name": "agent_name", "label": "Nombre del agente", "required": true}, {"name": "firm_name", "label": "Nombre del despacho", "required": true}]',
true, ARRAY['plazos', 'urgente', 'critico']),

('wa_invoice_sent', 'Factura Enviada', 'Notificación de envío de factura', 'whatsapp', 'facturacion',
'📄 *Nueva factura*

Hola {{client_name}},

Te hemos enviado la factura *{{invoice_number}}*:

💰 *Importe:* {{amount}}
📅 *Vencimiento:* {{due_date}}
📋 *Concepto:* {{concept}}

🔗 Ver factura: {{invoice_link}}

💳 *Formas de pago:*
• Transferencia bancaria
• Tarjeta de crédito
• Bizum

¿Alguna duda? Contáctanos.

{{firm_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "invoice_number", "label": "Número de factura", "required": true}, {"name": "amount", "label": "Importe", "required": true}, {"name": "due_date", "label": "Fecha de vencimiento", "required": true}, {"name": "concept", "label": "Concepto", "required": true}, {"name": "invoice_link", "label": "Enlace a factura", "required": false}, {"name": "firm_name", "label": "Nombre del despacho", "required": true}]',
true, ARRAY['facturacion', 'factura', 'pago']),

('wa_payment_received', 'Pago Recibido', 'Confirmación de pago recibido', 'whatsapp', 'facturacion',
'✅ *Pago confirmado*

Hola {{client_name}},

Hemos recibido tu pago:

💰 *Importe:* {{amount}}
📄 *Factura:* {{invoice_number}}
📅 *Fecha:* {{payment_date}}

¡Gracias por tu confianza!

{{firm_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "amount", "label": "Importe", "required": true}, {"name": "invoice_number", "label": "Número de factura", "required": true}, {"name": "payment_date", "label": "Fecha de pago", "required": true}, {"name": "firm_name", "label": "Nombre del despacho", "required": true}]',
true, ARRAY['facturacion', 'pago', 'confirmacion']),

('wa_payment_reminder', 'Recordatorio de Pago', 'Recordatorio amable de pago pendiente', 'whatsapp', 'facturacion',
'💳 *Recordatorio de pago*

Hola {{client_name}},

Te recordamos que la factura *{{invoice_number}}* está pendiente de pago:

💰 *Importe:* {{amount}}
📅 *Vencimiento:* {{due_date}}

⚠️ *Días de retraso:* {{days_overdue}}

🔗 Pagar ahora: {{payment_link}}

¿Necesitas un plan de pago? Contáctanos.

{{agent_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "invoice_number", "label": "Número de factura", "required": true}, {"name": "amount", "label": "Importe", "required": true}, {"name": "due_date", "label": "Fecha de vencimiento", "required": true}, {"name": "days_overdue", "label": "Días de retraso", "required": false}, {"name": "payment_link", "label": "Enlace de pago", "required": false}, {"name": "agent_name", "label": "Nombre del agente", "required": true}]',
true, ARRAY['facturacion', 'recordatorio', 'pago']),

('wa_trademark_granted', 'Marca Concedida', 'Notificación de concesión de marca', 'whatsapp', 'legal',
'🎊 *¡ENHORABUENA!*

{{client_name}}, tenemos excelentes noticias:

✅ *Tu marca ha sido CONCEDIDA*

🏷️ *Marca:* {{trademark_name}}
📋 *Nº Registro:* {{registration_number}}
🌍 *Territorio:* {{territory}}
📅 *Válida hasta:* {{expiry_date}}

🔒 Tu marca está ahora protegida legalmente.

📄 Te enviamos el certificado por email.

¡Felicidades!
{{agent_name}} | {{firm_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "trademark_name", "label": "Nombre de la marca", "required": true}, {"name": "registration_number", "label": "Número de registro", "required": true}, {"name": "territory", "label": "Territorio", "required": true}, {"name": "expiry_date", "label": "Fecha de vencimiento", "required": true}, {"name": "agent_name", "label": "Nombre del agente", "required": true}, {"name": "firm_name", "label": "Nombre del despacho", "required": true}]',
true, ARRAY['legal', 'marca', 'concesion', 'exito']),

('wa_opposition_alert', 'Alerta de Oposición', 'Notificación de oposición recibida', 'whatsapp', 'legal',
'⚠️ *Alerta: Oposición recibida*

{{client_name}}, información importante:

📋 *Expediente:* {{matter_reference}}
🏷️ *Marca:* {{trademark_name}}

❌ Se ha presentado una *oposición* contra tu marca.

📅 *Plazo de respuesta:* {{deadline_date}}
📝 *Oponente:* {{opponent_name}}

🔍 Necesitamos analizar el caso contigo.

📞 Te llamamos o llámanos: {{phone_number}}

{{agent_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "matter_reference", "label": "Referencia", "required": true}, {"name": "trademark_name", "label": "Nombre de la marca", "required": true}, {"name": "deadline_date", "label": "Fecha límite", "required": true}, {"name": "opponent_name", "label": "Nombre del oponente", "required": true}, {"name": "phone_number", "label": "Teléfono", "required": true}, {"name": "agent_name", "label": "Nombre del agente", "required": true}]',
true, ARRAY['legal', 'oposicion', 'alerta', 'urgente']),

('wa_meeting_confirmation', 'Confirmación de Reunión', 'Confirmación de cita programada', 'whatsapp', 'confirmaciones',
'📅 *Reunión confirmada*

Hola {{client_name}},

Tu reunión está programada:

📆 *Fecha:* {{meeting_date}}
⏰ *Hora:* {{meeting_time}}
📍 *Lugar:* {{meeting_location}}
👤 *Con:* {{agent_name}}

🔗 *Enlace videollamada:* {{meeting_link}}

📝 *Notas:* {{notes}}

¿Necesitas cambiar la cita? Avísanos con 24h de antelación.

{{firm_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "meeting_date", "label": "Fecha de la reunión", "required": true}, {"name": "meeting_time", "label": "Hora", "required": true}, {"name": "meeting_location", "label": "Lugar", "required": true}, {"name": "agent_name", "label": "Nombre del agente", "required": true}, {"name": "meeting_link", "label": "Enlace de videollamada", "required": false}, {"name": "notes", "label": "Notas", "required": false}, {"name": "firm_name", "label": "Nombre del despacho", "required": true}]',
true, ARRAY['reunion', 'cita', 'confirmacion']),

('wa_meeting_reminder', 'Recordatorio de Reunión', 'Recordatorio de cita próxima', 'whatsapp', 'recordatorios',
'⏰ *Recordatorio: Reunión mañana*

Hola {{client_name}},

Te recordamos tu reunión:

📆 *Mañana, {{meeting_date}}*
⏰ *Hora:* {{meeting_time}}
📍 *Lugar:* {{meeting_location}}

📄 *Por favor, trae:*
{{documents_needed}}

¿No puedes asistir? Avísanos lo antes posible.

{{agent_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "meeting_date", "label": "Fecha de la reunión", "required": true}, {"name": "meeting_time", "label": "Hora", "required": true}, {"name": "meeting_location", "label": "Lugar", "required": true}, {"name": "documents_needed", "label": "Documentos necesarios", "required": false}, {"name": "agent_name", "label": "Nombre del agente", "required": true}]',
true, ARRAY['reunion', 'recordatorio', 'cita']),

('wa_renewal_reminder', 'Recordatorio de Renovación', 'Aviso de renovación próxima', 'whatsapp', 'recordatorios',
'🔄 *Renovación próxima*

Hola {{client_name}},

Tu {{ip_type}} requiere renovación:

🏷️ *{{ip_name}}*
📋 *Nº:* {{registration_number}}
📅 *Vence:* {{expiry_date}}

⏰ *Quedan {{days_remaining}} días*

💰 *Coste renovación:* {{renewal_cost}}

¿Procedemos con la renovación?
Responde "SÍ" para confirmar.

{{agent_name}} | {{firm_name}}',
'[{"name": "client_name", "label": "Nombre del cliente", "required": true}, {"name": "ip_type", "label": "Tipo de PI", "required": true}, {"name": "ip_name", "label": "Nombre", "required": true}, {"name": "registration_number", "label": "Número de registro", "required": true}, {"name": "expiry_date", "label": "Fecha de vencimiento", "required": true}, {"name": "days_remaining", "label": "Días restantes", "required": true}, {"name": "renewal_cost", "label": "Coste de renovación", "required": true}, {"name": "agent_name", "label": "Nombre del agente", "required": true}, {"name": "firm_name", "label": "Nombre del despacho", "required": true}]',
true, ARRAY['renovacion', 'recordatorio', 'vencimiento']);