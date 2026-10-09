// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';
import { CircleCheck, Info, TriangleAlert } from 'lucide-react';

type SettingsCalloutVariant = 'warn' | 'info' | 'success';

type SettingsCalloutProps = {
  variant: SettingsCalloutVariant;
  children: ReactNode;
};

const ICON_SIZE = 18;

export function SettingsCallout({ variant, children }: SettingsCalloutProps) {
  const Icon = variant === 'warn' ? TriangleAlert : variant === 'info' ? Info : CircleCheck;

  return (
    <div className={`settings-callout settings-callout--${variant}`} role="status">
      <span className="settings-callout__icon" aria-hidden>
        <Icon size={ICON_SIZE} strokeWidth={2} />
      </span>
      <div className="settings-callout__content">{children}</div>
    </div>
  );
}
