/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_ENV?: 'dev' | 'stage' | 'prod';
}

declare const __APP_VERSION__: string;
