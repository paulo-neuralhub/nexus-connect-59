-- ============================================================
-- P-SYSTEM-04: BACKOFFICE AI AGENT (DB) - FIXED v2
-- Fix generated column immutability by using a trigger-managed tsvector.
-- ============================================================

-- 0) Helper: updated_at trigger (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1) Helper: backoffice staff check
CREATE OR REPLACE FUNCTION public.is_backoffice_staff()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.superadmins s
    WHERE s.user_id = v_uid
      AND COALESCE(s.is_active, true) = true
  ) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.memberships m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.user_id = v_uid
      AND r.code IN ('platform_admin', 'platform_support', 'platform_sales', 'platform_finance')
  );
END;
$$;

-- 2) Knowledge Base (trigger-based search_vector)
CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  source text,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  search_vector tsvector
);

CREATE INDEX IF NOT EXISTS idx_ai_kb_category ON public.ai_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_ai_kb_search ON public.ai_knowledge_base USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_ai_kb_keywords ON public.ai_knowledge_base USING gin(keywords);

-- Maintain search_vector via trigger
CREATE OR REPLACE FUNCTION public.ai_kb_update_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.keywords, ' '), '')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_kb_search_vector ON public.ai_knowledge_base;
CREATE TRIGGER trg_ai_kb_search_vector
BEFORE INSERT OR UPDATE OF title, content, keywords
ON public.ai_knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.ai_kb_update_search_vector();

DROP TRIGGER IF EXISTS trg_ai_knowledge_base_updated_at ON public.ai_knowledge_base;
CREATE TRIGGER trg_ai_knowledge_base_updated_at
BEFORE UPDATE ON public.ai_knowledge_base
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Backoffice staff can read KB" ON public.ai_knowledge_base;
CREATE POLICY "Backoffice staff can read KB"
ON public.ai_knowledge_base
FOR SELECT
TO authenticated
USING (public.is_backoffice_staff());

DROP POLICY IF EXISTS "Backoffice staff can manage KB" ON public.ai_knowledge_base;
CREATE POLICY "Backoffice staff can manage KB"
ON public.ai_knowledge_base
FOR ALL
TO authenticated
USING (public.is_backoffice_staff())
WITH CHECK (public.is_backoffice_staff());

-- 3) Agent sessions/messages
CREATE TABLE IF NOT EXISTS public.ai_agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  context_organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  context_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  total_messages integer NOT NULL DEFAULT 0,
  total_tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_message_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_user ON public.ai_agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_org ON public.ai_agent_sessions(context_organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_sessions_last_msg ON public.ai_agent_sessions(last_message_at DESC);

DROP TRIGGER IF EXISTS trg_ai_agent_sessions_updated_at ON public.ai_agent_sessions;
CREATE TRIGGER trg_ai_agent_sessions_updated_at
BEFORE UPDATE ON public.ai_agent_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ai_agent_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Backoffice staff can access agent sessions" ON public.ai_agent_sessions;
CREATE POLICY "Backoffice staff can access agent sessions"
ON public.ai_agent_sessions
FOR ALL
TO authenticated
USING (public.is_backoffice_staff())
WITH CHECK (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_agent_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  tools_used jsonb NOT NULL DEFAULT '[]'::jsonb,
  referenced_organizations uuid[] NOT NULL DEFAULT '{}',
  referenced_events uuid[] NOT NULL DEFAULT '{}',
  tokens_used integer,
  response_time_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_agent_messages_session ON public.ai_agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_messages_created ON public.ai_agent_messages(created_at);

ALTER TABLE public.ai_agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Backoffice staff can access agent messages" ON public.ai_agent_messages;
CREATE POLICY "Backoffice staff can access agent messages"
ON public.ai_agent_messages
FOR ALL
TO authenticated
USING (public.is_backoffice_staff())
WITH CHECK (public.is_backoffice_staff());

-- 4) RPC: Knowledge search
CREATE OR REPLACE FUNCTION public.ai_search_knowledge(
  p_query text,
  p_category text DEFAULT NULL,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  relevance real
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_backoffice_staff() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    ts_rank(kb.search_vector, plainto_tsquery('spanish', p_query)) AS relevance
  FROM public.ai_knowledge_base kb
  WHERE kb.is_active = true
    AND (p_category IS NULL OR kb.category = p_category)
    AND kb.search_vector @@ plainto_tsquery('spanish', p_query)
  ORDER BY relevance DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 20);
END;
$$;

-- 5) RPC: org context (minimal)
CREATE OR REPLACE FUNCTION public.ai_get_organization_context(p_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_backoffice_staff() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT jsonb_build_object(
    'organization', (
      SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'created_at', o.created_at,
        'plan', o.plan,
        'status', o.status
      )
      FROM public.organizations o
      WHERE o.id = p_org_id
    ),
    'subscription', (
      SELECT jsonb_build_object(
        'plan', s.plan,
        'status', s.status,
        'current_period_start', s.current_period_start,
        'current_period_end', s.current_period_end,
        'cancel_at_period_end', s.cancel_at_period_end
      )
      FROM public.subscriptions s
      WHERE s.organization_id = p_org_id
      LIMIT 1
    ),
    'recent_events', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'type', e.event_type,
          'title', e.title,
          'severity', e.severity,
          'created_at', e.created_at
        ) ORDER BY e.created_at DESC
      ), '[]'::jsonb)
      FROM (
        SELECT event_type, title, severity, created_at
        FROM public.system_events
        WHERE organization_id = p_org_id
        ORDER BY created_at DESC
        LIMIT 10
      ) e
    ),
    'open_alerts', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'type', a.alert_type,
          'title', a.title,
          'priority', a.priority,
          'status', a.status,
          'created_at', a.created_at
        ) ORDER BY a.created_at DESC
      ), '[]'::jsonb)
      FROM public.system_alerts a
      WHERE a.organization_id = p_org_id
        AND a.status IN ('active', 'acknowledged', 'in_progress')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 6) RPC: global metrics (minimal)
CREATE OR REPLACE FUNCTION public.ai_get_global_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_backoffice_staff() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN jsonb_build_object(
    'timestamp', now(),
    'organizations', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM public.organizations),
      'new_this_month', (
        SELECT COUNT(*)
        FROM public.organizations
        WHERE created_at >= date_trunc('month', now())
      )
    ),
    'issues', jsonb_build_object(
      'critical_alerts', (
        SELECT COUNT(*)
        FROM public.system_alerts
        WHERE status = 'active' AND priority = 'critical'
      ),
      'open_alerts', (
        SELECT COUNT(*)
        FROM public.system_alerts
        WHERE status IN ('active', 'acknowledged', 'in_progress')
      ),
      'pending_events', (
        SELECT COUNT(*)
        FROM public.v_pending_events
      )
    )
  );
END;
$$;
