import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsSectionTabs } from './SettingsSectionTabs';

type SettingsSectionLayoutProps = {
  sectionTitle?: string;
  sectionLead?: string;
  sectionBreadcrumb?: ReactNode;
  headerAside?: ReactNode;
  children: ReactNode;
};

export function SettingsSectionLayout({
  sectionTitle,
  sectionLead,
  sectionBreadcrumb,
  headerAside,
  children,
}: SettingsSectionLayoutProps) {
  const { t } = useTranslation();
  const isOverview = sectionTitle == null;

  return (
    <div className="page settings-page" data-ux="page">
      <header className="settings-section-header">
        <div className="settings-section-header-main">
          <h1 data-ux={isOverview ? 'page-title' : undefined}>{t('settings.title')}</h1>
          {isOverview ? <p className="muted settings-section-lead">{t('settings.lead')}</p> : null}
        </div>
        {headerAside ? <div className="settings-section-header-aside">{headerAside}</div> : null}
      </header>
      <SettingsSectionTabs />
      {!isOverview && sectionTitle ? (
        <div className="settings-section-intro">
          {sectionBreadcrumb ? (
            <div className="settings-section-breadcrumb">{sectionBreadcrumb}</div>
          ) : null}
          <h2 className="settings-section-title" data-ux="page-title">
            {sectionTitle}
          </h2>
          {sectionLead ? <p className="muted settings-section-lead">{sectionLead}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
