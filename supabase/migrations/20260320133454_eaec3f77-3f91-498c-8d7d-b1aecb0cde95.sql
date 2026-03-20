-- =====================================================
-- SEED: 24 AI Providers
-- =====================================================
INSERT INTO ai_providers (code, name, base_url, is_gateway, supports_chat, supports_embeddings, supports_vision, supports_tools, status, health_status, config, description, category, website)
VALUES
('anthropic', 'Anthropic', 'https://api.anthropic.com', false, true, false, true, true, 'active', 'unknown', '{}', 'Proveedor principal. Claude Opus/Sonnet/Haiku 4.5. Tool use robusto, visión, PDFs.', 'llm', 'https://anthropic.com'),
('openai', 'OpenAI', 'https://api.openai.com', false, true, true, true, true, 'active', 'unknown', '{}', 'GPT-4o, GPT-4o-mini, o1, o3-mini. Embeddings text-embedding-3.', 'llm', 'https://openai.com'),
('google', 'Google AI', 'https://generativelanguage.googleapis.com', false, true, true, true, true, 'active', 'unknown', '{}', 'Gemini 2.0 Flash/Pro. Context hasta 2M tokens. Google Search grounding.', 'llm', 'https://ai.google.dev'),
('deepseek', 'DeepSeek', 'https://api.deepseek.com', false, true, false, false, true, 'active', 'unknown', '{}', 'DeepSeek-V3, R1. Excelente razonamiento y código. MUY barato.', 'llm', 'https://deepseek.com'),
('mistral', 'Mistral AI', 'https://api.mistral.ai', false, true, true, true, true, 'active', 'unknown', '{}', 'Empresa europea. GDPR nativo. Excelente en idiomas europeos.', 'llm', 'https://mistral.ai'),
('perplexity', 'Perplexity AI', 'https://api.perplexity.ai', false, true, false, false, false, 'active', 'unknown', '{}', 'Especialista en búsqueda web con citas verificables.', 'search', 'https://perplexity.ai'),
('qwen', 'Alibaba Qwen', 'https://dashscope-intl.aliyuncs.com/compatible-mode', false, true, true, true, true, 'active', 'unknown', '{}', 'Qwen2.5 Max/Plus, QwQ. Fuerte en chino/asiático.', 'llm', 'https://qwen.ai'),
('kimi', 'Moonshot AI (Kimi)', 'https://api.moonshot.cn', false, true, false, false, true, 'active', 'unknown', '{}', 'Kimi K2. Modelo agéntico fuerte. MCP nativo.', 'llm', 'https://kimi.ai'),
('meta_together', 'Meta (via Together AI)', 'https://api.together.xyz', false, true, true, true, true, 'active', 'unknown', '{}', 'Llama 4 Maverick/Scout. Open source. Context 1M.', 'llm', 'https://together.ai'),
('xai', 'xAI', 'https://api.x.ai', false, true, false, true, true, 'active', 'unknown', '{}', 'Grok 2. Acceso a datos de X/Twitter en tiempo real.', 'llm', 'https://x.ai'),
('groq', 'Groq', 'https://api.groq.com/openai', false, true, false, true, true, 'active', 'unknown', '{}', 'Inference ULTRA-RÁPIDA con LPUs. Latencia <100ms.', 'llm', 'https://groq.com'),
('openrouter', 'OpenRouter', 'https://openrouter.ai/api', true, true, false, true, true, 'active', 'unknown', '{}', 'Gateway multi-modelo. Acceso a 100+ modelos con una sola API key.', 'llm', 'https://openrouter.ai'),
('serper', 'Serper', 'https://google.serper.dev', false, false, false, false, false, 'inactive', 'unknown', '{}', 'API de búsqueda Google SERP. Rápida y económica.', 'search', 'https://serper.dev'),
('tavily', 'Tavily', 'https://api.tavily.com', false, false, false, false, false, 'inactive', 'unknown', '{}', 'Búsqueda AI-optimizada. Ideal para agentes.', 'search', 'https://tavily.com'),
('brave_search', 'Brave Search', 'https://api.search.brave.com', false, false, false, false, false, 'inactive', 'unknown', '{}', 'Búsqueda independiente. Sin tracking. API gratuita generosa.', 'search', 'https://brave.com/search/api'),
('exa', 'Exa', 'https://api.exa.ai', false, false, false, false, false, 'inactive', 'unknown', '{}', 'Búsqueda neural. Encuentra contenido semánticamente relevante.', 'search', 'https://exa.ai'),
('google_vision', 'Google Cloud Vision', 'https://vision.googleapis.com', false, false, false, true, false, 'inactive', 'unknown', '{}', 'OCR y análisis de imágenes. Detección de texto, logos, objetos.', 'vision', 'https://cloud.google.com/vision'),
('google_docai', 'Google Document AI', 'https://documentai.googleapis.com', false, false, false, true, false, 'inactive', 'unknown', '{}', 'Procesamiento inteligente de documentos. Extracción de datos estructurados.', 'vision', 'https://cloud.google.com/document-ai'),
('aws_textract', 'AWS Textract', 'https://textract.amazonaws.com', false, false, false, true, false, 'inactive', 'unknown', '{}', 'OCR avanzado de AWS. Extracción de tablas, formularios y texto.', 'vision', 'https://aws.amazon.com/textract'),
('azure_vision', 'Azure Computer Vision', 'https://cognitiveservices.azure.com', false, false, false, true, false, 'inactive', 'unknown', '{}', 'OCR y análisis visual de Microsoft Azure. Read API 4.0.', 'vision', 'https://azure.microsoft.com/services/cognitive-services/computer-vision'),
('firecrawl', 'Firecrawl', 'https://api.firecrawl.dev', false, false, false, false, false, 'inactive', 'unknown', '{}', 'Web scraping con IA. Convierte páginas a markdown limpio.', 'scraping', 'https://firecrawl.dev'),
('apify', 'Apify', 'https://api.apify.com', false, false, false, false, false, 'inactive', 'unknown', '{}', 'Plataforma de web scraping y automatización. 1000+ actors.', 'scraping', 'https://apify.com'),
('scrapingbee', 'ScrapingBee', 'https://app.scrapingbee.com/api', false, false, false, false, false, 'inactive', 'unknown', '{}', 'Proxy + scraping API. Maneja JavaScript, captchas, rotación.', 'scraping', 'https://scrapingbee.com'),
('jina', 'Jina AI', 'https://api.jina.ai', false, false, true, false, false, 'inactive', 'unknown', '{}', 'Reader API: URL a texto limpio. Embeddings multimodales.', 'scraping', 'https://jina.ai')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, base_url = EXCLUDED.base_url, is_gateway = EXCLUDED.is_gateway,
  supports_chat = EXCLUDED.supports_chat, supports_embeddings = EXCLUDED.supports_embeddings,
  supports_vision = EXCLUDED.supports_vision, supports_tools = EXCLUDED.supports_tools,
  description = EXCLUDED.description, category = EXCLUDED.category, website = EXCLUDED.website,
  updated_at = now();

-- =====================================================
-- SEED: 17 AI Models
-- =====================================================
INSERT INTO ai_models (provider_id, model_id, name, model_name, family, tier, context_window, max_output_tokens,
  input_cost_per_1m, output_cost_per_1m, capabilities, is_active, is_default_for_provider, speed_rating, quality_rating,
  supports_vision, supports_function_calling, description)
VALUES
((SELECT id FROM ai_providers WHERE code='anthropic'), 'claude-sonnet-4-5-20250929', 'Claude Sonnet 4.5', 'Claude Sonnet 4.5', 'sonnet', 'standard', 200000, 16000, 3.00, 15.00, '{"chat":true,"vision":true,"tool_use":true,"pdf_input":true,"reasoning":true,"code":true}', true, true, 70, 88, true, true, 'Mejor equilibrio calidad/precio. Chat, redacción, traducción.'),
((SELECT id FROM ai_providers WHERE code='anthropic'), 'claude-haiku-4-5-20251001', 'Claude Haiku 4.5', 'Claude Haiku 4.5', 'haiku', 'economy', 200000, 8192, 0.80, 4.00, '{"chat":true,"vision":true,"tool_use":true,"pdf_input":true,"code":true}', true, false, 95, 72, true, true, 'Ultra-rápido y barato. Clasificación, extracción, routing.'),
((SELECT id FROM ai_providers WHERE code='openai'), 'gpt-4o', 'GPT-4o', 'GPT-4o', 'gpt-4o', 'standard', 128000, 16384, 2.50, 10.00, '{"chat":true,"vision":true,"tool_use":true,"pdf_input":true,"code":true,"json_mode":true}', true, true, 75, 87, true, true, 'Flagship OpenAI. Multimodal completo. Buena velocidad.'),
((SELECT id FROM ai_providers WHERE code='openai'), 'gpt-4o-mini', 'GPT-4o Mini', 'GPT-4o Mini', 'gpt-4o-mini', 'economy', 128000, 16384, 0.15, 0.60, '{"chat":true,"vision":true,"tool_use":true,"code":true,"json_mode":true}', true, false, 92, 70, true, true, 'Ultra-barato. Alternativa a Haiku.'),
((SELECT id FROM ai_providers WHERE code='google'), 'gemini-2.0-flash', 'Gemini 2.0 Flash', 'Gemini 2.0 Flash', 'gemini-2.0', 'economy', 1048576, 8192, 0.10, 0.40, '{"chat":true,"vision":true,"tool_use":true,"pdf_input":true,"code":true,"web_search":true}', true, true, 95, 73, true, true, 'Context 1M tokens. Ultra-barato. Web search integrado.'),
((SELECT id FROM ai_providers WHERE code='google'), 'gemini-2.5-pro', 'Gemini 2.5 Pro', 'Gemini 2.5 Pro', 'gemini-2.5', 'standard', 2097152, 8192, 1.25, 10.00, '{"chat":true,"vision":true,"tool_use":true,"pdf_input":true,"code":true,"web_search":true,"reasoning":true}', true, false, 70, 85, true, true, 'Context 2M tokens. Ideal para documentos muy largos.'),
((SELECT id FROM ai_providers WHERE code='deepseek'), 'deepseek-chat', 'DeepSeek V3', 'DeepSeek V3', 'deepseek-v3', 'economy', 65536, 8192, 0.27, 1.10, '{"chat":true,"tool_use":true,"code":true,"reasoning":true}', true, true, 85, 76, false, true, 'Calidad/precio excepcional. Fuerte en código y razonamiento.'),
((SELECT id FROM ai_providers WHERE code='deepseek'), 'deepseek-reasoner', 'DeepSeek R1', 'DeepSeek R1', 'deepseek-r1', 'standard', 65536, 8192, 0.55, 2.19, '{"chat":true,"reasoning":true,"code":true,"math":true}', true, false, 60, 78, false, false, 'Razonamiento profundo tipo o1. Mucho más barato.'),
((SELECT id FROM ai_providers WHERE code='perplexity'), 'sonar-pro', 'Sonar Pro', 'Sonar Pro', 'sonar', 'standard', 200000, 8000, 3.00, 15.00, '{"chat":true,"web_search":true,"citations":true}', true, true, 65, 75, false, false, 'ESPECIALISTA búsqueda web con citas. Research y datos actuales.'),
((SELECT id FROM ai_providers WHERE code='perplexity'), 'sonar', 'Sonar', 'Sonar', 'sonar', 'economy', 128000, 8000, 1.00, 1.00, '{"chat":true,"web_search":true,"citations":true}', true, false, 80, 65, false, false, 'Búsqueda web económica. Verificaciones rápidas.'),
((SELECT id FROM ai_providers WHERE code='qwen'), 'qwen-max', 'Qwen2.5 Max', 'Qwen2.5 Max', 'qwen-2.5', 'standard', 131072, 8192, 1.60, 6.40, '{"chat":true,"vision":true,"tool_use":true,"code":true,"reasoning":true}', true, true, 70, 82, true, true, 'Fuerte en chino/asiático. Buen multilingual.'),
((SELECT id FROM ai_providers WHERE code='kimi'), 'kimi-k2', 'Kimi K2', 'Kimi K2', 'kimi', 'standard', 131072, 8192, 0.60, 2.40, '{"chat":true,"tool_use":true,"code":true,"reasoning":true}', true, true, 75, 78, false, true, 'Agéntico fuerte. MCP nativo.'),
((SELECT id FROM ai_providers WHERE code='mistral'), 'mistral-large-latest', 'Mistral Large', 'Mistral Large', 'mistral-large', 'standard', 131072, 8192, 2.00, 6.00, '{"chat":true,"vision":true,"tool_use":true,"code":true}', true, true, 72, 83, true, true, 'Europeo. GDPR nativo.'),
((SELECT id FROM ai_providers WHERE code='meta_together'), 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8', 'Llama 4 Maverick', 'Llama 4 Maverick', 'llama-4', 'economy', 1048576, 8192, 0.27, 0.85, '{"chat":true,"vision":true,"tool_use":true,"code":true}', true, true, 82, 75, true, true, 'Open source. Context 1M.'),
((SELECT id FROM ai_providers WHERE code='xai'), 'grok-2', 'Grok 2', 'Grok 2', 'grok', 'standard', 131072, 8192, 2.00, 10.00, '{"chat":true,"vision":true,"tool_use":true,"code":true,"web_search":true}', true, true, 70, 80, true, true, 'Datos de X/Twitter en tiempo real.'),
((SELECT id FROM ai_providers WHERE code='groq'), 'llama-3.3-70b-versatile', 'Llama 3.3 70B (Groq)', 'Llama 3.3 70B (Groq)', 'llama-3.3', 'economy', 131072, 8192, 0.59, 0.79, '{"chat":true,"tool_use":true,"code":true}', true, true, 98, 72, false, true, 'ULTRA-RÁPIDA <100ms.')
ON CONFLICT (provider_id, model_id) DO UPDATE SET
  name = EXCLUDED.name, model_name = EXCLUDED.model_name, family = EXCLUDED.family, tier = EXCLUDED.tier,
  context_window = EXCLUDED.context_window, max_output_tokens = EXCLUDED.max_output_tokens,
  input_cost_per_1m = EXCLUDED.input_cost_per_1m, output_cost_per_1m = EXCLUDED.output_cost_per_1m,
  capabilities = EXCLUDED.capabilities, is_active = EXCLUDED.is_active,
  is_default_for_provider = EXCLUDED.is_default_for_provider, speed_rating = EXCLUDED.speed_rating,
  quality_rating = EXCLUDED.quality_rating, supports_vision = EXCLUDED.supports_vision,
  supports_function_calling = EXCLUDED.supports_function_calling, description = EXCLUDED.description,
  updated_at = now();

-- =====================================================
-- SEED: 12 AI Tasks
-- =====================================================
INSERT INTO ai_tasks (task_code, name, task_name, description, category, icon, is_active, module, primary_model, primary_provider, temperature, max_tokens)
VALUES
('LEGAL_ANALYSIS', 'Análisis Legal', 'Análisis Legal', 'Análisis legal de marcas, patentes y diseños industriales', 'analysis', 'Scale', true, 'legal', 'claude-sonnet-4-5-20250929', 'anthropic', 0.2, 8192),
('WEB_SEARCH', 'Búsqueda Web', 'Búsqueda Web IA', 'Búsquedas web especializadas en PI', 'search', 'Search', true, 'competitive_intelligence', 'sonar-pro', 'perplexity', 0.3, 4096),
('OCR_DOCUMENTS', 'OCR Documentos', 'OCR de Documentos', 'Extracción de texto y datos de documentos escaneados', 'vision', 'FileText', true, 'document_processing', 'gemini-2.0-flash', 'google', 0.1, 8192),
('GENERATE_DOCUMENTS', 'Generación Documentos', 'Generador de Documentos', 'Generación de borradores legales, informes y escritos', 'generation', 'FileEdit', true, 'document_generation', 'gpt-4o', 'openai', 0.4, 16384),
('TRADEMARK_COMPARISON', 'Comparación Marcas', 'Comparador de Marcas', 'Análisis visual y fonético de similitud entre marcas', 'analysis', 'GitCompare', true, 'trademark_analysis', 'claude-sonnet-4-5-20250929', 'anthropic', 0.2, 4096),
('FEE_EXTRACTION', 'Extracción Tasas', 'Extractor de Tasas', 'Extracción y normalización de tasas de oficinas de PI', 'classification', 'Calculator', true, 'pricing', 'gemini-2.0-flash', 'google', 0.05, 4096),
('CHAT_ASSISTANT', 'Chat Asistente', 'Asistente de Chat', 'Asistente conversacional para usuarios', 'agent', 'MessageCircle', true, 'assistant', 'claude-haiku-4-5-20251001', 'anthropic', 0.5, 2048),
('CASE_REQUIREMENTS', 'Requisitos Caso', 'Analizador de Requisitos', 'Analiza requisitos para casos de registro por jurisdicción', 'analysis', 'ClipboardCheck', true, 'case_management', 'claude-sonnet-4-5-20250929', 'anthropic', 0.3, 4096),
('COMPETITOR_ANALYSIS', 'Análisis Competitivo', 'Análisis de Competidores', 'Investigación y análisis de competidores en mercados de PI', 'analysis', 'Users', true, 'competitive_intelligence', 'claude-sonnet-4-5-20250929', 'anthropic', 0.3, 10000),
('GENERATE_REPORT', 'Generación Informe', 'Generador de Informes', 'Generación de informes de inteligencia de mercado y PI', 'generation', 'BarChart', true, 'reporting', 'claude-sonnet-4-5-20250929', 'anthropic', 0.4, 8192),
('EMAIL_DRAFTING', 'Redacción Email', 'Redactor de Emails', 'Redacción de emails profesionales de PI', 'generation', 'Mail', true, 'communications', 'gpt-4o', 'openai', 0.4, 4096),
('TRANSLATION', 'Traducción', 'Traductor Legal', 'Traducción especializada de documentos legales de PI', 'generation', 'Languages', true, 'translation', 'claude-sonnet-4-5-20250929', 'anthropic', 0.2, 8192)
ON CONFLICT (task_code) DO UPDATE SET
  name = EXCLUDED.name, task_name = EXCLUDED.task_name, description = EXCLUDED.description,
  category = EXCLUDED.category, icon = EXCLUDED.icon, is_active = EXCLUDED.is_active,
  module = EXCLUDED.module, primary_model = EXCLUDED.primary_model,
  primary_provider = EXCLUDED.primary_provider, temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens, updated_at = now();

-- =====================================================
-- SEED: 12 AI Function Configs
-- =====================================================
INSERT INTO ai_function_config (function_name, description, model, temperature, max_tokens, enabled, config)
VALUES
('legal_analysis', 'Análisis legal de marcas y patentes', 'claude-sonnet-4-5-20250929', 0.2, 8192, true, '{"provider":"anthropic","fallback":"gpt-4o"}'),
('web_search', 'Búsqueda web especializada en PI', 'sonar-pro', 0.3, 4096, true, '{"provider":"perplexity","fallback":"deepseek-chat"}'),
('document_ocr', 'OCR y extracción de documentos', 'gemini-2.0-flash', 0.1, 8192, true, '{"provider":"google","fallback":"gpt-4o"}'),
('document_generation', 'Generación de documentos legales', 'gpt-4o', 0.4, 16384, true, '{"provider":"openai","fallback":"claude-sonnet-4-5-20250929"}'),
('trademark_similarity', 'Análisis de similitud de marcas', 'claude-sonnet-4-5-20250929', 0.2, 4096, true, '{"provider":"anthropic","vision":true}'),
('fee_extraction', 'Extracción y normalización de tasas', 'gemini-2.0-flash', 0.05, 4096, true, '{"provider":"google","fallback":"deepseek-chat"}'),
('chat_assistant', 'Asistente conversacional', 'claude-haiku-4-5-20251001', 0.5, 2048, true, '{"provider":"anthropic","fallback":"gpt-4o-mini"}'),
('email_drafting', 'Redacción de emails profesionales', 'gpt-4o', 0.4, 4096, true, '{"provider":"openai","fallback":"claude-sonnet-4-5-20250929"}'),
('translation', 'Traducción especializada PI', 'claude-sonnet-4-5-20250929', 0.2, 8192, true, '{"provider":"anthropic","fallback":"gpt-4o"}'),
('meta_router', 'Clasificación y routing de solicitudes', 'claude-haiku-4-5-20251001', 0.1, 512, true, '{"provider":"anthropic","output_format":"json"}'),
('competitor_analysis', 'Análisis de competidores', 'claude-sonnet-4-5-20250929', 0.3, 10000, true, '{"provider":"anthropic","fallback":"gpt-4o"}'),
('report_generation', 'Generación de informes', 'claude-sonnet-4-5-20250929', 0.4, 8192, true, '{"provider":"anthropic","fallback":"gpt-4o"}')
ON CONFLICT (function_name) DO UPDATE SET
  description = EXCLUDED.description, model = EXCLUDED.model, temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens, enabled = EXCLUDED.enabled, config = EXCLUDED.config,
  updated_at = now();