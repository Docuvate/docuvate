// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';

import { LocaleSwitcher } from '../layout/LocaleSwitcher';
import { Card } from '../ui/Card';
import { Logo } from '../ui/Logo';

export interface FullPageErrorShellProps {
  children: ReactNode;
  testId?: string;
}

export function FullPageErrorShell({ children, testId }: FullPageErrorShellProps) {
  return (
    <div className="full-page-error-shell" data-testid={testId}>
      <div className="full-page-error-locale">
        <LocaleSwitcher />
      </div>
      <div className="full-page-error-inner">
        <Logo type="full" className="full-page-error-logo" />
        <Card className="full-page-error-card">{children}</Card>
      </div>
    </div>
  );
}
