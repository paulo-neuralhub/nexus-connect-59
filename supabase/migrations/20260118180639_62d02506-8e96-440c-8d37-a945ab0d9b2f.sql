-- =====================================================
-- CONVERSACIONES DE IA
-- =====================================================
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadata
  title TEXT,
  agent_type TEXT NOT NULL DEFAULT 'legal' CHECK (agent_type IN (
    'guide',
    'ops',
    'legal',
    'watch',
    'docs'
  )),
  
  -- Contexto vinculado
  matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  document_id UUID REFERENCES matter_documents(id) ON DELETE SET NULL,
  
  -- Estado
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  is_starred BOOLEAN DEFAULT false,
  
  -- Métricas
  message_count INT DEFAULT 0,
  token_count INT DEFAULT 0,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MENSAJES
-- =====================================================
CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  
  -- Contenido
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- Metadata del mensaje
  tokens_used INT,
  model_used TEXT,
  
  -- Para respuestas con fuentes (RAG)
  sources JSONB DEFAULT '[]',
  
  -- Feedback
  feedback TEXT CHECK (feedback IN ('positive', 'negative')),
  feedback_comment TEXT,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BASE DE CONOCIMIENTO LEGAL
-- =====================================================
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Categorización
  category TEXT NOT NULL CHECK (category IN (
    'legislation',
    'case_law',
    'guidelines',
    'treaties',
    'procedures',
    'forms',
    'glossary',
    'faq'
  )),
  
  -- Metadata
  title TEXT NOT NULL,
  description TEXT,
  jurisdiction TEXT,
  source TEXT,
  source_url TEXT,
  
  -- Contenido
  content TEXT NOT NULL,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'markdown', 'html')),
  
  -- Para búsqueda
  language TEXT DEFAULT 'es',
  tags TEXT[] DEFAULT '{}',
  
  -- Vigencia
  effective_date DATE,
  expiry_date DATE,
  is_current BOOLEAN DEFAULT true,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =====================================================
-- CHUNKS DE DOCUMENTOS PARA RAG
-- =====================================================
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Origen
  source_type TEXT NOT NULL CHECK (source_type IN (
    'knowledge_base',
    'matter_document',
    'uploaded_file'
  )),
  source_id UUID NOT NULL,
  
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Contenido
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  tokens INT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PLANTILLAS DE PROMPTS
-- =====================================================
CREATE TABLE ai_prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Configuración
  agent_type TEXT NOT NULL,
  category TEXT,
  
  -- Prompt
  system_prompt TEXT NOT NULL,
  user_prompt_template TEXT,
  
  -- Parámetros por defecto
  default_model TEXT DEFAULT 'claude-3-sonnet',
  default_temperature DECIMAL DEFAULT 0.3,
  max_tokens INT DEFAULT 4000,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- USO DE IA (para límites y billing)
-- =====================================================
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Periodo
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Contadores
  messages_count INT DEFAULT 0,
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  
  -- Por tipo de operación
  chat_messages INT DEFAULT 0,
  document_analyses INT DEFAULT 0,
  document_generations INT DEFAULT 0,
  
  -- Costes estimados (en centavos)
  estimated_cost_cents INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, user_id, period_start)
);

-- =====================================================
-- DOCUMENTOS GENERADOS POR IA
-- =====================================================
CREATE TABLE ai_generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
  
  -- Tipo de documento
  document_type TEXT NOT NULL CHECK (document_type IN (
    'opposition',
    'response',
    'renewal',
    'assignment',
    'license',
    'coexistence',
    'cease_desist',
    'watch_report',
    'valuation',
    'summary',
    'custom'
  )),
  
  -- Contenido
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_format TEXT DEFAULT 'markdown',
  
  -- Vinculación
  matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
  
  -- Versiones
  version INT DEFAULT 1,
  parent_id UUID REFERENCES ai_generated_documents(id),
  
  -- Estado
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'exported')),
  
  -- Auditoría
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_ai_conversations_org ON ai_conversations(organization_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_matter ON ai_conversations(matter_id);
CREATE INDEX idx_ai_conversations_updated ON ai_conversations(updated_at DESC);
CREATE INDEX idx_ai_conversations_agent ON ai_conversations(agent_type);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON ai_messages(created_at);

CREATE INDEX idx_knowledge_base_category ON knowledge_base(category);
CREATE INDEX idx_knowledge_base_jurisdiction ON knowledge_base(jurisdiction);
CREATE INDEX idx_knowledge_base_tags ON knowledge_base USING GIN(tags);

CREATE INDEX idx_document_chunks_source ON document_chunks(source_type, source_id);
CREATE INDEX idx_document_chunks_org ON document_chunks(organization_id);

CREATE INDEX idx_ai_usage_org_period ON ai_usage(organization_id, period_start);

CREATE INDEX idx_ai_generated_docs_org ON ai_generated_documents(organization_id);
CREATE INDEX idx_ai_generated_docs_matter ON ai_generated_documents(matter_id);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_documents ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversations
CREATE POLICY "Users view own conversations" ON ai_conversations 
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users create own conversations" ON ai_conversations 
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own conversations" ON ai_conversations 
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users delete own conversations" ON ai_conversations 
  FOR DELETE USING (user_id = auth.uid());

-- Policies for ai_messages
CREATE POLICY "Users view conversation messages" ON ai_messages 
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
  );
CREATE POLICY "Users add messages" ON ai_messages 
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
  );
CREATE POLICY "Users update messages" ON ai_messages 
  FOR UPDATE USING (
    conversation_id IN (SELECT id FROM ai_conversations WHERE user_id = auth.uid())
  );

-- Policies for knowledge_base (public read)
CREATE POLICY "Public knowledge base read" ON knowledge_base 
  FOR SELECT USING (true);

-- Policies for ai_prompt_templates (public read)
CREATE POLICY "Public prompt templates read" ON ai_prompt_templates 
  FOR SELECT USING (true);

-- Policies for document_chunks
CREATE POLICY "Org document chunks" ON document_chunks 
  FOR SELECT USING (
    organization_id IS NULL OR
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- Policies for ai_usage
CREATE POLICY "View own usage" ON ai_usage 
  FOR SELECT USING (user_id = auth.uid());

-- Policies for ai_generated_documents
CREATE POLICY "View org generated docs" ON ai_generated_documents 
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "Create org generated docs" ON ai_generated_documents 
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "Update org generated docs" ON ai_generated_documents 
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );
CREATE POLICY "Delete org generated docs" ON ai_generated_documents 
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Actualizar contadores de conversación
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations SET
    message_count = message_count + 1,
    token_count = token_count + COALESCE(NEW.tokens_used, 0),
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ai_message_stats
  AFTER INSERT ON ai_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_stats();

-- Auto-generar título si no existe
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' THEN
    UPDATE ai_conversations SET
      title = COALESCE(title, LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END)
    WHERE id = NEW.conversation_id AND title IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ai_message_auto_title
  AFTER INSERT ON ai_messages
  FOR EACH ROW EXECUTE FUNCTION auto_title_conversation();

-- =====================================================
-- DATOS INICIALES - PLANTILLAS DE PROMPTS
-- =====================================================
INSERT INTO ai_prompt_templates (code, name, description, agent_type, category, system_prompt, user_prompt_template) VALUES

-- NEXUS GUIDE
('guide_help', 'Ayuda General', 'Responde preguntas sobre uso de la plataforma', 'guide', 'help',
'Eres NEXUS GUIDE, el asistente de ayuda de IP-NEXUS. Tu función es ayudar a los usuarios a usar la plataforma.
- Explica funcionalidades de forma clara y concisa
- Proporciona pasos detallados cuando sea necesario
- Si no conoces algo específico de la plataforma, indícalo
- Sé amable y paciente
- Responde en el idioma del usuario',
NULL),

-- NEXUS OPS
('ops_portfolio', 'Consulta de Cartera', 'Consulta expedientes, plazos y estado', 'ops', 'query',
'Eres NEXUS OPS, el asistente operativo de IP-NEXUS. Tienes acceso a la cartera de PI del usuario.
- Responde consultas sobre expedientes, plazos, renovaciones
- Proporciona datos precisos de la base de datos
- Alerta sobre plazos próximos o vencidos
- Sugiere acciones cuando detectes riesgos
- Responde en el idioma del usuario

CARTERA DEL USUARIO:
{{portfolio_context}}',
'{{user_query}}'),

-- NEXUS LEGAL
('legal_query', 'Consulta Legal', 'Responde preguntas legales sobre PI', 'legal', 'research',
'Eres NEXUS LEGAL, el asesor legal de IP-NEXUS especializado en Propiedad Intelectual.
- Responde consultas sobre marcas, patentes, diseños, derechos de autor
- Cita fuentes legales cuando sea posible (leyes, jurisprudencia)
- Indica claramente cuando algo es una opinión vs un hecho legal
- Advierte que tus respuestas no sustituyen asesoramiento legal profesional
- Adapta la complejidad al nivel del usuario
- Responde en el idioma del usuario

BASE DE CONOCIMIENTO:
{{knowledge_context}}',
'{{user_query}}'),

('legal_analyze_trademark', 'Análisis de Marca', 'Analiza registrabilidad de una marca', 'legal', 'analysis',
'Eres NEXUS LEGAL analizando la registrabilidad de una marca.
Evalúa:
1. Distintividad (descriptiva, genérica, sugestiva, arbitraria, fantasía)
2. Posibles prohibiciones absolutas
3. Riesgo de confusión con marcas existentes
4. Recomendaciones de clases Niza
5. Estrategia de protección

Sé objetivo y menciona tanto fortalezas como debilidades.
Responde en el idioma del usuario.',
'Analiza la registrabilidad de la marca "{{mark_name}}" para {{goods_services}} en {{jurisdiction}}'),

('legal_draft_opposition', 'Borrador Oposición', 'Genera borrador de escrito de oposición', 'legal', 'drafting',
'Eres NEXUS LEGAL redactando un escrito de oposición.
El documento debe incluir:
1. Encabezamiento formal
2. Identificación de las partes
3. Hechos
4. Fundamentos de derecho
5. Solicitud

Usa lenguaje jurídico apropiado pero claro.
Responde en el idioma del usuario.',
'Redacta un escrito de oposición contra la marca "{{opposed_mark}}" basándose en nuestra marca "{{own_mark}}".

Motivos: {{opposition_grounds}}

Jurisdicción: {{jurisdiction}}'),

-- NEXUS WATCH
('watch_conflict', 'Análisis de Conflicto', 'Analiza riesgo de conflicto entre marcas', 'watch', 'analysis',
'Eres NEXUS WATCH analizando un posible conflicto de marcas.
Evalúa:
1. Similitud denominativa (fonética, ortográfica)
2. Similitud gráfica (si aplica)
3. Similitud conceptual
4. Identidad/similitud de productos/servicios
5. Público relevante
6. Riesgo global de confusión
7. Recomendación de acción

Sé preciso y fundamenta tu análisis.
Responde en el idioma del usuario.',
'Analiza el conflicto entre:
- Nuestra marca: {{own_mark}}
- Marca detectada: {{detected_mark}}
- Clases en conflicto: {{classes}}'),

-- NEXUS DOCS
('docs_extract', 'Extracción de Datos', 'Extrae datos estructurados de documentos', 'docs', 'extraction',
'Eres NEXUS DOCS extrayendo información de un documento legal de PI.
Extrae y estructura:
- Tipo de documento
- Partes involucradas
- Fechas relevantes
- Números de expediente/registro
- Plazos
- Obligaciones clave
- Cualquier otro dato relevante

Responde en formato estructurado.
Responde en el idioma del usuario.',
'Extrae la información clave del siguiente documento:

{{document_content}}'),

('docs_summarize', 'Resumen de Documento', 'Resume documentos legales', 'docs', 'summary',
'Eres NEXUS DOCS resumiendo un documento legal.
El resumen debe:
- Ser conciso pero completo
- Destacar los puntos más importantes
- Identificar acciones requeridas si las hay
- Mantener precisión legal

Responde en el idioma del usuario.',
'Resume el siguiente documento:

{{document_content}}');

-- =====================================================
-- DATOS INICIALES - BASE DE CONOCIMIENTO
-- =====================================================
INSERT INTO knowledge_base (category, title, jurisdiction, source, language, content, tags) VALUES

('legislation', 'Ley de Marcas - Art. 4 Concepto de marca', 'ES', 'OEPM', 'es',
'Artículo 4. Concepto de marca.
1. Se entiende por marca todo signo susceptible de representación gráfica que sirva para distinguir en el mercado los productos o servicios de una empresa de los de otras.
2. Tales signos podrán, en particular, ser:
a) Las palabras o combinaciones de palabras, incluidas las que sirven para identificar a las personas.
b) Las imágenes, figuras, símbolos y dibujos.
c) Las letras, las cifras y sus combinaciones.
d) Las formas tridimensionales entre las que se incluyen los envoltorios, los envases y la forma del producto o de su presentación.
e) Los sonidos.
f) Cualquier combinación de los signos que, con carácter enunciativo, se mencionan en los apartados anteriores.',
ARRAY['marca', 'concepto', 'definición', 'signos distintivos']),

('legislation', 'Reglamento de Marca UE - Art. 8 Motivos de denegación relativos', 'EU', 'EUIPO', 'es',
'Artículo 8. Motivos de denegación relativos.
1. Mediando oposición del titular de una marca anterior, se denegará el registro de la marca:
a) cuando sea idéntica a la marca anterior y los productos o servicios para los que se solicita el registro de la marca sean idénticos a los productos o servicios para los cuales esté protegida la marca anterior;
b) cuando, por ser idéntica o similar a la marca anterior y por ser idénticos o similares los productos o servicios que ambas marcas designan, exista riesgo de confusión por parte del público en el territorio en que esté protegida la marca anterior; el riesgo de confusión incluye el riesgo de asociación con la marca anterior.',
ARRAY['marca UE', 'oposición', 'motivos relativos', 'riesgo confusión']),

('guidelines', 'EUIPO - Directrices examen marcas - Similitud signos', 'EU', 'EUIPO', 'es',
'La apreciación global del riesgo de confusión debe basarse en la impresión de conjunto producida por los signos, teniendo en cuenta sus elementos distintivos y dominantes.

El consumidor medio normalmente percibe una marca como un todo, sin detenerse a examinar sus diversos detalles.

Para apreciar la similitud entre dos marcas hay que tener en cuenta:
- Similitud visual: comparación de la estructura, longitud y elementos gráficos
- Similitud fonética: comparación del sonido al pronunciar las marcas
- Similitud conceptual: comparación del significado o idea que transmiten

Basta con que exista similitud en uno de estos aspectos para que pueda existir riesgo de confusión.',
ARRAY['similitud', 'signos', 'visual', 'fonética', 'conceptual', 'EUIPO']);