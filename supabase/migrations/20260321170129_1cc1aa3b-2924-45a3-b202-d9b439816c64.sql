-- GENIUS-01 Phase 1: Core Tables + pgvector + RAG

-- 1. Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- TABLA 1: Knowledge base global (compartida)
CREATE TABLE IF NOT EXISTS genius_knowledge_global (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  knowledge_type text NOT NULL,
  jurisdiction_code text,
  document_category text,
  title text NOT NULL,
  content text NOT NULL,
  source_name text,
  source_url text,
  article_reference text,
  effective_date date,
  language text DEFAULT 'es',
  embedding vector(1536),
  is_active boolean DEFAULT true,
  last_verified_at date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 2: Knowledge base por tenant (AISLADA)
CREATE TABLE IF NOT EXISTS genius_knowledge_tenant (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  source_type text NOT NULL,
  source_id uuid,
  title text NOT NULL,
  content_chunk text NOT NULL,
  chunk_index integer DEFAULT 0,
  chunk_total integer DEFAULT 1,
  jurisdiction_code text,
  document_type text,
  embedding vector(1536),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- TABLA 3: Configuración Genius por tenant
CREATE TABLE IF NOT EXISTS genius_tenant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  is_active boolean DEFAULT false,
  plan_code text DEFAULT 'genius_starter',
  max_queries_per_month integer DEFAULT 50,
  max_documents_per_month integer DEFAULT 10,
  max_actions_per_month integer DEFAULT 20,
  current_month_queries integer DEFAULT 0,
  current_month_documents integer DEFAULT 0,
  current_month_actions integer DEFAULT 0,
  current_month_reset_at timestamptz DEFAULT date_trunc('month', now()),
  feature_document_generation boolean DEFAULT true,
  feature_app_actions boolean DEFAULT false,
  feature_proactive_analysis boolean DEFAULT false,
  feature_web_search boolean DEFAULT true,
  preferred_language text DEFAULT 'es',
  disclaimer_accepted boolean DEFAULT false,
  disclaimer_accepted_at timestamptz,
  disclaimer_accepted_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 4: Conversaciones (aisladas por tenant)
CREATE TABLE IF NOT EXISTS genius_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  context_type text DEFAULT 'general',
  context_matter_id uuid REFERENCES matters(id),
  title text,
  status text DEFAULT 'active',
  message_count integer DEFAULT 0,
  total_tokens_used integer DEFAULT 0,
  total_cost_eur numeric(10,6) DEFAULT 0,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 5: Mensajes (INMUTABLES — sin updated_at)
CREATE TABLE IF NOT EXISTS genius_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  conversation_id uuid NOT NULL REFERENCES genius_conversations(id),
  role text NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'text',
  document_type text,
  document_jurisdiction text,
  document_language text,
  proposed_action text,
  action_data jsonb,
  action_status text DEFAULT 'pending',
  action_executed_at timestamptz,
  rag_sources jsonb DEFAULT '[]',
  model_used text,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  cost_eur numeric(10,6) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- TABLA 6: Documentos generados con workflow
CREATE TABLE IF NOT EXISTS genius_generated_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  conversation_id uuid REFERENCES genius_conversations(id),
  matter_id uuid REFERENCES matters(id),
  document_type text NOT NULL,
  jurisdiction_code text,
  language text DEFAULT 'es',
  title text NOT NULL,
  content_markdown text,
  content_html text,
  status text DEFAULT 'draft',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  sent_at timestamptz,
  model_used text,
  rag_sources_used jsonb DEFAULT '[]',
  generation_prompt_hash text,
  version integer DEFAULT 1,
  parent_doc_id uuid REFERENCES genius_generated_docs(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);