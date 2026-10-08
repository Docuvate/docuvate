/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCREENSHOT_ASSET_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
