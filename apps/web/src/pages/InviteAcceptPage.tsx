// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { PASSWORD_LENGTH_MAX_BOUND } from '@docuvate/contracts';
import { FormEvent, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { AuthScreen } from '../components/auth/AuthScreen';
import { PasswordPolicyChecklist } from '../components/auth/PasswordPolicyChecklist';
import { Button } from '../components/ui/Button';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { acceptUserInvitation } from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { routes } from '../lib/routes';
import { usePasswordPolicy } from '../lib/usePasswordPolicy';

export function InviteAcceptPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const passwordPolicy = usePasswordPolicy();
  const [search] = useSearchParams();
  const [token] = useState(() => search.get('token')?.trim() ?? '');
  const passwordId = useId();
  const confirmId = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmMismatch, setConfirmMismatch] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = document.querySelector('meta[name="referrer"]');
    const previous = existing?.getAttribute('content') ?? null;
    let created: HTMLMetaElement | null = null;
    if (existing) {
      existing.setAttribute('content', 'no-referrer');
    } else {
      created = document.createElement('meta');
      created.name = 'referrer';
      created.content = 'no-referrer';
      document.head.appendChild(created);
    }
    return () => {
      if (created) {
        created.remove();
      } else if (existing) {
        if (previous != null) {
          existing.setAttribute('content', previous);
        } else {
          existing.removeAttribute('content');
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('token')) return;
    url.searchParams.delete('token');
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', next);
  }, [token]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setError(t('admin.inviteAcceptInvalidLink'));
      return;
    }
    if (password !== confirm) {
      setConfirmMismatch(true);
      setError(t('auth.resetPasswordMismatch'));
      return;
    }
    setConfirmMismatch(false);
    setLoading(true);
    setError(null);
    try {
      await acceptUserInvitation({ token, password });
      navigate(routes.login);
    } catch (err) {
      setError(formatUserFacingError(err, 'admin.inviteAcceptFailed'));
    } finally {
      setLoading(false);
    }
  }

  const invalidLink = !token;

  return (
    <AuthScreen
      cardGroup="invite"
      title={t('admin.inviteAcceptTitle')}
      lead={t('admin.inviteAcceptLead')}
      footer={
        <p className="auth-footer-link">
          <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
        </p>
      }
    >
      {invalidLink ? (
        <p className="auth-card-lead" role="alert">
          {t('admin.inviteAcceptInvalidLink')}
        </p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)} className="auth-form" noValidate>
          <FormField label={t('auth.password')} htmlFor={passwordId} showHelp={false}>
            <Input
              id={passwordId}
              type="password"
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
              className={error && !confirmMismatch ? 'input-invalid' : ''}
            />
            <PasswordPolicyChecklist policy={passwordPolicy} password={password} />
          </FormField>
          <FormField
            label={t('auth.confirmPassword')}
            htmlFor={confirmId}
            showHelp={false}
            error={confirmMismatch || error ? (error ?? t('auth.resetPasswordMismatch')) : undefined}
          >
            <Input
              id={confirmId}
              type="password"
              autoComplete="new-password"
              minLength={passwordPolicy.minLength}
              maxLength={PASSWORD_LENGTH_MAX_BOUND}
              required
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
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
            {loading ? t('admin.inviteAcceptPending') : t('admin.inviteAcceptSubmit')}
          </Button>
        </form>
      )}
    </AuthScreen>
  );
}
