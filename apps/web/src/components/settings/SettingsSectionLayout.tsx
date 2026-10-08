import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsSectionTabs } from './SettingsSectionTabs';

type SettingsSectionLayoutProps = {
  sectionTitle?: string;
  sectionLead?: string;
  headerAside?: ReactNode;
  children: ReactNode;
};

export function SettingsSectionLayout({
  sectionTitle,
  sectionLead,
  headerAside,
  children,
}: SettingsSectionLayoutProps) {
  const { t } = useTranslation();
  const isOverview = sectionTitle == null;

  return (
    <div className="page settings-page">
      <header className="settings-section-header">
        <div className="settings-section-header-main">
          <h1>{t('settings.title')}</h1>
          <p className="muted settings-section-lead">{t('settings.lead')}</p>
        </div>
        {headerAside ? <div className="settings-section-header-aside">{headerAside}</div> : null}
      </header>
      <SettingsSectionTabs />
      {!isOverview && sectionTitle ? (
        <div className="settings-section-intro">
          <h2 className="settings-section-title">{sectionTitle}</h2>
          {sectionLead ? <p className="muted settings-section-lead">{sectionLead}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
