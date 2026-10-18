// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  initialSelectedDocumentIds,
  selectedDocumentIds,
} from '../labels/labelRecDocumentSelection';
import { LabelRecommendationDocuments } from '../labels/LabelRecommendationDocuments';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import type { GroupedLibraryLabelSuggestion } from './groupedLabelSuggestions';

interface Props {
  group: GroupedLibraryLabelSuggestion;
  busy?: boolean;
  onAccept: (tagId: string, documentIds: string[]) => Promise<void>;
}

export function LibraryGroupedLabelSuggestionCard(props: Props) {
  const { group, busy, onAccept } = props;
  const { t } = useTranslation();
  const [selected, setSelected] = useState(() => initialSelectedDocumentIds(group.documents));

  const acceptCount = useMemo(
    () => selectedDocumentIds(group.documents, selected).length,
    [group.documents, selected]
  );
  const acceptDisabled = Boolean(busy) || acceptCount === 0;

  return (
    <Card className="library-grouped-label-card">
      <div className="library-grouped-label-head">
        <h3 className="library-grouped-label-title">
          {t('library.groupedLabelTitle', { count: group.documents.length })}
        </h3>
        <Chip label={group.tag.name} variant="suggest" color={group.tag.color} />
      </div>
      <p className="muted library-grouped-label-reason">{group.reason}</p>
      <LabelRecommendationDocuments
        documents={group.documents}
        selectedIds={selected}
        onSelectedIdsChange={setSelected}
        exclusionHint
      />
      <div className="library-grouped-label-actions">
        <Button
          type="button"
          variant="primary"
          disabled={acceptDisabled}
          onClick={() => {
            void onAccept(group.tag.id, selectedDocumentIds(group.documents, selected));
          }}
        >
          {t('library.groupedLabelAccept', { count: acceptCount, name: group.tag.name })}
        </Button>
      </div>
    </Card>
  );
}
