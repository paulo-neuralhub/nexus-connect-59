-- Create private reports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reports', 'reports', false, 52428800, ARRAY['text/csv', 'application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

-- RLS: users can only read their own org's reports
CREATE POLICY "Tenant read own reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reports'
  AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
);

-- RLS: service role can insert (Edge Function uses service role)
CREATE POLICY "Service can insert reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reports');
