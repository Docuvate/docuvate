// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { FormEvent, useEffect, useId, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { acceptUserInvitation } from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { routes } from '../lib/routes';
import { AuthFormError } from '../components/auth/AuthFormError';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LocaleSwitcher } from '../components/layout/LocaleSwitcher';

export function InviteAcceptPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const [token] = useState(() => search.get('token')?.trim() ?? '');
  const formErrorId = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
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
      setError(t('auth.resetPasswordMismatch'));
      return;
    }
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

  return (
    <div className="auth-layout">
      <div className="auth-locale">
        <LocaleSwitcher />
      </div>
      <Card className="auth-card">
        <h1>{t('admin.inviteAcceptTitle')}</h1>
        <p className="muted">{t('admin.inviteAcceptLead')}</p>
        <form onSubmit={(e) => void onSubmit(e)} className="auth-form settings-stack">
          <AuthFormError id={formErrorId} message={error ?? ''} />
          <label>
            {t('auth.newPassword')}
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label>
            {t('auth.confirmPassword')}
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={loading || !token}>
            {loading ? t('admin.inviteAcceptPending') : t('admin.inviteAcceptSubmit')}
          </Button>
        </form>
        <p className="auth-footer-link">
          <Link to={routes.login}>{t('auth.backToSignIn')}</Link>
        </p>
      </Card>
    </div>
  );
}
