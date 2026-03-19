import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://uaqniahteuzhetuyzvak.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInR5cCI6IkpXVCJ9";

// Temporary loose typing: the generated database types are currently incomplete
// and were breaking the whole preview with "from(...): never" errors.
export const supabase = createClient(SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});