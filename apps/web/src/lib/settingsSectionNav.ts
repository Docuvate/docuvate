import { routes } from './routes';

export type SettingsSectionNavItem = {
  to: string;
  end: boolean;
  labelKey: string;
  /** Reserved for future role-gated entries (e.g. administration). */
  requiredRoles?: readonly string[];
};

export function getSettingsSectionNavItems(): SettingsSectionNavItem[] {
  return [
    { to: routes.settings, end: true, labelKey: 'settings.navOverview' },
    { to: routes.settingsConnectors, end: false, labelKey: 'settings.navConnectors' },
    { to: routes.settingsBlockedLabels, end: false, labelKey: 'settings.navBlockedLabels' },
  ];
}
