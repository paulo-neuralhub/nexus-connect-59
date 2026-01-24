-- ============================================================
-- IP-NEXUS - DEADLINE RULES ENGINE - PARTE 1
-- Crear tablas base
-- ============================================================

-- Tipos de plazo (catálogo)
CREATE TABLE IF NOT EXISTS deadline_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name_es VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  category VARCHAR(20) NOT NULL CHECK (category IN ('filing', 'response', 'renewal', 'opposition', 'payment', 'other')),
  matter_types TEXT[] NOT NULL DEFAULT '{}',
  is_system BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Calendarios de festivos
CREATE TABLE IF NOT EXISTS holiday_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(200),
  is_national BOOLEAN DEFAULT true,
  region VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(country_code, date)
);

-- RLS
ALTER TABLE deadline_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE holiday_calendars ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "deadline_types_select" ON deadline_types;
CREATE POLICY "deadline_types_select" ON deadline_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "holiday_calendars_select" ON holiday_calendars;
CREATE POLICY "holiday_calendars_select" ON holiday_calendars FOR SELECT USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_holiday_calendars_lookup ON holiday_calendars(country_code, year, date);

-- ============================================================
-- SEED: Tipos de plazo estándar
-- ============================================================

INSERT INTO deadline_types (code, name_es, name_en, category, matter_types, sort_order) VALUES
('TM_FILING_RESPONSE', 'Respuesta requerimiento registro', 'Filing Response', 'response', '{trademark}', 10),
('TM_OPPOSITION_DEADLINE', 'Plazo oposición', 'Opposition Period', 'opposition', '{trademark}', 20),
('TM_OPPOSITION_RESPONSE', 'Respuesta a oposición', 'Opposition Response', 'response', '{trademark}', 30),
('TM_RENEWAL', 'Renovación marca', 'Trademark Renewal', 'renewal', '{trademark}', 40),
('TM_RENEWAL_GRACE', 'Renovación periodo gracia', 'Renewal Grace Period', 'renewal', '{trademark}', 50),
('TM_PROOF_OF_USE', 'Prueba de uso', 'Proof of Use', 'response', '{trademark}', 60),
('TM_DECLARATION_OF_USE', 'Declaración de uso (US)', 'Declaration of Use', 'filing', '{trademark}', 70),
('TM_SECTION_8', 'Declaración Sección 8 (US)', 'Section 8 Declaration', 'filing', '{trademark}', 75),
('TM_SECTION_15', 'Declaración Sección 15 (US)', 'Section 15 Declaration', 'filing', '{trademark}', 76),
('PT_FILING_RESPONSE', 'Respuesta requerimiento patente', 'Patent Filing Response', 'response', '{patent}', 100),
('PT_EXAMINATION_REQUEST', 'Solicitud examen', 'Examination Request', 'filing', '{patent}', 110),
('PT_ANNUITY', 'Anualidad patente', 'Patent Annuity', 'payment', '{patent}', 120),
('PT_PCT_NATIONAL_PHASE', 'Entrada fase nacional PCT', 'PCT National Phase Entry', 'filing', '{patent}', 130),
('PT_PRIORITY_CLAIM', 'Reivindicación prioridad', 'Priority Claim', 'filing', '{patent,trademark,design}', 140),
('PT_OPPOSITION', 'Plazo oposición patente', 'Patent Opposition', 'opposition', '{patent}', 150),
('PT_APPEAL', 'Recurso patente', 'Patent Appeal', 'response', '{patent}', 160),
('DS_RENEWAL', 'Renovación diseño', 'Design Renewal', 'renewal', '{design}', 200),
('DS_FILING_RESPONSE', 'Respuesta requerimiento diseño', 'Design Filing Response', 'response', '{design}', 210),
('DS_OPPOSITION', 'Plazo oposición diseño', 'Design Opposition', 'opposition', '{design}', 220),
('UM_ANNUITY', 'Anualidad modelo utilidad', 'Utility Model Annuity', 'payment', '{utility_model}', 300),
('UM_RENEWAL', 'Renovación modelo utilidad', 'Utility Model Renewal', 'renewal', '{utility_model}', 310),
('GEN_OFFICE_ACTION', 'Acción de oficio', 'Office Action', 'response', '{trademark,patent,design,utility_model}', 400),
('GEN_APPEAL', 'Plazo recurso', 'Appeal Deadline', 'response', '{trademark,patent,design,utility_model}', 410),
('GEN_PAYMENT', 'Pago tasas', 'Fee Payment', 'payment', '{trademark,patent,design,utility_model}', 420),
('GEN_SUBMISSION', 'Presentación documentos', 'Document Submission', 'filing', '{trademark,patent,design,utility_model}', 430)
ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  name_en = EXCLUDED.name_en,
  category = EXCLUDED.category,
  matter_types = EXCLUDED.matter_types;

-- ============================================================
-- SEED: Festivos 2025-2026
-- ============================================================

INSERT INTO holiday_calendars (country_code, year, date, name, is_national) VALUES
('ES', 2025, '2025-01-01', 'Año Nuevo', true),
('ES', 2025, '2025-01-06', 'Epifanía del Señor', true),
('ES', 2025, '2025-04-18', 'Viernes Santo', true),
('ES', 2025, '2025-05-01', 'Día del Trabajo', true),
('ES', 2025, '2025-08-15', 'Asunción de la Virgen', true),
('ES', 2025, '2025-10-12', 'Fiesta Nacional', true),
('ES', 2025, '2025-11-01', 'Todos los Santos', true),
('ES', 2025, '2025-12-06', 'Día de la Constitución', true),
('ES', 2025, '2025-12-08', 'Inmaculada Concepción', true),
('ES', 2025, '2025-12-25', 'Navidad', true),
('ES', 2026, '2026-01-01', 'Año Nuevo', true),
('ES', 2026, '2026-01-06', 'Epifanía del Señor', true),
('ES', 2026, '2026-04-03', 'Viernes Santo', true),
('ES', 2026, '2026-05-01', 'Día del Trabajo', true),
('ES', 2026, '2026-08-15', 'Asunción de la Virgen', true),
('ES', 2026, '2026-10-12', 'Fiesta Nacional', true),
('ES', 2026, '2026-11-01', 'Todos los Santos', true),
('ES', 2026, '2026-12-06', 'Día de la Constitución', true),
('ES', 2026, '2026-12-08', 'Inmaculada Concepción', true),
('ES', 2026, '2026-12-25', 'Navidad', true),
('EU', 2025, '2025-01-01', 'New Year', true),
('EU', 2025, '2025-04-18', 'Good Friday', true),
('EU', 2025, '2025-04-21', 'Easter Monday', true),
('EU', 2025, '2025-05-01', 'Labour Day', true),
('EU', 2025, '2025-12-25', 'Christmas', true),
('EU', 2025, '2025-12-26', 'St Stephens Day', true),
('EU', 2026, '2026-01-01', 'New Year', true),
('EU', 2026, '2026-04-03', 'Good Friday', true),
('EU', 2026, '2026-04-06', 'Easter Monday', true),
('EU', 2026, '2026-05-01', 'Labour Day', true),
('EU', 2026, '2026-12-25', 'Christmas', true),
('EU', 2026, '2026-12-26', 'St Stephens Day', true),
('US', 2025, '2025-01-01', 'New Year', true),
('US', 2025, '2025-01-20', 'Martin Luther King Jr. Day', true),
('US', 2025, '2025-02-17', 'Presidents Day', true),
('US', 2025, '2025-05-26', 'Memorial Day', true),
('US', 2025, '2025-07-04', 'Independence Day', true),
('US', 2025, '2025-09-01', 'Labor Day', true),
('US', 2025, '2025-10-13', 'Columbus Day', true),
('US', 2025, '2025-11-11', 'Veterans Day', true),
('US', 2025, '2025-11-27', 'Thanksgiving', true),
('US', 2025, '2025-12-25', 'Christmas', true),
('US', 2026, '2026-01-01', 'New Year', true),
('US', 2026, '2026-01-19', 'Martin Luther King Jr. Day', true),
('US', 2026, '2026-02-16', 'Presidents Day', true),
('US', 2026, '2026-05-25', 'Memorial Day', true),
('US', 2026, '2026-07-04', 'Independence Day', true),
('US', 2026, '2026-09-07', 'Labor Day', true),
('US', 2026, '2026-10-12', 'Columbus Day', true),
('US', 2026, '2026-11-11', 'Veterans Day', true),
('US', 2026, '2026-11-26', 'Thanksgiving', true),
('US', 2026, '2026-12-25', 'Christmas', true)
ON CONFLICT (country_code, date) DO NOTHING;