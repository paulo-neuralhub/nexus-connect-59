-- BLOQUE 9: Cron jobs for copilot learning

-- Cron: nightly learning at 2:00 AM UTC
SELECT cron.schedule(
  'copilot-learn-nightly',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://uaqniahteuzhetuyzvak.supabase.co/functions/v1/copilot-learn',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcW5pYWh0ZXV6aGV0dXl6dmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTI5MjEsImV4cCI6MjA4OTQyODkyMX0.3z-NyjVkjqUMOIER-q2bVrWTf3M3RbZecJ1erinb0M8"}'::jsonb,
    body := '{"run_for_all_orgs": true}'::jsonb
  );
  $$
);

-- Cron: GDPR cleanup every Sunday at 3:00 AM UTC
SELECT cron.schedule(
  'copilot-gdpr-cleanup',
  '0 3 * * 0',
  $$
  DELETE FROM copilot_context_events
  WHERE created_at < now() - interval '90 days';
  $$
);