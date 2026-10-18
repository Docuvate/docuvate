// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { authClient } from '../../lib/auth-client';
import { formatAuthClientError } from '../../lib/authErrors';
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

interface AccountSecurityRegenerateBackupCodesDialogProps {
  open: boolean;
  onClose: () => void;
}

export function AccountSecurityRegenerateBackupCodesDialog({
  open,
  onClose,
}: AccountSecurityRegenerateBackupCodesDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const passwordId = useId();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  function resetAndClose() {
    setPassword('');
    setError(null);
    setCodes(null);
    onClose();
  }

  async function regenerate() {
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.twoFactor.generateBackupCodes({ password });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      setCodes(result.data.backupCodes);
      setPassword('');
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
        title={t('settings.accountSecurity.regenerateBackupCodesTitle')}
        description={t('settings.accountSecurity.regenerateBackupCodesLead')}
        showClose
        onClose={resetAndClose}
        closeDisabled={busy}
      />
      <DialogBody>
        {codes?.length ? (
          <div className="settings-backup-codes">
            <p className="muted">{t('settings.accountSecurity.regenerateBackupCodesResultLead')}</p>
            <ul>
              {codes.map((code) => (
                <li key={code}>
                  <code>{code}</code>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void navigator.clipboard.writeText(codes.join('\n'))}
            >
              {t('settings.accountSecurity.backupCodesCopy')}
            </Button>
          </div>
        ) : (
          <DialogFormGrid>
            <DialogFieldSpan>
              <label className="settings-field" htmlFor={passwordId}>
                {t('settings.accountSecurity.passwordLabel')}
                <Input
                  id={passwordId}
                  type="password"
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
        )}
      </DialogBody>
      <DialogFooter>
        {codes?.length ? (
          <Button type="button" variant="primary" onClick={resetAndClose}>
            {t('common.close')}
          </Button>
        ) : (
          <>
            <Button type="button" variant="secondary" disabled={busy} onClick={resetAndClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={busy || !password}
              loading={busy}
              onClick={() => void regenerate()}
            >
              {t('settings.accountSecurity.regenerateBackupCodesSubmit')}
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
