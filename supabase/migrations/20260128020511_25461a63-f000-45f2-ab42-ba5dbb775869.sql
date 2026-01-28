
-- =====================================================
-- CORRECCIÓN: Actualizar funciones CRM para usar columnas correctas
-- crm_deals usa 'name' y 'amount' (no 'title' y 'estimated_value')
-- =====================================================

-- 1. Corregir get_crm_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_crm_dashboard_stats(p_organization_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'leads', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM crm_leads WHERE organization_id = p_organization_id AND status != 'converted'),
      'new', (SELECT COUNT(*) FROM crm_leads WHERE organization_id = p_organization_id AND status = 'new'),
      'contacted', (SELECT COUNT(*) FROM crm_leads WHERE organization_id = p_organization_id AND status = 'contacted'),
      'standby', (SELECT COUNT(*) FROM crm_leads WHERE organization_id = p_organization_id AND status = 'standby'),
      'converted_this_month', (SELECT COUNT(*) FROM crm_leads WHERE organization_id = p_organization_id AND status = 'converted' AND converted_at >= DATE_TRUNC('month', CURRENT_DATE))
    ),
    'deals', jsonb_build_object(
      'total_open', (SELECT COUNT(*) FROM crm_deals WHERE organization_id = p_organization_id AND stage NOT IN ('won', 'lost')),
      'total_value', (SELECT COALESCE(SUM(amount), 0) FROM crm_deals WHERE organization_id = p_organization_id AND stage NOT IN ('won', 'lost')),
      'by_stage', (
        SELECT COALESCE(jsonb_object_agg(stage, cnt), '{}'::jsonb)
        FROM (
          SELECT stage, COUNT(*) as cnt
          FROM crm_deals
          WHERE organization_id = p_organization_id AND stage NOT IN ('won', 'lost')
          GROUP BY stage
        ) s
      ),
      'won_this_month', (SELECT COUNT(*) FROM crm_deals WHERE organization_id = p_organization_id AND stage = 'won' AND won_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'won_value_this_month', (SELECT COALESCE(SUM(won_value), 0) FROM crm_deals WHERE organization_id = p_organization_id AND stage = 'won' AND won_at >= DATE_TRUNC('month', CURRENT_DATE)),
      'lost_this_month', (SELECT COUNT(*) FROM crm_deals WHERE organization_id = p_organization_id AND stage = 'lost' AND lost_at >= DATE_TRUNC('month', CURRENT_DATE))
    ),
    'clients', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM clients WHERE organization_id = p_organization_id AND status = 'active'),
      'new_this_month', (SELECT COUNT(*) FROM clients WHERE organization_id = p_organization_id AND created_at >= DATE_TRUNC('month', CURRENT_DATE))
    ),
    'activities', jsonb_build_object(
      'today', (SELECT COUNT(*) FROM crm_activities WHERE organization_id = p_organization_id AND created_at >= CURRENT_DATE),
      'this_week', (SELECT COUNT(*) FROM crm_activities WHERE organization_id = p_organization_id AND created_at >= DATE_TRUNC('week', CURRENT_DATE))
    )
  );
END;
$$;

-- 2. Corregir approve_lead para usar 'name' en lugar de 'title'
CREATE OR REPLACE FUNCTION public.approve_lead(
  p_lead_id UUID,
  p_deal_title TEXT DEFAULT NULL,
  p_deal_value NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lead RECORD;
  v_client_id UUID;
  v_client_number TEXT;
  v_deal_id UUID;
  v_deal_number TEXT;
  v_org_id UUID;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead FROM crm_leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead no encontrado');
  END IF;
  
  IF v_lead.status = 'converted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lead ya convertido');
  END IF;
  
  v_org_id := v_lead.organization_id;
  
  -- Generate client number
  v_client_number := generate_client_number(v_org_id);
  
  -- Create client
  INSERT INTO clients (
    organization_id, client_number, name, legal_name, client_type,
    tax_id, email, phone, status, source, tags
  ) VALUES (
    v_org_id, v_client_number, 
    COALESCE(v_lead.company_name, v_lead.contact_name),
    v_lead.company_name,
    'direct',
    v_lead.company_tax_id,
    v_lead.contact_email,
    v_lead.contact_phone,
    'active',
    v_lead.source,
    v_lead.tags
  )
  RETURNING id INTO v_client_id;
  
  -- Create primary contact
  INSERT INTO client_contacts (
    organization_id, client_id, first_name, last_name, 
    email, phone, is_primary
  ) VALUES (
    v_org_id, v_client_id,
    SPLIT_PART(v_lead.contact_name, ' ', 1),
    SUBSTRING(v_lead.contact_name FROM POSITION(' ' IN v_lead.contact_name) + 1),
    v_lead.contact_email,
    v_lead.contact_phone,
    true
  );
  
  -- Generate deal number
  SELECT 'DEAL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((COALESCE(MAX(SUBSTRING(deal_number FROM 11)::INT), 0) + 1)::TEXT, 4, '0')
  INTO v_deal_number
  FROM crm_deals 
  WHERE organization_id = v_org_id AND deal_number LIKE 'DEAL-' || TO_CHAR(NOW(), 'YYYY') || '-%';
  
  IF v_deal_number IS NULL THEN
    v_deal_number := 'DEAL-' || TO_CHAR(NOW(), 'YYYY') || '-0001';
  END IF;
  
  -- Create deal (usando 'name' y 'amount')
  INSERT INTO crm_deals (
    organization_id, client_id, lead_id, deal_number, name,
    stage, amount, probability, next_action
  ) VALUES (
    v_org_id, v_client_id, p_lead_id, v_deal_number,
    COALESCE(p_deal_title, 'Nuevo deal - ' || COALESCE(v_lead.company_name, v_lead.contact_name)),
    'contacted', 
    COALESCE(p_deal_value, v_lead.estimated_value),
    20,
    'Contacto inicial'
  )
  RETURNING id INTO v_deal_id;
  
  -- Update lead
  UPDATE crm_leads SET
    status = 'converted',
    converted_to_client_id = v_client_id,
    converted_to_deal_id = v_deal_id,
    converted_at = NOW()
  WHERE id = p_lead_id;
  
  -- Log activity
  INSERT INTO crm_activities (organization_id, lead_id, client_id, deal_id, activity_type, subject, description)
  VALUES (v_org_id, p_lead_id, v_client_id, v_deal_id, 'conversion', 'Lead convertido', 
          'Lead convertido a cliente ' || v_client_number || ' y deal ' || v_deal_number);
  
  RETURN jsonb_build_object(
    'success', true,
    'client_id', v_client_id,
    'client_number', v_client_number,
    'deal_id', v_deal_id,
    'deal_number', v_deal_number
  );
END;
$$;

-- 3. Corregir win_deal para usar 'amount'
CREATE OR REPLACE FUNCTION public.win_deal(
  p_deal_id UUID,
  p_won_value NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deal RECORD;
  v_final_value NUMERIC;
BEGIN
  SELECT * INTO v_deal FROM crm_deals WHERE id = p_deal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal no encontrado');
  END IF;
  
  IF v_deal.stage = 'won' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal ya está ganado');
  END IF;
  
  v_final_value := COALESCE(p_won_value, v_deal.amount, 0);
  
  UPDATE crm_deals SET
    stage = 'won',
    probability = 100,
    won_at = NOW(),
    won_value = v_final_value
  WHERE id = p_deal_id;
  
  -- Log activity
  INSERT INTO crm_activities (organization_id, deal_id, client_id, activity_type, subject, description)
  VALUES (v_deal.organization_id, p_deal_id, v_deal.client_id, 'deal_won', 
          '🎉 Deal ganado', COALESCE(p_notes, 'Valor: ' || v_final_value::TEXT || ' €'));
  
  RETURN jsonb_build_object('success', true, 'won_value', v_final_value);
END;
$$;
