-- FASE 2 prep: Add missing columns for edge functions

-- internal_messages: indexing columns
ALTER TABLE public.internal_messages
  ADD COLUMN IF NOT EXISTS indexed_to_matter_id uuid REFERENCES public.matters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS indexed_at timestamptz,
  ADD COLUMN IF NOT EXISTS indexed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referenced_invoice_id uuid,
  ADD COLUMN IF NOT EXISTS referenced_deadline_id uuid,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric(3,2),
  ADD COLUMN IF NOT EXISTS ai_suggested_matter_id uuid REFERENCES public.matters(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_reason text,
  ADD COLUMN IF NOT EXISTS ai_suggested_action text,
  ADD COLUMN IF NOT EXISTS app_context jsonb DEFAULT '{}';

-- internal_channels: last_message_at and message_count
ALTER TABLE public.internal_channels
  ADD COLUMN IF NOT EXISTS last_message_at timestamptz,
  ADD COLUMN IF NOT EXISTS message_count integer DEFAULT 0;

-- staff_notifications: priority and action_url
ALTER TABLE public.staff_notifications
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  ADD COLUMN IF NOT EXISTS action_url text;