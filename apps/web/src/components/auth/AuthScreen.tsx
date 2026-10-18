// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { LocaleSwitcher } from '../layout/LocaleSwitcher';
import { Card } from '../ui/Card';
import { Logo } from '../ui/Logo';

export type AuthCardGroup =
  | 'signIn'
  | 'twoFactor'
  | 'forgotPassword'
  | 'resetPassword'
  | 'register'
  | 'invite';

export interface AuthScreenProps {
  title: string;
  intro?: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  cardGroup?: AuthCardGroup;
}

const CARD_GROUP_CLASS: Record<AuthCardGroup, string> = {
  signIn: 'auth-card--sign-in',
  twoFactor: 'auth-card--two-factor',
  forgotPassword: 'auth-card--forgot-password',
  resetPassword: 'auth-card--reset-password',
  register: 'auth-card--register',
  invite: 'auth-card--invite',
};

export function AuthScreen({
  title,
  intro,
  lead,
  children,
  footer,
  cardGroup,
}: AuthScreenProps) {
  const { t } = useTranslation();
  const cardClass = cardGroup ? CARD_GROUP_CLASS[cardGroup] : '';
  return (
    <div className="auth-layout">
      <div className="auth-locale">
        <LocaleSwitcher />
      </div>
      <div className="auth-screen">
        <Logo type="full" />
        <p className="auth-screen-claim">{t('auth.tagline')}</p>
        <Card className={`auth-card${cardClass ? ` ${cardClass}` : ''}`.trim()}>
          <div className="auth-card-head">
            {intro}
            <h1 className="auth-card-title">{title}</h1>
            {lead ? <div className="auth-card-lead">{lead}</div> : null}
          </div>
          <div className="auth-card-main">{children}</div>
          {cardGroup ? <div className="auth-card-spacer" aria-hidden /> : null}
        </Card>
        {footer ? <div className="auth-screen-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
