-- Crear bucket imports si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imports',
  'imports', 
  false,
  52428800,
  ARRAY['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Política de upload
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'imports_upload_policy' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "imports_upload_policy"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'imports');
  END IF;
END $$;

-- Política de lectura
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'imports_read_policy' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "imports_read_policy"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'imports');
  END IF;
END $$;

-- Columnas extra en import_review_queue
ALTER TABLE import_review_queue 
ADD COLUMN IF NOT EXISTS import_job_id uuid REFERENCES import_jobs(id),
ADD COLUMN IF NOT EXISTS proposed_data jsonb,
ADD COLUMN IF NOT EXISTS conflict_type text DEFAULT 'duplicate';