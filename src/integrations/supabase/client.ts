import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uaqniahteuzhetuyzvak.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcW5pYWh0ZXV6aGV0dXl6dmFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NTI5MjEsImV4cCI6MjA4OTQyODkyMX0.3z-NyjVkjqUMOIER-q2bVrWTf3M3RbZecJ1erinb0M8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
