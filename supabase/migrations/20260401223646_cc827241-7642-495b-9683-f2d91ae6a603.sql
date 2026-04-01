
-- ============================================================
-- GENIUS Copilot v2 — Ambient Intelligence tables
-- ============================================================

-- 1. copilot_suggestions
CREATE TABLE IF NOT EXISTS public.copilot_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL DEFAULT 'informational',
  title TEXT NOT NULL,
  body TEXT,
  action_primary_label TEXT,
  action_primary_url TEXT,
  action_secondary_label TEXT,
  action_secondary_url TEXT,
  matter_id UUID,
  crm_account_id UUID,
  trigger_source TEXT,
  confidence_score NUMERIC(5,2) DEFAULT 0,
  shown_at TIMESTAMPTZ,
  acted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_suggestions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_copilot_suggestions_org ON public.copilot_suggestions(organization_id);
CREATE INDEX idx_copilot_suggestions_user ON public.copilot_suggestions(user_id);
CREATE INDEX idx_copilot_suggestions_active ON public.copilot_suggestions(organization_id, dismissed_at, expires_at);

CREATE POLICY "Users see own org suggestions"
  ON public.copilot_suggestions FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
    AND (user_id = auth.uid() OR user_id IS NULL)
    AND dismissed_at IS NULL
    AND expires_at > now()
  );

CREATE POLICY "Users update own suggestions"
  ON public.copilot_suggestions FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
    AND (user_id = auth.uid() OR user_id IS NULL)
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()
    )
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

-- 2. copilot_user_preferences
CREATE TABLE IF NOT EXISTS public.copilot_user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  copilot_visible BOOLEAN DEFAULT true,
  copilot_position TEXT DEFAULT 'bottom-right',
  copilot_size TEXT DEFAULT 'default',
  bubble_state TEXT DEFAULT 'collapsed',
  suggestions_enabled BOOLEAN DEFAULT true,
  suggestion_confidence_threshold NUMERIC(5,2) DEFAULT 50,
  greeting_enabled BOOLEAN DEFAULT true,
  last_greeted_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own preferences"
  ON public.copilot_user_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own preferences"
  ON public.copilot_user_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users insert own preferences"
  ON public.copilot_user_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. copilot_context_events
CREATE TABLE IF NOT EXISTS public.copilot_context_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page_url TEXT,
  matter_id UUID,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_context_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own context events"
  ON public.copilot_context_events FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_copilot_context_events_user ON public.copilot_context_events(user_id, created_at DESC);
