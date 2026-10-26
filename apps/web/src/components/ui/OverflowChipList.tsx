// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Chip, type ChipVariant } from './Chip';
import { Popover } from './overlay/Popover';

export interface OverflowChipItem {
  id: string;
  label: string;
  variant?: ChipVariant;
  color?: string;
  onRemove?: () => void;
}

interface OverflowChipListProps {
  items: OverflowChipItem[];
  maxVisible?: number;
  empty: string;
  overflowAriaKey?: string;
}

export function OverflowChipList({
  items,
  maxVisible = 8,
  empty,
  overflowAriaKey = 'documents.labelsOverflowMore',
}: OverflowChipListProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  if (items.length === 0) {
    return <p className="muted">{empty}</p>;
  }
  const visible = items.slice(0, maxVisible);
  const hidden = items.slice(maxVisible);
  return (
    <div className="chip-row overflow-chip-list">
      {visible.map((item) => (
        <Chip
          key={item.id}
          label={item.label}
          variant={item.variant}
          color={item.color}
          onRemove={item.onRemove}
          truncateLabel
        />
      ))}
      {hidden.length > 0 ? (
        <>
          <button
            ref={moreRef}
            type="button"
            className="overflow-chip-more"
            aria-expanded={open}
            aria-label={t(overflowAriaKey, { count: hidden.length })}
            onClick={() => { setOpen((prev) => !prev); }}
          >
            {t('documents.labelsOverflowCount', { count: hidden.length })}
          </button>
          <Popover
            open={open}
            onOpenChange={setOpen}
            referenceRef={moreRef}
            className="popover-surface overflow-chip-popover"
            role="dialog"
            aria-label={t(overflowAriaKey, { count: hidden.length })}
          >
            <ul className="overflow-chip-popover-list">
              {hidden.map((item) => (
                <li key={item.id}>
                  <Chip
                    label={item.label}
                    variant={item.variant}
                    color={item.color}
                    onRemove={item.onRemove}
                    truncateLabel
                  />
                </li>
              ))}
            </ul>
          </Popover>
        </>
      ) : null}
    </div>
  );
}
