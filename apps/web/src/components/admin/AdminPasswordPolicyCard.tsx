// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { PasswordPolicyDto } from '@docuvate/contracts';
import {
  PASSWORD_DEFAULT_MIN_LENGTH,
  PASSWORD_LENGTH_MAX_BOUND,
  PASSWORD_LENGTH_MIN_BOUND,
  PASSWORD_POLICY_PREVIEW_POLICY,
} from '@docuvate/contracts';
import { KeyRound } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getAdminPasswordPolicy, updateAdminPasswordPolicy } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { notifySaved, notifySaveError } from '../../lib/saveNotify';
import { useFormDraft } from '../../lib/useFormDraft';
import { PasswordPolicyChecklist } from '../auth/PasswordPolicyChecklist';
import { PageFormSaveKit } from '../save/PageFormSaveKit';
import { SettingsSectionCard } from '../settings/SettingsSectionCard';
import { Input } from '../ui/Input';
import { Switch } from '../ui/Switch';

const ICON = { size: 20, strokeWidth: 1.75, 'aria-hidden': true as const };
const PREVIEW_SAMPLE = 'Aa1!BeispielPasswort';

export function AdminPasswordPolicyCard() {
  const { t } = useTranslation();
  const minLengthId = useId();
  const [baseline, setBaseline] = useState<PasswordPolicyDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useFormDraft(
    baseline ?? {
      minLength: PASSWORD_DEFAULT_MIN_LENGTH,
      requireLower: false,
      requireUpper: false,
      requireDigit: false,
      requireSymbol: false,
      checkBreached: false,
    }
  );

  useEffect(() => {
    void getAdminPasswordPolicy()
      .then((policy) => {
        setBaseline(policy);
      })
      .catch((err: unknown) => {
        setLoadError(formatUserFacingError(err, 'errors.loadFailed'));
      });
  }, []);

  const minLengthInvalid = useMemo(() => {
    const value = form.draft.minLength;
    return (
      !Number.isFinite(value) ||
      value < PASSWORD_LENGTH_MIN_BOUND ||
      value > PASSWORD_LENGTH_MAX_BOUND
    );
  }, [form.draft.minLength]);

  async function save(): Promise<void> {
    if (minLengthInvalid) {
      setSaveError(t('admin.passwordPolicy.minLengthInvalid'));
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await updateAdminPasswordPolicy(form.draft);
      setBaseline(saved);
      form.commit(saved);
      notifySaved();
    } catch (err) {
      const message = formatUserFacingError(err, 'admin.passwordPolicy.saveFailed');
      setSaveError(message);
      notifySaveError(message, () => void save());
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsSectionCard
      className="settings-section-card--full admin-password-policy-card"
      icon={<KeyRound {...ICON} />}
      title={t('admin.passwordPolicy.title')}
      description={t('admin.passwordPolicy.lead')}
    >
      {loadError ? (
        <p className="error" role="alert">
          {loadError}
        </p>
      ) : null}
      <div className="admin-password-policy-layout">
        <div className="admin-password-policy-form settings-stack">
          <label className="settings-field" htmlFor={minLengthId}>
            {t('admin.passwordPolicy.minLengthLabel')}
            <div className="admin-password-policy-min-length">
              <Input
                id={minLengthId}
                type="number"
                inputMode="numeric"
                min={PASSWORD_LENGTH_MIN_BOUND}
                max={PASSWORD_LENGTH_MAX_BOUND}
                value={String(form.draft.minLength)}
                disabled={!baseline || saving}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  form.setDraft({
                    ...form.draft,
                    minLength: Number.isFinite(parsed) ? parsed : form.draft.minLength,
                  });
                }}
              />
              <span className="muted admin-password-policy-unit">{t('admin.passwordPolicy.minLengthUnit')}</span>
            </div>
            <p className="muted settings-field-help">{t('admin.passwordPolicy.minLengthHelp')}</p>
          </label>
          <Switch
            label={t('admin.passwordPolicy.requireLower')}
            checked={form.draft.requireLower}
            disabled={!baseline || saving}
            onCheckedChange={(checked) => {
              form.setDraft({ ...form.draft, requireLower: checked });
            }}
          />
          <Switch
            label={t('admin.passwordPolicy.requireUpper')}
            checked={form.draft.requireUpper}
            disabled={!baseline || saving}
            onCheckedChange={(checked) => {
              form.setDraft({ ...form.draft, requireUpper: checked });
            }}
          />
          <Switch
            label={t('admin.passwordPolicy.requireDigit')}
            checked={form.draft.requireDigit}
            disabled={!baseline || saving}
            onCheckedChange={(checked) => {
              form.setDraft({ ...form.draft, requireDigit: checked });
            }}
          />
          <Switch
            label={t('admin.passwordPolicy.requireSymbol')}
            checked={form.draft.requireSymbol}
            disabled={!baseline || saving}
            onCheckedChange={(checked) => {
              form.setDraft({ ...form.draft, requireSymbol: checked });
            }}
          />
          <Switch
            label={t('admin.passwordPolicy.checkBreached')}
            checked={form.draft.checkBreached}
            disabled={!baseline || saving}
            onCheckedChange={(checked) => {
              form.setDraft({ ...form.draft, checkBreached: checked });
            }}
          />
          <p className="muted">{t('admin.passwordPolicy.checkBreachedHelp')}</p>
        </div>
        <div className="admin-password-policy-preview">
          <p className="settings-subheading">{t('admin.passwordPolicy.previewTitle')}</p>
          <PasswordPolicyChecklist policy={PASSWORD_POLICY_PREVIEW_POLICY} password={PREVIEW_SAMPLE} />
        </div>
      </div>
      <PageFormSaveKit
        dirty={form.dirty}
        saving={saving}
        error={saveError}
        onSave={() => void save()}
        onDiscard={() => {
          form.discard();
          setSaveError(null);
        }}
      />
    </SettingsSectionCard>
  );
}
