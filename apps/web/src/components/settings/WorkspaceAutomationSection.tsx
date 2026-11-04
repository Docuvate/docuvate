// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import {
  DUPLICATE_DETECTION_MODES,
  FIELD_ACCEPTANCE_PRESETS,
  LABEL_AUTO_ASSIGN_PRESETS,
  LABEL_SUGGESTION_PRESETS,
  type UpdateWorkspaceMlSettingsRequest,
  type WorkspaceMlSettingsDto,
} from '@docuvate/contracts';
import { type ReactNode, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { getWorkspaceMlSettings, updateWorkspaceMlSettings } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { notifySaved, notifySaveError } from '../../lib/saveNotify';
import { SegmentedControl } from '../ui/SegmentedControl';
import { SettingsSectionCard } from './SettingsSectionCard';

interface PresetFieldProps<T extends string> {
  name: string;
  value: T;
  values: readonly T[];
  disabled: boolean;
  onChange: (value: T) => void;
}

/** One workspace preset: label, short explanation, and a segmented choice. */
function PresetField<T extends string>({ name, value, values, disabled, onChange }: PresetFieldProps<T>) {
  const { t } = useTranslation();
  const label = t(`settings.workspaceMl.${name}.label`);
  return (
    <div className="settings-field workspace-automation__field">
      <span className="settings-field-label">{label}</span>
      <p className="muted settings-hint">{t(`settings.workspaceMl.${name}.hint`)}</p>
      <SegmentedControl
        className="workspace-automation__choice"
        ariaLabel={label}
        value={value}
        options={values.map((option) => ({
          value: option,
          label: t(`settings.workspaceMl.${name}.${option}`),
          disabled,
        }))}
        onChange={onChange}
      />
    </div>
  );
}

/** Workspace-wide automation presets; members see them read-only. */
export function WorkspaceAutomationSection({ icon }: { icon: ReactNode }) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<WorkspaceMlSettingsDto | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getWorkspaceMlSettings()
      .then((loaded) => {
        if (active) setSettings(loaded);
      })
      .catch((err: unknown) => {
        if (active) setLoadError(formatUserFacingError(err, 'settings.workspaceMl.loadFailed'));
      });
    return () => {
      active = false;
    };
  }, []);

  async function save(patch: UpdateWorkspaceMlSettingsRequest) {
    if (!settings?.editable) return;
    const previous = settings;
    setSettings({ ...settings, ...patch });
    try {
      setSettings(await updateWorkspaceMlSettings(patch));
      notifySaved();
    } catch (err) {
      setSettings(previous);
      notifySaveError(formatUserFacingError(err, 'settings.workspaceMl.saveFailed'), () => {
        void save(patch);
      });
    }
  }

  const readOnly = settings?.editable !== true;

  return (
    <SettingsSectionCard
      className="settings-section-card--full workspace-automation"
      icon={icon}
      title={t('settings.workspaceMl.title')}
      description={t('settings.workspaceMl.lead')}
    >
      {loadError ? (
        <p className="error" role="alert">
          {loadError}
        </p>
      ) : null}
      {settings ? (
        <>
          {readOnly ? <p className="muted settings-hint">{t('settings.workspaceMl.readOnly')}</p> : null}
          <PresetField
            name="labelAutoAssign"
            value={settings.labelAutoAssign}
            values={LABEL_AUTO_ASSIGN_PRESETS}
            disabled={readOnly}
            onChange={(labelAutoAssign) => void save({ labelAutoAssign })}
          />
          <PresetField
            name="labelSuggestions"
            value={settings.labelSuggestions}
            values={LABEL_SUGGESTION_PRESETS}
            disabled={readOnly}
            onChange={(labelSuggestions) => void save({ labelSuggestions })}
          />
          <PresetField
            name="duplicateDetection"
            value={settings.duplicateDetection}
            values={DUPLICATE_DETECTION_MODES}
            disabled={readOnly}
            onChange={(duplicateDetection) => void save({ duplicateDetection })}
          />
          <PresetField
            name="fieldAcceptance"
            value={settings.fieldAcceptance}
            values={FIELD_ACCEPTANCE_PRESETS}
            disabled={readOnly}
            onChange={(fieldAcceptance) => void save({ fieldAcceptance })}
          />
        </>
      ) : null}
    </SettingsSectionCard>
  );
}
