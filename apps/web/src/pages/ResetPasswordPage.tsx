// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { LocaleSwitcher } from '../components/layout/LocaleSwitcher';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/format-auth-client-error';
import { routes } from '../lib/routes';
import { verifyPasswordResetToken } from '../lib/verifyPasswordResetToken';

const MIN_PASSWORD_LENGTH = 8;

type TokenGateState =
  { kind: 'idle' } | { kind: 'checking' } | { kind: 'invalid' } | { kind: 'valid' };

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const linkError = useMemo(() => searchParams.get('error'), [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tokenGate, setTokenGate] = useState<TokenGateState>(() =>
    !token || linkError === 'INVALID_TOKEN' ? { kind: 'invalid' } : { kind: 'checking' }
  );

  useEffect(() => {
    if (!token || linkError === 'INVALID_TOKEN') {
      setTokenGate({ kind: 'invalid' });
      return;
    }

    let cancelled = false;
    setTokenGate({ kind: 'checking' });
    void verifyPasswordResetToken(token)
      .then((result) => {
        if (cancelled) return;
        setTokenGate(result.valid ? { kind: 'valid' } : { kind: 'invalid' });
      })
      .catch(() => {
        if (cancelled) return;
        setTokenGate({ kind: 'invalid' });
      });

    return () => {
      cancelled = true;
    };
  }, [token, linkError]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError(t('auth.resetPasswordMismatch'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (result.error) {
        setError(
          formatAuthClientError(
            result.error,
            t('auth.resetPasswordFailed'),
            {
              PASSWORD_TOO_SHORT: t('auth.passwordTooShort'),
              INVALID_TOKEN: t('auth.resetPasswordInvalidLink'),
            },
            'resetPassword'
          )
        );
        return;
      }
      navigate(routes.login, { state: { passwordResetSuccess: true } });
    } finally {
      setLoading(false);
    }
  }

  const showInvalidLink = tokenGate.kind === 'invalid';
  const showChecking = tokenGate.kind === 'checking';
  const showForm = tokenGate.kind === 'valid';

  return (
    <div className="auth-layout">
      <div className="auth-locale">
        <LocaleSwitcher />
      </div>
      <Card className={`auth-card${showChecking ? ' auth-card-reset-pending' : ''}`}>
        <h1>{t('auth.resetPasswordTitle')}</h1>
        {showChecking ? (
          <div className="auth-card-status" role="status" aria-live="polite">
            <Spinner size="sm" label={t('auth.resetPasswordVerifying')} />
            <span>{t('auth.resetPasswordVerifying')}</span>
          </div>
        ) : null}
        {showInvalidLink ? (
          <div className="auth-reset-invalid stack">
            <p className="error" role="alert" aria-live="assertive">
              {t('auth.resetPasswordInvalidLink')}
            </p>
            <Link className="btn btn-primary" to={routes.forgotPassword}>
              {t('auth.requestNewResetLink')}
            </Link>
            <p className="muted auth-reset-secondary-link">
              <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
            </p>
          </div>
        ) : null}
        {showForm ? (
          <form onSubmit={onSubmit} className="stack">
            <label>
              {t('auth.newPassword')}
              <Input
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); }}
              />
            </label>
            <label>
              {t('auth.confirmPassword')}
              <Input
                type="password"
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); }}
              />
            </label>
            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={loading}>
              {loading ? t('auth.resetPasswordPending') : t('auth.resetPasswordSubmit')}
            </Button>
          </form>
        ) : null}
        {!showInvalidLink ? (
          <p className="muted">
            <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
          </p>
        ) : null}
      </Card>
    </div>
  );
}
