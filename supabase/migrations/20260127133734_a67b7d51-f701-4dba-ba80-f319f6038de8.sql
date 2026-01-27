-- Limpieza con manejo de errores por tabla inexistente
DO $$
DECLARE
  demo_org RECORD;
  v_total INTEGER := 0;
  v_count INTEGER := 0;
BEGIN
  FOR demo_org IN SELECT id, name FROM organizations WHERE is_demo = TRUE
  LOOP
    RAISE NOTICE 'Cleaning: %', demo_org.name;
    
    -- activity_log
    BEGIN EXECUTE 'DELETE FROM activity_log WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- activities
    BEGIN EXECUTE 'DELETE FROM activities WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- ai_messages -> ai_conversations
    BEGIN EXECUTE 'DELETE FROM ai_messages WHERE conversation_id IN (SELECT id FROM ai_conversations WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM ai_conversations WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- deals, pipelines
    BEGIN EXECUTE 'DELETE FROM deals WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM pipeline_stages WHERE pipeline_id IN (SELECT id FROM pipelines WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM pipelines WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- communications
    BEGIN EXECUTE 'DELETE FROM communications WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- watch_results
    BEGIN EXECUTE 'DELETE FROM watch_results WHERE related_matter_id IN (SELECT id FROM matters WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- matter children
    BEGIN EXECUTE 'DELETE FROM matter_costs WHERE matter_id IN (SELECT id FROM matters WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM matter_fees WHERE matter_id IN (SELECT id FROM matters WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM matter_parties WHERE matter_id IN (SELECT id FROM matters WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM matter_documents WHERE matter_id IN (SELECT id FROM matters WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM matter_deadlines WHERE matter_id IN (SELECT id FROM matters WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM matter_events WHERE matter_id IN (SELECT id FROM matters WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- filing_applications
    BEGIN EXECUTE 'DELETE FROM filing_applications WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- billing
    BEGIN EXECUTE 'DELETE FROM payments WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM invoice_line_items WHERE invoice_id IN (SELECT id FROM invoices WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM invoices WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM quote_line_items WHERE quote_id IN (SELECT id FROM quotes WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM quotes WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM billing_clients WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- portals
    BEGIN EXECUTE 'DELETE FROM client_portal_users WHERE portal_id IN (SELECT id FROM client_portals WHERE organization_id = $1)' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    BEGIN EXECUTE 'DELETE FROM client_portals WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- matters
    BEGIN EXECUTE 'DELETE FROM matters WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
    -- contacts (al final)
    BEGIN EXECUTE 'DELETE FROM contacts WHERE organization_id = $1' USING demo_org.id; GET DIAGNOSTICS v_count = ROW_COUNT; v_total := v_total + v_count; EXCEPTION WHEN undefined_table THEN NULL; END;
    
  END LOOP;
  
  RAISE NOTICE '=== TOTAL DELETED: % ===', v_total;
END $$;