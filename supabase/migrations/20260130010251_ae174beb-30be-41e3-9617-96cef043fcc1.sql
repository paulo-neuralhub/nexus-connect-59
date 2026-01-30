-- L109: System Verification Tables
-- Create table to store system test results

CREATE TABLE IF NOT EXISTS public.system_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL,
  category TEXT NOT NULL,
  test_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'skipped', 'warning')),
  message TEXT,
  duration_ms INTEGER,
  details JSONB DEFAULT '{}',
  screenshot_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_system_tests_run_id ON public.system_tests(run_id);
CREATE INDEX idx_system_tests_category ON public.system_tests(category);
CREATE INDEX idx_system_tests_status ON public.system_tests(status);
CREATE INDEX idx_system_tests_created_at ON public.system_tests(created_at DESC);

-- Enable RLS
ALTER TABLE public.system_tests ENABLE ROW LEVEL SECURITY;

-- Allow super admins and backoffice users to manage tests
CREATE POLICY "Admins can manage system tests" ON public.system_tests
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.super_admins 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role full access" ON public.system_tests
  FOR ALL 
  USING (auth.role() = 'service_role');

-- Create a summary view for quick stats
CREATE OR REPLACE VIEW public.system_test_summary AS
SELECT 
  run_id,
  MIN(created_at) as started_at,
  MAX(created_at) as completed_at,
  COUNT(*) as total_tests,
  COUNT(*) FILTER (WHERE status = 'passed') as passed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'warning') as warnings,
  COUNT(*) FILTER (WHERE status = 'skipped') as skipped,
  ROUND(COUNT(*) FILTER (WHERE status = 'passed')::numeric / NULLIF(COUNT(*)::numeric, 0) * 100, 1) as pass_rate,
  SUM(duration_ms) as total_duration_ms
FROM public.system_tests
GROUP BY run_id
ORDER BY started_at DESC;

-- Grant access to the view
GRANT SELECT ON public.system_test_summary TO authenticated;