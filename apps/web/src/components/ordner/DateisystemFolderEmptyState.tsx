// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Upload } from 'lucide-react';
import { type DragEvent,useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { isFileDrag } from '../../lib/documentUploadConstants';
import { Button } from '../ui/Button';
import { useDocumentUploadContext } from '../upload/DocumentUploadProvider';
import { UploadFileTrigger } from '../upload/UploadFileTrigger';
import { DateisystemNewFolderButton } from './DateisystemNewFolderButton';

interface DateisystemFolderEmptyStateProps {
  folderLabel: string;
  onAddExisting: () => void;
  onCreateFolder?: (name: string) => Promise<void>;
  uploadDisabledTitle?: string;
  onRequestUploadTarget?: () => void;
}

export function DateisystemFolderEmptyState({
  folderLabel,
  onAddExisting,
  onCreateFolder,
  uploadDisabledTitle,
  onRequestUploadTarget,
}: DateisystemFolderEmptyStateProps) {
  const { t } = useTranslation();
  const { dropTarget, enqueueFiles } = useDocumentUploadContext();
  const [dragActive, setDragActive] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const onDrop = useCallback(
    (event: DragEvent) => {
      if (!dropTarget.enabled || !isFileDrag(event.dataTransfer)) return;
      event.preventDefault();
      setDragActive(false);
      if (event.dataTransfer.files.length) {
        enqueueFiles(event.dataTransfer.files, dropTarget.assignment);
      }
    },
    [dropTarget.assignment, dropTarget.enabled, enqueueFiles]
  );

  return (
    <div
      className={`empty-state dateisystem-folder-empty dateisystem-folder-dropzone${dragActive ? ' is-drag-over' : ''}`}
      onDragEnter={(e) => {
        if (!dropTarget.enabled || !isFileDrag(e.dataTransfer)) return;
        e.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(e) => {
        if (!dropTarget.enabled || !isFileDrag(e.dataTransfer)) return;
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => { setDragActive(false); }}
      onDrop={onDrop}
    >
      <Upload className="dateisystem-empty-icon" size={32} strokeWidth={1.5} aria-hidden />
      <h3>{t('filesystem.folderEmptyTitle', { folder: folderLabel })}</h3>
      <p className="muted">{t('upload.dropzoneHint')}</p>
      <div className="dateisystem-folder-empty-actions">
        <UploadFileTrigger
          variant="primary"
          disabledTitle={uploadDisabledTitle}
          onDisabledClick={onRequestUploadTarget}
        />
        <Button type="button" variant="secondary" onClick={onAddExisting}>
          {t('filesystem.addExistingButton')}
        </Button>
        {onCreateFolder ? (
          <DateisystemNewFolderButton
            onCreate={onCreateFolder}
            open={newFolderOpen}
            onOpenChange={setNewFolderOpen}
          />
        ) : null}
      </div>
    </div>
  );
}
