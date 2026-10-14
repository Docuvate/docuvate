// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagSuggestionDto } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import { acceptDocumentTagSuggestion, dismissDocumentTagSuggestion } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { useToastNotify } from '../save/ToastProvider';
import { Chip } from '../ui/Chip';

interface Props {
  documentId: string;
  suggestions: TagSuggestionDto[];
  assignedTagIds: ReadonlySet<string>;
  disabled?: boolean;
  onUpdated: () => void | Promise<void>;
}

export function DocumentLabelSuggestionChips({
  documentId,
  suggestions,
  assignedTagIds,
  disabled = false,
  onUpdated,
}: Props) {
  const { t } = useTranslation();
  const { pushError } = useToastNotify();

  const open = suggestions.filter((item) => !assignedTagIds.has(item.tag.id));
  if (open.length === 0) {
    return null;
  }

  async function accept(tagId: string) {
    try {
      await acceptDocumentTagSuggestion(documentId, tagId);
      await onUpdated();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    }
  }

  async function dismiss(tagId: string) {
    try {
      await dismissDocumentTagSuggestion(documentId, tagId);
      await onUpdated();
    } catch (err) {
      pushError(formatUserFacingError(err, 'errors.generic'));
    }
  }

  return (
    <div className="chip-row document-label-suggestion-chips" role="list">
      {open.map((item) => (
        <button
          key={item.tag.id}
          type="button"
          className="document-label-suggestion-chip-btn"
          disabled={disabled}
          title={t('documents.labelSuggestionAcceptHint', { name: item.tag.name })}
          onClick={() => void accept(item.tag.id)}
          onContextMenu={(event) => {
            event.preventDefault();
            void dismiss(item.tag.id);
          }}
        >
          <Chip label={item.tag.name} variant="suggest" color={item.tag.color} />
        </button>
      ))}
    </div>
  );
}
