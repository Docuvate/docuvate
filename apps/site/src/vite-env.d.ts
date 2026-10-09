// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCREENSHOT_ASSET_SHA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
