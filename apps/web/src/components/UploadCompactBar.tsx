// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Plug, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { routes } from '../lib/routes';
import { Button } from './ui/Button';

interface UploadCompactBarProps {
  onExpand: () => void;
}

/** Intake strip: step 1 of the pipeline, always one click away above the document list. */
export function UploadCompactBar({ onExpand }: UploadCompactBarProps) {
  const { t } = useTranslation();

  return (
    <div className="upload-compact-bar">
      <span className="upload-compact-icon" aria-hidden>
        <Upload size={16} strokeWidth={2} />
      </span>
      <p className="upload-compact-copy">
        <span className="upload-compact-title">{t('pipeline.library.intakeTitle')}</span>
        <span className="muted upload-compact-hint">{t('upload.compactHint')}</span>
      </p>
      <Link
        to={routes.settingsConnectors}
        className="btn btn-ghost upload-compact-import"
        aria-label={t('pipeline.library.importSources')}
      >
        <Plug size={16} strokeWidth={2} aria-hidden />
        <span className="upload-compact-import-label">{t('pipeline.library.importSources')}</span>
      </Link>
      <Button type="button" variant="primary" data-ux="primary-action" onClick={onExpand}>
        {t('upload.uploadButton')}
      </Button>
    </div>
  );
}
