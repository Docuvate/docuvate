// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Upload } from 'lucide-react';
import { useCallback, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { UPLOAD_ACCEPT } from '../../lib/documentUploadConstants';
import { Button } from '../ui/Button';
import { useDocumentUploadContext } from './documentUploadContext';

interface UploadFileTriggerProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
  disabledTitle?: string;
  onDisabledClick?: () => void;
  className?: string;
  /** Leading upload icon, as every labelled ribbon action has one. */
  icon?: boolean;
}

export function UploadFileTrigger({
  variant = 'secondary',
  size = 'md',
  disabledTitle,
  onDisabledClick,
  className,
  icon = false,
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
        size={size}
        className={className}
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
        {icon ? <Upload size={16} strokeWidth={2} aria-hidden /> : null}
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
          if (e.target.files?.length) {
            processFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />
    </>
  );
}
