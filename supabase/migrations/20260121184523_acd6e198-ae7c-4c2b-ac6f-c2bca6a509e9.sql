-- P77 follow-up: help_articles full-text search support + safer view count increment

-- Add generated tsvector column for search (used by client textSearch)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='help_articles' AND column_name='search_vector'
  ) THEN
    ALTER TABLE public.help_articles
      ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector(
          'spanish',
          coalesce(title_es, title, '') || ' ' || coalesce(content_es, content, '') || ' ' || coalesce(excerpt_es, excerpt, summary, '')
        )
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_help_articles_search_vector
  ON public.help_articles USING GIN (search_vector);
