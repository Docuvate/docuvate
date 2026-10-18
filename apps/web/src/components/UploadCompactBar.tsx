// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { Button } from './ui/Button';

interface UploadCompactBarProps {
  onExpand: () => void;
}

export function UploadCompactBar({ onExpand }: UploadCompactBarProps) {
  const { t } = useTranslation();

  return (
    <div className="upload-compact-bar">
      <p className="muted upload-compact-hint">{t('upload.compactHint')}</p>
      <Button type="button" variant="secondary" onClick={onExpand}>
        {t('upload.uploadButton')}
      </Button>
    </div>
  );
}
