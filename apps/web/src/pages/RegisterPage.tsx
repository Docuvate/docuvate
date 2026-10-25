// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { PASSWORD_LENGTH_MAX_BOUND } from '@docuvate/contracts';
import { FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { AuthScreen } from '../components/auth/AuthScreen';
import { PasswordPolicyChecklist } from '../components/auth/PasswordPolicyChecklist';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { PasswordInput } from '../components/ui/PasswordInput';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import { awaitAuthenticatedSession } from '../lib/awaitAuthenticatedSession';
import { routes } from '../lib/routes';
import { usePasswordPolicy } from '../lib/usePasswordPolicy';

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const passwordPolicy = usePasswordPolicy();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
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
    <AuthScreen
      cardGroup="register"
      title={t('auth.registerTitle')}
      footer={
        <p className="auth-register-line">
          <span className="muted">{t('auth.hasAccount')}</span>{' '}
          <Link to={routes.login}>{t('auth.signIn')}</Link>
        </p>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="auth-form" noValidate>
        <FormField label={t('auth.name')} htmlFor={nameId} showHelp={false}>
          <Input
            id={nameId}
            required
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            className={error ? 'input-invalid' : ''}
          />
        </FormField>
        <FormField label={t('auth.email')} htmlFor={emailId} showHelp={false}>
          <Input
            id={emailId}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            className={error ? 'input-invalid' : ''}
          />
        </FormField>
        <FormField
          label={t('auth.password')}
          htmlFor={passwordId}
          showHelp={false}
          error={error ?? undefined}
        >
          <PasswordInput
            id={passwordId}
            minLength={passwordPolicy.minLength}
            maxLength={PASSWORD_LENGTH_MAX_BOUND}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            className={error ? 'input-invalid' : ''}
          />
          <PasswordPolicyChecklist policy={passwordPolicy} password={password} />
        </FormField>
        <Button
          type="submit"
          variant="primary"
          className="auth-primary-btn"
          disabled={loading}
          loading={loading}
        >
          {loading ? t('auth.registerPending') : t('auth.register')}
        </Button>
      </form>
    </AuthScreen>
  );
}
