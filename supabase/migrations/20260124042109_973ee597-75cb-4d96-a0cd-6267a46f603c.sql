-- Expand allowed values for matters.status and matters.type to support demo lifecycle coverage

DO $$
BEGIN
  -- Drop existing CHECK constraints if they exist
  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'matters'
      AND c.conname = 'matters_status_check'
  ) THEN
    EXECUTE 'ALTER TABLE public.matters DROP CONSTRAINT matters_status_check';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'matters'
      AND c.conname = 'matters_type_check'
  ) THEN
    EXECUTE 'ALTER TABLE public.matters DROP CONSTRAINT matters_type_check';
  END IF;
END $$;

-- Recreate with superset of existing + requested statuses
ALTER TABLE public.matters
  ADD CONSTRAINT matters_status_check
  CHECK (
    status = ANY (
      ARRAY[
        -- existing/legacy
        'draft',
        'pending',
        'filed',
        'published',
        'granted',
        'active',
        'opposed',
        'expired',
        'abandoned',
        'cancelled',

        -- requested explicit lifecycle states
        'pending_examination',
        'opposition_period',
        'under_opposition',
        'registered',
        'renewed',
        'rejected',
        'withdrawn'
      ]::text[]
    )
  );

-- Recreate with superset of existing + tradename
ALTER TABLE public.matters
  ADD CONSTRAINT matters_type_check
  CHECK (
    type = ANY (
      ARRAY[
        'trademark',
        'patent',
        'design',
        'domain',
        'copyright',
        'other',
        'tradename'
      ]::text[]
    )
  );
