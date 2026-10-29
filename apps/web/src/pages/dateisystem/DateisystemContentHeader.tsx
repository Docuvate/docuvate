// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DateisystemNewFolderButton } from '../../components/ordner/DateisystemNewFolderButton';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { Button } from '../../components/ui/Button';
import { UploadFileTrigger } from '../../components/upload/UploadFileTrigger';
import type { OrdnerBreadcrumbSegment } from '../../lib/ordnerTree';
import { DateisystemContentActions } from './DateisystemContentActions';

interface DateisystemContentHeaderProps {
  breadcrumbs: OrdnerBreadcrumbSegment[];
  pageTitle: string;
  showDocuments: boolean;
  onCreateFolder: (name: string) => Promise<void>;
  onAddExistingDocuments?: () => void;
  uploadDisabledTitle?: string;
  onRequestUploadTarget?: () => void;
  hideNewFolderWhenEmpty?: boolean;
}

export function DateisystemContentHeader({
  breadcrumbs,
  pageTitle,
  showDocuments,
  onCreateFolder,
  onAddExistingDocuments,
  uploadDisabledTitle,
  onRequestUploadTarget,
  hideNewFolderWhenEmpty = false,
}: DateisystemContentHeaderProps) {
  const { t } = useTranslation();
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const secondary = [
    ...(!hideNewFolderWhenEmpty
      ? [
          {
            id: 'new-folder',
            menuLabel: t('filesystem.newRootButton'),
            onMenuSelect: () => { setNewFolderOpen(true); },
            forceVisible: newFolderOpen,
            node: (
              <DateisystemNewFolderButton
                onCreate={onCreateFolder}
                open={newFolderOpen}
                onOpenChange={setNewFolderOpen}
              />
            ),
          },
        ]
      : []),
    ...(showDocuments && onAddExistingDocuments
      ? [
          {
            id: 'add-existing',
            menuLabel: t('filesystem.addExistingButton'),
            onMenuSelect: () => { onAddExistingDocuments(); },
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
        <Breadcrumb
          className="dateisystem-breadcrumb"
          ariaLabel={t('filesystem.pathAria')}
          trailEndsWithLink={breadcrumbs.length > 1}
          items={
            breadcrumbs.length > 1
              ? breadcrumbs.slice(0, -1).map((seg) => ({ label: seg.label, to: seg.to }))
              : breadcrumbs.map((seg) => ({ label: seg.label, to: seg.to }))
          }
        />
        {breadcrumbs.length > 1 ? (
          <h1 className="dateisystem-page-title" data-ux="page-title">
            {pageTitle}
          </h1>
        ) : null}
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
