-- ============================================================
-- F1-A: SISTEMA DE NUMERACIÓN DE EXPEDIENTES
-- ============================================================

-- 1. ENUM para tipos de expediente
DO $$ BEGIN
  CREATE TYPE public.matter_type_code AS ENUM (
    'TM',   -- Trademark / Marca
    'PT',   -- Patent / Patente
    'UM',   -- Utility Model / Modelo de Utilidad
    'DS',   -- Design / Diseño Industrial
    'CP',   -- Copyright / Derechos de Autor
    'DN',   -- Domain Name / Nombre de Dominio
    'TS',   -- Trade Secret / Secreto Comercial
    'OP',   -- Opposition / Oposición
    'LT',   -- Litigation / Litigio
    'LC',   -- License / Licencia
    'OT'    -- Other / Otro
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Tabla de tipos de expediente (referencia)
CREATE TABLE IF NOT EXISTS public.matter_types (
  code TEXT PRIMARY KEY,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT DEFAULT 'File',
  color TEXT DEFAULT '#6B7280',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insertar tipos base
INSERT INTO public.matter_types (code, name_es, name_en, icon, color, sort_order) VALUES
  ('TM', 'Marca', 'Trademark', 'Tag', '#EC4899', 1),
  ('PT', 'Patente', 'Patent', 'Lightbulb', '#F59E0B', 2),
  ('UM', 'Modelo de Utilidad', 'Utility Model', 'Wrench', '#8B5CF6', 3),
  ('DS', 'Diseño Industrial', 'Industrial Design', 'Palette', '#10B981', 4),
  ('CP', 'Derechos de Autor', 'Copyright', 'Copyright', '#3B82F6', 5),
  ('DN', 'Nombre de Dominio', 'Domain Name', 'Globe', '#0EA5E9', 6),
  ('TS', 'Secreto Comercial', 'Trade Secret', 'Lock', '#6366F1', 7),
  ('OP', 'Oposición', 'Opposition', 'Scale', '#EF4444', 8),
  ('LT', 'Litigio', 'Litigation', 'Gavel', '#DC2626', 9),
  ('LC', 'Licencia', 'License', 'FileCheck', '#14B8A6', 10),
  ('OT', 'Otro', 'Other', 'File', '#6B7280', 99)
ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  name_en = EXCLUDED.name_en,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order;

-- 3. Configuración de numeración por organización
CREATE TABLE IF NOT EXISTS public.matter_numbering_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL DEFAULT '{TYPE}-{JUR}-{DATE}-{CLIENT}-{SEQ}-{CHECK}',
  date_format TEXT DEFAULT 'YYYYMMDD',
  seq_length INT DEFAULT 4,
  seq_reset_period TEXT DEFAULT 'never', -- 'never', 'yearly', 'monthly'
  include_client_token BOOLEAN DEFAULT true,
  include_check_digit BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);

-- 4. Secuencias por organización/tipo/jurisdicción
CREATE TABLE IF NOT EXISTS public.matter_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_type TEXT NOT NULL,
  jurisdiction_code TEXT NOT NULL,
  year INT NOT NULL,
  month INT DEFAULT NULL, -- NULL if reset is yearly or never
  last_sequence INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, matter_type, jurisdiction_code, year, month)
);

-- 5. Añadir client_token a contacts (clientes)
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS client_token TEXT;

-- Crear índice único para client_token por organización
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_client_token_org 
ON public.contacts(organization_id, client_token) 
WHERE client_token IS NOT NULL;

-- 6. Función para generar token de cliente (3 caracteres únicos)
CREATE OR REPLACE FUNCTION public.generate_client_token(
  p_organization_id UUID,
  p_client_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token TEXT;
  v_base TEXT;
  v_suffix INT := 0;
  v_exists BOOLEAN;
BEGIN
  -- Generar base del token (primeras 3 letras del nombre, uppercase, sin acentos)
  v_base := UPPER(LEFT(REGEXP_REPLACE(
    TRANSLATE(p_client_name, 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'),
    '[^A-Z0-9]', '', 'g'
  ), 3));
  
  -- Si es muy corto, rellenar con X
  v_base := RPAD(v_base, 3, 'X');
  
  v_token := v_base;
  
  -- Verificar unicidad y generar alternativas si es necesario
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM public.contacts 
      WHERE organization_id = p_organization_id 
      AND client_token = v_token
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
    
    v_suffix := v_suffix + 1;
    -- Reemplazar último carácter con número
    v_token := LEFT(v_base, 2) || CAST(v_suffix % 10 AS TEXT);
    
    -- Si llegamos a 10 intentos, usar caracteres aleatorios
    IF v_suffix >= 10 THEN
      v_token := UPPER(SUBSTR(MD5(p_client_name || v_suffix::TEXT), 1, 3));
    END IF;
    
    -- Límite de seguridad
    IF v_suffix > 100 THEN
      v_token := UPPER(SUBSTR(MD5(gen_random_uuid()::TEXT), 1, 3));
      EXIT;
    END IF;
  END LOOP;
  
  RETURN v_token;
END;
$$;

-- 7. Función para calcular dígito de control (Luhn modificado)
CREATE OR REPLACE FUNCTION public.calculate_check_digit(p_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sum INT := 0;
  v_char CHAR;
  v_val INT;
  v_double BOOLEAN := false;
  i INT;
  v_clean TEXT;
BEGIN
  -- Limpiar input: solo alfanuméricos
  v_clean := UPPER(REGEXP_REPLACE(p_input, '[^A-Z0-9]', '', 'g'));
  
  -- Procesar de derecha a izquierda
  FOR i IN REVERSE LENGTH(v_clean)..1 LOOP
    v_char := SUBSTR(v_clean, i, 1);
    
    -- Convertir a valor numérico (A=10, B=11, etc.)
    IF v_char ~ '[0-9]' THEN
      v_val := v_char::INT;
    ELSE
      v_val := ASCII(v_char) - 55; -- A=10, B=11, etc.
    END IF;
    
    IF v_double THEN
      v_val := v_val * 2;
      IF v_val > 9 THEN
        v_val := v_val - 9;
      END IF;
    END IF;
    
    v_sum := v_sum + v_val;
    v_double := NOT v_double;
  END LOOP;
  
  -- Calcular dígito de control (0-9 y A-Z para 10-35)
  v_val := (10 - (v_sum % 10)) % 10;
  
  -- Añadir letra para mayor entropía
  RETURN CHR(65 + (v_sum % 26)) || v_val::TEXT;
END;
$$;

-- 8. Función principal para generar número de expediente
CREATE OR REPLACE FUNCTION public.generate_matter_number(
  p_organization_id UUID,
  p_matter_type TEXT,
  p_jurisdiction_code TEXT,
  p_client_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_sequence INT;
  v_client_token TEXT := '';
  v_date_part TEXT;
  v_seq_part TEXT;
  v_result TEXT;
  v_year INT := EXTRACT(YEAR FROM CURRENT_DATE)::INT;
  v_month INT := EXTRACT(MONTH FROM CURRENT_DATE)::INT;
  v_check_month INT := NULL;
BEGIN
  -- Obtener configuración
  SELECT * INTO v_config 
  FROM public.matter_numbering_config 
  WHERE organization_id = p_organization_id;
  
  -- Si no existe, crear configuración por defecto
  IF v_config IS NULL THEN
    INSERT INTO public.matter_numbering_config (organization_id)
    VALUES (p_organization_id)
    RETURNING * INTO v_config;
  END IF;
  
  -- Determinar mes para secuencia
  IF v_config.seq_reset_period = 'monthly' THEN
    v_check_month := v_month;
  END IF;
  
  -- Obtener y incrementar secuencia
  INSERT INTO public.matter_sequences (
    organization_id, matter_type, jurisdiction_code, year, month, last_sequence
  )
  VALUES (
    p_organization_id, p_matter_type, p_jurisdiction_code, v_year, v_check_month, 1
  )
  ON CONFLICT (organization_id, matter_type, jurisdiction_code, year, month) 
  DO UPDATE SET 
    last_sequence = matter_sequences.last_sequence + 1,
    updated_at = now()
  RETURNING last_sequence INTO v_sequence;
  
  -- Obtener token del cliente
  IF v_config.include_client_token AND p_client_id IS NOT NULL THEN
    SELECT client_token INTO v_client_token 
    FROM public.contacts 
    WHERE id = p_client_id;
    
    -- Si no tiene token, generarlo
    IF v_client_token IS NULL THEN
      SELECT name INTO v_client_token FROM public.contacts WHERE id = p_client_id;
      v_client_token := public.generate_client_token(p_organization_id, v_client_token);
      UPDATE public.contacts SET client_token = v_client_token WHERE id = p_client_id;
    END IF;
  END IF;
  
  -- Formatear fecha
  CASE v_config.date_format
    WHEN 'YYYYMMDD' THEN v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    WHEN 'YYMMDD' THEN v_date_part := TO_CHAR(CURRENT_DATE, 'YYMMDD');
    WHEN 'YYYY' THEN v_date_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    WHEN 'YY' THEN v_date_part := TO_CHAR(CURRENT_DATE, 'YY');
    ELSE v_date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  END CASE;
  
  -- Formatear secuencia
  v_seq_part := LPAD(v_sequence::TEXT, v_config.seq_length, '0');
  
  -- Construir número base (sin check digit)
  v_result := v_config.pattern;
  v_result := REPLACE(v_result, '{TYPE}', UPPER(p_matter_type));
  v_result := REPLACE(v_result, '{JUR}', UPPER(p_jurisdiction_code));
  v_result := REPLACE(v_result, '{DATE}', v_date_part);
  v_result := REPLACE(v_result, '{SEQ}', v_seq_part);
  
  IF v_config.include_client_token AND v_client_token != '' THEN
    v_result := REPLACE(v_result, '{CLIENT}', v_client_token);
  ELSE
    v_result := REPLACE(v_result, '-{CLIENT}', '');
    v_result := REPLACE(v_result, '{CLIENT}-', '');
    v_result := REPLACE(v_result, '{CLIENT}', '');
  END IF;
  
  -- Añadir check digit
  IF v_config.include_check_digit THEN
    v_result := REPLACE(v_result, '{CHECK}', public.calculate_check_digit(v_result));
  ELSE
    v_result := REPLACE(v_result, '-{CHECK}', '');
    v_result := REPLACE(v_result, '{CHECK}', '');
  END IF;
  
  RETURN v_result;
END;
$$;

-- 9. Trigger para auto-generar client_token
CREATE OR REPLACE FUNCTION public.auto_generate_client_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.client_token IS NULL AND NEW.name IS NOT NULL THEN
    NEW.client_token := public.generate_client_token(NEW.organization_id, NEW.name);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_client_token ON public.contacts;
CREATE TRIGGER trg_auto_client_token
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_client_token();

-- 10. RLS para nuevas tablas
ALTER TABLE public.matter_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matter_numbering_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matter_sequences ENABLE ROW LEVEL SECURITY;

-- Políticas para matter_types (lectura pública)
CREATE POLICY "Anyone can read matter_types" ON public.matter_types
  FOR SELECT USING (true);

-- Políticas para matter_numbering_config
CREATE POLICY "Users can view own org numbering config" ON public.matter_numbering_config
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage numbering config" ON public.matter_numbering_config
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Políticas para matter_sequences
CREATE POLICY "Users can view own org sequences" ON public.matter_sequences
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage sequences" ON public.matter_sequences
  FOR ALL USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT ON public.matter_types TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.matter_numbering_config TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.matter_sequences TO authenticated;