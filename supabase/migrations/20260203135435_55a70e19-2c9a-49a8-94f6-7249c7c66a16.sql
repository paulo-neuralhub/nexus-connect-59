-- Limpiar tablas que aún tienen datos de negocio (con manejo de errores)
DO $$
DECLARE
  tables_remaining TEXT[] := ARRAY[
    'deals', 'contacts', 'matters',
    'pipeline_stages', 'pipelines', 
    'crm_pipeline_stages', 'crm_pipelines',
    'contact_list_members', 'contact_lists',
    'matter_sequences'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables_remaining LOOP
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