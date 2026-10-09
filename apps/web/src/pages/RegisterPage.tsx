// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FormEvent, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import { routes } from '../lib/routes';
import { AuthFormError } from '../components/auth/AuthFormError';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LocaleSwitcher } from '../components/layout/LocaleSwitcher';
import { awaitAuthenticatedSession } from '../lib/awaitAuthenticatedSession';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formErrorId = useId();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.signUp.email({ name, email, password });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signUp'));
        return;
      }
      if (!(await awaitAuthenticatedSession())) {
        setError(formatAuthClientError(new Error('AUTH_SESSION_NOT_VISIBLE'), 'signUp'));
        return;
      }
      navigate(routes.documents);
    } catch (err) {
      setError(formatAuthClientError(err, 'signUp'));
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
        <h1>{t('auth.registerTitle')}</h1>
        <form onSubmit={onSubmit} className="stack" noValidate>
          <label>
            {t('auth.name')}
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? formErrorId : undefined}
            />
          </label>
          <label>
            {t('auth.email')}
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? formErrorId : undefined}
            />
          </label>
          <label>
            {t('auth.password')}
            <Input
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? formErrorId : undefined}
            />
          </label>
          {error ? <AuthFormError id={formErrorId} message={error} /> : null}
          <Button type="submit" disabled={loading}>
            {loading ? t('auth.registerCreatePending') : t('auth.register')}
          </Button>
        </form>
        <p className="muted">
          {t('auth.hasAccount')} <Link to={routes.login}>{t('auth.signIn')}</Link>
        </p>
      </Card>
    </div>
  );
}
