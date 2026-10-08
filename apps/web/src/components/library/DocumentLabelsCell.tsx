import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TagDto } from '@docuvate/contracts';
import { Chip } from '../ui/Chip';

const MAX_VISIBLE_LABELS = 2;
const LONG_LABEL_CHARS = 18;

interface DocumentLabelsCellProps {
  tags: TagDto[];
}

export function DocumentLabelsCell({ tags }: DocumentLabelsCellProps) {
  const { t } = useTranslation();
  const labelTags = useMemo(() => tags.filter((tag) => !tag.isInbox), [tags]);
  const visible = labelTags.slice(0, MAX_VISIBLE_LABELS);
  const overflow = labelTags.slice(MAX_VISIBLE_LABELS);

  if (labelTags.length === 0) {
    return null;
  }

  const overflowNames = overflow.map((tag) => tag.name).join(', ');

  return (
    <div className="document-labels-cell">
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
              aria-label={t('library.moreLabelsAria', { count: overflow.length, names: overflowNames })}
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
    </div>
  );
}
