// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CircleAlert } from 'lucide-react';
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthScreen } from '../components/auth/AuthScreen';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import {
  clearAuthenticatedSessionHint,
  markAuthenticatedSessionHint,
} from '../lib/authSessionHint';
import { awaitAuthenticatedSession } from '../lib/awaitAuthenticatedSession';
import { readLocationStateBoolean } from '../lib/routerLocationState';
import { routes } from '../lib/routes';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const emailId = useId();
  const passwordId = useId();
  const passwordResetSuccess = readLocationStateBoolean(location.state, 'passwordResetSuccess');
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
  const showCredentialBanner = displayedError != null && displayedError.length > 0;

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
    <AuthScreen
      title={t('auth.signIn')}
      cardGroup="signIn"
      footer={
        <p className="auth-register-line">
          <span className="muted">{t('auth.noAccount')}</span>{' '}
          <Link to={routes.register}>{t('auth.register')}</Link>
        </p>
      }
    >
      {passwordResetSuccess ? (
        <p className="muted auth-reset-success" role="status">
          {t('auth.passwordResetSuccessHint')}
        </p>
      ) : null}
      {showCredentialBanner ? (
        <Banner
          variant="danger"
          icon={CircleAlert}
          title={t('auth.errors.invalidCredentialsTitle')}
          description={t('auth.errors.invalidCredentialsDescription')}
        />
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)} className="auth-form stack" noValidate>
        <FormField label={t('auth.email')} htmlFor={emailId} showHelp={false}>
          <Input
            ref={emailInputRef}
            id={emailId}
            type="email"
            autoComplete="username webauthn"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            className={showCredentialBanner ? 'input-invalid' : ''}
          />
        </FormField>
        <FormField label={t('auth.password')} htmlFor={passwordId} showHelp={false}>
          <Input
            id={passwordId}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            aria-invalid={showCredentialBanner ? true : undefined}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            className={showCredentialBanner ? 'input-invalid' : ''}
          />
        </FormField>
        <p className="auth-forgot-link">
          <Link to={routes.forgotPassword}>{t('auth.forgotPasswordLink')}</Link>
        </p>
        <Button type="submit" variant="primary" className="auth-primary-btn" disabled={loading} loading={loading}>
          {loading ? t('auth.signInPending') : t('auth.signIn')}
        </Button>
      </form>
    </AuthScreen>
  );
}
