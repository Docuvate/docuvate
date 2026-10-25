// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authClient, authSessionUserEmail } from '../../lib/auth-client';
import { formatAuthClientError } from '../../lib/authErrors';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import {
  Dialog,
  DialogBody,
  DialogFieldSpan,
  DialogFooter,
  DialogFormGrid,
  DialogHeader,
} from '../ui/Dialog';
import { Input } from '../ui/Input';
import { PasswordInput } from '../ui/PasswordInput';

interface AccountSecurityChangeEmailDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AccountSecurityChangeEmailDialog({
  open,
  onClose,
}: AccountSecurityChangeEmailDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const emailId = useId();
  const passwordId = useId();
  const { data: session } = authClient.useSession();
  const currentEmail = authSessionUserEmail(session) ?? '';
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function resetAndClose() {
    setNewEmail('');
    setPassword('');
    setError(null);
    setSent(false);
    onClose();
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const verify = await authClient.changePassword({
        currentPassword: password,
        newPassword: password,
        revokeOtherSessions: false,
      });
      if (verify.error) {
        setError(formatAuthClientError(verify.error, 'signIn'));
        return;
      }
      const callbackURL = `${window.location.origin}${routes.settingsAccountSecurity}`;
      const result = await authClient.changeEmail({
        newEmail: newEmail.trim(),
        callbackURL,
      });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      setSent(true);
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      busy={busy}
      onCancel={resetAndClose}
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <DialogHeader
        titleId={titleId}
        descriptionId={descId}
        title={t('settings.accountSecurity.changeEmailTitle')}
        description={
          sent
            ? t('settings.accountSecurity.changeEmailSentLead')
            : t('settings.accountSecurity.changeEmailLead', { email: currentEmail })
        }
        showClose
        onClose={resetAndClose}
        closeDisabled={busy}
      />
      {!sent ? (
        <>
          <DialogBody>
            <DialogFormGrid>
              <DialogFieldSpan>
                <label className="settings-field" htmlFor={emailId}>
                  {t('settings.accountSecurity.changeEmailNewLabel')}
                  <Input
                    id={emailId}
                    type="email"
                    autoComplete="email"
                    value={newEmail}
                    disabled={busy}
                    onChange={(e) => { setNewEmail(e.target.value); }}
                  />
                </label>
              </DialogFieldSpan>
              <DialogFieldSpan>
                <label className="settings-field" htmlFor={passwordId}>
                  {t('settings.accountSecurity.passwordLabel')}
                  <PasswordInput
                    id={passwordId}
                    autoComplete="current-password"
                    value={password}
                    disabled={busy}
                    onChange={(e) => { setPassword(e.target.value); }}
                  />
                </label>
                {error ? (
                  <p className="error auth-field-hint" role="alert">
                    {error}
                  </p>
                ) : null}
              </DialogFieldSpan>
            </DialogFormGrid>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" disabled={busy} onClick={resetAndClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={busy || !newEmail.trim() || !password}
              loading={busy}
              onClick={() => void submit()}
            >
              {t('settings.accountSecurity.changeEmailSubmit')}
            </Button>
          </DialogFooter>
        </>
      ) : (
        <DialogFooter>
          <Button type="button" variant="primary" onClick={resetAndClose}>
            {t('common.close')}
          </Button>
        </DialogFooter>
      )}
    </Dialog>
  );
}
