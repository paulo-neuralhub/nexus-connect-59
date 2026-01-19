-- ============================================
-- AI TRANSLATIONS SYSTEM
-- ============================================

-- Translation Glossaries
CREATE TABLE public.ai_translation_glossaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  
  name VARCHAR(200) NOT NULL,
  source_language VARCHAR(5) NOT NULL,
  target_language VARCHAR(5) NOT NULL,
  domain VARCHAR(50), -- 'patents', 'trademarks', 'contracts', 'general'
  
  is_public BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Glossary Terms
CREATE TABLE public.ai_glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  glossary_id UUID NOT NULL REFERENCES public.ai_translation_glossaries(id) ON DELETE CASCADE,
  
  source_term VARCHAR(500) NOT NULL,
  target_term VARCHAR(500) NOT NULL,
  context TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translations
CREATE TABLE public.ai_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Languages
  source_language VARCHAR(5) NOT NULL,
  target_language VARCHAR(5) NOT NULL,
  
  -- Content
  document_type VARCHAR(50) NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT,
  
  -- Quality
  confidence_score DECIMAL(3,2),
  word_count INTEGER,
  character_count INTEGER,
  
  -- Legal
  disclaimer_accepted BOOLEAN DEFAULT false,
  disclaimer_accepted_at TIMESTAMPTZ,
  
  -- Glossary
  glossary_id UUID REFERENCES public.ai_translation_glossaries(id),
  terms_used JSONB DEFAULT '[]',
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending',
  processing_time_ms INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS for glossaries
ALTER TABLE public.ai_translation_glossaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public or own glossaries"
ON public.ai_translation_glossaries FOR SELECT
USING (
  is_public = true 
  OR user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create glossaries"
ON public.ai_translation_glossaries FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own glossaries"
ON public.ai_translation_glossaries FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own glossaries"
ON public.ai_translation_glossaries FOR DELETE
USING (user_id = auth.uid() AND is_official = false);

-- RLS for glossary terms
ALTER TABLE public.ai_glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view terms of accessible glossaries"
ON public.ai_glossary_terms FOR SELECT
USING (
  glossary_id IN (
    SELECT id FROM public.ai_translation_glossaries 
    WHERE is_public = true 
      OR user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
      )
  )
);

CREATE POLICY "Users can manage terms of own glossaries"
ON public.ai_glossary_terms FOR ALL
USING (
  glossary_id IN (
    SELECT id FROM public.ai_translation_glossaries WHERE user_id = auth.uid()
  )
);

-- RLS for translations
ALTER TABLE public.ai_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own translations"
ON public.ai_translations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create translations"
ON public.ai_translations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own translations"
ON public.ai_translations FOR UPDATE
USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_ai_translations_user ON public.ai_translations(user_id);
CREATE INDEX idx_ai_translations_org ON public.ai_translations(organization_id);
CREATE INDEX idx_ai_translations_status ON public.ai_translations(status);
CREATE INDEX idx_ai_glossary_terms_glossary ON public.ai_glossary_terms(glossary_id);
CREATE INDEX idx_ai_glossaries_languages ON public.ai_translation_glossaries(source_language, target_language);

-- Insert official IP glossary ES-EN
INSERT INTO public.ai_translation_glossaries (name, source_language, target_language, domain, is_public, is_official)
VALUES 
  ('Glosario Oficial PI ES-EN', 'es', 'en', 'general', true, true),
  ('Glosario Oficial PI EN-ES', 'en', 'es', 'general', true, true);

-- Insert common IP terms (ES-EN)
INSERT INTO public.ai_glossary_terms (glossary_id, source_term, target_term, context)
SELECT g.id, t.source_term, t.target_term, t.context
FROM public.ai_translation_glossaries g
CROSS JOIN (VALUES
  ('marca registrada', 'registered trademark', 'IP registration'),
  ('marca notoria', 'well-known trademark', 'Trademark law'),
  ('solicitud de marca', 'trademark application', 'Filing'),
  ('reivindicación', 'claim', 'Patent law'),
  ('reivindicación independiente', 'independent claim', 'Patent drafting'),
  ('reivindicación dependiente', 'dependent claim', 'Patent drafting'),
  ('estado de la técnica', 'prior art', 'Patent examination'),
  ('novedad', 'novelty', 'Patentability'),
  ('actividad inventiva', 'inventive step', 'European patent law'),
  ('no obviedad', 'non-obviousness', 'US patent law'),
  ('cesión', 'assignment', 'IP transfers'),
  ('licencia', 'license', 'IP licensing'),
  ('licenciatario', 'licensee', 'Licensing'),
  ('licenciante', 'licensor', 'Licensing'),
  ('royalty', 'royalty', 'Licensing fees'),
  ('infracción', 'infringement', 'IP litigation'),
  ('demanda por infracción', 'infringement lawsuit', 'Litigation'),
  ('oposición', 'opposition', 'Trademark/patent proceedings'),
  ('cancelación', 'cancellation', 'IP proceedings'),
  ('nulidad', 'nullity', 'IP invalidity'),
  ('caducidad', 'lapse', 'IP expiration'),
  ('renovación', 'renewal', 'IP maintenance'),
  ('prioridad', 'priority', 'Paris Convention'),
  ('fecha de prioridad', 'priority date', 'Filing dates'),
  ('clases de Niza', 'Nice classes', 'Trademark classification'),
  ('distintividad', 'distinctiveness', 'Trademark registrability'),
  ('signos distintivos', 'distinctive signs', 'Trademark law'),
  ('secreto comercial', 'trade secret', 'Confidential information'),
  ('patente de utilidad', 'utility patent', 'Patent types'),
  ('patente de diseño', 'design patent', 'US design protection'),
  ('modelo de utilidad', 'utility model', 'Minor invention'),
  ('diseño industrial', 'industrial design', 'Design protection'),
  ('derechos de autor', 'copyright', 'Literary/artistic works'),
  ('obra derivada', 'derivative work', 'Copyright law'),
  ('dominio público', 'public domain', 'Expired IP'),
  ('libertad de operación', 'freedom to operate', 'FTO analysis'),
  ('acción de oficina', 'office action', 'Examination procedure'),
  ('examinador', 'examiner', 'Patent/trademark office'),
  ('concesión', 'grant', 'IP approval'),
  ('denegación', 'refusal', 'IP rejection')
) AS t(source_term, target_term, context)
WHERE g.source_language = 'es' AND g.target_language = 'en';