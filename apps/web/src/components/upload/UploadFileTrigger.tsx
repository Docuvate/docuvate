// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UPLOAD_ACCEPT } from '../../lib/documentUploadConstants';
import { Button } from '../ui/Button';
import { useDocumentUploadContext } from './DocumentUploadProvider';

interface UploadFileTriggerProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  disabledTitle?: string;
  onDisabledClick?: () => void;
}

export function UploadFileTrigger({
  variant = 'secondary',
  disabledTitle,
  onDisabledClick,
}: UploadFileTriggerProps) {
  const { t } = useTranslation();
  const { dropTarget, enqueueFiles } = useDocumentUploadContext();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      enqueueFiles(files, dropTarget.assignment);
    },
    [dropTarget.assignment, enqueueFiles]
  );

  const disabled = !dropTarget.enabled;

  return (
    <>
      <Button
        type="button"
        variant={variant}
        data-ux={variant === 'primary' ? 'primary-action' : undefined}
        title={disabled && disabledTitle ? disabledTitle : undefined}
        onClick={() => {
          if (disabled) {
            onDisabledClick?.();
            return;
          }
          inputRef.current?.click();
        }}
      >
        {t('upload.uploadButton')}
      </Button>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={UPLOAD_ACCEPT}
        multiple
        className="sr-only"
        aria-label={t('upload.chooseFilesAria')}
        disabled={disabled && !onDisabledClick}
        onChange={(e) => {
          if (e.target.files?.length) void processFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </>
  );
}
