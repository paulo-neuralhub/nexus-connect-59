-- Crear bucket de storage para invoices
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoices', 'invoices', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Política de lectura para invoices bucket
CREATE POLICY "Org members can read invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices'
  );

-- Política de escritura para invoices bucket
CREATE POLICY "Org members can upload invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices'
  );