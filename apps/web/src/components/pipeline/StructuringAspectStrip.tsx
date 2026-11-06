// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { LayoutTemplate, ListChecks, type LucideIcon, ScanText, Tags } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { AspectStatus, StructuringAspect } from '../../lib/structuringAspects';

const ASPECT_ICONS: Record<StructuringAspect, LucideIcon> = {
  ocr: ScanText,
  labels: Tags,
  layout: LayoutTemplate,
  fields: ListChecks,
};

interface StructuringAspectStripProps {
  statuses: readonly AspectStatus[];
  /** Opens the correction mode for an aspect; omit for a read-only strip. */
  onOpen?: (aspect: StructuringAspect) => void;
  /** Library rows: icons with state colour only (text stays available to assistive tech). */
  compact?: boolean;
  className?: string;
}

/** What is left to structure, per aspect (OCR, labels, layout, fields). */
export function StructuringAspectStrip({
  statuses,
  onOpen,
  compact = false,
  className = '',
}: StructuringAspectStripProps) {
  const { t } = useTranslation();
  return (
    <ul
      className={`aspect-strip${compact ? ' aspect-strip--compact' : ''}${className ? ` ${className}` : ''}`}
      aria-label={t('pipeline.aspects.aria')}
    >
      {statuses.map((status) => {
        const Icon = ASPECT_ICONS[status.aspect];
        const name = t(`pipeline.aspects.name.${status.aspect}`);
        const stateText =
          status.state === 'open' && status.open != null
            ? t('pipeline.aspects.openCount', { count: status.open })
            : t(`pipeline.aspects.state.${status.state}`);
        const label = t('pipeline.aspects.itemAria', { aspect: name, state: stateText });
        const content = (
          <>
            <Icon size={compact ? 14 : 16} strokeWidth={2} aria-hidden />
            {compact ? (
              <span className="visually-hidden">{label}</span>
            ) : (
              <>
                <span className="aspect-strip-name">{name}</span>
                <span className="aspect-strip-state">{stateText}</span>
              </>
            )}
          </>
        );
        const openable =
          onOpen !== undefined && status.state !== 'unavailable' && status.state !== 'unknown';
        return (
          <li
            key={status.aspect}
            className={`aspect-strip-item aspect-strip-item--${status.state}`}
            data-aspect={status.aspect}
            data-aspect-state={status.state}
            title={compact ? label : undefined}
          >
            {openable ? (
              <button
                type="button"
                className="aspect-strip-btn"
                aria-label={label}
                onClick={() => {
                  onOpen(status.aspect);
                }}
              >
                {content}
              </button>
            ) : (
              <span className="aspect-strip-btn">{content}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
