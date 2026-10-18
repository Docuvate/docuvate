// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ConnectorPluginId } from '@docuvate/contracts';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import { buildConnectorBreadcrumbItems } from '../../lib/connectorBreadcrumbs';
import { routes } from '../../lib/routes';
import { SettingsSectionLayout } from '../settings/SettingsSectionLayout';
import { Breadcrumb } from '../ui/Breadcrumb';

interface ConnectorDetailLayoutProps {
  pluginId: ConnectorPluginId;
  connectionId: string;
  connectionName: string;
  pluginLabelKey: string;
  tailLabel?: string;
  subtitle?: string;
  children: ReactNode;
}

export function ConnectorDetailLayout({
  pluginId,
  connectionId,
  connectionName,
  pluginLabelKey,
  tailLabel,
  subtitle,
  children,
}: ConnectorDetailLayoutProps) {
  const { t } = useTranslation();
  const crumbs = buildConnectorBreadcrumbItems({
    settingsLabel: t('settings.title'),
    connectorsLabel: t('connectors.title'),
    pluginLabel: t(pluginLabelKey),
    pluginId,
    connectionId,
    connectionName,
    tailLabel,
  });

  return (
    <SettingsSectionLayout
      sectionTitle={connectionName}
      sectionLead={subtitle ?? t(pluginLabelKey)}
      sectionBreadcrumb={<Breadcrumb items={crumbs} className="connector-detail-breadcrumb" />}
    >
      <nav className="connector-detail-tabs" aria-label={t('connectors.detail.tabsAria')}>
        <NavLink
          end
          className={({ isActive }) =>
            isActive ? 'connector-detail-tab connector-detail-tab--active' : 'connector-detail-tab'
          }
          to={routes.settingsConnectorConnection(pluginId, connectionId)}
        >
          {t('connectors.detail.tabSetup')}
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? 'connector-detail-tab connector-detail-tab--active' : 'connector-detail-tab'
          }
          to={routes.settingsConnectorSources(pluginId, connectionId)}
        >
          {t('connectors.detail.tabSources')}
        </NavLink>
      </nav>
      {children}
    </SettingsSectionLayout>
  );
}
