// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';

import { LocaleSwitcher } from '../layout/LocaleSwitcher';
import { Logo } from '../ui/Logo';

export interface FullPageErrorShellProps {
  children: ReactNode;
  testId?: string;
  embedded?: boolean;
}

export function FullPageErrorShell({ children, testId, embedded = false }: FullPageErrorShellProps) {
  if (embedded) {
    return (
      <div className="full-page-error-scene full-page-error-scene--embedded" data-testid={testId}>
        {children}
      </div>
    );
  }

  return (
    <div className="full-page-error-shell" data-testid={testId}>
      <div className="full-page-error-topbar">
        <Logo type="full" className="full-page-error-logo" />
        <LocaleSwitcher />
      </div>
      <div className="full-page-error-scene">{children}</div>
    </div>
  );
}
