// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Lock } from 'lucide-react';
import { FormEvent, useCallback, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthScreen } from '../components/auth/AuthScreen';
import { TwoFactorCodeInput } from '../components/auth/TwoFactorCodeInput';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import { markAuthenticatedSessionHint } from '../lib/authSessionHint';
import { awaitAuthenticatedSession } from '../lib/awaitAuthenticatedSession';
import { routes } from '../lib/routes';

export function LoginTwoFactorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const otpPrefix = useId();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const verifyLock = useRef(false);

  const returnTo = searchParams.get('return') ?? routes.documents;

  const verifyTotp = useCallback(
    async (submittedCode: string) => {
      if (verifyLock.current) {
        return;
      }
      verifyLock.current = true;
      setLoading(true);
      setError(null);
      try {
        const result = await authClient.twoFactor.verifyTotp({ code: submittedCode });
        if (result.error) {
          setError(formatAuthClientError(result.error, 'signIn'));
          verifyLock.current = false;
          return;
        }
        if (!(await awaitAuthenticatedSession())) {
          setError(t('auth.errors.sessionNotReady'));
          verifyLock.current = false;
          return;
        }
        markAuthenticatedSessionHint();
        navigate(returnTo, { replace: true });
      } catch (err) {
        setError(formatAuthClientError(err, 'signIn'));
        verifyLock.current = false;
      } finally {
        setLoading(false);
      }
    },
    [navigate, returnTo, t]
  );

  const onComplete = useCallback(
    (completed: string) => {
      void verifyTotp(completed);
    },
    [verifyTotp]
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (code.trim().length === 0) {
      return;
    }
    void verifyTotp(code.trim());
  }

  return (
    <AuthScreen
      title={t('auth.twoFactor.title')}
      intro={
        <div className="auth-2fa-icon" aria-hidden>
          <Lock size={24} />
        </div>
      }
      lead={t('auth.twoFactor.lead')}
      footer={
        <p className="auth-footer-link">
          <Link to={routes.login}>{t('auth.twoFactor.backToLogin')}</Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="auth-form" noValidate>
        <FormField
          label={t('auth.twoFactor.codeLabel')}
          showHelp={false}
          error={error ?? undefined}
        >
          <TwoFactorCodeInput
            idPrefix={otpPrefix}
            value={code}
            disabled={loading}
            onChange={(next) => {
              setCode(next);
              if (error) {
                setError(null);
              }
              if (next.length < 6) {
                verifyLock.current = false;
              }
            }}
            onComplete={onComplete}
          />
        </FormField>
        <Button
          type="submit"
          variant="primary"
          className="auth-primary-btn"
          disabled={loading || code.trim().length === 0}
          loading={loading}
        >
          {t('auth.twoFactor.submit')}
        </Button>
      </form>
    </AuthScreen>
  );
}
