// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { SettingsChatStatusPresentation } from '../../lib/settingsChatStatus';
import { SettingsCallout } from './SettingsCallout';

interface SettingsChatStatusProps {
  status: SettingsChatStatusPresentation;
}

export function SettingsChatStatus({ status }: SettingsChatStatusProps) {
  if (status.variant === 'success') {
    return (
      <SettingsCallout variant="success">
        <p>{status.message}</p>
      </SettingsCallout>
    );
  }

  if (status.variant === 'info') {
    return (
      <SettingsCallout variant="info">
        <p>{status.message}</p>
      </SettingsCallout>
    );
  }

  return (
    <p className="settings-status-line" role="status">
      {status.message}
    </p>
  );
}
