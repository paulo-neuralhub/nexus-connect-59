-- Seed lists and automations using the actual profile (role=member)
DO $$
DECLARE org RECORD;
DECLARE v_creator uuid;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    SELECT id INTO v_creator FROM profiles
    WHERE organization_id = org.id LIMIT 1;

    IF v_creator IS NOT NULL THEN
      INSERT INTO marketing_lists (organization_id, name, description, list_type, filter_criteria, created_by)
      VALUES
        (org.id, 'Clientes activos', 'Todos los clientes con opt-in de marketing activo', 'dynamic',
          '{"marketing_opt_in": true, "email_unsubscribed": false}', v_creator),
        (org.id, 'Renovaciones próximas (90 días)', 'Clientes con marcas que vencen en los próximos 90 días', 'dynamic',
          '{"has_renewal_in_days": 90, "marketing_opt_in": true}', v_creator),
        (org.id, 'Clientes sin portal activo', 'Clientes que no han activado el portal cliente', 'dynamic',
          '{"portal_enabled": false, "marketing_opt_in": true}', v_creator),
        (org.id, 'Clientes inactivos', 'Clientes sin contacto en los últimos 60 días', 'dynamic',
          '{"last_contact_days": 60, "marketing_opt_in": true}', v_creator)
      ON CONFLICT DO NOTHING;

      INSERT INTO marketing_automations (organization_id, name, description, automation_type, trigger_config, steps, is_active, created_by)
      VALUES
        (org.id, 'Recordatorio de Renovación de Marca', 'Avisa al cliente cuando su marca está próxima a vencer',
          'renewal_reminder', '{"days_before": [90, 60, 30, 7]}',
          '[{"step":1,"delay_days":0,"subject":"Tu marca {marca} vence en 90 días","conditions":{"days_before":90}},{"step":2,"delay_days":0,"subject":"⚠️ {marca} vence en 30 días","conditions":{"days_before":30}},{"step":3,"delay_days":0,"subject":"🚨 URGENTE: {marca} vence en 7 días","conditions":{"days_before":7}}]',
          false, v_creator),
        (org.id, 'Bienvenida nuevo cliente', 'Serie de emails de onboarding al añadir un nuevo cliente',
          'onboarding_sequence', '{"delays_days": [0, 3, 7]}',
          '[{"step":1,"delay_days":0,"subject":"Bienvenido a {despacho} 👋"},{"step":2,"delay_days":3,"subject":"¿Cómo va tu primer expediente?"},{"step":3,"delay_days":7,"subject":"Activa tu portal cliente gratuito"}]',
          false, v_creator),
        (org.id, '🎉 ¡Tu marca ha sido registrada!', 'Email de felicitación cuando un expediente pasa a registered',
          'matter_registered', '{"delay_hours": 1}',
          '[{"step":1,"delay_days":0,"subject":"🎉 ¡Enhorabuena! Tu marca {marca} ha sido registrada"}]',
          false, v_creator),
        (org.id, 'Recordatorio de Factura Vencida', 'Recordatorios automáticos para facturas impagadas',
          'invoice_overdue', '{"days_after": [1, 7, 15]}',
          '[{"step":1,"delay_days":1,"subject":"Recordatorio de pago — Factura {numero}"},{"step":2,"delay_days":7,"subject":"⚠️ Factura {numero} pendiente de pago"},{"step":3,"delay_days":15,"subject":"🚨 Último aviso — Factura {numero}"}]',
          false, v_creator)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;