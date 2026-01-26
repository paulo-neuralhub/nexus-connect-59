
-- =============================================
-- TABLA: tenant_modules
-- Módulos activos por organización
-- =============================================

CREATE TABLE IF NOT EXISTS public.tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  module_code VARCHAR(50) NOT NULL,
  access_type VARCHAR(20) NOT NULL DEFAULT 'selected' CHECK (access_type IN ('included', 'selected', 'addon', 'trial')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'expired', 'cancelled')),
  trial_ends_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  stripe_subscription_item_id TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, module_code)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_status ON tenant_modules(status);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_code ON tenant_modules(module_code);

-- RLS
ALTER TABLE tenant_modules ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver módulos de sus organizaciones
CREATE POLICY "Users can view their org modules" ON tenant_modules
  FOR SELECT USING (
    tenant_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Política: Solo admins pueden modificar módulos de su org
CREATE POLICY "Admins can manage org modules" ON tenant_modules
  FOR ALL USING (
    tenant_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tenant_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tenant_modules_updated_at
  BEFORE UPDATE ON tenant_modules
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_modules_updated_at();

-- Comentarios
COMMENT ON TABLE tenant_modules IS 'Módulos activos por organización';
COMMENT ON COLUMN tenant_modules.access_type IS 'included=plan, selected=elegido, addon=comprado extra, trial=prueba';
COMMENT ON COLUMN tenant_modules.status IS 'Estado actual del módulo para esta org';
