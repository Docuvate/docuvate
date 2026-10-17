// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '../layout/LocaleSwitcher';
import { Card } from '../ui/Card';
import { Logo } from '../ui/Logo';

export interface AuthScreenProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Hide register/passkey blocks (e.g. login error state A2). */
  compactFooter?: boolean;
}

export function AuthScreen({ title, children, footer, compactFooter = false }: AuthScreenProps) {
  const { t } = useTranslation();
  return (
    <div className="auth-layout">
      <div className="auth-locale">
        <LocaleSwitcher />
      </div>
      <div className="auth-screen">
        <Logo type="full" />
        <p className="auth-screen-claim">{t('auth.tagline')}</p>
        <Card className="auth-card">
          <h1 className="auth-card-title">{title}</h1>
          {children}
        </Card>
        {!compactFooter && footer ? <div className="auth-screen-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
