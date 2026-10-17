// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Mail } from 'lucide-react';
import { FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { AuthScreen } from '../components/auth/AuthScreen';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/format-auth-client-error';
import { routes } from '../lib/routes';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const emailId = useId();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}${routes.resetPassword}`;
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo,
      });
      if (result.error) {
        setError(
          formatAuthClientError(
            result.error,
            t('auth.forgotPasswordFailed'),
            undefined,
            'forgotPassword'
          )
        );
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title={t('auth.forgotPasswordTitle')}
      lead={submitted ? undefined : t('auth.forgotPasswordHint')}
      footer={
        <p className="auth-footer-link">
          <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
        </p>
      }
    >
      {submitted ? (
        <div className="auth-confirm-box" role="status">
          <Mail size={18} aria-hidden />
          <span>{t('auth.forgotPasswordConfirmation')}</span>
        </div>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="auth-form" noValidate>
          <FormField label={t('auth.email')} htmlFor={emailId} showHelp={false} error={error ?? undefined}>
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              className={error ? 'input-invalid' : ''}
            />
          </FormField>
          <Button
            type="submit"
            variant="primary"
            className="auth-primary-btn"
            disabled={loading}
            loading={loading}
          >
            {loading ? t('auth.forgotPasswordPending') : t('auth.forgotPasswordSubmit')}
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
