// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ReactNode } from 'react';

import { chipColorStyle } from '../../lib/chipColorStyle';

export type ChipVariant = 'assigned' | 'suggest' | 'inbox' | 'outline';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  color?: string;
  onRemove?: () => void;
  trailing?: ReactNode;
  /** Ellipsis + title tooltip when label exceeds practical inline width. */
  truncateLabel?: boolean;
}

export function Chip({
  label,
  variant = 'assigned',
  color,
  onRemove,
  trailing,
  truncateLabel = false,
}: ChipProps) {
  const style = color && variant === 'assigned' ? chipColorStyle(color) : undefined;

  return (
    <span
      className={`chip chip-${variant}${truncateLabel ? ' chip-label-truncate' : ''}`}
      style={style}
      title={label}
    >
      <span className="chip-label">{label}</span>
      {trailing}
      {onRemove ? (
        <button
          type="button"
          className="chip-remove"
          onClick={onRemove}
          aria-label={`${label} entfernen`}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
