import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { OrdnerBreadcrumbSegment } from '../../lib/ordnerTree';
import { DateisystemNewFolderButton } from '../../components/ordner/DateisystemNewFolderButton';
import { UploadFileTrigger } from '../../components/upload/UploadFileTrigger';
import { Button } from '../../components/ui/Button';

interface DateisystemContentHeaderProps {
  breadcrumbs: OrdnerBreadcrumbSegment[];
  pageTitle: string;
  showDocuments: boolean;
  onCreateFolder: (name: string) => Promise<void>;
  onAddExistingDocuments?: () => void;
  uploadDisabledTitle?: string;
  onRequestUploadTarget?: () => void;
}

export function DateisystemContentHeader({
  breadcrumbs,
  pageTitle,
  showDocuments,
  onCreateFolder,
  onAddExistingDocuments,
  uploadDisabledTitle,
  onRequestUploadTarget,
}: DateisystemContentHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="dateisystem-content-header">
      <div className="dateisystem-content-heading">
        <nav className="dateisystem-breadcrumb" aria-label={t('filesystem.pathAria')}>
          <ol>
            {breadcrumbs.map((seg, i) => (
              <li key={seg.to}>
                {i > 0 ? <span className="dateisystem-breadcrumb-sep" aria-hidden>›</span> : null}
                {i === breadcrumbs.length - 1 ? (
                  <span className="dateisystem-breadcrumb-current">{seg.label}</span>
                ) : (
                  <Link to={seg.to}>{seg.label}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="dateisystem-page-title">{pageTitle}</h1>
      </div>

      <div className="dateisystem-content-actions">
        <UploadFileTrigger
          variant="primary"
          disabledTitle={uploadDisabledTitle}
          onDisabledClick={onRequestUploadTarget}
        />
        <DateisystemNewFolderButton onCreate={onCreateFolder} />
        {showDocuments && onAddExistingDocuments ? (
          <Button type="button" variant="secondary" onClick={onAddExistingDocuments}>
            {t('filesystem.addExistingButton')}
          </Button>
        ) : null}
      </div>
    </header>
  );
}
