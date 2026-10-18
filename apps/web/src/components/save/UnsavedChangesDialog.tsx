// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useTranslation } from 'react-i18next';

import { ConfirmDialog } from '../ui/ConfirmDialog';

interface UnsavedChangesDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

export function UnsavedChangesDialog({ open, onStay, onLeave }: UnsavedChangesDialogProps) {
  const { t } = useTranslation();
  return (
    <ConfirmDialog
      open={open}
      title={t('save.unsavedTitle')}
      description={t('save.unsavedDescription')}
      confirmLabel={t('save.leaveWithoutSaving')}
      cancelLabel={t('save.stay')}
      tone="danger"
      onConfirm={onLeave}
      onCancel={onStay}
    />
  );
}
