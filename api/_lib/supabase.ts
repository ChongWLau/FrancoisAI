import { createClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service role key (bypasses RLS).
// Never import this from src/ — it must stay server-side only.
export const db = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
) as any // eslint-disable-line @typescript-eslint/no-explicit-any
