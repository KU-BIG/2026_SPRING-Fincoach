/// <reference types="vite/client" />

interface ImportMetaEnv {
  /* Base URL for the FinCoach backend. Empty in dev (Vite proxies /api) and in
     production unless a tunnel is configured for live data. */
  readonly VITE_API_BASE?: string;
  /* Supabase project URL + publishable (anon) key. Present only in the
     real-service build; absent in the demo build (auth stays disabled). */
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
