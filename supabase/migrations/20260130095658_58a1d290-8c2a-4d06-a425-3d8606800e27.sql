-- ============================================================
-- L109E: Gestión Clases Nice - Campos de control y tabla de historial
-- ============================================================

-- 1. Añadir campos de control a nice_classes
ALTER TABLE nice_classes 
ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS wipo_version TEXT DEFAULT '12-2024',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS product_count INTEGER DEFAULT 0;

-- 2. Añadir campos a nice_products
ALTER TABLE nice_products 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS wipo_code TEXT;

-- 3. Crear tabla de historial de revisiones
CREATE TABLE IF NOT EXISTS nice_revision_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number INTEGER REFERENCES nice_classes(class_number),
  action TEXT CHECK (action IN ('reviewed', 'product_added', 'product_removed', 'product_updated', 'class_updated')),
  details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_nice_revision_class ON nice_revision_log(class_number);
CREATE INDEX IF NOT EXISTS idx_nice_revision_date ON nice_revision_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_nice_products_class ON nice_products(class_number);
CREATE INDEX IF NOT EXISTS idx_nice_products_active ON nice_products(is_active);

-- 4. Función para actualizar product_count automáticamente
CREATE OR REPLACE FUNCTION update_nice_class_product_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE nice_classes 
    SET product_count = (
      SELECT COUNT(*) FROM nice_products 
      WHERE class_number = NEW.class_number AND is_active = TRUE
    )
    WHERE class_number = NEW.class_number;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE nice_classes 
    SET product_count = (
      SELECT COUNT(*) FROM nice_products 
      WHERE class_number = NEW.class_number AND is_active = TRUE
    )
    WHERE class_number = NEW.class_number;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE nice_classes 
    SET product_count = (
      SELECT COUNT(*) FROM nice_products 
      WHERE class_number = OLD.class_number AND is_active = TRUE
    )
    WHERE class_number = OLD.class_number;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener product_count sincronizado
DROP TRIGGER IF EXISTS trigger_update_nice_class_product_count ON nice_products;
CREATE TRIGGER trigger_update_nice_class_product_count
AFTER INSERT OR UPDATE OR DELETE ON nice_products
FOR EACH ROW
EXECUTE FUNCTION update_nice_class_product_count();

-- 5. Función para verificar clases que necesitan revisión (más de 1 año)
CREATE OR REPLACE FUNCTION check_nice_classes_review()
RETURNS TABLE(class_number INTEGER, title_es TEXT, last_reviewed_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT nc.class_number, nc.title_es, nc.last_reviewed_at
  FROM nice_classes nc
  WHERE nc.last_reviewed_at IS NULL 
     OR nc.last_reviewed_at < NOW() - INTERVAL '1 year'
  ORDER BY nc.last_reviewed_at NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- 6. Actualizar product_count inicial para todas las clases
UPDATE nice_classes nc
SET product_count = (
  SELECT COUNT(*) FROM nice_products np 
  WHERE np.class_number = nc.class_number 
  AND (np.is_active IS NULL OR np.is_active = TRUE)
);

-- 7. RLS para nice_revision_log (solo backoffice staff puede ver/modificar)
ALTER TABLE nice_revision_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backoffice staff can view nice revision log"
ON nice_revision_log FOR SELECT
TO authenticated
USING (is_backoffice_staff());

CREATE POLICY "Backoffice staff can insert nice revision log"
ON nice_revision_log FOR INSERT
TO authenticated
WITH CHECK (is_backoffice_staff());