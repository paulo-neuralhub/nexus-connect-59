-- Monthly usage tracking for AI modules (assistant/genius)

CREATE TABLE IF NOT EXISTS public.ai_module_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NULL,
  user_id UUID NOT NULL,
  module_code TEXT NOT NULL,
  period_start DATE NOT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_module_usage_unique UNIQUE (user_id, module_code, period_start)
);

CREATE INDEX IF NOT EXISTS ai_module_usage_user_idx ON public.ai_module_usage (user_id);
CREATE INDEX IF NOT EXISTS ai_module_usage_module_idx ON public.ai_module_usage (module_code);
CREATE INDEX IF NOT EXISTS ai_module_usage_period_idx ON public.ai_module_usage (period_start);

DROP TRIGGER IF EXISTS trg_ai_module_usage_updated_at ON public.ai_module_usage;
CREATE TRIGGER trg_ai_module_usage_updated_at
BEFORE UPDATE ON public.ai_module_usage
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ai_module_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ai module usage" ON public.ai_module_usage;
CREATE POLICY "Users can view their own ai module usage"
ON public.ai_module_usage
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
