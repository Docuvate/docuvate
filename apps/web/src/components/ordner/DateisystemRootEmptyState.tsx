import { useTranslation } from 'react-i18next';

export function DateisystemRootEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="empty-state dateisystem-root-empty">
      <div className="dateisystem-empty-icon" aria-hidden>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path
            d="M8 14a4 4 0 0 1 4-4h10l4 4h14a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V14Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3>{t('filesystem.chooseFolderTitle')}</h3>
      <p className="muted">{t('filesystem.rootEmptyLead')}</p>
      <p className="muted dateisystem-root-empty-hint">{t('filesystem.rootEmptyHint')}</p>
    </div>
  );
}
