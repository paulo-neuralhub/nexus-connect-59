-- =====================================================
-- P68: IP-MARKET - EXPANSIÓN DE USUARIOS
-- Transforma Market en plataforma abierta tipo "LinkedIn de PI"
-- =====================================================

-- =====================================================
-- TABLA: market_users (usuarios del marketplace)
-- =====================================================
CREATE TABLE market_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vinculación con IP-NEXUS (NULL si es usuario externo)
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  -- Tipo de usuario del marketplace
  user_type TEXT NOT NULL CHECK (user_type IN (
    'internal_agent',    -- Agente con cuenta IP-NEXUS completa
    'external_agent',    -- Agente externo (solo Market)
    'ip_holder',         -- Titular de PI (vende/licencia)
    'service_seeker',    -- Busca servicios de PI
    'investor',          -- Busca invertir en PI
    'visitor'            -- Solo navega (pre-registro)
  )),
  
  -- =====================================================
  -- DATOS BÁSICOS (todos los usuarios)
  -- =====================================================
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  country TEXT NOT NULL,
  city TEXT,
  timezone TEXT DEFAULT 'Europe/Madrid',
  languages TEXT[] DEFAULT ARRAY['es'],
  bio TEXT,
  
  -- =====================================================
  -- DATOS PROFESIONALES (agentes)
  -- =====================================================
  is_agent BOOLEAN DEFAULT false,
  agent_type TEXT CHECK (agent_type IN (
    'patent_attorney',
    'trademark_attorney', 
    'ip_lawyer',
    'patent_agent',
    'trademark_agent',
    'ip_consultant',
    'licensing_specialist',
    'valuation_expert'
  )),
  license_number TEXT,
  bar_association TEXT,
  jurisdictions TEXT[] DEFAULT ARRAY[]::TEXT[],
  specializations TEXT[] DEFAULT ARRAY[]::TEXT[],
  years_experience INT,
  hourly_rate DECIMAL(10,2),
  rate_currency TEXT DEFAULT 'EUR',
  
  -- Empresa/Despacho
  company_name TEXT,
  company_type TEXT CHECK (company_type IN (
    'solo_practitioner',
    'small_firm',
    'medium_firm',
    'large_firm',
    'corporate',
    'startup',
    'other'
  )),
  company_website TEXT,
  company_logo_url TEXT,
  
  -- =====================================================
  -- VERIFICACIÓN Y KYC
  -- =====================================================
  kyc_level INT DEFAULT 0 CHECK (kyc_level BETWEEN 0 AND 4),
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN (
    'pending', 'in_review', 'verified', 'rejected', 'expired'
  )),
  kyc_verified_at TIMESTAMPTZ,
  kyc_expires_at TIMESTAMPTZ,
  kyc_documents JSONB DEFAULT '[]',
  
  is_verified_agent BOOLEAN DEFAULT false,
  agent_verified_at TIMESTAMPTZ,
  agent_verification_notes TEXT,
  
  -- =====================================================
  -- MÉTRICAS Y REPUTACIÓN
  -- =====================================================
  reputation_score INT DEFAULT 50 CHECK (reputation_score BETWEEN 0 AND 100),
  
  total_transactions INT DEFAULT 0,
  successful_transactions INT DEFAULT 0,
  total_volume DECIMAL(15,2) DEFAULT 0,
  
  rating_avg DECIMAL(2,1) DEFAULT 0 CHECK (rating_avg BETWEEN 0 AND 5),
  ratings_count INT DEFAULT 0,
  
  success_rate DECIMAL(5,2) DEFAULT 0,
  response_time_avg INT DEFAULT 0,
  communication_score DECIMAL(5,2) DEFAULT 0,
  
  rank_position INT,
  rank_percentile DECIMAL(5,2),
  
  -- =====================================================
  -- BADGES
  -- =====================================================
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- =====================================================
  -- CONFIGURACIÓN
  -- =====================================================
  is_active BOOLEAN DEFAULT true,
  is_public_profile BOOLEAN DEFAULT true,
  accepts_new_clients BOOLEAN DEFAULT true,
  notification_preferences JSONB DEFAULT '{
    "email_new_rfq": true,
    "email_messages": true,
    "email_reviews": true,
    "push_enabled": false
  }',
  
  -- =====================================================
  -- TIMESTAMPS
  -- =====================================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_agent_data CHECK (
    (is_agent = false) OR 
    (is_agent = true AND agent_type IS NOT NULL AND jurisdictions != ARRAY[]::TEXT[])
  )
);

-- Comentario de tabla
COMMENT ON TABLE market_users IS 'Usuarios del marketplace IP-MARKET (internos y externos)';

-- =====================================================
-- ÍNDICES para market_users
-- =====================================================
CREATE INDEX idx_market_users_auth ON market_users(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_market_users_org ON market_users(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_market_users_email ON market_users(email);
CREATE INDEX idx_market_users_type ON market_users(user_type);
CREATE INDEX idx_market_users_country ON market_users(country);
CREATE INDEX idx_market_users_agent ON market_users(is_agent) WHERE is_agent = true;
CREATE INDEX idx_market_users_verified ON market_users(is_verified_agent) WHERE is_verified_agent = true;
CREATE INDEX idx_market_users_reputation ON market_users(reputation_score DESC);
CREATE INDEX idx_market_users_rating ON market_users(rating_avg DESC);
CREATE INDEX idx_market_users_active ON market_users(is_active, is_public_profile) WHERE is_active = true AND is_public_profile = true;
CREATE INDEX idx_market_users_jurisdictions ON market_users USING GIN(jurisdictions);
CREATE INDEX idx_market_users_specializations ON market_users USING GIN(specializations);
CREATE INDEX idx_market_users_badges ON market_users USING GIN(badges);

-- =====================================================
-- RLS para market_users
-- =====================================================
ALTER TABLE market_users ENABLE ROW LEVEL SECURITY;

-- Perfiles públicos visibles por todos (sin auth requerido)
CREATE POLICY "Public profiles viewable by anyone"
  ON market_users FOR SELECT
  USING (is_public_profile = true AND is_active = true);

-- Usuarios autenticados pueden ver todos los perfiles activos
CREATE POLICY "Authenticated users can view all active profiles"
  ON market_users FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Usuarios gestionan su propio perfil
CREATE POLICY "Users manage own profile"
  ON market_users FOR ALL
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Service role tiene acceso total
CREATE POLICY "Service role full access to market_users"
  ON market_users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLA: market_user_reviews
-- =====================================================
CREATE TABLE market_user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewed_user_id UUID NOT NULL REFERENCES market_users(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES market_users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES market_transactions(id) ON DELETE SET NULL,
  
  -- Ratings
  rating_overall INT NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
  rating_communication INT CHECK (rating_communication BETWEEN 1 AND 5),
  rating_quality INT CHECK (rating_quality BETWEEN 1 AND 5),
  rating_timeliness INT CHECK (rating_timeliness BETWEEN 1 AND 5),
  rating_value INT CHECK (rating_value BETWEEN 1 AND 5),
  
  -- Content
  title TEXT,
  comment TEXT,
  response TEXT,
  response_at TIMESTAMPTZ,
  
  -- Moderation
  is_verified BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason TEXT,
  moderated_by UUID REFERENCES auth.users(id),
  moderated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Una review por transacción
  UNIQUE(transaction_id, reviewer_id)
);

COMMENT ON TABLE market_user_reviews IS 'Reviews y ratings de usuarios del marketplace';

-- =====================================================
-- ÍNDICES para market_user_reviews
-- =====================================================
CREATE INDEX idx_reviews_reviewed ON market_user_reviews(reviewed_user_id);
CREATE INDEX idx_reviews_reviewer ON market_user_reviews(reviewer_id);
CREATE INDEX idx_reviews_transaction ON market_user_reviews(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_reviews_visible ON market_user_reviews(is_visible) WHERE is_visible = true;
CREATE INDEX idx_reviews_rating ON market_user_reviews(rating_overall DESC);
CREATE INDEX idx_reviews_created ON market_user_reviews(created_at DESC);

-- =====================================================
-- RLS para market_user_reviews
-- =====================================================
ALTER TABLE market_user_reviews ENABLE ROW LEVEL SECURITY;

-- Reviews visibles públicamente
CREATE POLICY "Visible reviews are public"
  ON market_user_reviews FOR SELECT
  USING (is_visible = true);

-- Usuarios autenticados pueden crear reviews
CREATE POLICY "Authenticated users can create reviews"
  ON market_user_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM market_users 
      WHERE id = reviewer_id AND auth_user_id = auth.uid()
    )
  );

-- Reviewers pueden editar sus propias reviews
CREATE POLICY "Reviewers can update own reviews"
  ON market_user_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM market_users 
      WHERE id = reviewer_id AND auth_user_id = auth.uid()
    )
  );

-- Reviewed users pueden responder (solo el campo response)
CREATE POLICY "Reviewed users can respond"
  ON market_user_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM market_users 
      WHERE id = reviewed_user_id AND auth_user_id = auth.uid()
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to reviews"
  ON market_user_reviews FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FUNCIÓN: Recalcular reputación de usuario
-- =====================================================
CREATE OR REPLACE FUNCTION recalculate_market_user_reputation()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_rating_avg DECIMAL(2,1);
  v_ratings_count INT;
  v_success_rate DECIMAL(5,2);
  v_reputation_score INT;
  v_total_transactions INT;
  v_successful_transactions INT;
  v_is_verified BOOLEAN;
BEGIN
  -- Determinar el usuario afectado
  IF TG_TABLE_NAME = 'market_user_reviews' THEN
    v_user_id := COALESCE(NEW.reviewed_user_id, OLD.reviewed_user_id);
  ELSIF TG_TABLE_NAME = 'market_transactions' THEN
    v_user_id := COALESCE(NEW.seller_id, OLD.seller_id);
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calcular promedio de ratings
  SELECT COALESCE(AVG(rating_overall), 0)::DECIMAL(2,1), COUNT(*)
  INTO v_rating_avg, v_ratings_count
  FROM market_user_reviews
  WHERE reviewed_user_id = v_user_id AND is_visible = true;
  
  -- Calcular transacciones (si la tabla existe)
  BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_total_transactions, v_successful_transactions
    FROM market_transactions
    WHERE seller_id = v_user_id OR buyer_id = v_user_id;
  EXCEPTION WHEN undefined_table THEN
    v_total_transactions := 0;
    v_successful_transactions := 0;
  END;
  
  -- Calcular tasa de éxito
  IF v_total_transactions > 0 THEN
    v_success_rate := (v_successful_transactions::DECIMAL / v_total_transactions) * 100;
  ELSE
    v_success_rate := 0;
  END IF;
  
  -- Obtener estado de verificación
  SELECT is_verified_agent INTO v_is_verified
  FROM market_users WHERE id = v_user_id;
  
  -- Calcular score de reputación (0-100)
  -- Fórmula: rating*8 + success_rate*0.3 + transacciones + bonus verificación
  v_reputation_score := LEAST(100, GREATEST(0,
    ROUND(
      (COALESCE(v_rating_avg, 0) * 8) +
      (COALESCE(v_success_rate, 0) * 0.3) +
      (LEAST(COALESCE(v_total_transactions, 0), 100) * 0.2) +
      (CASE WHEN v_is_verified = true THEN 10 ELSE 0 END)
    )::INT
  ));
  
  -- Actualizar el usuario
  UPDATE market_users SET
    rating_avg = v_rating_avg,
    ratings_count = v_ratings_count,
    success_rate = v_success_rate,
    total_transactions = v_total_transactions,
    successful_transactions = v_successful_transactions,
    reputation_score = v_reputation_score,
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para actualizar reputación cuando hay nueva review
CREATE TRIGGER trigger_update_reputation_on_review
  AFTER INSERT OR UPDATE OR DELETE ON market_user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_market_user_reputation();

-- Trigger para updated_at en market_users
CREATE TRIGGER trigger_market_users_updated_at
  BEFORE UPDATE ON market_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at en market_user_reviews
CREATE TRIGGER trigger_market_reviews_updated_at
  BEFORE UPDATE ON market_user_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: Sincronizar usuario interno desde IP-NEXUS
-- =====================================================
CREATE OR REPLACE FUNCTION sync_market_user_from_nexus(
  p_auth_user_id UUID,
  p_organization_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_user RECORD;
  v_market_user_id UUID;
BEGIN
  -- Obtener datos del usuario de IP-NEXUS
  SELECT u.*, o.name as org_name
  INTO v_user
  FROM users u
  LEFT JOIN organizations o ON o.id = p_organization_id
  WHERE u.id = p_auth_user_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Insertar o actualizar en market_users
  INSERT INTO market_users (
    auth_user_id,
    organization_id,
    user_type,
    email,
    display_name,
    avatar_url,
    phone,
    country,
    is_agent,
    company_name
  ) VALUES (
    p_auth_user_id,
    p_organization_id,
    'internal_agent',
    v_user.email,
    COALESCE(v_user.full_name, v_user.email),
    v_user.avatar_url,
    v_user.phone,
    COALESCE((v_user.settings->>'country')::TEXT, 'ES'),
    true,
    v_user.org_name
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = EXCLUDED.auth_user_id,
    organization_id = EXCLUDED.organization_id,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    phone = EXCLUDED.phone,
    company_name = EXCLUDED.company_name,
    updated_at = NOW()
  RETURNING id INTO v_market_user_id;
  
  RETURN v_market_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;