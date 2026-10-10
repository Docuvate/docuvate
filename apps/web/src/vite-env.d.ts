// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/// <reference types="vite/client" />

declare const __DOCUVATE_BUILD_SHA__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_BUILD_SHA?: string;
  readonly VITE_DOCUVATE_BUILD_SHA?: string;
  readonly VITE_CONNECTORS_OAUTH_SETUP_DOC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __DOCUVATE_BUILD_SHA__?: string;
}
