import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { FolderDto, SftpIngressCreateAccountResponseDto, SftpIngressServerInfoDto } from '@docuvate/contracts';
import { useDialogFocusTrap } from '../../lib/useDialogFocusTrap';
import { SettingsCallout } from '../settings/SettingsCallout';
import { Button } from '../ui/Button';
import { CopyButton } from '../ui/CopyButton';
import { Input } from '../ui/Input';
import { Select, type SelectOption } from '../ui/Select';
import { SegmentedControl } from '../ui/SegmentedControl';

type AuthMode = 'password' | 'sshKey';

interface SftpIngressSetupDialogProps {
  open: boolean;
  busy?: boolean;
  server: SftpIngressServerInfoDto | null;
  serverReady: boolean;
  folders: FolderDto[];
  onCancel: () => void;
  onComplete: (result: SftpIngressCreateAccountResponseDto) => void;
  onSubmit: (payload: {
    displayName: string;
    folderId: string | null;
    authMode: AuthMode;
    sshPublicKey: string | null;
  }) => Promise<SftpIngressCreateAccountResponseDto>;
}

function ValueRow({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) {
  return (
    <div className="connector-sftp-kv-row">
      <span className="connector-sftp-kv-label">{label}</span>
      <div className="connector-sftp-kv-value">
        <code>{value}</code>
        <CopyButton value={copyValue ?? value} />
      </div>
    </div>
  );
}

const STEP_LABEL_KEYS = ['sftpIngress.setupStepName', 'sftpIngress.setupStepDevice', 'sftpIngress.setupStepDone'] as const;

export function SftpIngressSetupDialog({
  open,
  busy = false,
  server,
  serverReady,
  folders,
  onCancel,
  onComplete,
  onSubmit,
}: SftpIngressSetupDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const displayNameRef = useRef<HTMLInputElement>(null);
  const sshPublicKeyRef = useRef<HTMLTextAreaElement>(null);
  const nameErrorId = `${titleId}-display-name-error`;
  const sshErrorId = `${titleId}-ssh-key-error`;
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('password');
  const [sshPublicKey, setSshPublicKey] = useState('');
  const [folderId, setFolderId] = useState<string>('');
  const [created, setCreated] = useState<SftpIngressCreateAccountResponseDto | null>(null);
  const [nameBlurred, setNameBlurred] = useState(false);
  const [sshBlurred, setSshBlurred] = useState(false);
  const [step0Attempted, setStep0Attempted] = useState(false);

  useDialogFocusTrap(dialogRef, open, cancelRef);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setStep(0);
      setDisplayName('');
      setAuthMode('password');
      setSshPublicKey('');
      setFolderId('');
      setCreated(null);
      setNameBlurred(false);
      setSshBlurred(false);
      setStep0Attempted(false);
    }
  }, [open]);

  const endpointLine = useMemo(() => {
    const host = server?.host ?? t('sftpIngress.hostNotConfigured');
    const port = server?.port ?? 2222;
    return `${host}:${port}`;
  }, [server]);

  const folderOptions: SelectOption[] = useMemo(
    () => [
      { value: '', label: t('sftpIngress.targetFolderInbox') },
      ...folders.map((folder) => ({ value: folder.id, label: folder.name })),
    ],
    [folders, t]
  );

  const step0Missing = useMemo(() => {
    const missing: string[] = [];
    if (!displayName.trim()) {
      missing.push(t('sftpIngress.setupMissingName'));
    }
    if (authMode === 'sshKey' && !sshPublicKey.trim()) {
      missing.push(t('sftpIngress.setupMissingSshKey'));
    }
    return missing;
  }, [authMode, displayName, sshPublicKey, t]);

  const canAdvanceStep0 = step0Missing.length === 0;

  const fingerprint = server?.hostKeyFingerprintSha256 ?? null;

  async function handleCreate() {
    const result = await onSubmit({
      displayName: displayName.trim(),
      folderId: folderId.trim() || null,
      authMode,
      sshPublicKey: authMode === 'sshKey' ? sshPublicKey.trim() || null : null,
    });
    setCreated(result);
    setStep(2);
    onComplete(result);
  }

  function tryAdvanceStep0() {
    setStep0Attempted(true);
    if (canAdvanceStep0) {
      setStep(1);
      return;
    }
    if (!displayName.trim()) {
      displayNameRef.current?.focus();
      return;
    }
    if (authMode === 'sshKey' && !sshPublicKey.trim()) {
      sshPublicKeyRef.current?.focus();
    }
  }

  const showNameError = (step0Attempted || nameBlurred) && !displayName.trim();
  const showSshKeyError =
    (step0Attempted || sshBlurred) && authMode === 'sshKey' && !sshPublicKey.trim();

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog connector-sftp-ingress-dialog"
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={titleId} className="confirm-dialog-title">
        {t('sftpIngress.setupTitle')}
      </h2>

      <ol className="connector-sftp-wizard-steps" aria-label={t('sftpIngress.setupStep', { current: step + 1, total: 3 })}>
        {STEP_LABEL_KEYS.map((key, index) => (
          <li
            key={key}
            className={`connector-sftp-wizard-step${index === step ? ' connector-sftp-wizard-step--active' : ''}${index < step ? ' connector-sftp-wizard-step--done' : ''}`}
            aria-current={index === step ? 'step' : undefined}
          >
            <span className="connector-sftp-wizard-step-index">{index + 1}</span>
            <span className="connector-sftp-wizard-step-label">{t(key)}</span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="connector-sftp-setup-step connector-sftp-field-grid">
          <label className="field">
            <span>{t('sftpIngress.displayName')}</span>
            <Input
              ref={displayNameRef}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => setNameBlurred(true)}
              autoComplete="off"
              aria-invalid={showNameError || undefined}
              aria-describedby={showNameError ? nameErrorId : undefined}
              className={showNameError ? 'input-invalid' : ''}
            />
            {showNameError ? (
              <p id={nameErrorId} className="field-inline-error" role="alert">
                {t('sftpIngress.setupFieldErrorName')}
              </p>
            ) : null}
          </label>
          <div className="field">
            <span id={`${titleId}-auth-mode`}>{t('sftpIngress.authModeLegend')}</span>
            <SegmentedControl<AuthMode>
              ariaLabel={t('sftpIngress.authModeLegend')}
              value={authMode}
              options={[
                { value: 'password', label: t('sftpIngress.authModePassword') },
                { value: 'sshKey', label: t('sftpIngress.authModeSshKey') },
              ]}
              onChange={(mode) => {
                setAuthMode(mode);
              }}
            />
          </div>
          {authMode === 'sshKey' ? (
            <label className="field">
              <span>{t('sftpIngress.sshPublicKey')}</span>
              <textarea
                ref={sshPublicKeyRef}
                className={`input connector-sftp-textarea${showSshKeyError ? ' input-invalid' : ''}`}
                rows={4}
                value={sshPublicKey}
                onChange={(e) => setSshPublicKey(e.target.value)}
                onBlur={() => setSshBlurred(true)}
                aria-invalid={showSshKeyError || undefined}
                aria-describedby={showSshKeyError ? sshErrorId : undefined}
              />
              {showSshKeyError ? (
                <p id={sshErrorId} className="field-inline-error" role="alert">
                  {t('sftpIngress.setupFieldErrorSshKey')}
                </p>
              ) : null}
            </label>
          ) : null}
          <label className="field">
            <span>{t('sftpIngress.targetFolder')}</span>
            <Select
              value={folderId}
              onChange={setFolderId}
              options={folderOptions}
              aria-label={t('sftpIngress.targetFolder')}
              menuPortal
            />
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="connector-sftp-setup-step">
          <p className="muted">{t('sftpIngress.printerStepLead')}</p>
          <div className="connector-sftp-kv-grid">
            <ValueRow label={t('sftpIngress.serverAddress')} value={endpointLine} />
            <div className="connector-sftp-kv-row">
              <span className="connector-sftp-kv-label">{t('sftpIngress.fingerprint')}</span>
              {fingerprint ? (
                <div className="connector-sftp-kv-value">
                  <code>{fingerprint}</code>
                  <CopyButton value={fingerprint} />
                </div>
              ) : (
                <SettingsCallout variant="info">
                  {!serverReady ? t('sftpIngress.serverLoading') : t('sftpIngress.fingerprintInfo')}
                </SettingsCallout>
              )}
            </div>
            <ValueRow label={t('sftpIngress.remotePath')} value="/" />
          </div>
        </div>
      ) : null}

      {step === 2 && created ? (
        <div className="connector-sftp-setup-step">
          <p>{t('sftpIngress.createdDescription')}</p>
          <div className="connector-sftp-kv-grid">
            <ValueRow label={t('sftpIngress.username')} value={created.account.username} />
            {created.passwordPlain ? (
              <div className="connector-sftp-kv-row">
                <span className="connector-sftp-kv-label">{t('sftpIngress.passwordOnce')}</span>
                <div className="connector-sftp-kv-value">
                  <code className="connector-sftp-secret-mask">••••••••••••</code>
                  <CopyButton value={created.passwordPlain} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="confirm-dialog-actions connector-sftp-ingress-dialog-actions">
        <Button type="button" variant="secondary" ref={cancelRef} disabled={busy} onClick={onCancel}>
          {step === 2 ? t('common.close') : t('common.cancel')}
        </Button>
        {step === 0 ? (
          <Button type="button" onClick={tryAdvanceStep0}>
            {t('sftpIngress.setupNext')}
          </Button>
        ) : null}
        {step === 1 ? (
          <>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setStep(0)}>
              {t('sftpIngress.setupBack')}
            </Button>
            <Button type="button" disabled={busy || !displayName.trim()} onClick={() => void handleCreate()}>
              {busy ? t('sftpIngress.createPending') : t('sftpIngress.createSubmit')}
            </Button>
          </>
        ) : null}
      </div>
    </dialog>
  );
}
