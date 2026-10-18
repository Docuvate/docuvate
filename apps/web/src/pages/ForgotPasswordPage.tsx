// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { CircleAlert, Mail } from 'lucide-react';
import { FormEvent, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { AuthScreen } from '../components/auth/AuthScreen';
import { Banner } from '../components/ui/Banner';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/format-auth-client-error';
import { routes } from '../lib/routes';

const RESEND_COOLDOWN_SECONDS = 60;

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const emailId = useId();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!submitted || resendSeconds <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [submitted, resendSeconds]);

  async function sendResetLink() {
    setLoading(true);
    setBannerError(null);
    setFieldError(null);
    try {
      const redirectTo = `${window.location.origin}${routes.resetPassword}`;
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo,
      });
      if (result.error) {
        const message = formatAuthClientError(
          result.error,
          t('auth.forgotPasswordFailed'),
          undefined,
          'forgotPassword'
        );
        if (result.error.code === 'INVALID_EMAIL' || result.error.code === 'INVALID_EMAIL_FORMAT') {
          setFieldError(message);
        } else {
          setBannerError(message);
        }
        return;
      }
      setSubmitted(true);
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    await sendResetLink();
  }

  return (
    <AuthScreen
      title={t('auth.forgotPasswordTitle')}
      cardGroup="forgotPassword"
      lead={submitted ? undefined : t('auth.forgotPasswordHint')}
      footer={
        <p className="auth-footer-link">
          <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
        </p>
      }
    >
      {submitted ? (
        <Banner
          variant="success"
          icon={Mail}
          title={t('auth.forgotPasswordConfirmation')}
        />
      ) : null}
      {bannerError ? (
        <Banner variant="danger" icon={CircleAlert} title={bannerError} />
      ) : null}
      <form onSubmit={(e) => void onSubmit(e)} className="auth-form" noValidate>
        <FormField
          label={t('auth.email')}
          htmlFor={emailId}
          showHelp={false}
          error={fieldError ?? undefined}
        >
          <Input
            id={emailId}
            type="email"
            autoComplete="email"
            required
            disabled={submitted}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            className={fieldError ? 'input-invalid' : ''}
          />
        </FormField>
        {submitted ? (
          <Button
            type="button"
            variant="secondary"
            className="auth-primary-btn"
            disabled={loading || resendSeconds > 0}
            loading={loading}
            onClick={() => void sendResetLink()}
          >
            {resendSeconds > 0
              ? t('auth.forgotPasswordResendCooldown', { seconds: resendSeconds })
              : t('auth.forgotPasswordResend')}
          </Button>
        ) : (
          <Button
            type="submit"
            variant="primary"
            className="auth-primary-btn"
            disabled={loading}
            loading={loading}
          >
            {loading ? t('auth.forgotPasswordPending') : t('auth.forgotPasswordSubmit')}
          </Button>
        )}
      </form>
    </AuthScreen>
  );
}
