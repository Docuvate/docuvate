// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthFormError } from '../components/auth/AuthFormError';
import { LocaleSwitcher } from '../components/layout/LocaleSwitcher';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import {
  clearAuthenticatedSessionHint,
  markAuthenticatedSessionHint,
} from '../lib/authSessionHint';
import { awaitAuthenticatedSession } from '../lib/awaitAuthenticatedSession';
import { routes } from '../lib/routes';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const formErrorId = useId();
  const passwordResetSuccess =
    (location.state as { passwordResetSuccess?: boolean } | null)?.passwordResetSuccess === true;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (error) {
      emailInputRef.current?.focus();
    }
  }, [error]);

  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      clearAuthenticatedSessionHint();
    }
  }, [searchParams]);

  const sessionExpiredMessage = useMemo(() => {
    const reason = searchParams.get('reason');
    if (reason === 'session_expired') {
      return t('auth.errors.sessionExpired');
    }
    if (reason === 'sign_out_failed') {
      return t('auth.errors.signOutFailed');
    }
    return null;
  }, [searchParams, t]);

  const displayedError = error ?? sessionExpiredMessage;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      if (!(await awaitAuthenticatedSession())) {
        setError(formatAuthClientError(new Error('AUTH_SESSION_NOT_VISIBLE'), 'signIn'));
        return;
      }
      markAuthenticatedSessionHint();
      navigate(routes.documents);
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-locale">
        <LocaleSwitcher />
      </div>
      <Card className="auth-card">
        <h1>Docuvate</h1>
        <p className="muted">{t('auth.tagline')}</p>
        {passwordResetSuccess ? (
          <p className="muted" role="status">
            {t('auth.passwordResetSuccessHint')}
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="stack" noValidate>
          <label>
            {t('auth.email')}
            <Input
              ref={emailInputRef}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); }}
              aria-invalid={displayedError ? true : undefined}
              aria-describedby={displayedError ? formErrorId : undefined}
            />
          </label>
          <label>
            {t('auth.password')}
            <Input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); }}
              aria-invalid={displayedError ? true : undefined}
              aria-describedby={displayedError ? formErrorId : undefined}
            />
          </label>
          <p className="muted auth-forgot-link">
            <Link to={routes.forgotPassword}>{t('auth.forgotPasswordLink')}</Link>
          </p>
          {displayedError ? <AuthFormError id={formErrorId} message={displayedError} /> : null}
          <Button type="submit" disabled={loading}>
            {loading ? t('auth.signInPending') : t('auth.signIn')}
          </Button>
        </form>
        <p className="muted">
          {t('auth.noAccount')} <Link to={routes.register}>{t('auth.register')}</Link>
        </p>
      </Card>
    </div>
  );
}
