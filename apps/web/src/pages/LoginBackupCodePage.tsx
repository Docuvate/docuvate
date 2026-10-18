// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Lock } from 'lucide-react';
import { FormEvent, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthScreen } from '../components/auth/AuthScreen';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import { markAuthenticatedSessionHint } from '../lib/authSessionHint';
import { awaitAuthenticatedSession } from '../lib/awaitAuthenticatedSession';
import { routes } from '../lib/routes';

export function LoginBackupCodePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeId = useId();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const returnTo = searchParams.get('return') ?? routes.documents;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.twoFactor.verifyBackupCode({ code: trimmed });
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
    <AuthScreen
      title={t('auth.twoFactor.backupTitle')}
      cardGroup="twoFactor"
      intro={
        <div className="auth-2fa-icon" aria-hidden>
          <Lock size={24} />
        </div>
      }
      lead={t('auth.twoFactor.backupLead')}
      footer={
        <p className="auth-footer-link">
          <Link to={routes.loginTwoFactor}>{t('auth.twoFactor.useAuthenticatorApp')}</Link>
        </p>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="auth-form" noValidate>
        <FormField
          label={t('auth.twoFactor.backupCodeLabel')}
          htmlFor={codeId}
          showHelp={false}
          error={error ?? undefined}
        >
          <Input
            id={codeId}
            value={code}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="font-mono"
            placeholder={t('auth.twoFactor.backupCodePlaceholder')}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) {
                setError(null);
              }
            }}
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
