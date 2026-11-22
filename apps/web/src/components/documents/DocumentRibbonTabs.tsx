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

/** Display order matches Word-like document work: Text → Labels → Felder → Layout. */
const TAB_ORDER: readonly StructuringAspect[] = ['ocr', 'labels', 'fields', 'layout'];

interface DocumentRibbonTabsProps {
  statuses: readonly AspectStatus[];
  active: StructuringAspect | null;
  onOpen: (aspect: StructuringAspect) => void;
}

/**
 * Fluent-style ribbon tabs for document structuring (replaces the chip aspect strip).
 */
export function DocumentRibbonTabs({ statuses, active, onOpen }: DocumentRibbonTabsProps) {
  const { t } = useTranslation();
  const byAspect = new Map(statuses.map((status) => [status.aspect, status]));

  return (
    <div className="document-ribbon-tabs" role="tablist" aria-label={t('pipeline.aspects.aria')}>
      {TAB_ORDER.map((aspect) => {
        const status = byAspect.get(aspect);
        if (!status || status.state === 'unavailable' || status.state === 'unknown') {
          return null;
        }
        const Icon = ASPECT_ICONS[aspect];
        const name = t(`pipeline.aspects.name.${aspect}`);
        const stateText =
          status.state === 'open' && status.open != null
            ? t('pipeline.aspects.openCount', { count: status.open })
            : t(`pipeline.aspects.state.${status.state}`);
        const settled = status.state === 'no_open_items' || status.state === 'confirmed';
        const selected = active === aspect;
        return (
          <button
            key={aspect}
            type="button"
            role="tab"
            className={`document-ribbon-tab${selected ? ' document-ribbon-tab--active' : ''}${
              settled ? ' document-ribbon-tab--settled' : ''
            }`}
            aria-selected={selected}
            aria-label={t('pipeline.aspects.itemAria', { aspect: name, state: stateText })}
            data-testid={`structuring-primary-${aspect}`}
            data-aspect={aspect}
            data-aspect-state={status.state}
            onClick={() => {
              onOpen(aspect);
            }}
          >
            <Icon size={16} strokeWidth={2} aria-hidden />
            <span className="document-ribbon-tab-name">{name}</span>
            {settled ? null : <span className="document-ribbon-tab-badge">{stateText}</span>}
          </button>
        );
      })}
    </div>
  );
}
