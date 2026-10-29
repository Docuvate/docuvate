// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentRegionBlockType, DocumentRegionDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

const BLOCK_TYPES: DocumentRegionBlockType[] = [
  'heading',
  'paragraph',
  'list',
  'key_value',
  'table',
  'header',
  'footer',
];

function parseSelectedBlockType(value: string): DocumentRegionBlockType | null {
  switch (value) {
    case 'heading':
    case 'paragraph':
    case 'list':
    case 'key_value':
    case 'table':
    case 'header':
    case 'footer':
      return value;
    default:
      return null;
  }
}

export interface CorrectedBlockCardProps {
  region: DocumentRegionDto;
  index: number;
  active: boolean;
  onSelect: () => void;
  onTypeChange?: (blockType: DocumentRegionBlockType) => void;
  onRankChange?: (readingRank: number) => void;
  onIgnore?: () => void;
}

export function CorrectedBlockCard({
  region,
  index,
  active,
  onSelect,
  onTypeChange,
  onRankChange,
  onIgnore,
}: CorrectedBlockCardProps) {
  const { t } = useTranslation();
  const block = region.block;
  return (
    <section
      className={`layout-block-card${active ? ' layout-block-card-active' : ''}`}
      data-testid="corrected-block-card"
      data-layout-overlay-target={`region-block-${region.id}`}
    >
      <button type="button" className="layout-table-card-head" onClick={onSelect}>
        <span>{t('documents.layoutCorrectedBlockLabel', { n: index + 1 })}</span>
        <span className="muted">
          {region.role === 'ignore'
            ? t('documents.blockIgnored')
            : t(`documents.blockType.${block?.blockType ?? 'paragraph'}`)}
        </span>
      </button>
      <div className="layout-block-controls">
        <label className="layout-table-header-stepper">
          <span>{t('documents.blockTypeLabel')}</span>
          <select
            value={block?.blockType ?? 'paragraph'}
            aria-label={t('documents.blockTypeLabel')}
            onChange={(event) => {
              const next = parseSelectedBlockType(event.target.value);
              if (next) {
                onTypeChange?.(next);
              }
            }}
          >
            {BLOCK_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`documents.blockType.${type}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="layout-table-header-stepper">
          <span>{t('documents.blockReadingRank')}</span>
          <input
            type="number"
            min={1}
            value={block?.readingRank ?? 1}
            aria-label={t('documents.blockReadingRank')}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isInteger(next) && next >= 1) {
                onRankChange?.(next);
              }
            }}
          />
        </label>
        {onIgnore && region.role !== 'ignore' ? (
          <button type="button" className="layout-block-ignore" onClick={onIgnore}>
            {t('documents.blockIgnore')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
