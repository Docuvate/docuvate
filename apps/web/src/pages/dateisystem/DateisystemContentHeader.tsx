import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { OrdnerBreadcrumbSegment } from '../../lib/ordnerTree';
import { DateisystemNewFolderButton } from '../../components/ordner/DateisystemNewFolderButton';
import { UploadFileTrigger } from '../../components/upload/UploadFileTrigger';
import { Button } from '../../components/ui/Button';
import { DateisystemContentActions } from './DateisystemContentActions';

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
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const secondary = [
    {
      id: 'new-folder',
      menuLabel: t('filesystem.newRootButton'),
      onMenuSelect: () => setNewFolderOpen(true),
      forceVisible: newFolderOpen,
      node: (
        <DateisystemNewFolderButton
          onCreate={onCreateFolder}
          open={newFolderOpen}
          onOpenChange={setNewFolderOpen}
        />
      ),
    },
    ...(showDocuments && onAddExistingDocuments
      ? [
          {
            id: 'add-existing',
            menuLabel: t('filesystem.addExistingButton'),
            onMenuSelect: () => onAddExistingDocuments(),
            node: (
              <Button type="button" variant="secondary" onClick={onAddExistingDocuments}>
                {t('filesystem.addExistingButton')}
              </Button>
            ),
          },
        ]
      : []),
  ];

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
        <h1 className="dateisystem-page-title" data-ux="page-title">
          {pageTitle}
        </h1>
      </div>

      <DateisystemContentActions
        primary={
          <UploadFileTrigger
            variant="primary"
            disabledTitle={uploadDisabledTitle}
            onDisabledClick={onRequestUploadTarget}
          />
        }
        secondary={secondary}
      />
    </header>
  );
}
