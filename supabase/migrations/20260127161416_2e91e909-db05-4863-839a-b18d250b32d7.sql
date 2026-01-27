-- ============================================================
-- F1-B: TABLAS PRINCIPALES - matters_v2 y matter_filings
-- ============================================================

-- 1. Tabla principal de expedientes (V2)
CREATE TABLE IF NOT EXISTS public.matters_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Identificación
  matter_number TEXT NOT NULL, -- Generado automáticamente
  reference TEXT, -- Referencia interna del cliente
  title TEXT NOT NULL,
  
  -- Tipo y estado
  matter_type TEXT NOT NULL REFERENCES public.matter_types(code),
  status TEXT NOT NULL DEFAULT 'draft',
  status_date TIMESTAMPTZ DEFAULT now(),
  
  -- Cliente principal
  client_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Fechas clave
  instruction_date DATE, -- Fecha de instrucción/encargo
  priority_date DATE, -- Fecha de prioridad (si aplica)
  
  -- Información del derecho (resumen)
  mark_name TEXT, -- Para marcas
  mark_type TEXT, -- word, figurative, combined, etc.
  mark_image_url TEXT,
  invention_title TEXT, -- Para patentes
  
  -- Clasificación
  nice_classes INT[], -- Clases Nice (marcas)
  ipc_classes TEXT[], -- IPC (patentes)
  goods_services TEXT,
  
  -- Responsables
  responsible_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Costes estimados
  estimated_official_fees DECIMAL(12,2) DEFAULT 0,
  estimated_professional_fees DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  
  -- Opciones
  is_urgent BOOLEAN DEFAULT false,
  is_confidential BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  
  -- Notas
  internal_notes TEXT,
  client_instructions TEXT,
  
  -- Metadatos
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  
  -- Auditoría
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  UNIQUE(organization_id, matter_number)
);

-- Índices para matters_v2
CREATE INDEX IF NOT EXISTS idx_matters_v2_org ON public.matters_v2(organization_id);
CREATE INDEX IF NOT EXISTS idx_matters_v2_client ON public.matters_v2(client_id);
CREATE INDEX IF NOT EXISTS idx_matters_v2_type ON public.matters_v2(matter_type);
CREATE INDEX IF NOT EXISTS idx_matters_v2_status ON public.matters_v2(status);
CREATE INDEX IF NOT EXISTS idx_matters_v2_number ON public.matters_v2(matter_number);
CREATE INDEX IF NOT EXISTS idx_matters_v2_created ON public.matters_v2(created_at DESC);

-- 2. Tabla de presentaciones por jurisdicción
CREATE TABLE IF NOT EXISTS public.matter_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES public.matters_v2(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Jurisdicción
  jurisdiction_code TEXT NOT NULL, -- ES, EU, US, WO, etc.
  office_code TEXT, -- OEPM, EUIPO, USPTO, WIPO, etc.
  
  -- Números oficiales
  application_number TEXT,
  registration_number TEXT,
  publication_number TEXT,
  
  -- Fechas oficiales
  filing_date DATE,
  publication_date DATE,
  registration_date DATE,
  grant_date DATE,
  expiry_date DATE,
  next_renewal_date DATE,
  
  -- Estado en esta jurisdicción
  status TEXT DEFAULT 'pending',
  status_date TIMESTAMPTZ DEFAULT now(),
  
  -- Prioridad reivindicada
  priority_claimed BOOLEAN DEFAULT false,
  priority_country TEXT,
  priority_number TEXT,
  priority_date DATE,
  
  -- Costes reales
  official_fees_paid DECIMAL(12,2) DEFAULT 0,
  professional_fees DECIMAL(12,2) DEFAULT 0,
  
  -- Agente local (si es diferente)
  local_agent_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  local_reference TEXT,
  
  -- Notas específicas de jurisdicción
  notes TEXT,
  
  -- Link a oficina (si está conectada)
  office_link_id UUID,
  last_sync_at TIMESTAMPTZ,
  
  -- Metadatos
  custom_fields JSONB DEFAULT '{}',
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un expediente solo puede tener una presentación por jurisdicción
  UNIQUE(matter_id, jurisdiction_code)
);

-- Índices para matter_filings
CREATE INDEX IF NOT EXISTS idx_matter_filings_matter ON public.matter_filings(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_filings_org ON public.matter_filings(organization_id);
CREATE INDEX IF NOT EXISTS idx_matter_filings_jur ON public.matter_filings(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_matter_filings_status ON public.matter_filings(status);
CREATE INDEX IF NOT EXISTS idx_matter_filings_expiry ON public.matter_filings(expiry_date);
CREATE INDEX IF NOT EXISTS idx_matter_filings_renewal ON public.matter_filings(next_renewal_date);

-- 3. RLS para matters_v2
ALTER TABLE public.matters_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org matters" ON public.matters_v2
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create matters in own org" ON public.matters_v2
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own org matters" ON public.matters_v2
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete own org matters" ON public.matters_v2
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 4. RLS para matter_filings
ALTER TABLE public.matter_filings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org filings" ON public.matter_filings
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org filings" ON public.matter_filings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- 5. Triggers de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_matters_v2_updated_at ON public.matters_v2;
CREATE TRIGGER trg_matters_v2_updated_at
  BEFORE UPDATE ON public.matters_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_matter_filings_updated_at ON public.matter_filings;
CREATE TRIGGER trg_matter_filings_updated_at
  BEFORE UPDATE ON public.matter_filings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matters_v2 TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matter_filings TO authenticated;