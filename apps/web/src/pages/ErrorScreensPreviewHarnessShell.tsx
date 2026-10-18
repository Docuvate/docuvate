// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';

import { ToastProvider } from '../components/save/ToastProvider';

/** Minimal chrome for offline screenshot capture (no auth, no header). */
export function ErrorScreensPreviewHarnessShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="app-shell">
        <main className="app-main app-main--harness">{children}</main>
      </div>
    </ToastProvider>
  );
}
