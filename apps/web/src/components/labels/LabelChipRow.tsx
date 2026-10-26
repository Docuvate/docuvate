// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useFittingChipCount } from '../library/useFittingChipCount';
import { Chip, type ChipProps } from '../ui/Chip';
import { Popover } from '../ui/overlay/Popover';

export interface LabelChipItem {
  id: string;
  label: string;
  color?: string;
  truncateLabel?: boolean;
  onRemove?: () => void;
  variant?: ChipProps['variant'];
}

interface LabelChipRowProps {
  items: LabelChipItem[];
  className?: string;
  overflowAriaLabel?: (overflow: LabelChipItem[]) => string;
}

export function LabelChipRow({ items, className, overflowAriaLabel }: LabelChipRowProps) {
  const { t } = useTranslation();
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const overflowButtonRef = useRef<HTMLButtonElement>(null);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const popoverId = useId();
  const visibleCount = useFittingChipCount(rowRef, measureRef, items.length);
  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);
  const singleTruncatedChip = visibleCount === 1 && overflow.length > 0;
  const truncateVisibleLabels = true;

  if (items.length === 0) {
    return null;
  }

  const overflowNames = overflow.map((item) => item.label).join(', ');

  return (
    <div className={className ?? 'label-chip-row'}>
      <div className="label-chip-row-visible" ref={rowRef}>
        {visible.map((item, index) => (
          <span
            key={item.id}
            className={
              singleTruncatedChip && index === 0
                ? 'label-chip-row-chip label-chip-row-chip--truncate'
                : 'label-chip-row-chip'
            }
          >
            <Chip
              label={item.label}
              variant={item.variant ?? 'assigned'}
              color={item.color}
              truncateLabel={item.truncateLabel ?? truncateVisibleLabels}
              onRemove={item.onRemove}
            />
          </span>
        ))}
        {overflow.length > 0 ? (
          <>
            <button
              ref={overflowButtonRef}
              type="button"
              className="chip chip-outline label-chip-row-overflow-btn"
              aria-expanded={overflowOpen}
              aria-controls={popoverId}
              aria-label={
                overflowAriaLabel?.(overflow) ??
                t('library.moreLabelsAria', { count: overflow.length, names: overflowNames })
              }
              title={overflowNames}
              onClick={() => { setOverflowOpen((open) => !open); }}
            >
              <span className="chip-label">+{overflow.length}</span>
            </button>
            <Popover
              open={overflowOpen}
              onOpenChange={setOverflowOpen}
              referenceRef={overflowButtonRef}
              returnFocusRef={overflowButtonRef}
              portalLayer="popover"
              className="label-chip-row-overflow-popover popover-surface"
              id={popoverId}
              role="region"
              aria-label={t('labelPicker.overflowPopoverAria')}
              onEscape={() => { setOverflowOpen(false); }}
            >
              <div className="label-chip-row-overflow-chips">
                {overflow.map((item) => (
                  <Chip
                    key={item.id}
                    label={item.label}
                    variant={item.variant ?? 'assigned'}
                    color={item.color}
                    onRemove={item.onRemove}
                  />
                ))}
              </div>
            </Popover>
          </>
        ) : null}
      </div>
      <div className="label-chip-row-measure" aria-hidden="true" ref={measureRef}>
        <span data-measure-six-chars="" className="label-chip-row-measure-chip">
          <Chip label="mmmmmm" variant="assigned" />
        </span>
        {items.map((item) => (
          <span
            key={item.id}
            data-measure-chip=""
            data-label-length={String(item.label.length)}
            className="label-chip-row-measure-chip"
          >
            <Chip
              label={item.label}
              variant={item.variant ?? 'assigned'}
              color={item.color}
              truncateLabel={item.truncateLabel}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
