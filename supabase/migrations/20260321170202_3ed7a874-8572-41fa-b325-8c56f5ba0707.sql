-- GENIUS-01 Phase 1b: RLS + Indexes + Functions + Seed

-- RLS
ALTER TABLE genius_knowledge_tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE genius_tenant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE genius_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE genius_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE genius_generated_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE genius_knowledge_global ENABLE ROW LEVEL SECURITY;

-- Tenant RLS policies
CREATE POLICY "genius_knowledge_tenant_org" ON genius_knowledge_tenant
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "genius_tenant_config_org" ON genius_tenant_config
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "genius_conversations_org" ON genius_conversations
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "genius_messages_org" ON genius_messages
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "genius_generated_docs_org" ON genius_generated_docs
  FOR ALL USING (organization_id = public.get_user_org_id());

-- Global knowledge policies
CREATE POLICY "genius_global_read" ON genius_knowledge_global
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "genius_global_admin_write" ON genius_knowledge_global
  FOR ALL USING (public.is_backoffice_staff());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_genius_tenant_org
  ON genius_knowledge_tenant(organization_id, jurisdiction_code);

CREATE INDEX IF NOT EXISTS idx_genius_messages_conv
  ON genius_messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_genius_docs_matter
  ON genius_generated_docs(matter_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_genius_conversations_org
  ON genius_conversations(organization_id, status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_genius_global_type_jur
  ON genius_knowledge_global(knowledge_type, jurisdiction_code, document_category);

-- Semantic search function
CREATE OR REPLACE FUNCTION genius_semantic_search(
  p_org_id uuid,
  p_query_embedding vector(1536),
  p_jurisdiction text DEFAULT NULL,
  p_doc_category text DEFAULT NULL,
  p_limit integer DEFAULT 8
)
RETURNS TABLE (
  source text, id uuid, title text, content text,
  jurisdiction_code text, article_reference text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 'global'::text, g.id, g.title, g.content,
    g.jurisdiction_code, g.article_reference,
    (1 - (g.embedding <=> p_query_embedding))::float as similarity
  FROM genius_knowledge_global g
  WHERE g.is_active = true
    AND g.embedding IS NOT NULL
    AND (p_jurisdiction IS NULL OR g.jurisdiction_code = p_jurisdiction
         OR g.jurisdiction_code IS NULL)
    AND (p_doc_category IS NULL OR g.document_category = p_doc_category)
    AND 1 - (g.embedding <=> p_query_embedding) > 0.70

  UNION ALL

  SELECT 'tenant'::text, t.id, t.title, t.content_chunk,
    t.jurisdiction_code, NULL::text,
    (1 - (t.embedding <=> p_query_embedding))::float as similarity
  FROM genius_knowledge_tenant t
  WHERE t.organization_id = p_org_id
    AND t.is_active = true
    AND t.embedding IS NOT NULL
    AND (p_jurisdiction IS NULL OR t.jurisdiction_code = p_jurisdiction)
    AND 1 - (t.embedding <=> p_query_embedding) > 0.70

  ORDER BY similarity DESC
  LIMIT p_limit;
END;
$$;

-- Increment counters function
CREATE OR REPLACE FUNCTION increment_genius_counter(
  p_org_id uuid,
  p_type text
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE genius_tenant_config
  SET
    current_month_queries = CASE
      WHEN p_type = 'query' THEN
        CASE WHEN current_month_reset_at < date_trunc('month', now())
          THEN 1 ELSE current_month_queries + 1 END
      ELSE current_month_queries END,
    current_month_documents = CASE
      WHEN p_type = 'document' THEN
        CASE WHEN current_month_reset_at < date_trunc('month', now())
          THEN 1 ELSE current_month_documents + 1 END
      ELSE current_month_documents END,
    current_month_actions = CASE
      WHEN p_type = 'action' THEN
        CASE WHEN current_month_reset_at < date_trunc('month', now())
          THEN 1 ELSE current_month_actions + 1 END
      ELSE current_month_actions END,
    current_month_reset_at = CASE
      WHEN current_month_reset_at < date_trunc('month', now())
      THEN date_trunc('month', now())
      ELSE current_month_reset_at END,
    updated_at = now()
  WHERE organization_id = p_org_id;
END;
$$;