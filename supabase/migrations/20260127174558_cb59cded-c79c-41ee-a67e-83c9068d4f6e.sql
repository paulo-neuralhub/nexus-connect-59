-- ============================================================
-- CONFIGURACIÓN DE REFERENCIA INTERNA POR TENANT
-- ============================================================

CREATE TABLE IF NOT EXISTS public.internal_reference_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Plantilla del formato
  -- Variables: {YEAR}, {YEAR2}, {MONTH}, {TYPE}, {JUR}, {SEQ}, {CLIENT}
  template VARCHAR(100) NOT NULL DEFAULT '{YEAR}/{TYPE}/{SEQ}',
  
  -- Configuración de secuencia
  seq_padding INTEGER DEFAULT 3 CHECK (seq_padding >= 1 AND seq_padding <= 6),
  seq_scope VARCHAR(30) DEFAULT 'YEAR' CHECK (seq_scope IN ('YEAR', 'TYPE_YEAR', 'GLOBAL')),
  seq_start INTEGER DEFAULT 1 CHECK (seq_start >= 1),
  
  -- Separadores y opciones
  separator VARCHAR(5) DEFAULT '/',
  uppercase BOOLEAN DEFAULT TRUE,
  include_client_code BOOLEAN DEFAULT FALSE,
  
  -- Preview (para mostrar ejemplo en UI)
  preview_example VARCHAR(100),
  
  -- Estado
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.internal_reference_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org config"
  ON public.internal_reference_config FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org config"
  ON public.internal_reference_config FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ============================================================
-- SECUENCIAS DE REFERENCIA INTERNA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.internal_reference_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sequence_key VARCHAR(50) NOT NULL,  -- ej: "2026", "TM:2026", "GLOBAL"
  last_value INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, sequence_key)
);

-- Enable RLS
ALTER TABLE public.internal_reference_sequences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org sequences"
  ON public.internal_reference_sequences FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage their org sequences"
  ON public.internal_reference_sequences FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- ============================================================
-- FUNCIÓN: Generar Referencia Interna
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_internal_reference(
  p_organization_id UUID,
  p_type_code VARCHAR,
  p_jurisdiction_code VARCHAR DEFAULT NULL,
  p_client_code VARCHAR DEFAULT NULL
)
RETURNS VARCHAR
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_template VARCHAR;
  v_seq_key VARCHAR;
  v_seq_value INTEGER;
  v_result VARCHAR;
  v_year VARCHAR;
  v_year2 VARCHAR;
  v_month VARCHAR;
BEGIN
  -- Obtener configuración del tenant
  SELECT * INTO v_config
  FROM internal_reference_config
  WHERE organization_id = p_organization_id AND is_active = TRUE;
  
  -- Si no hay config, crear default
  IF NOT FOUND THEN
    INSERT INTO internal_reference_config (organization_id, template)
    VALUES (p_organization_id, '{YEAR}/{TYPE}/{SEQ}')
    RETURNING * INTO v_config;
  END IF;
  
  v_template := v_config.template;
  
  -- Preparar variables de fecha
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  v_year2 := RIGHT(v_year, 2);
  v_month := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
  
  -- Determinar scope de secuencia
  v_seq_key := CASE v_config.seq_scope
    WHEN 'GLOBAL' THEN 'GLOBAL'
    WHEN 'TYPE_YEAR' THEN p_type_code || ':' || v_year
    ELSE v_year  -- Default: YEAR
  END;
  
  -- Obtener siguiente secuencia (UPSERT atómico)
  INSERT INTO internal_reference_sequences (organization_id, sequence_key, last_value)
  VALUES (p_organization_id, v_seq_key, COALESCE(v_config.seq_start, 1))
  ON CONFLICT (organization_id, sequence_key) DO UPDATE
  SET last_value = internal_reference_sequences.last_value + 1,
      updated_at = NOW()
  RETURNING last_value INTO v_seq_value;
  
  -- Reemplazar variables en template
  v_result := v_template;
  v_result := REPLACE(v_result, '{YEAR}', v_year);
  v_result := REPLACE(v_result, '{YEAR2}', v_year2);
  v_result := REPLACE(v_result, '{MONTH}', v_month);
  v_result := REPLACE(v_result, '{TYPE}', COALESCE(p_type_code, 'XX'));
  v_result := REPLACE(v_result, '{JUR}', COALESCE(p_jurisdiction_code, 'XX'));
  v_result := REPLACE(v_result, '{SEQ}', LPAD(v_seq_value::TEXT, COALESCE(v_config.seq_padding, 3), '0'));
  v_result := REPLACE(v_result, '{CLIENT}', COALESCE(p_client_code, ''));
  
  -- Limpiar separadores vacíos si CLIENT está vacío
  v_result := REGEXP_REPLACE(v_result, '/{2,}', '/', 'g');
  v_result := REGEXP_REPLACE(v_result, '-{2,}', '-', 'g');
  v_result := TRIM(BOTH '/' FROM v_result);
  v_result := TRIM(BOTH '-' FROM v_result);
  
  -- Aplicar uppercase si está configurado
  IF v_config.uppercase THEN
    v_result := UPPER(v_result);
  END IF;
  
  RETURN v_result;
END;
$$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_internal_ref_config_org 
  ON public.internal_reference_config(organization_id);
CREATE INDEX IF NOT EXISTS idx_internal_ref_seq_org_key 
  ON public.internal_reference_sequences(organization_id, sequence_key);