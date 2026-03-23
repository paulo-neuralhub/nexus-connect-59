-- Función RAG híbrida multi-nivel (corregida)
CREATE OR REPLACE FUNCTION genius_hybrid_search(
  p_query_text    text,
  p_org_id        uuid,
  p_matter_id     uuid    DEFAULT NULL,
  p_user_id       uuid    DEFAULT NULL,
  p_limit         integer DEFAULT 8
)
RETURNS TABLE (
  content     text,
  title       text,
  source      text,
  level       text,
  relevance   float
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT sub.content, sub.title, sub.source, sub.level, sub.relevance
  FROM (
    -- Nivel 1: Conocimiento global (full-text)
    SELECT
      gkg.content,
      gkg.title,
      COALESCE(gkg.source_name, 'global') AS source,
      'global'::text AS level,
      ts_rank(
        to_tsvector('spanish',
          COALESCE(gkg.title,'') || ' ' || COALESCE(gkg.content,'')),
        plainto_tsquery('spanish', p_query_text)
      )::float AS relevance
    FROM genius_knowledge_global gkg
    WHERE gkg.is_active = true
      AND to_tsvector('spanish',
            COALESCE(gkg.title,'') || ' ' || COALESCE(gkg.content,''))
          @@ plainto_tsquery('spanish', p_query_text)

    UNION ALL

    -- Nivel 2: Conocimiento del despacho (full-text, boosted x1.2)
    SELECT
      gkt.content_chunk,
      gkt.title,
      'tenant'::text,
      'tenant'::text,
      (ts_rank(
        to_tsvector('spanish',
          COALESCE(gkt.title,'') || ' ' || COALESCE(gkt.content_chunk,'')),
        plainto_tsquery('spanish', p_query_text)
      ) * 1.2)::float
    FROM genius_knowledge_tenant gkt
    WHERE gkt.organization_id = p_org_id
      AND to_tsvector('spanish',
            COALESCE(gkt.title,'') || ' ' || COALESCE(gkt.content_chunk,''))
          @@ plainto_tsquery('spanish', p_query_text)

    UNION ALL

    -- Nivel 3: Documentos del expediente (si aplica)
    SELECT
      de.chunk_text,
      md.name,
      'matter'::text,
      'matter'::text,
      0.9::float
    FROM document_embeddings de
    JOIN matter_documents md ON de.document_id = md.id
    WHERE p_matter_id IS NOT NULL
      AND md.matter_id = p_matter_id
      AND de.chunk_text ILIKE '%' || split_part(p_query_text,' ',1) || '%'

    UNION ALL

    -- Nivel 4: Memoria de conversación (si aplica)
    SELECT
      gcm.content,
      'Memoria'::text,
      'memory'::text,
      'memory'::text,
      (gcm.relevance_score * 0.8)::float
    FROM genius_conversation_memory gcm
    WHERE p_user_id IS NOT NULL
      AND gcm.user_id = p_user_id
      AND (gcm.expires_at IS NULL OR gcm.expires_at > now())
      AND gcm.relevance_score >= 0.65
  ) sub
  ORDER BY sub.relevance DESC
  LIMIT p_limit;
$$;