import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/format-auth-client-error';
import { routes } from '../lib/routes';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LocaleSwitcher } from '../components/layout/LocaleSwitcher';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
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
          formatAuthClientError(result.error, t('auth.forgotPasswordFailed'), undefined, 'forgotPassword'),
        );
        return;
      }
      setSubmitted(true);
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
        <h1>{t('auth.forgotPasswordTitle')}</h1>
        {submitted ? (
          <p className="muted">{t('auth.forgotPasswordConfirmation')}</p>
        ) : (
          <>
            <p className="muted">{t('auth.forgotPasswordHint')}</p>
            <form onSubmit={onSubmit} className="stack">
              <label>
                {t('auth.email')}
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {error ? (
                <p className="error" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" disabled={loading}>
                {loading ? t('auth.forgotPasswordPending') : t('auth.forgotPasswordSubmit')}
              </Button>
            </form>
          </>
        )}
        <p className="muted">
          <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
        </p>
      </Card>
    </div>
  );
}
