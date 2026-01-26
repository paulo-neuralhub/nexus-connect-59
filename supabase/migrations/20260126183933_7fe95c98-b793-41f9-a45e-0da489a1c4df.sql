-- =============================================
-- GASTOS / EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Usuario que registra
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Contexto
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Detalle
  date DATE NOT NULL,
  category VARCHAR(50) NOT NULL, -- travel, materials, official_fees, courier, meals, accommodation, other
  description TEXT NOT NULL,
  
  -- Importe
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  vat_rate DECIMAL(5,2) DEFAULT 21,
  vat_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Justificante
  receipt_url TEXT,
  receipt_file_name VARCHAR(255),
  
  -- Reembolsable al cliente
  is_billable BOOLEAN DEFAULT TRUE,
  markup_percent DECIMAL(5,2) DEFAULT 0,
  
  -- Estado
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'approved',
    'rejected',
    'reimbursed'
  )),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Facturación
  billing_status VARCHAR(20) DEFAULT 'unbilled' CHECK (billing_status IN (
    'unbilled',
    'ready',
    'billed',
    'written_off'
  )),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  invoice_line_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_expenses_organization ON public.expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_matter ON public.expenses(matter_id);
CREATE INDEX IF NOT EXISTS idx_expenses_contact ON public.expenses(contact_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_billing ON public.expenses(billing_status);

-- RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view expenses from their organization
CREATE POLICY "Users can view org expenses" ON public.expenses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create expenses for their org
CREATE POLICY "Users can create expenses" ON public.expenses
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    ) AND user_id = auth.uid()
  );

-- Policy: Users can update their own pending expenses
CREATE POLICY "Users can update own pending expenses" ON public.expenses
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'pending'
  );

-- Policy: Admins can update any expense (for approval)
CREATE POLICY "Admins can update expenses" ON public.expenses
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Policy: Users can delete their own pending expenses
CREATE POLICY "Users can delete own pending expenses" ON public.expenses
  FOR DELETE USING (
    user_id = auth.uid() AND status = 'pending'
  );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();