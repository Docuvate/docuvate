// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LabelRecommendationDto } from '@docuvate/contracts';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import {
  LabelSuggestionDismissActions,
  type LabelSuggestionDismissScope,
} from './LabelSuggestionDismissActions';
import { recommendationDocumentTitle } from './labelRecDocumentDisplay';
import {
  mergeLabelPairNames,
  recommendationLabelName,
  syncVisibleQueueIds,
  todoAcceptActionKey,
  todoWhyLine,
} from './labelsTodoPresentation';

type Props = {
  items: LabelRecommendationDto[];
  documentCountByTagId: Record<string, number>;
  tagColorById: Record<string, string>;
  loading?: boolean;
  busyId: string | null;
  onAccept: (item: LabelRecommendationDto) => void | Promise<void>;
  onRename: (item: LabelRecommendationDto) => void;
  onDismiss: (
    item: LabelRecommendationDto,
    scope: LabelSuggestionDismissScope
  ) => void | Promise<void>;
};

function TodoHead() {
  const { t } = useTranslation();
  return (
    <div className="label-rec-head">
      <h2>{t('labels.todoTitle')}</h2>
    </div>
  );
}

type TodoRowMainProps = {
  item: LabelRecommendationDto;
  tagColorById: Record<string, string>;
  documentCountByTagId: Record<string, number>;
};

function TodoRowMain(props: TodoRowMainProps) {
  const { item, tagColorById, documentCountByTagId } = props;
  const { t } = useTranslation();
  const reason = todoWhyLine(item, t, documentCountByTagId);
  const primaryDoc = item.sampleDocuments?.[0];
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

  const docTitle =
    primaryDoc != null ? (
      <Link to={routes.document(primaryDoc.id)} className="labels-todo-doc-title">
        {recommendationDocumentTitle(primaryDoc)}
      </Link>
    ) : (
      <p className="labels-todo-doc-title labels-todo-doc-title-static">
        {mergeNames ? `${mergeNames.keep} / ${mergeNames.remove}` : recommendationLabelName(item)}
      </p>
    );

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
                color={item.tagIds?.[tagIndex] ? tagColorById[item.tagIds[tagIndex]!] : undefined}
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
      {primaryDoc && (item.sampleDocuments?.length ?? 0) > 1 ? (
        <p className="muted labels-todo-more-docs">
          {t('labelRecommendations.moreDocuments', {
            count: (item.sampleDocuments?.length ?? 0) - 1,
          })}
        </p>
      ) : null}
    </>
  );
}

export function LabelsTodoQueue(props: Props) {
  const { t } = useTranslation();
  const [visibleIds, setVisibleIds] = useState<string[]>(() => props.items.map((i) => i.id));
  const [exitingIds, setExitingIds] = useState<Set<string>>(() => new Set());
  const exitTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    setVisibleIds((prev) => syncVisibleQueueIds(prev, props.items));
  }, [props.items]);

  useEffect(() => {
    return () => {
      for (const timer of exitTimers.current.values()) {
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
    beginExit(item.id, () => {
      void props.onAccept(item);
    });
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

  if (props.loading) {
    return (
      <Card className="label-rec-panel labels-todo-panel">
        <TodoHead />
        <p className="muted label-rec-hint">{t('labelRecommendations.loading')}</p>
      </Card>
    );
  }

  if (props.items.length === 0) {
    return (
      <Card className="label-rec-panel labels-todo-panel">
        <TodoHead />
        <p className="muted labels-todo-empty">{t('labels.todoEmpty')}</p>
        <p className="muted labels-todo-empty-hint">{t('labels.todoEmptyHint')}</p>
      </Card>
    );
  }

  return (
    <Card className="label-rec-panel labels-todo-panel">
      <TodoHead />
      <ul className="suggest-list label-rec-suggest-list labels-todo-list">
        {ordered.map((item) => (
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
              />
            </div>
            <div className="suggest-actions labels-todo-actions">
              {item.kind === 'rename' ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={props.busyId === item.id || exitingIds.has(item.id)}
                  onClick={() => props.onRename(item)}
                >
                  {t('labelRecommendations.renameAction')}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={props.busyId === item.id || exitingIds.has(item.id)}
                  onClick={() => wrapAccept(item)}
                >
                  {t(todoAcceptActionKey(item))}
                </Button>
              )}
              <LabelSuggestionDismissActions
                labelName={recommendationLabelName(item)}
                disabled={props.busyId === item.id || exitingIds.has(item.id)}
                onDismiss={(scope) => wrapDismiss(item, scope)}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
