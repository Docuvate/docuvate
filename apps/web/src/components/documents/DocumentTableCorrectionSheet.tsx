// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '../ui/overlay/BottomSheet';
import { CorrectedTableCard } from './CorrectedTableCard';

interface DocumentTableCorrectionSheetProps {
  open: boolean;
  region: DocumentRegionDto | null;
  index: number;
  onClose: () => void;
  onSelect: () => void;
  onHeaderChange?: (headerRows: number, headerCols: number) => void;
  onCellChange?: (row: number, col: number, text: string) => void;
}

export function DocumentTableCorrectionSheet({
  open,
  region,
  index,
  onClose,
  onSelect,
  onHeaderChange,
  onCellChange,
}: DocumentTableCorrectionSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('documents.tableCorrectionSheetTitle', { n: index + 1 })}
      testId="table-correction-sheet"
    >
      {region ? (
        <CorrectedTableCard
          region={region}
          index={index}
          active
          onSelect={onSelect}
          onHeaderChange={onHeaderChange}
          onCellChange={onCellChange}
        />
      ) : (
        <p className="muted">{t('documents.layoutTablesEmpty')}</p>
      )}
    </BottomSheet>
  );
}
