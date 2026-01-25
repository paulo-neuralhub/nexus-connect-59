-- =============================================
-- SEED: Industrial Design Services
-- =============================================

INSERT INTO service_catalog (
  organization_id, preconfigured_code, name, description, category, subcategory,
  base_price, includes_official_fees, official_fees_note,
  estimated_duration, generates_matter, default_matter_type,
  applicable_offices, is_active, is_preconfigured, display_order
) VALUES
-- Registration
(NULL, 'DS_REGISTER_ES',
 'Registro diseño industrial España',
 'Solicitud de registro de diseño industrial ante OEPM.',
 'designs', 'registration',
 450.00, true, 'Tasas OEPM: desde 93,54€',
 '2-4 meses', true, 'design',
 ARRAY['OEPM'], false, true, 2000),

(NULL, 'DS_REGISTER_EU',
 'Registro diseño comunitario (RCD)',
 'Solicitud de Dibujo o Modelo Comunitario Registrado ante EUIPO.',
 'designs', 'registration',
 550.00, true, 'Tasas EUIPO: desde 350€',
 '1-2 semanas', true, 'design',
 ARRAY['EUIPO'], false, true, 2010),

(NULL, 'DS_REGISTER_HAGUE',
 'Registro diseño internacional (Hague)',
 'Solicitud de diseño industrial vía Sistema de La Haya.',
 'designs', 'registration',
 750.00, true, 'Tasas OMPI: según designaciones',
 '6-12 meses', true, 'design',
 ARRAY['WIPO'], false, true, 2020),

-- Renewals
(NULL, 'DS_RENEWAL_ES',
 'Renovación diseño España',
 'Renovación de diseño industrial por período de 5 años.',
 'designs', 'renewals',
 175.00, true, 'Tasa renovación: según período',
 '1-2 meses', false, NULL,
 ARRAY['OEPM'], false, true, 2100),

(NULL, 'DS_RENEWAL_EU',
 'Renovación diseño comunitario',
 'Renovación de RCD por período de 5 años.',
 'designs', 'renewals',
 250.00, true, 'Tasa EUIPO: desde 90€',
 '1-2 semanas', false, NULL,
 ARRAY['EUIPO'], false, true, 2101)
ON CONFLICT (preconfigured_code) DO NOTHING;

-- =============================================
-- SEED: Domain Name Services
-- =============================================

INSERT INTO service_catalog (
  organization_id, preconfigured_code, name, description, category, subcategory,
  base_price, includes_official_fees, official_fees_note,
  estimated_duration, generates_matter, default_matter_type,
  is_active, is_preconfigured, display_order
) VALUES
(NULL, 'DOM_REGISTER',
 'Registro de dominio',
 'Gestión de registro de nombre de dominio (.com, .es, .eu, etc.).',
 'domains', 'registration',
 75.00, true, 'Precio dominio según extensión',
 '24-48 horas', false, NULL, false, true, 3000),

(NULL, 'DOM_RECOVERY_UDRP',
 'Recuperación de dominio (UDRP)',
 'Procedimiento de resolución de disputas por dominio .com/.net ante OMPI.',
 'domains', 'disputes',
 2500.00, true, 'Tasa OMPI: desde $1,500',
 '2-4 meses', true, 'domain_dispute', false, true, 3100),

(NULL, 'DOM_RECOVERY_ADR',
 'Recuperación de dominio .eu (ADR)',
 'Procedimiento de resolución de disputas por dominio .eu.',
 'domains', 'disputes',
 1800.00, true, 'Tasa CAC: desde 1.300€',
 '2-4 meses', true, 'domain_dispute', false, true, 3101),

(NULL, 'DOM_WATCHING',
 'Vigilancia de dominios',
 'Monitorización de registros de dominios similares a tu marca.',
 'domains', 'watching',
 45.00, false, NULL,
 'Suscripción mensual', false, NULL, false, true, 3200)
ON CONFLICT (preconfigured_code) DO NOTHING;

-- =============================================
-- SEED: General/Other Services - Enforcement
-- =============================================

INSERT INTO service_catalog (
  organization_id, preconfigured_code, name, description, category, subcategory,
  base_price, includes_official_fees, official_fees_note,
  estimated_duration, generates_matter,
  is_active, is_preconfigured, display_order
) VALUES
(NULL, 'GEN_CEASE_DESIST',
 'Carta cease & desist',
 'Redacción y envío de carta de cese y desista por infracción de derechos de PI.',
 'other', 'enforcement',
 350.00, false, NULL,
 '2-5 días', false, false, true, 4000),

(NULL, 'GEN_RESPONSE_CEASE',
 'Respuesta a cease & desist',
 'Análisis y respuesta a carta de cese recibida de tercero.',
 'other', 'enforcement',
 450.00, false, NULL,
 '3-7 días', false, false, true, 4001),

(NULL, 'GEN_INFRINGEMENT_REPORT',
 'Informe de infracción',
 'Análisis detallado de posible infracción de derechos de PI con recomendaciones.',
 'other', 'enforcement',
 650.00, false, NULL,
 '1-2 semanas', false, false, true, 4002)
ON CONFLICT (preconfigured_code) DO NOTHING;

-- =============================================
-- SEED: General/Other Services - Advisory
-- =============================================

INSERT INTO service_catalog (
  organization_id, preconfigured_code, name, description, category, subcategory,
  base_price, includes_official_fees, official_fees_note,
  estimated_duration, generates_matter,
  is_active, is_preconfigured, display_order
) VALUES
(NULL, 'GEN_DUE_DILIGENCE',
 'Due diligence de PI',
 'Auditoría completa de cartera de propiedad intelectual para operaciones corporativas.',
 'other', 'advisory',
 2500.00, false, NULL,
 '2-4 semanas', false, false, true, 4100),

(NULL, 'GEN_VALUATION',
 'Valoración de activos PI',
 'Valoración económica de marcas, patentes u otros activos de PI.',
 'other', 'advisory',
 1800.00, false, NULL,
 '2-3 semanas', false, false, true, 4101),

(NULL, 'GEN_PORTFOLIO_AUDIT',
 'Auditoría de cartera PI',
 'Revisión y optimización de cartera de derechos de propiedad intelectual.',
 'other', 'advisory',
 950.00, false, NULL,
 '1-2 semanas', false, false, true, 4102),

(NULL, 'GEN_CONSULTATION_HOUR',
 'Consultoría PI (hora)',
 'Asesoramiento especializado en propiedad intelectual por hora.',
 'other', 'advisory',
 150.00, false, NULL,
 'Por hora', false, false, true, 4200),

(NULL, 'GEN_STRATEGY_SESSION',
 'Sesión estratégica PI',
 'Sesión de planificación estratégica de protección de PI para empresas.',
 'other', 'advisory',
 450.00, false, NULL,
 '2-3 horas', false, false, true, 4201)
ON CONFLICT (preconfigured_code) DO NOTHING;

-- =============================================
-- SEED: General/Other Services - Contracts
-- =============================================

INSERT INTO service_catalog (
  organization_id, preconfigured_code, name, description, category, subcategory,
  base_price, includes_official_fees, official_fees_note,
  estimated_duration, generates_matter,
  is_active, is_preconfigured, display_order
) VALUES
(NULL, 'GEN_NDA',
 'Acuerdo de confidencialidad (NDA)',
 'Redacción de acuerdo de confidencialidad para protección de información.',
 'other', 'contracts',
 250.00, false, NULL,
 '2-3 días', false, false, true, 4300),

(NULL, 'GEN_IP_ASSIGNMENT',
 'Contrato cesión derechos PI',
 'Redacción de contrato de cesión de derechos de propiedad intelectual.',
 'other', 'contracts',
 550.00, false, NULL,
 '3-5 días', false, false, true, 4301)
ON CONFLICT (preconfigured_code) DO NOTHING;

-- =============================================
-- SEED: General/Other Services - Training
-- =============================================

INSERT INTO service_catalog (
  organization_id, preconfigured_code, name, description, category, subcategory,
  base_price, includes_official_fees, official_fees_note,
  estimated_duration, generates_matter,
  is_active, is_preconfigured, display_order
) VALUES
(NULL, 'GEN_TRAINING_BASIC',
 'Formación básica PI (empresa)',
 'Sesión formativa sobre fundamentos de propiedad intelectual para equipos.',
 'other', 'training',
 750.00, false, NULL,
 '2-4 horas', false, false, true, 4400),

(NULL, 'GEN_TRAINING_ADVANCED',
 'Formación avanzada PI',
 'Programa formativo especializado en protección de PI.',
 'other', 'training',
 1500.00, false, NULL,
 '1 día', false, false, true, 4401)
ON CONFLICT (preconfigured_code) DO NOTHING;