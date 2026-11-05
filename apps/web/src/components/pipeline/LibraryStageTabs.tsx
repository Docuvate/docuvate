// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentListQuery } from '@docuvate/contracts';
import { useTranslation } from 'react-i18next';

import type { PipelineOverview } from '../../lib/documentPipeline';
import {
  activeLibraryStageTab,
  LIBRARY_STAGE_TABS,
  type LibraryStageTab,
  libraryStageTabCount,
  libraryStageTabPatch,
} from '../../lib/libraryStageTabs';

interface LibraryStageTabsProps {
  filters: Pick<DocumentListQuery, 'inbox' | 'withoutNonInboxLabel' | 'status'>;
  overview: PipelineOverview | null;
  onSelect: (patch: ReturnType<typeof libraryStageTabPatch>) => void;
}

const ATTENTION_TABS: ReadonlySet<LibraryStageTab> = new Set(['review', 'failed', 'unlabeled']);

/** Pipeline-step shortcuts over the library list (same filters as the filter panel). */
export function LibraryStageTabs({ filters, overview, onSelect }: LibraryStageTabsProps) {
  const { t } = useTranslation();
  const active = activeLibraryStageTab(filters);
  return (
    <div className="library-stage-tabs" role="group" aria-label={t('pipeline.library.tabsAria')}>
      {LIBRARY_STAGE_TABS.map((tab) => {
        const count = libraryStageTabCount(tab, overview);
        const attention = ATTENTION_TABS.has(tab) && count != null && count > 0;
        return (
          <button
            key={tab}
            type="button"
            className={`library-stage-tab${active === tab ? ' is-active' : ''}${attention ? ' library-stage-tab--attention' : ''}`}
            aria-pressed={active === tab}
            data-stage-tab={tab}
            onClick={() => {
              onSelect(libraryStageTabPatch(tab));
            }}
          >
            <span className="library-stage-tab-label">{t(`pipeline.library.tab.${tab}`)}</span>
            {count != null ? <span className="library-stage-tab-count">{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
