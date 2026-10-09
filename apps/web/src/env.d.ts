// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
/// <reference types="vite/client" />

declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare const __DOCUVATE_BUILD_SHA__: string;

interface Window {
  __DOCUVATE_BUILD_SHA__?: string;
}
