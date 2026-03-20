-- Fix #1: Add FK crm_deals.account_id -> crm_accounts.id
ALTER TABLE public.crm_deals
  ADD CONSTRAINT crm_deals_account_id_crm_accounts_fkey
  FOREIGN KEY (account_id) REFERENCES public.crm_accounts(id)
  ON DELETE SET NULL;

-- Fix #2: Add missing folder_type column to client_folders
ALTER TABLE public.client_folders
  ADD COLUMN IF NOT EXISTS folder_type text DEFAULT 'general';