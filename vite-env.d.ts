/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_INSTAGRAM_WA_TOKEN: string;
  readonly VITE_FACEBOOK_PRODUCTION_TOKEN: string;
  readonly VITE_X_API_KEY: string;
  readonly VITE_X_API_SECRET: string;
  readonly VITE_X_ACCESS_TOKEN: string;
  readonly VITE_X_ACCESS_SECRET: string;
  readonly VITE_INSTAGRAM_BUSINESS_ID: string;
  readonly VITE_FACEBOOK_PAGE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
