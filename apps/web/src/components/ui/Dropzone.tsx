// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ChangeEvent, DragEvent } from 'react';
import { useTranslation } from 'react-i18next';

export interface DropzoneProps {
  disabled?: boolean;
  busy?: boolean;
  onFile: (file: File) => void;
}

export function Dropzone({ disabled, busy, onFile }: DropzoneProps) {
  const { t } = useTranslation();

  function pick(file: File | undefined) {
    if (file && !disabled && !busy) {
      onFile(file);
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    pick(event.dataTransfer.files[0]);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    pick(event.target.files?.[0]);
    event.target.value = '';
  }

  return (
    <label
      className={`dropzone${busy ? ' dropzone-busy' : ''}`}
      onDragOver={(e) => { e.preventDefault(); }}
      onDrop={onDrop}
    >
      <input
        type="file"
        accept="application/pdf,image/*"
        className="sr-only"
        disabled={disabled ?? busy}
        onChange={onChange}
      />
      <span className="dropzone-title">
        {busy ? t('upload.dropzoneBusy') : t('upload.dropzoneTitle')}
      </span>
      <span className="dropzone-hint muted">{t('upload.dropzoneHint')}</span>
    </label>
  );
}
