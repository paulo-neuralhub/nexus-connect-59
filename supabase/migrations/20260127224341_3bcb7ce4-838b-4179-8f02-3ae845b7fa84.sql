-- =============================================
-- ESTRUCTURA COMPLETA MÓDULO EXPEDIENTES V2
-- =============================================

-- 1. Añadir columna sort_order a matter_parties (falta y causa errores)
ALTER TABLE public.matter_parties ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;

-- 2. Añadir columna matter_id a invoices para vincular facturas
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS matter_id uuid REFERENCES public.matters(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_matter_id ON public.invoices(matter_id);

-- 3. Crear tabla matter_tasks (no existe)
CREATE TABLE IF NOT EXISTS public.matter_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date timestamptz,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  completed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  is_completed boolean DEFAULT false,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para matter_tasks
CREATE INDEX IF NOT EXISTS idx_matter_tasks_matter_id ON public.matter_tasks(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_tasks_organization_id ON public.matter_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_matter_tasks_assigned_to ON public.matter_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_matter_tasks_due_date ON public.matter_tasks(due_date);

-- RLS para matter_tasks
ALTER TABLE public.matter_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their organization"
  ON public.matter_tasks FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks in their organization"
  ON public.matter_tasks FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks in their organization"
  ON public.matter_tasks FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks in their organization"
  ON public.matter_tasks FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Trigger para updated_at en matter_tasks
CREATE TRIGGER update_matter_tasks_updated_at
  BEFORE UPDATE ON public.matter_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();