import { FormEvent, useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { authClient } from '../lib/auth-client';
import { formatAuthClientError } from '../lib/authErrors';
import { SettingsSectionCard } from '../components/settings/SettingsSectionCard';
import { SettingsSectionLayout } from '../components/settings/SettingsSectionLayout';
import QRCode from 'qrcode';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/save/ToastProvider';

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true as const };

type PasskeyRow = {
  id: string;
  name?: string | null;
  createdAt?: string | Date | null;
};

export function AccountSecuritySettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const passwordId = useId();
  const totpCodeId = useId();
  const passkeyNameId = useId();
  const { data: session } = authClient.useSession();
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [totpUri, setTotpUri] = useState<string | null>(null);
  const [totpQrDataUrl, setTotpQrDataUrl] = useState<string | null>(null);
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeyRow[]>([]);
  const [passkeyName, setPasskeyName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPasskeys = useCallback(async () => {
    const list = authClient.passkey?.listUserPasskeys;
    if (!list) {
      setPasskeys([]);
      return;
    }
    const result = await list();
    if (result.data) {
      setPasskeys(result.data as PasskeyRow[]);
    }
  }, []);

  useEffect(() => {
    const user = session?.user as { twoFactorEnabled?: boolean } | undefined;
    setTotpEnabled(user?.twoFactorEnabled === true);
    void refreshPasskeys();
  }, [session?.user, refreshPasskeys]);

  async function startTotpEnrollment(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const enable = authClient.twoFactor?.enable;
      if (!enable) {
        setError(t('settings.accountSecurity.unavailable'));
        return;
      }
      const enabled = await enable({ password });
      if (enabled.error) {
        setError(formatAuthClientError(enabled.error, 'signIn'));
        return;
      }
      const payload = enabled.data;
      if (!payload || payload.method !== 'totp') {
        setError(t('settings.accountSecurity.unavailable'));
        return;
      }
      const uri = payload.totpURI ?? null;
      setTotpUri(uri);
      setBackupCodes(payload.backupCodes ?? null);
      setShowTotpSecret(false);
      if (uri) {
        const dataUrl = await QRCode.toDataURL(uri, { margin: 1, width: 200 });
        setTotpQrDataUrl(dataUrl);
      } else {
        setTotpQrDataUrl(null);
      }
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
    } finally {
      setBusy(false);
    }
  }

  async function confirmTotp(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const verify = authClient.twoFactor?.verifyTotp;
      if (!verify) {
        setError(t('settings.accountSecurity.unavailable'));
        return;
      }
      const result = await verify({ code: totpCode });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      setTotpUri(null);
      setTotpQrDataUrl(null);
      setBackupCodes(null);
      setTotpCode('');
      setPassword('');
      setTotpEnabled(true);
      toast.success(t('settings.accountSecurity.totpEnabledToast'));
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
    } finally {
      setBusy(false);
    }
  }

  async function disableTotp() {
    setBusy(true);
    setError(null);
    try {
      const disable = authClient.twoFactor?.disable;
      if (!disable) {
        setError(t('settings.accountSecurity.unavailable'));
        return;
      }
      const result = await disable({ password });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      setTotpEnabled(false);
      setPassword('');
      toast.success(t('settings.accountSecurity.totpDisabledToast'));
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
    } finally {
      setBusy(false);
    }
  }

  async function addPasskey() {
    setBusy(true);
    setError(null);
    try {
      const add = authClient.passkey?.addPasskey;
      if (!add) {
        setError(t('settings.accountSecurity.unavailable'));
        return;
      }
      const result = await add({ name: passkeyName.trim() || undefined });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      setPasskeyName('');
      await refreshPasskeys();
      toast.success(t('settings.accountSecurity.passkeyAddedToast'));
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
    } finally {
      setBusy(false);
    }
  }

  async function removePasskey(id: string) {
    setBusy(true);
    setError(null);
    try {
      const del = authClient.passkey?.deletePasskey;
      if (!del) {
        setError(t('settings.accountSecurity.unavailable'));
        return;
      }
      const result = await del({ id });
      if (result.error) {
        setError(formatAuthClientError(result.error, 'signIn'));
        return;
      }
      await refreshPasskeys();
      toast.success(t('settings.accountSecurity.passkeyRemovedToast'));
    } catch (err) {
      setError(formatAuthClientError(err, 'signIn'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSectionLayout
      sectionTitle={t('settings.accountSecurity.title')}
      sectionLead={t('settings.accountSecurity.lead')}
    >
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="settings-grid">
        <SettingsSectionCard
          icon={<ShieldCheck {...ICON} />}
          title={t('settings.accountSecurity.totpTitle')}
          description={t('settings.accountSecurity.totpLead')}
        >
          {totpEnabled ? (
            <div className="settings-stack">
              <p className="muted">{t('settings.accountSecurity.totpActive')}</p>
              <label className="settings-field" htmlFor={passwordId}>
                {t('settings.accountSecurity.passwordLabel')}
                <Input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={busy}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <Button type="button" variant="secondary" disabled={busy || !password} onClick={() => void disableTotp()}>
                {t('settings.accountSecurity.totpDisable')}
              </Button>
            </div>
          ) : totpUri ? (
            <form className="settings-stack" onSubmit={(e) => void confirmTotp(e)}>
              {totpQrDataUrl ? (
                <img
                  className="settings-totp-qr"
                  src={totpQrDataUrl}
                  alt={t('settings.accountSecurity.totpQrAlt')}
                  width={200}
                  height={200}
                />
              ) : null}
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowTotpSecret((v) => !v)}
              >
                {showTotpSecret
                  ? t('settings.accountSecurity.totpHideKey')
                  : t('settings.accountSecurity.totpShowKey')}
              </Button>
              {showTotpSecret ? (
                <p className="settings-totp-uri muted">{totpUri}</p>
              ) : null}
              {backupCodes?.length ? (
                <div className="settings-backup-codes">
                  <p className="muted">{t('settings.accountSecurity.backupCodesLead')}</p>
                  <ul>
                    {backupCodes.map((code) => (
                      <li key={code}>
                        <code>{code}</code>
                      </li>
                    ))}
                  </ul>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void navigator.clipboard.writeText(backupCodes.join('\n'))}
                  >
                    {t('settings.accountSecurity.backupCodesCopy')}
                  </Button>
                </div>
              ) : null}
              <label className="settings-field" htmlFor={totpCodeId}>
                {t('settings.accountSecurity.totpCodeLabel')}
                <Input
                  id={totpCodeId}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totpCode}
                  disabled={busy}
                  onChange={(e) => setTotpCode(e.target.value)}
                />
              </label>
              <Button type="submit" disabled={busy || !totpCode || !password}>
                {t('settings.accountSecurity.totpConfirm')}
              </Button>
            </form>
          ) : (
            <form className="settings-stack" onSubmit={(e) => void startTotpEnrollment(e)}>
              <label className="settings-field" htmlFor={passwordId}>
                {t('settings.accountSecurity.passwordLabel')}
                <Input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  disabled={busy}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <Button type="submit" disabled={busy || !password}>
                {t('settings.accountSecurity.totpStart')}
              </Button>
            </form>
          )}
        </SettingsSectionCard>

        <SettingsSectionCard
          icon={<KeyRound {...ICON} />}
          title={t('settings.accountSecurity.passkeyTitle')}
          description={t('settings.accountSecurity.passkeyLead')}
        >
          <div className="settings-stack">
            {passkeys.length === 0 ? (
              <p className="muted">{t('settings.accountSecurity.passkeyEmpty')}</p>
            ) : (
              <ul className="account-passkey-list">
                {passkeys.map((pk) => (
                  <li key={pk.id} className="account-passkey-row">
                    <span>{pk.name?.trim() || t('settings.accountSecurity.passkeyUnnamed')}</span>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => void removePasskey(pk.id)}
                    >
                      {t('settings.accountSecurity.passkeyRemove')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <label className="settings-field" htmlFor={passkeyNameId}>
              {t('settings.accountSecurity.passkeyNameLabel')}
              <Input
                id={passkeyNameId}
                value={passkeyName}
                disabled={busy}
                onChange={(e) => setPasskeyName(e.target.value)}
              />
            </label>
            <Button type="button" disabled={busy} onClick={() => void addPasskey()}>
              {t('settings.accountSecurity.passkeyAdd')}
            </Button>
          </div>
        </SettingsSectionCard>
      </div>
    </SettingsSectionLayout>
  );
}
