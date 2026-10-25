// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { ERROR_CODES, PASSWORD_LENGTH_MAX_BOUND } from '@docuvate/contracts';
import { CircleAlert } from 'lucide-react';
import { FormEvent, useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthScreen } from '../components/auth/AuthScreen';
import { PasswordPolicyChecklist } from '../components/auth/PasswordPolicyChecklist';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Spinner } from '../components/ui/Spinner';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/format-auth-client-error';
import { routes } from '../lib/routes';
import { usePasswordPolicy } from '../lib/usePasswordPolicy';
import { verifyPasswordResetToken } from '../lib/verifyPasswordResetToken';

type TokenGateState =
  { kind: 'idle' } | { kind: 'checking' } | { kind: 'invalid' } | { kind: 'valid' };

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const passwordPolicy = usePasswordPolicy();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const linkError = useMemo(() => searchParams.get('error'), [searchParams]);
  const passwordId = useId();
  const confirmId = useId();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmMismatch, setConfirmMismatch] = useState(false);
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
      setConfirmMismatch(true);
      setError(t('auth.resetPasswordMismatch'));
      return;
    }
    setConfirmMismatch(false);
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
              PASSWORD_POLICY_VIOLATION: t('auth.errors.passwordPolicyViolation'),
              [ERROR_CODES.AUTH_PASSWORD_POLICY_VIOLATION]: t('auth.errors.passwordPolicyViolation'),
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

  if (showInvalidLink) {
    return (
      <AuthScreen
        title={t('auth.resetPasswordInvalidTitle')}
        cardGroup="resetPassword"
        intro={
          <div className="auth-2fa-icon" aria-hidden>
            <CircleAlert size={24} />
          </div>
        }
        lead={t('auth.resetPasswordInvalidLead')}
        footer={
          <p className="auth-footer-link">
            <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
          </p>
        }
      >
        <Link className="btn btn-primary auth-primary-btn" to={routes.forgotPassword}>
          {t('auth.requestNewResetLink')}
        </Link>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={t('auth.resetPasswordTitle')}
      cardGroup="resetPassword"
      footer={
        !showChecking ? (
          <p className="auth-footer-link">
            <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
          </p>
        ) : null
      }
    >
      {showChecking ? (
        <div className="auth-card-status" role="status" aria-live="polite">
          <Spinner size="sm" label={t('auth.resetPasswordVerifying')} decorative />
          <span>{t('auth.resetPasswordVerifying')}</span>
        </div>
      ) : null}
      {showForm ? (
        <form onSubmit={(e) => void onSubmit(e)} className="auth-form" noValidate>
          <FormField label={t('auth.newPassword')} htmlFor={passwordId} showHelp={false}>
            <PasswordInput
              id={passwordId}
              autoComplete="new-password"
              minLength={passwordPolicy.minLength}
              maxLength={PASSWORD_LENGTH_MAX_BOUND}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (confirmMismatch) {
                  setConfirmMismatch(false);
                  setError(null);
                }
              }}
            />
            <PasswordPolicyChecklist policy={passwordPolicy} password={password} />
          </FormField>
          <FormField
            label={t('auth.confirmPassword')}
            htmlFor={confirmId}
            showHelp={false}
            error={confirmMismatch || error ? (error ?? t('auth.resetPasswordMismatch')) : undefined}
          >
            <PasswordInput
              id={confirmId}
              autoComplete="new-password"
              minLength={passwordPolicy.minLength}
              maxLength={PASSWORD_LENGTH_MAX_BOUND}
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (confirmMismatch) {
                  setConfirmMismatch(false);
                  setError(null);
                }
              }}
              className={confirmMismatch || error ? 'input-invalid' : ''}
            />
          </FormField>
          <Button
            type="submit"
            variant="primary"
            className="auth-primary-btn"
            disabled={loading}
            loading={loading}
          >
            {loading ? t('auth.resetPasswordPending') : t('auth.resetPasswordSubmit')}
          </Button>
        </form>
      ) : null}
    </AuthScreen>
  );
}
