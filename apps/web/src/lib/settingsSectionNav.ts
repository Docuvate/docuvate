// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { routes } from './routes';

export interface SettingsSectionNavItem {
  to: string;
  end: boolean;
  labelKey: string;
  /** Reserved for future role-gated entries (e.g. administration). */
  requiredRoles?: readonly string[];
}

export function getSettingsSectionNavItems(): SettingsSectionNavItem[] {
  return [
    { to: routes.settings, end: true, labelKey: 'settings.navOverview' },
    { to: routes.settingsConnectors, end: false, labelKey: 'settings.navConnectors' },
    { to: routes.settingsBlockedLabels, end: false, labelKey: 'settings.navBlockedLabels' },
    { to: routes.settingsAccountSecurity, end: false, labelKey: 'settings.tabAccountSecurity' },
  ];
}
