// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { Input } from '../ui/Input';
import { LocalizedDateInput } from '../ui/LocalizedDateInput';
import { Select } from '../ui/Select';

interface DocumentMetadataFormProps {
  title: string;
  documentDate: string;
  notes: string;
  folderId: string;
  folders: FolderDto[];
  saving: boolean;
  onTitleChange: (value: string) => void;
  onDocumentDateChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onFolderIdChange: (value: string) => void;
}

export function DocumentMetadataForm(props: DocumentMetadataFormProps) {
  const { t } = useTranslation();
  const folderOptions = [
    { value: '', label: t('documents.metadataNoFolder') },
    ...props.folders.map((f) => ({ value: f.id, label: f.name })),
  ];

  return (
    <section className="detail-tab-section" aria-labelledby="document-metadata-heading">
      <h2 id="document-metadata-heading" className="detail-section-title">
        {t('documents.metadataHeading')}
      </h2>
      <div className="stack document-metadata-fields">
        <label>
          {t('documents.metadataTitle')}
          <Input
            value={props.title}
            onChange={(e) => { props.onTitleChange(e.target.value); }}
            required
          />
        </label>
        <label>
          {t('documents.metadataDocumentDate')}
          <LocalizedDateInput value={props.documentDate} onChange={props.onDocumentDateChange} />
        </label>
        <label>
          {t('documents.metadataNotes')}
          <textarea
            className="textarea"
            rows={3}
            value={props.notes}
            onChange={(e) => { props.onNotesChange(e.target.value); }}
          />
        </label>
        <label>
          {t('documents.metadataFolder')}
          <Select
            value={props.folderId}
            onChange={props.onFolderIdChange}
            options={folderOptions}
            aria-label={t('documents.metadataFolderAria')}
          />
        </label>
        <p className="muted metadata-hint">{t('documents.metadataHint')}</p>
      </div>
    </section>
  );
}
