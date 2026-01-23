-- Fix: Postgres doesn't support CREATE POLICY IF NOT EXISTS

-- 1) Bucket for communication attachments
insert into storage.buckets (id, name, public)
values ('comm_attachments', 'comm_attachments', false)
on conflict (id) do nothing;

-- 2) Table to link attachments to communications
create table if not exists public.communication_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  communication_id uuid not null,
  bucket_id text not null default 'comm_attachments',
  object_path text not null,
  file_name text,
  mime_type text,
  file_size_bytes bigint,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_comm_attachments_org on public.communication_attachments (organization_id, created_at desc);
create index if not exists idx_comm_attachments_comm on public.communication_attachments (communication_id, created_at desc);

alter table public.communication_attachments enable row level security;

-- 3) RLS policies (public.communication_attachments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'communication_attachments' AND policyname = 'attachments_select_own_org'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "attachments_select_own_org"
      ON public.communication_attachments
      FOR SELECT
      USING (
        organization_id IN (
          SELECT m.organization_id
          FROM public.memberships m
          WHERE m.user_id = auth.uid()
        )
      )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'communication_attachments' AND policyname = 'attachments_insert_own_org'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "attachments_insert_own_org"
      ON public.communication_attachments
      FOR INSERT
      WITH CHECK (
        organization_id IN (
          SELECT m.organization_id
          FROM public.memberships m
          WHERE m.user_id = auth.uid()
        )
      )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'communication_attachments' AND policyname = 'attachments_delete_own_org'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "attachments_delete_own_org"
      ON public.communication_attachments
      FOR DELETE
      USING (
        organization_id IN (
          SELECT m.organization_id
          FROM public.memberships m
          WHERE m.user_id = auth.uid()
        )
      )
    $p$;
  END IF;
END$$;

-- 4) Storage policies (storage.objects)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'comm_attachments_read_own_org'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "comm_attachments_read_own_org"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'comm_attachments'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] IN (
          SELECT m.organization_id::text
          FROM public.memberships m
          WHERE m.user_id = auth.uid()
        )
      )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'comm_attachments_insert_own_org'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "comm_attachments_insert_own_org"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'comm_attachments'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] IN (
          SELECT m.organization_id::text
          FROM public.memberships m
          WHERE m.user_id = auth.uid()
        )
      )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'comm_attachments_update_own_org'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "comm_attachments_update_own_org"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'comm_attachments'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] IN (
          SELECT m.organization_id::text
          FROM public.memberships m
          WHERE m.user_id = auth.uid()
        )
      )
      WITH CHECK (
        bucket_id = 'comm_attachments'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] IN (
          SELECT m.organization_id::text
          FROM public.memberships m
          WHERE m.user_id = auth.uid()
        )
      )
    $p$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'comm_attachments_delete_own_org'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "comm_attachments_delete_own_org"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'comm_attachments'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] IN (
          SELECT m.organization_id::text
          FROM public.memberships m
          WHERE m.user_id = auth.uid()
        )
      )
    $p$;
  END IF;
END$$;