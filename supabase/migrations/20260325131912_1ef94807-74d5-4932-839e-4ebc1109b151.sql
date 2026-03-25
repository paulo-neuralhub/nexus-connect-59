INSERT INTO incoming_messages (
  id, organization_id, channel, sender_name, sender_email, subject, body,
  ai_category, ai_urgency_score, ai_summary, ai_confidence, ai_proposed_action,
  status, account_id, created_at
) VALUES
('d0100001-0000-0000-0000-000000000001',
 '1187fb92-0b65-44ba-91cc-7955af6a08d0',
 'email', 'Kevin Park', 'kevin.park@quantumdevices.com',
 'URGENT: Office Action Response Required — TECHFLOW US',
 'Dear Team,

We have received an Office Action from the USPTO regarding our TECHFLOW trademark application (Serial No. 88/123,456). The examiner has cited likelihood of confusion with an existing registration.

The deadline to respond is June 20, 2026 (3 months from issuance). This is a non-final action but requires careful analysis of the cited marks.

Please review the attached Office Action and prepare a response strategy. We may need to amend the description of goods or submit arguments distinguishing our mark.

Best regards,
Kevin Park
IP Director, Quantum Devices Inc.',
 'urgent', 9,
 'Office Action de USPTO requiere respuesta antes del 20 jun 2026. Conflicto por likelihood of confusion con marca existente.',
 0.97, 'Crear tarea de respuesta OA y asignar a abogado especialista',
 'pending', 'a0100001-0000-0000-0000-000000000001',
 NOW() - INTERVAL '2 hours'),

('d0100002-0000-0000-0000-000000000002',
 '1187fb92-0b65-44ba-91cc-7955af6a08d0',
 'email', 'Petra Müller', 'petra.mueller@verdecosmetics.de',
 'Nueva solicitud: VERDE PURE — registro en clases 3 y 5',
 'Estimado equipo,

Quisiera iniciar el proceso de registro de nuestra nueva marca VERDE PURE en la Unión Europea. Necesitamos protección en:

- Clase 3: Cosméticos naturales, cremas, lociones
- Clase 5: Suplementos vitamínicos orgánicos

Adjunto el brief de la marca con el logotipo. Necesitamos que realicen una búsqueda de anterioridades antes de proceder.

Presupuesto aprobado: hasta 4500 EUR.

Saludos cordiales,
Petra Müller
Directora de Marketing, Verde Cosmetics GmbH',
 'instruction', 7,
 'Nueva instrucción de registro de marca VERDE PURE en EUIPO, clases 3 y 5. Presupuesto aprobado 4500 EUR.',
 0.94, 'Crear expediente nuevo y ejecutar búsqueda de anterioridades',
 'pending', 'a0100002-0000-0000-0000-000000000002',
 NOW() - INTERVAL '5 hours'),

('d0100003-0000-0000-0000-000000000003',
 '1187fb92-0b65-44ba-91cc-7955af6a08d0',
 'whatsapp', 'Alejandro Reyes', null,
 'Consulta renovación marca NÓMADE',
 'Hola, buenos días. Quería consultar sobre la renovación de nuestra marca NÓMADE STUDIO. Creo que vence el año próximo pero no estoy seguro de la fecha exacta. Podrían confirmarme? También quiero saber el costo de renovación en España y en la UE. Gracias!',
 'query', 4,
 'Consulta sobre fecha de vencimiento y costos de renovación de marca NÓMADE STUDIO en España y UE.',
 0.91, 'Verificar fecha de vencimiento en expediente y enviar presupuesto de renovación',
 'pending', 'a0100004-0000-0000-0000-000000000004',
 NOW() - INTERVAL '1 day'),

('d0100004-0000-0000-0000-000000000004',
 '1187fb92-0b65-44ba-91cc-7955af6a08d0',
 'email', 'James Wilson', 'j.wilson@techflow.io',
 'Updated Power of Attorney — TechFlow Solutions',
 'Hi team,

Please find attached the updated Power of Attorney document for TechFlow Solutions. This replaces the previous version dated January 2025.

The document has been notarized and apostilled as required. Please update your records accordingly.

Regards,
James Wilson
Legal Counsel, TechFlow Solutions',
 'admin', 3,
 'Poder notarial actualizado de TechFlow Solutions. Documento notarizado y apostillado.',
 0.88, 'Actualizar poder en el sistema y confirmar recepción',
 'pending', 'a0100001-0000-0000-0000-000000000001',
 NOW() - INTERVAL '2 days'),

('d0100005-0000-0000-0000-000000000005',
 '1187fb92-0b65-44ba-91cc-7955af6a08d0',
 'portal', 'Sofía Herrera', 'sofia@nomadestudio.co',
 'Estado de oposición marca TERRA NOVA',
 'Buenos días,

Quisiera saber en qué estado se encuentra la oposición que presentamos contra la marca TERRA NOVA en la EUIPO. Han pasado ya 6 semanas desde que la presentamos y no hemos recibido ninguna actualización.

Hay alguna fecha estimada para la resolución?

Muchas gracias,
Sofía Herrera
CEO, Nómade Studio',
 'query', 6,
 'Solicitud de actualización sobre oposición contra TERRA NOVA en EUIPO. Cliente espera respuesta hace 6 semanas.',
 0.92, 'Revisar estado del expediente de oposición y enviar actualización al cliente',
 'awaiting_approval', 'a0100004-0000-0000-0000-000000000004',
 NOW() - INTERVAL '3 days')

ON CONFLICT (id) DO NOTHING;
