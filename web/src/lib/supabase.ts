import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* Supabase client. Configured only when both env vars are present:
   - real-service build (deploy-app.yml injects them) -> auth enabled
   - demo build (deploy-web.yml, no vars) -> client is null, auth disabled,
     so the demo keeps its original placeholder buttons untouched.
   The publishable/anon key is safe in the bundle by design; per-user security
   is enforced by Postgres Row Level Security, not by hiding the key. */
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
