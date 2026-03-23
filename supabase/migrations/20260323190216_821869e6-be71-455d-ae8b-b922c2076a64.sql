-- GIN indexes for full-text search on genius knowledge tables
CREATE INDEX IF NOT EXISTS idx_gkg_fts ON genius_knowledge_global USING gin (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_gkt_fts ON genius_knowledge_tenant USING gin (to_tsvector('english', content_chunk));
