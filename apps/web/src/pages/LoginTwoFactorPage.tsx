// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FormEvent, useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import { markAuthenticatedSessionHint } from '../lib/authSessionHint';
import { awaitAuthenticatedSession } from '../lib/awaitAuthenticatedSession';
import { routes } from '../lib/routes';
import { AuthFormError } from '../components/auth/AuthFormError';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LocaleSwitcher } from '../components/layout/LocaleSwitcher';

export function LoginTwoFactorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeId = useId();
  const errorId = useId();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get('return') || routes.documents;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const verify = authClient.twoFactor?.verifyTotp;
      if (!verify) {
        setError(t('auth.twoFactor.unavailable'));
        return;
      }
      const result = await verify({ code });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      if (!(await awaitAuthenticatedSession())) {
        setError(t('auth.errors.sessionNotReady'));
        return;
      }
      markAuthenticatedSessionHint();
      navigate(returnTo, { replace: true });
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
        <h1>{t('auth.twoFactor.title')}</h1>
        <p className="muted">{t('auth.twoFactor.lead')}</p>
        <form onSubmit={(e) => void onSubmit(e)} className="auth-form">
          {error ? <AuthFormError id={errorId} message={error} /> : null}
          <label className="auth-field" htmlFor={codeId}>
            {t('auth.twoFactor.codeLabel')}
            <Input
              id={codeId}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              disabled={loading}
              onChange={(e) => setCode(e.target.value)}
            />
          </label>
          <Button type="submit" className="auth-submit" disabled={loading || !code.trim()}>
            {t('auth.twoFactor.submit')}
          </Button>
        </form>
        <p className="auth-footer">
          <Link to={routes.login}>{t('auth.twoFactor.backToLogin')}</Link>
        </p>
      </Card>
    </div>
  );
}
