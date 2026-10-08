/// <reference types="vite/client" />

declare const __DOCUVATE_BUILD_SHA__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_BUILD_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __DOCUVATE_BUILD_SHA__?: string;
}
