
-- =============================================
-- Fase 4: Storage bucket + signed URL support
-- =============================================

-- 1. Create private storage bucket for telephony recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'telephony-recordings',
  'telephony-recordings',
  false,
  52428800, -- 50MB max
  ARRAY['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS: Only org members can read their recordings
CREATE POLICY "Org members can read their telephony recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'telephony-recordings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.organizations
    WHERE id = public.get_user_org_id()
  )
);

-- 3. RLS: Service role / edge functions insert recordings (via service key)
-- Edge functions use service_role key so no INSERT policy needed for users

-- 4. Fix critical security issue: communication_messages tautological RLS
-- Drop the broken policy and create correct one
DO $$
BEGIN
  -- Try to drop existing broken policies
  BEGIN
    DROP POLICY IF EXISTS "org_member_select" ON public.communication_messages;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "org_member_insert" ON public.communication_messages;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Users can view org communication messages" ON public.communication_messages;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
  BEGIN
    DROP POLICY IF EXISTS "Users can insert org communication messages" ON public.communication_messages;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- Check if table exists before creating policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'communication_messages') THEN
    EXECUTE 'CREATE POLICY "cm_org_select" ON public.communication_messages FOR SELECT TO authenticated USING (organization_id = public.get_user_org_id())';
    EXECUTE 'CREATE POLICY "cm_org_insert" ON public.communication_messages FOR INSERT TO authenticated WITH CHECK (organization_id = public.get_user_org_id())';
    EXECUTE 'CREATE POLICY "cm_org_update" ON public.communication_messages FOR UPDATE TO authenticated USING (organization_id = public.get_user_org_id())';
    EXECUTE 'CREATE POLICY "cm_org_delete" ON public.communication_messages FOR DELETE TO authenticated USING (organization_id = public.get_user_org_id())';
  END IF;
END $$;
