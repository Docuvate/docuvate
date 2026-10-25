// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CircleAlert, KeyRound } from 'lucide-react';
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthOrDivider } from '../components/auth/AuthOrDivider';
import { AuthScreen } from '../components/auth/AuthScreen';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import {
  clearAuthenticatedSessionHint,
  markAuthenticatedSessionHint,
} from '../lib/authSessionHint';
import { awaitAuthenticatedSession } from '../lib/awaitAuthenticatedSession';
import { signInWithPasskey } from '../lib/loginPasskey';
import { readLocationStateBoolean } from '../lib/routerLocationState';
import { routes } from '../lib/routes';
import { useAuthSignInOptions } from '../lib/useAuthSignInOptions';

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
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const signInOptions = useAuthSignInOptions();
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

  async function onPasskeySignIn() {
    setPasskeyLoading(true);
    setError(null);
    try {
      const result = await signInWithPasskey();
      if (!result.ok) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      markAuthenticatedSessionHint();
      navigate(routes.documents);
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
    } finally {
      setPasskeyLoading(false);
    }
  }

  async function onOidcSignIn(providerId: string) {
    setPasskeyLoading(true);
    setError(null);
    try {
      const callbackURL = `${window.location.origin}${routes.documents}`;
      await authClient.signIn.social({ provider: providerId, callbackURL });
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
      setPasskeyLoading(false);
    }
  }

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
          <PasswordInput
            id={passwordId}
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
        <Button type="submit" variant="primary" className="auth-primary-btn" disabled={loading || passkeyLoading} loading={loading}>
          {loading ? t('auth.signInPending') : t('auth.signIn')}
        </Button>
      </form>
      {signInOptions.passkeysEnabled || signInOptions.oidcProviders.length > 0 ? (
        <>
          <AuthOrDivider />
          <div className="auth-passwordless-stack">
            {signInOptions.passkeysEnabled ? (
              <Button
                type="button"
                variant="secondary"
                className="auth-secondary-btn"
                disabled={loading || passkeyLoading}
                loading={passkeyLoading}
                onClick={() => void onPasskeySignIn()}
              >
                <KeyRound size={18} aria-hidden />
                {t('auth.signInWithPasskey')}
              </Button>
            ) : null}
            {signInOptions.oidcProviders.map((provider) => (
              <Button
                key={provider.providerId}
                type="button"
                variant="secondary"
                className="auth-secondary-btn"
                disabled={loading || passkeyLoading}
                onClick={() => void onOidcSignIn(provider.providerId)}
              >
                {t('auth.signInWithProvider', { provider: provider.displayName })}
              </Button>
            ))}
          </div>
        </>
      ) : null}
    </AuthScreen>
  );
}
