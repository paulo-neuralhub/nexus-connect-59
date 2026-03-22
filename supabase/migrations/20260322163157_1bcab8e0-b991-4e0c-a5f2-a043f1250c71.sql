
SELECT cron.schedule(
  'copilot-briefing-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://uaqniahteuzhetuyzvak.supabase.co/functions/v1/genius-briefing',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcW5pYWh0ZXV6aGV0dXl6dmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTI5MjEsImV4cCI6MjA4OTQyODkyMX0.3z-NyjVkjqUMOIER-q2bVrWTf3M3RbZecJ1erinb0M8"}'::jsonb,
    body := '{"run_for_all_orgs": true, "force": false}'::jsonb
  ) as request_id;
  $$
);
