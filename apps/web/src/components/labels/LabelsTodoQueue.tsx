// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { LabelRecommendationDto } from '@docuvate/contracts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { recommendationDocumentTitle } from './labelRecDocumentDisplay';
import {
  excludedDocumentIds,
  initialSelectedDocumentIds,
  selectedDocumentIds,
  syncSelectedDocumentIds,
} from './labelRecDocumentSelection';
import { LabelRecommendationDocuments } from './LabelRecommendationDocuments';
import { clusterAcceptButtonLabel, clusterAcceptDisabled } from './labelsTodoAcceptLabel';
import {
  mergeLabelPairNames,
  recommendationLabelName,
  syncVisibleQueueIds,
  todoWhyLine,
} from './labelsTodoPresentation';
import {
  LabelSuggestionDismissActions,
  type LabelSuggestionDismissScope,
} from './LabelSuggestionDismissActions';

export interface LabelRecommendationAcceptOptions {
  documentIds: string[];
  excludedDocumentIds: string[];
}

interface Props {
  items: LabelRecommendationDto[];
  documentCountByTagId: Record<string, number>;
  tagColorById: Record<string, string>;
  loading?: boolean;
  recommendationsWarming?: boolean;
  busyId: string | null;
  documentReviewPendingCount?: number;
  loadError?: string | null;
  onRetryLoad?: () => void;
  retryBusy?: boolean;
  onAccept: (
    item: LabelRecommendationDto,
    options?: LabelRecommendationAcceptOptions
  ) => void | Promise<void>;
  onRename: (item: LabelRecommendationDto) => void;
  onDismiss: (
    item: LabelRecommendationDto,
    scope: LabelSuggestionDismissScope
  ) => void | Promise<void>;
}

function TodoHead() {
  const { t } = useTranslation();
  return (
    <div className="label-rec-head">
      <h2>{t('labels.todoTitle')}</h2>
    </div>
  );
}

interface TodoRowMainProps {
  item: LabelRecommendationDto;
  tagColorById: Record<string, string>;
  documentCountByTagId: Record<string, number>;
  selectedDocumentIds: Set<string>;
  onSelectedDocumentIdsChange: (next: Set<string>) => void;
}

function TodoRowMain(props: TodoRowMainProps) {
  const { item, tagColorById, documentCountByTagId, selectedDocumentIds, onSelectedDocumentIdsChange } =
    props;
  const { t } = useTranslation();
  const reason = todoWhyLine(item, t, documentCountByTagId);
  const sampleDocuments = item.sampleDocuments ?? [];
  const clusterDocuments =
    (item.kind === 'new' || item.kind === 'assign') && sampleDocuments.length > 1
      ? sampleDocuments
      : [];
  const showClusterPicker = clusterDocuments.length > 1;
  const mergeNames = mergeLabelPairNames(item);

  if (item.kind === 'rename') {
    return (
      <>
        <p className="labels-todo-doc-title labels-todo-doc-title-static">
          {item.currentName ?? item.proposedName ?? item.id}
        </p>
        <div className="labels-todo-suggestion muted">
          <span className="labels-todo-suggestion-prefix">{t('labels.todoSuggestionPrefix')}</span>
          <div className="label-rec-chip-row">
            <Chip label={item.currentName ?? '?'} variant="outline" />
            <span className="label-rec-arrow muted" aria-hidden>
              →
            </span>
            <Chip label={item.proposedName ?? '?'} variant="suggest" />
          </div>
          {reason ? <span className="labels-todo-suggestion-reason">{reason}</span> : null}
        </div>
      </>
    );
  }

  let docTitle: ReactNode = null;
  if (!showClusterPicker) {
    if (sampleDocuments.length > 0) {
      const firstDocument = sampleDocuments[0];
      docTitle = (
        <Link to={routes.document(firstDocument.id)} className="labels-todo-doc-title">
          {recommendationDocumentTitle(firstDocument)}
        </Link>
      );
    } else {
      docTitle = (
        <p className="labels-todo-doc-title labels-todo-doc-title-static">
          {mergeNames ? `${mergeNames.keep} / ${mergeNames.remove}` : recommendationLabelName(item)}
        </p>
      );
    }
  }

  return (
    <>
      {docTitle}
      <div className="labels-todo-suggestion muted">
        <span className="labels-todo-suggestion-prefix">{t('labels.todoSuggestionPrefix')}</span>
        {item.kind === 'assign' && item.tagNames?.[0] ? (
          <Chip
            label={item.tagNames[0]}
            variant="assigned"
            color={item.tagId ? tagColorById[item.tagId] : undefined}
          />
        ) : null}
        {item.kind === 'new' && item.proposedName ? (
          <Chip label={item.proposedName} variant="suggest" />
        ) : null}
        {item.kind === 'merge' && item.tagNames ? (
          <div className="label-rec-chip-row">
            {item.tagNames.map((name, tagIndex) => (
              <Chip
                key={name}
                label={name}
                variant="assigned"
                color={item.tagIds?.[tagIndex] ? tagColorById[item.tagIds[tagIndex]] : undefined}
              />
            ))}
          </div>
        ) : null}
        {mergeNames ? (
          <span className="labels-todo-suggestion-reason">
            {t('labels.todoMergeKeepHint', mergeNames)}
          </span>
        ) : (
          <span className="labels-todo-suggestion-reason">{reason}</span>
        )}
      </div>
      {showClusterPicker ? (
        <LabelRecommendationDocuments
          documents={clusterDocuments}
          selectedIds={selectedDocumentIds}
          onSelectedIdsChange={onSelectedDocumentIdsChange}
          exclusionHint
        />
      ) : null}
    </>
  );
}

export function LabelsTodoQueue(props: Props) {
  const { t } = useTranslation();
  const [visibleIds, setVisibleIds] = useState<string[]>(() => props.items.map((i) => i.id));
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const [selectedByItemId, setSelectedByItemId] = useState<Map<string, Set<string>>>(() => new Map());
  const exitTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setVisibleIds((prev) => syncVisibleQueueIds(prev, props.items));
  }, [props.items]);

  useEffect(() => {
    setSelectedByItemId((prev) => {
      const next = new Map(prev);
      for (const item of props.items) {
        if (item.kind !== 'new' && item.kind !== 'assign') {
          continue;
        }
        const documents = item.sampleDocuments ?? [];
        if (documents.length <= 1) {
          continue;
        }
        const existing = next.get(item.id);
        next.set(
          item.id,
          existing
            ? syncSelectedDocumentIds(existing, documents)
            : initialSelectedDocumentIds(documents)
        );
      }
      return next;
    });
  }, [props.items]);

  useEffect(() => {
    const timers = exitTimers.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const beginExit = useCallback((id: string, after: () => void) => {
    setExitingIds((prev) => new Set(prev).add(id));
    const timer = setTimeout(() => {
      setVisibleIds((prev) => prev.filter((x) => x !== id));
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      exitTimers.current.delete(id);
      after();
    }, 220);
    exitTimers.current.set(id, timer);
  }, []);

  const wrapAccept = (item: LabelRecommendationDto) => {
    const documents = item.sampleDocuments ?? [];
    const usesSubsetPicker =
      (item.kind === 'new' || item.kind === 'assign') && documents.length > 1;
    const selected = usesSubsetPicker
      ? (selectedByItemId.get(item.id) ?? initialSelectedDocumentIds(documents))
      : initialSelectedDocumentIds(documents);
    const options: LabelRecommendationAcceptOptions | undefined =
      (item.kind === 'new' || item.kind === 'assign') && documents.length > 0
        ? {
            documentIds: selectedDocumentIds(documents, selected),
            excludedDocumentIds: excludedDocumentIds(documents, selected),
          }
        : undefined;
    void props.onAccept(item, options);
    beginExit(item.id, () => undefined);
  };

  const wrapDismiss = (item: LabelRecommendationDto, scope: LabelSuggestionDismissScope) => {
    beginExit(item.id, () => {
      void props.onDismiss(item, scope);
    });
  };

  const itemsById = new Map(props.items.map((item) => [item.id, item]));
  const ordered = visibleIds
    .map((id) => itemsById.get(id))
    .filter((item): item is LabelRecommendationDto => item != null);

  const useVirtual = ordered.length > 20;
  const listScrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: ordered.length,
    getScrollElement: () => listScrollRef.current,
    estimateSize: () => 132,
    overscan: 6,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  if (props.loading) {
    return (
      <Card className="label-rec-panel labels-todo-panel">
        <TodoHead />
        <p className="muted label-rec-hint">{t('labelRecommendations.loading')}</p>
      </Card>
    );
  }

  if (props.recommendationsWarming && ordered.length === 0) {
    return (
      <Card className="label-rec-panel labels-todo-panel">
        <TodoHead />
        <p className="muted label-rec-hint">{t('labelRecommendations.warming')}</p>
      </Card>
    );
  }

  if (props.loadError) {
    return (
      <Card className="label-rec-panel labels-todo-panel">
        <TodoHead />
        <div className="labels-todo-load-error" role="alert">
          <p className="error">{props.loadError}</p>
          {props.onRetryLoad ? (
            <Button
              type="button"
              variant="secondary"
              disabled={props.retryBusy}
              onClick={() => {
                props.onRetryLoad?.();
              }}
            >
              {t('common.retry')}
            </Button>
          ) : null}
        </div>
      </Card>
    );
  }

  if (props.items.length === 0) {
    const openDocumentSuggestions = (props.documentReviewPendingCount ?? 0) > 0;
    return (
      <Card className="label-rec-panel labels-todo-panel">
        <TodoHead />
        {openDocumentSuggestions ? (
          <>
            <p className="muted labels-todo-empty-hint">{t('labels.todoDocumentReviewOpen')}</p>
            <Link to={routes.reviewQueue} className="labels-todo-review-link">
              {t('labels.todoDocumentReviewLink', { count: props.documentReviewPendingCount ?? 0 })}
            </Link>
          </>
        ) : (
          <>
            <p className="muted labels-todo-empty">{t('labels.todoEmpty')}</p>
            <p className="muted labels-todo-empty-hint">{t('labels.todoEmptyHint')}</p>
          </>
        )}
      </Card>
    );
  }

  function renderRow(item: LabelRecommendationDto) {
    const documents = item.sampleDocuments ?? [];
    const usesSubsetPicker =
      (item.kind === 'new' || item.kind === 'assign') && documents.length > 1;
    const selected = usesSubsetPicker
      ? (selectedByItemId.get(item.id) ?? initialSelectedDocumentIds(documents))
      : new Set<string>();
    const selectedCount = selected.size;
    const totalCount = documents.length;
    const acceptDisabled =
      props.busyId === item.id ||
      exitingIds.has(item.id) ||
      clusterAcceptDisabled(item, selectedCount, totalCount);
    const acceptVariant = usesSubsetPicker ? 'primary' : 'secondary';

    return (
      <li
        key={item.id}
        id={`label-rec-${item.id}`}
        className={`suggest-row label-rec-suggest-row labels-todo-row${
          exitingIds.has(item.id) ? ' is-exiting' : ''
        }`}
      >
        <div className="label-rec-suggest-main labels-todo-main">
          <TodoRowMain
            item={item}
            tagColorById={props.tagColorById}
            documentCountByTagId={props.documentCountByTagId}
            selectedDocumentIds={selected}
            onSelectedDocumentIdsChange={(next) => {
              setSelectedByItemId((prev) => {
                const map = new Map(prev);
                map.set(item.id, next);
                return map;
              });
            }}
          />
        </div>
        <div className="suggest-actions labels-todo-actions">
          {item.kind === 'rename' ? (
            <Button
              type="button"
              variant="secondary"
              disabled={acceptDisabled}
              onClick={() => { props.onRename(item); }}
            >
              {t('labelRecommendations.renameAction')}
            </Button>
          ) : (
            <Button
              type="button"
              variant={acceptVariant}
              disabled={acceptDisabled}
              onClick={() => { wrapAccept(item); }}
            >
              {clusterAcceptButtonLabel(item, selectedCount, totalCount, t)}
            </Button>
          )}
          <LabelSuggestionDismissActions
            labelName={recommendationLabelName(item)}
            disabled={props.busyId === item.id || exitingIds.has(item.id)}
            onDismiss={(scope) => { wrapDismiss(item, scope); }}
          />
        </div>
      </li>
    );
  }

  return (
    <Card className="label-rec-panel labels-todo-panel">
      <TodoHead />
      {useVirtual ? (
        <div
          ref={listScrollRef}
          className="labels-todo-list-virtual-scroll"
          data-testid="labels-todo-virtual-scroll"
        >
          <ul
            className="suggest-list label-rec-suggest-list labels-todo-list labels-todo-list-virtual"
            style={{
              height: `${String(rowVirtualizer.getTotalSize())}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = ordered[virtualRow.index];
              return (
                <div
                  key={item.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${String(virtualRow.start)}px)`,
                  }}
                >
                  {renderRow(item)}
                </div>
              );
            })}
          </ul>
        </div>
      ) : (
        <ul className="suggest-list label-rec-suggest-list labels-todo-list">
          {ordered.map((item) => renderRow(item))}
        </ul>
      )}
    </Card>
  );
}
