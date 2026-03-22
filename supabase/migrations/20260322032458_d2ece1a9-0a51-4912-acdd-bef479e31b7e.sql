
-- =============================================
-- MIGRATION: B2B2B Phase 2 — Expand stub tables for Edge Functions
-- =============================================

-- Expand portal_client_instructions stub
ALTER TABLE portal_client_instructions
  ADD COLUMN IF NOT EXISTS crm_account_id uuid REFERENCES crm_accounts(id),
  ADD COLUMN IF NOT EXISTS matter_id uuid REFERENCES matters(id),
  ADD COLUMN IF NOT EXISTS instruction_type text,
  ADD COLUMN IF NOT EXISTS instruction_text text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'received'
    CHECK (status IN ('received','acknowledged','in_progress','completed','rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Expand portal_access stub
ALTER TABLE portal_access
  ADD COLUMN IF NOT EXISTS can_request_services boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_view_invoices boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_submit_instructions boolean DEFAULT false;

-- Create portal_notifications table
CREATE TABLE IF NOT EXISTS portal_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  portal_user_id uuid REFERENCES auth.users(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  notification_type text NOT NULL,
  priority text DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  title text NOT NULL,
  message text,
  metadata jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE portal_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portal_notifications_org" ON portal_notifications 
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Expand portal_service_requests stub
ALTER TABLE portal_service_requests
  ADD COLUMN IF NOT EXISTS crm_account_id uuid REFERENCES crm_accounts(id),
  ADD COLUMN IF NOT EXISTS service_type text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
