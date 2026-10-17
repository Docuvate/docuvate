// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { Check, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { confidenceLevelFromPercent } from '../../lib/confidenceLevel';
import { Button } from './Button';
import { Chip } from './Chip';
import { Confidence } from './Confidence';
import { IconButton } from './IconButton';
import { SourceChip } from './SourceChip';

export interface SuggestionRowProps {
  label: string;
  confidencePercent: number;
  sourceLabel: string;
  onAccept?: () => void;
  onDismiss?: () => void;
  trailing?: ReactNode;
}

export function SuggestionRow({
  label,
  confidencePercent,
  sourceLabel,
  onAccept,
  onDismiss,
  trailing,
}: SuggestionRowProps) {
  const { t } = useTranslation();
  const level = confidenceLevelFromPercent(confidencePercent);
  const acceptVariant = level === 'high' ? 'primary' : 'secondary';
  return (
    <div className="suggestion-row">
      <Chip variant="suggest" label={label} />
      <Confidence value={confidencePercent} />
      <SourceChip kind="document" label={sourceLabel} />
      <span className="suggestion-row-spacer" />
      {trailing}
      {onAccept ? (
        <Button type="button" size="sm" variant={acceptVariant} onClick={onAccept}>
          <Check size={16} aria-hidden /> {t('ui.suggestion.accept')}
        </Button>
      ) : null}
      {onDismiss ? (
        <IconButton icon={X} label={t('ui.suggestion.dismiss')} size="sm" onClick={onDismiss} />
      ) : null}
    </div>
  );
}
