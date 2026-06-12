/// <reference types="vite/client" />

interface ImportMetaEnv {
  /* Base URL for the FinCoach backend. Empty in dev (Vite proxies /api) and in
     production unless a tunnel is configured for live data. */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
