
-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('expense-receipts', 'expense-receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for expense-receipts bucket
CREATE POLICY "Users can upload receipts for their org"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'expense-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view receipts from their org"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete receipts from their org"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'expense-receipts'
  AND (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM profiles WHERE id = auth.uid()
  )
);
