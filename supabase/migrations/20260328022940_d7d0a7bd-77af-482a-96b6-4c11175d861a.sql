
-- Create spider-logos storage bucket (public for logo display)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'spider-logos',
  'spider-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: authenticated users can upload to their org folder
CREATE POLICY "Org members can upload spider logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'spider-logos'
  AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM public.profiles WHERE id = auth.uid())
);

-- RLS policy: anyone can read (public bucket)
CREATE POLICY "Public read spider logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'spider-logos');

-- RLS policy: org members can update/delete their logos
CREATE POLICY "Org members can manage spider logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'spider-logos'
  AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM public.profiles WHERE id = auth.uid())
);
