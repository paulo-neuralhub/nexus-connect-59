-- Add FK from crm_accounts.assigned_to to profiles.id
ALTER TABLE public.crm_accounts
  ADD CONSTRAINT crm_accounts_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
  ON DELETE SET NULL;