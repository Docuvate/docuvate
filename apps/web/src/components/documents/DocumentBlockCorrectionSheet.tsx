// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionBlockType, DocumentRegionDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '../ui/overlay/BottomSheet';
import { CorrectedBlockCard } from './CorrectedBlockCard';

interface DocumentBlockCorrectionSheetProps {
  open: boolean;
  region: DocumentRegionDto | null;
  index: number;
  onClose: () => void;
  onSelect: () => void;
  onTypeChange?: (blockType: DocumentRegionBlockType) => void;
  onRankChange?: (readingRank: number) => void;
  onIgnore?: () => void;
}

export function DocumentBlockCorrectionSheet({
  open,
  region,
  index,
  onClose,
  onSelect,
  onTypeChange,
  onRankChange,
  onIgnore,
}: DocumentBlockCorrectionSheetProps) {
  const { t } = useTranslation();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={t('documents.blockCorrectionSheetTitle', { n: index + 1 })}
      testId="block-correction-sheet"
    >
      {region ? (
        <CorrectedBlockCard
          region={region}
          index={index}
          active
          onSelect={onSelect}
          onTypeChange={onTypeChange}
          onRankChange={onRankChange}
          onIgnore={onIgnore}
        />
      ) : (
        <p className="muted">{t('documents.layoutOutlineEmpty')}</p>
      )}
    </BottomSheet>
  );
}
