-- ============================================================
-- F1-C: TIMELINE Y PARTIES (RETRY)
-- ============================================================

-- 1. Tabla de timeline (audit log visual del expediente)
CREATE TABLE IF NOT EXISTS public.matter_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES public.matters_v2(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Evento
  event_type TEXT NOT NULL,
  event_category TEXT DEFAULT 'system',
  title TEXT NOT NULL,
  description TEXT,
  
  -- Datos del cambio
  old_value JSONB,
  new_value JSONB,
  changed_fields TEXT[],
  
  -- Referencias
  filing_id UUID REFERENCES public.matter_filings(id) ON DELETE SET NULL,
  document_id UUID,
  party_id UUID,
  
  -- Metadatos
  metadata JSONB DEFAULT '{}',
  
  -- Auditoría
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Para ordenar
  event_date TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_matter_timeline_matter ON public.matter_timeline(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_timeline_org ON public.matter_timeline(organization_id);
CREATE INDEX IF NOT EXISTS idx_matter_timeline_type ON public.matter_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_matter_timeline_date ON public.matter_timeline(event_date DESC);

-- 2. Función para registrar eventos
CREATE OR REPLACE FUNCTION public.log_matter_event(
  p_matter_id UUID,
  p_event_type TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_changed_fields TEXT[] DEFAULT NULL,
  p_filing_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
  v_event_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id 
  FROM public.matters_v2 
  WHERE id = p_matter_id;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Matter not found: %', p_matter_id;
  END IF;
  
  INSERT INTO public.matter_timeline (
    matter_id, organization_id, event_type, title, description,
    old_value, new_value, changed_fields, filing_id, metadata, created_by
  )
  VALUES (
    p_matter_id, v_org_id, p_event_type, p_title, p_description,
    p_old_value, p_new_value, p_changed_fields, p_filing_id, p_metadata, auth.uid()
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

-- 3. Trigger para auto-log en matters_v2
CREATE OR REPLACE FUNCTION public.trg_log_matter_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed TEXT[] := '{}';
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.matter_timeline (
      matter_id, organization_id, event_type, title, 
      new_value, created_by, event_category
    )
    VALUES (
      NEW.id, NEW.organization_id, 'created', 'Expediente creado',
      jsonb_build_object('matter_number', NEW.matter_number, 'title', NEW.title),
      NEW.created_by, 'system'
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_changed := array_append(v_changed, 'status');
      
      INSERT INTO public.matter_timeline (
        matter_id, organization_id, event_type, title,
        old_value, new_value, changed_fields, created_by, event_category
      )
      VALUES (
        NEW.id, NEW.organization_id, 'status_change', 
        'Estado cambiado a ' || COALESCE(NEW.status, 'desconocido'),
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        ARRAY['status'], auth.uid(), 'system'
      );
    END IF;
    
    IF OLD.client_id IS DISTINCT FROM NEW.client_id THEN
      v_changed := array_append(v_changed, 'client_id');
    END IF;
    
    IF OLD.responsible_id IS DISTINCT FROM NEW.responsible_id THEN
      v_changed := array_append(v_changed, 'responsible_id');
    END IF;
    
    IF array_length(v_changed, 1) > 0 AND NOT ('status' = ANY(v_changed) AND array_length(v_changed, 1) = 1) THEN
      INSERT INTO public.matter_timeline (
        matter_id, organization_id, event_type, title,
        changed_fields, created_by, event_category
      )
      VALUES (
        NEW.id, NEW.organization_id, 'updated', 'Expediente actualizado',
        v_changed, auth.uid(), 'user'
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_matters_v2_log ON public.matters_v2;
CREATE TRIGGER trg_matters_v2_log
  AFTER INSERT OR UPDATE ON public.matters_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_log_matter_changes();

-- 4. Trigger para auto-log en matter_filings
CREATE OR REPLACE FUNCTION public.trg_log_filing_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.matter_timeline (
      matter_id, organization_id, event_type, title,
      filing_id, new_value, created_by, event_category
    )
    VALUES (
      NEW.matter_id, NEW.organization_id, 'filing_added', 
      'Presentación añadida: ' || NEW.jurisdiction_code,
      NEW.id,
      jsonb_build_object(
        'jurisdiction', NEW.jurisdiction_code,
        'application_number', NEW.application_number
      ),
      auth.uid(), 'system'
    );
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.matter_timeline (
        matter_id, organization_id, event_type, title,
        filing_id, old_value, new_value, changed_fields, created_by, event_category
      )
      VALUES (
        NEW.matter_id, NEW.organization_id, 'filing_status_change',
        'Estado de ' || NEW.jurisdiction_code || ' cambiado a ' || NEW.status,
        NEW.id,
        jsonb_build_object('status', OLD.status),
        jsonb_build_object('status', NEW.status),
        ARRAY['status'], auth.uid(), 'system'
      );
    END IF;
    
    IF OLD.registration_number IS NULL AND NEW.registration_number IS NOT NULL THEN
      INSERT INTO public.matter_timeline (
        matter_id, organization_id, event_type, title,
        filing_id, new_value, created_by, event_category
      )
      VALUES (
        NEW.matter_id, NEW.organization_id, 'registration',
        'Registrado en ' || NEW.jurisdiction_code || ': ' || NEW.registration_number,
        NEW.id,
        jsonb_build_object('registration_number', NEW.registration_number),
        auth.uid(), 'system'
      );
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_matter_filings_log ON public.matter_filings;
CREATE TRIGGER trg_matter_filings_log
  AFTER INSERT OR UPDATE ON public.matter_filings
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_log_filing_changes();

-- 5. Tabla de partes/actores del expediente
CREATE TABLE IF NOT EXISTS public.matter_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES public.matters_v2(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Rol en el expediente
  party_role TEXT NOT NULL,
  
  -- Referencia al contacto (si existe)
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Datos directos
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  country TEXT,
  tax_id TEXT,
  
  -- Específico de PI
  nationality TEXT,
  inventor_waiver BOOLEAN DEFAULT false,
  
  -- Orden y estado
  is_primary BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  
  -- Metadatos
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_matter_parties_matter ON public.matter_parties(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_parties_org ON public.matter_parties(organization_id);
CREATE INDEX IF NOT EXISTS idx_matter_parties_role ON public.matter_parties(party_role);
CREATE INDEX IF NOT EXISTS idx_matter_parties_contact ON public.matter_parties(contact_id);

-- 6. RLS para matter_timeline
ALTER TABLE public.matter_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org timeline" ON public.matter_timeline;
CREATE POLICY "Users can view own org timeline" ON public.matter_timeline
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert timeline events" ON public.matter_timeline;
CREATE POLICY "Users can insert timeline events" ON public.matter_timeline
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can insert timeline" ON public.matter_timeline;
CREATE POLICY "System can insert timeline" ON public.matter_timeline
  FOR INSERT WITH CHECK (true);

-- 7. RLS para matter_parties
ALTER TABLE public.matter_parties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own org parties" ON public.matter_parties;
CREATE POLICY "Users can view own org parties" ON public.matter_parties
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own org parties" ON public.matter_parties;
CREATE POLICY "Users can manage own org parties" ON public.matter_parties
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- 8. Trigger updated_at para parties
DROP TRIGGER IF EXISTS trg_matter_parties_updated_at ON public.matter_parties;
CREATE TRIGGER trg_matter_parties_updated_at
  BEFORE UPDATE ON public.matter_parties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Grants
GRANT SELECT, INSERT ON public.matter_timeline TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matter_parties TO authenticated;