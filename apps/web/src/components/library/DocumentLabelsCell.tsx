// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { useMemo } from 'react';

import { DocumentLabelSuggestionChips } from '../documents/DocumentLabelSuggestionChips';
import { LabelChipRow } from '../labels/LabelChipRow';

const LONG_LABEL_CHARS = 18;

interface DocumentLabelsCellProps {
  document: Pick<DocumentDto, 'id' | 'tags' | 'tagSuggestions'>;
  onRefresh?: () => void | Promise<void>;
}

export function DocumentLabelsCell({ document, onRefresh }: DocumentLabelsCellProps) {
  const tags = document.tags;
  const labelTags = useMemo(() => tags.filter((tag) => !tag.isInbox), [tags]);
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
      <LabelChipRow
        className="document-labels-cell-row"
        items={labelTags.map((tag) => ({
          id: tag.id,
          label: tag.name,
          color: tag.color,
          truncateLabel: tag.name.length > LONG_LABEL_CHARS,
        }))}
      />
    </div>
  );
}
