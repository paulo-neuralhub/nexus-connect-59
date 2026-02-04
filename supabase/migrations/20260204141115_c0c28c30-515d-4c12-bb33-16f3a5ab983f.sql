-- ============================================================
-- ADD MISSING JURISDICTIONS TO SUPPORT FULL WIZARD SELECTION
-- Adding ~35 missing countries to prevent FK constraint errors
-- ============================================================

-- Europa faltantes
INSERT INTO jurisdictions (code, name, name_en, name_es, jurisdiction_type, tier, region, office_acronym, flag_emoji, flag_code, is_active, sort_order, supports_trademarks, supports_patents, supports_designs, supports_utility_models, is_madrid_member, is_pct_member, is_paris_member, trademark_duration_years, patent_duration_years, paris_priority_months_tm, paris_priority_months_pt, paris_priority_months_ds, price_monthly)
VALUES
  ('BE', 'Bélgica (BOIP)', 'Belgium', 'Bélgica', 'country', 2, 'europe', 'BOIP', '🇧🇪', 'be', true, 100, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('CH', 'Suiza (IGE)', 'Switzerland', 'Suiza', 'country', 2, 'europe', 'IGE', '🇨🇭', 'ch', true, 101, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('AT', 'Austria (ÖPA)', 'Austria', 'Austria', 'country', 2, 'europe', 'ÖPA', '🇦🇹', 'at', true, 102, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('SE', 'Suecia (PRV)', 'Sweden', 'Suecia', 'country', 2, 'europe', 'PRV', '🇸🇪', 'se', true, 103, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('DK', 'Dinamarca (DKPTO)', 'Denmark', 'Dinamarca', 'country', 2, 'europe', 'DKPTO', '🇩🇰', 'dk', true, 104, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('NO', 'Noruega (NIPO)', 'Norway', 'Noruega', 'country', 2, 'europe', 'NIPO', '🇳🇴', 'no', true, 105, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('FI', 'Finlandia (PRH)', 'Finland', 'Finlandia', 'country', 2, 'europe', 'PRH', '🇫🇮', 'fi', true, 106, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('PL', 'Polonia (UPRP)', 'Poland', 'Polonia', 'country', 2, 'europe', 'UPRP', '🇵🇱', 'pl', true, 107, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('CZ', 'Rep. Checa (ÚPVČR)', 'Czech Republic', 'República Checa', 'country', 2, 'europe', 'ÚPVČR', '🇨🇿', 'cz', true, 108, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('IE', 'Irlanda (IPOI)', 'Ireland', 'Irlanda', 'country', 2, 'europe', 'IPOI', '🇮🇪', 'ie', true, 109, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('GR', 'Grecia (OBI)', 'Greece', 'Grecia', 'country', 2, 'europe', 'OBI', '🇬🇷', 'gr', true, 110, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('TR', 'Turquía (TÜRKPATENT)', 'Turkey', 'Turquía', 'country', 2, 'europe', 'TÜRKPATENT', '🇹🇷', 'tr', true, 111, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('RU', 'Rusia (ROSPATENT)', 'Russia', 'Rusia', 'country', 2, 'europe', 'ROSPATENT', '🇷🇺', 'ru', true, 112, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0)
ON CONFLICT (code) DO NOTHING;

-- América faltantes
INSERT INTO jurisdictions (code, name, name_en, name_es, jurisdiction_type, tier, region, office_acronym, flag_emoji, flag_code, is_active, sort_order, supports_trademarks, supports_patents, supports_designs, supports_utility_models, is_madrid_member, is_pct_member, is_paris_member, trademark_duration_years, patent_duration_years, paris_priority_months_tm, paris_priority_months_pt, paris_priority_months_ds, price_monthly)
VALUES
  ('AR', 'Argentina (INPI)', 'Argentina', 'Argentina', 'country', 2, 'LATAM', 'INPI', '🇦🇷', 'ar', true, 120, true, true, true, true, false, false, true, 10, 20, 6, 12, 6, 0),
  ('CL', 'Chile (INAPI)', 'Chile', 'Chile', 'country', 2, 'LATAM', 'INAPI', '🇨🇱', 'cl', true, 121, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('PE', 'Perú (INDECOPI)', 'Peru', 'Perú', 'country', 2, 'LATAM', 'INDECOPI', '🇵🇪', 'pe', true, 122, true, true, true, true, false, true, true, 10, 20, 6, 12, 6, 0)
ON CONFLICT (code) DO NOTHING;

-- Asia-Pacífico faltantes
INSERT INTO jurisdictions (code, name, name_en, name_es, jurisdiction_type, tier, region, office_acronym, flag_emoji, flag_code, is_active, sort_order, supports_trademarks, supports_patents, supports_designs, supports_utility_models, is_madrid_member, is_pct_member, is_paris_member, trademark_duration_years, patent_duration_years, paris_priority_months_tm, paris_priority_months_pt, paris_priority_months_ds, price_monthly)
VALUES
  ('NZ', 'Nueva Zelanda (IPONZ)', 'New Zealand', 'Nueva Zelanda', 'country', 2, 'asia_pacific', 'IPONZ', '🇳🇿', 'nz', true, 130, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('SG', 'Singapur (IPOS)', 'Singapore', 'Singapur', 'country', 2, 'asia_pacific', 'IPOS', '🇸🇬', 'sg', true, 131, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('HK', 'Hong Kong (HKIPD)', 'Hong Kong', 'Hong Kong', 'country', 2, 'asia_pacific', 'HKIPD', '🇭🇰', 'hk', true, 132, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('TW', 'Taiwán (TIPO)', 'Taiwan', 'Taiwán', 'country', 2, 'asia_pacific', 'TIPO', '🇹🇼', 'tw', true, 133, true, true, true, true, false, false, false, 10, 20, 6, 12, 6, 0),
  ('TH', 'Tailandia (DIP)', 'Thailand', 'Tailandia', 'country', 2, 'asia_pacific', 'DIP', '🇹🇭', 'th', true, 134, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('MY', 'Malasia (MyIPO)', 'Malaysia', 'Malasia', 'country', 2, 'asia_pacific', 'MyIPO', '🇲🇾', 'my', true, 135, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('ID', 'Indonesia (DGIP)', 'Indonesia', 'Indonesia', 'country', 2, 'asia_pacific', 'DGIP', '🇮🇩', 'id', true, 136, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('PH', 'Filipinas (IPOPHL)', 'Philippines', 'Filipinas', 'country', 2, 'asia_pacific', 'IPOPHL', '🇵🇭', 'ph', true, 137, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('VN', 'Vietnam (NOIP)', 'Vietnam', 'Vietnam', 'country', 2, 'asia_pacific', 'NOIP', '🇻🇳', 'vn', true, 138, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0)
ON CONFLICT (code) DO NOTHING;

-- África y Medio Oriente
INSERT INTO jurisdictions (code, name, name_en, name_es, jurisdiction_type, tier, region, office_acronym, flag_emoji, flag_code, is_active, sort_order, supports_trademarks, supports_patents, supports_designs, supports_utility_models, is_madrid_member, is_pct_member, is_paris_member, trademark_duration_years, patent_duration_years, paris_priority_months_tm, paris_priority_months_pt, paris_priority_months_ds, price_monthly)
VALUES
  ('ZA', 'Sudáfrica (CIPC)', 'South Africa', 'Sudáfrica', 'country', 2, 'africa', 'CIPC', '🇿🇦', 'za', true, 140, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('AE', 'Emiratos Árabes (MOE)', 'United Arab Emirates', 'Emiratos Árabes', 'country', 2, 'middle_east', 'MOE', '🇦🇪', 'ae', true, 141, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('SA', 'Arabia Saudí (SAIP)', 'Saudi Arabia', 'Arabia Saudita', 'country', 2, 'middle_east', 'SAIP', '🇸🇦', 'sa', true, 142, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0),
  ('IL', 'Israel (ILPO)', 'Israel', 'Israel', 'country', 2, 'middle_east', 'ILPO', '🇮🇱', 'il', true, 143, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0)
ON CONFLICT (code) DO NOTHING;

-- Regionales
INSERT INTO jurisdictions (code, name, name_en, name_es, jurisdiction_type, tier, region, office_acronym, flag_emoji, flag_code, is_active, sort_order, supports_trademarks, supports_patents, supports_designs, supports_utility_models, is_madrid_member, is_pct_member, is_paris_member, trademark_duration_years, patent_duration_years, paris_priority_months_tm, paris_priority_months_pt, paris_priority_months_ds, price_monthly)
VALUES
  ('OAPI', 'OAPI (África)', 'OAPI', 'OAPI', 'regional', 1, 'africa', 'OAPI', '🌍', 'oapi', true, 150, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('ARIPO', 'ARIPO (África)', 'ARIPO', 'ARIPO', 'regional', 1, 'africa', 'ARIPO', '🌍', 'aripo', true, 151, true, true, true, true, true, true, true, 10, 20, 6, 12, 6, 0),
  ('EAPO', 'Euroasiática (EAPO)', 'EAPO', 'EAPO', 'regional', 1, 'europe', 'EAPO', '🌏', 'eapo', true, 152, false, true, false, false, false, true, true, 10, 20, 6, 12, 6, 0),
  ('GCC', 'Golfo (GCC)', 'GCC Patent Office', 'Oficina de Patentes del Golfo', 'regional', 1, 'middle_east', 'GCC-PO', '🌍', 'gcc', true, 153, false, true, false, false, false, true, true, 10, 20, 6, 12, 6, 0),
  ('WO', 'Internacional (WIPO)', 'WIPO', 'OMPI', 'international', 1, 'international', 'WIPO', '🌍', 'wo', true, 5, true, true, true, false, true, true, true, 10, 20, 6, 12, 6, 0)
ON CONFLICT (code) DO NOTHING;