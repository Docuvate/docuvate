// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DocumentLabelSuggestionChips } from '../documents/DocumentLabelSuggestionChips';
import { Chip } from '../ui/Chip';

const MAX_VISIBLE_LABELS = 2;
const LONG_LABEL_CHARS = 18;

interface DocumentLabelsCellProps {
  document: Pick<DocumentDto, 'id' | 'tags' | 'tagSuggestions'>;
  onRefresh?: () => void | Promise<void>;
}

export function DocumentLabelsCell({ document, onRefresh }: DocumentLabelsCellProps) {
  const tags = document.tags;
  const { t } = useTranslation();
  const labelTags = useMemo(() => tags.filter((tag) => !tag.isInbox), [tags]);
  const visible = labelTags.slice(0, MAX_VISIBLE_LABELS);
  const overflow = labelTags.slice(MAX_VISIBLE_LABELS);

  const overflowNames = overflow.map((tag) => tag.name).join(', ');
  const assignedIds = new Set(tags.map((tag) => tag.id));

  return (
    <div className="document-labels-cell">
      <DocumentLabelSuggestionChips
        documentId={document.id}
        suggestions={document.tagSuggestions ?? []}
        assignedTagIds={assignedIds}
        onUpdated={async () => {
          await onRefresh?.();
        }}
      />
      {labelTags.length === 0 ? null : (
      <div className="document-labels-cell-row">
        {visible.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            variant="assigned"
            color={tag.color}
            truncateLabel={tag.name.length > LONG_LABEL_CHARS}
          />
        ))}
        {overflow.length > 0 ? (
          <details className="document-labels-overflow-details">
            <summary
              className="chip chip-outline document-labels-overflow-btn"
              aria-label={t('library.moreLabelsAria', {
                count: overflow.length,
                names: overflowNames,
              })}
              title={overflowNames}
            >
              <span className="chip-label">+{overflow.length}</span>
            </summary>
            <div className="document-labels-overflow-popover">
              {overflow.map((tag) => (
                <Chip key={tag.id} label={tag.name} variant="assigned" color={tag.color} />
              ))}
            </div>
          </details>
        ) : null}
      </div>
      )}
    </div>
  );
}
