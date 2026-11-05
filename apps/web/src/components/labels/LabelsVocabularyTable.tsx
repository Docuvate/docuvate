// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { TFunction } from 'i18next';
import { MoreHorizontal, Search } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import {
  flattenTagSearchPages,
  useTagSearchInfiniteQuery,
} from '../../lib/labels/useTagSearchInfiniteQuery';
import { routes } from '../../lib/routes';
import { useStackedTableLayout } from '../../lib/useStackedTableLayout';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ContextMenu } from '../ui/ContextMenu';
import { IconButton } from '../ui/IconButton';
import { Input } from '../ui/Input';
import { describeLabelAutoAssignment } from './labelMatchingSummary';

interface Props {
  tags: TagDto[];
  documentCountByTagId: Record<string, number>;
  loading?: boolean;
  onEdit: (tag: TagDto) => void;
  onDelete: (tagId: string) => void | Promise<void>;
}

const FILTER_DEBOUNCE_MS = 200;

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      window.clearTimeout(handle);
    };
  }, [value, delayMs]);
  return debounced;
}

function filterLinkForTag(tag: TagDto): string {
  const needsQuotes = /\s/.test(tag.name);
  const token = needsQuotes ? `label:"${tag.name}"` : `label:${tag.name}`;
  return `${routes.documents}?filter=${encodeURIComponent(token)}`;
}

const GRID_ROW_HEIGHT = 48;
const COMPACT_ROW_ESTIMATE = 88;
const GRID_VIRTUAL_THRESHOLD = 120;
const COMPACT_VIRTUAL_THRESHOLD = 40;

interface RowSharedProps {
  tag: TagDto;
  count: number;
  style?: CSSProperties;
  measureRef?: (element: HTMLElement | null) => void;
  dataIndex?: number;
  menuOpen: boolean;
  menuTagId: string | null;
  onEdit: (tag: TagDto) => void;
  onOpenMenu: (tagId: string, anchor: HTMLButtonElement) => void;
  t: TFunction;
}

function VocabularyGridRow(props: RowSharedProps) {
  const { tag, count, style, measureRef, dataIndex, menuOpen, menuTagId, onEdit, onOpenMenu, t } =
    props;
  return (
    <div
      ref={measureRef}
      data-index={dataIndex}
      className="labels-vocabulary-grid labels-vocabulary-grid--row"
      style={style}
      role="row"
    >
      <span role="cell" className="labels-vocabulary-cell-truncate">
        <Chip label={tag.name} variant="assigned" color={tag.color} truncateLabel />
      </span>
      <span role="cell" className="labels-vocabulary-grid__count labels-vocabulary-cell-truncate">
        {count > 0 ? (
          <Link to={filterLinkForTag(tag)} className="labels-vocabulary-doc-link">
            {t('labels.vocabularyDocCount', { count })}
          </Link>
        ) : (
          <span className="muted">{t('labels.vocabularyDocCount', { count: 0 })}</span>
        )}
      </span>
      <span role="cell" className="labels-vocabulary-auto labels-vocabulary-cell-truncate muted">
        {describeLabelAutoAssignment(tag, t)}
      </span>
      <span role="cell" className="labels-vocabulary-grid__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            onEdit(tag);
          }}
        >
          {t('labels.editAction')}
        </Button>
        <IconButton
          icon={MoreHorizontal}
          label={t('labels.deleteMenuAria', { name: tag.name })}
          hasPopup="menu"
          expanded={menuOpen && menuTagId === tag.id}
          className="labels-overflow-btn"
          onClick={(e) => {
            onOpenMenu(tag.id, e.currentTarget);
          }}
        />
      </span>
    </div>
  );
}

function VocabularyCompactRow(props: RowSharedProps) {
  const { tag, count, style, measureRef, dataIndex, menuOpen, menuTagId, onEdit, onOpenMenu, t } =
    props;
  return (
    <div
      ref={measureRef}
      data-index={dataIndex}
      className="labels-vocabulary-card-row"
      style={style}
      role="listitem"
    >
      <div className="labels-vocabulary-card-row__main">
        <div className="labels-vocabulary-card-row__line1">
          {/* Small screens show the full name: names with a shared prefix must stay distinguishable. */}
          <Chip label={tag.name} variant="assigned" color={tag.color} />
        </div>
        <div className="labels-vocabulary-card-row__line2 muted">
          <span className="labels-vocabulary-card-row__count">
            {count > 0 ? (
              <Link to={filterLinkForTag(tag)} className="labels-vocabulary-doc-link">
                {t('labels.vocabularyDocCount', { count })}
              </Link>
            ) : (
              t('labels.vocabularyDocCount', { count: 0 })
            )}
          </span>
          <span className="labels-vocabulary-card-row__auto">
            {describeLabelAutoAssignment(tag, t)}
          </span>
        </div>
      </div>
      <div className="labels-vocabulary-card-row__actions">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            onEdit(tag);
          }}
        >
          {t('labels.editAction')}
        </Button>
        <IconButton
          icon={MoreHorizontal}
          label={t('labels.deleteMenuAria', { name: tag.name })}
          hasPopup="menu"
          expanded={menuOpen && menuTagId === tag.id}
          className="labels-overflow-btn"
          onClick={(e) => {
            onOpenMenu(tag.id, e.currentTarget);
          }}
        />
      </div>
    </div>
  );
}

export function LabelsVocabularyTable(props: Props) {
  const { t } = useTranslation();
  const stackedLayout = useStackedTableLayout();
  const vocabularyTags = useMemo(() => props.tags.filter((tag) => !tag.isInbox), [props.tags]);
  const [filterQuery, setFilterQuery] = useState('');
  const debouncedFilterQuery = useDebouncedValue(filterQuery, FILTER_DEBOUNCE_MS);
  const filterActive = debouncedFilterQuery.trim().length > 0;
  const search = useTagSearchInfiniteQuery(debouncedFilterQuery, filterActive);
  const searched = useMemo(
    () => flattenTagSearchPages(search.data?.pages).tags,
    [search.data?.pages]
  );
  const displayTags = useMemo(() => {
    if (!filterActive) {
      return vocabularyTags;
    }
    const allowed = new Set(searched.map((tag) => tag.id));
    return vocabularyTags.filter((tag) => allowed.has(tag.id));
  }, [filterActive, searched, vocabularyTags]);

  const useVirtual = stackedLayout
    ? displayTags.length > COMPACT_VIRTUAL_THRESHOLD
    : displayTags.length > GRID_VIRTUAL_THRESHOLD;

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: displayTags.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => (stackedLayout ? COMPACT_ROW_ESTIMATE : GRID_ROW_HEIGHT),
    measureElement: useVirtual ? (element) => element.getBoundingClientRect().height : undefined,
    overscan: 8,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [menuTagId, setMenuTagId] = useState<string | null>(null);
  const [confirmTag, setConfirmTag] = useState<TagDto | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);

  const openMenu = (tagId: string, anchor: HTMLButtonElement) => {
    menuAnchorRef.current = anchor;
    setMenuTagId(tagId);
    const rect = anchor.getBoundingClientRect();
    setMenuPos({ x: rect.left, y: rect.bottom + 4 });
    setMenuOpen(true);
  };

  const runDelete = useCallback(async () => {
    if (!confirmTag) return;
    setDeleteBusy(true);
    try {
      await props.onDelete(confirmTag.id);
      setConfirmTag(null);
    } finally {
      setDeleteBusy(false);
    }
  }, [confirmTag, props]);

  const renderRow = (
    tag: TagDto,
    rowProps: {
      style?: CSSProperties;
      measureRef?: (el: HTMLElement | null) => void;
      dataIndex?: number;
    }
  ) => {
    const shared: RowSharedProps = {
      tag,
      count: props.documentCountByTagId[tag.id] ?? 0,
      style: rowProps.style,
      measureRef: rowProps.measureRef,
      dataIndex: rowProps.dataIndex,
      menuOpen,
      menuTagId,
      onEdit: props.onEdit,
      onOpenMenu: openMenu,
      t,
    };
    return stackedLayout ? (
      <VocabularyCompactRow key={tag.id} {...shared} />
    ) : (
      <VocabularyGridRow key={tag.id} {...shared} />
    );
  };

  const showFilterEmpty =
    !props.loading &&
    filterActive &&
    !search.isFetching &&
    !search.isError &&
    displayTags.length === 0;
  const showFilterLoading = filterActive && search.isFetching && displayTags.length === 0;
  const showFilterError = filterActive && search.isError;

  return (
    <Card className="labels-vocabulary-card">
      <h2 className="labels-vocabulary-title">{t('labels.vocabularyTitle')}</h2>
      <div className="labels-vocabulary-toolbar">
        <div className="labels-vocabulary-filter">
          <div className="labels-vocabulary-filter-control">
            <Search
              className="labels-vocabulary-filter-icon"
              size={16}
              strokeWidth={2}
              aria-hidden
            />
            <Input
              type="search"
              value={filterQuery}
              placeholder={t('labels.vocabularyFilterPlaceholder')}
              aria-label={t('labels.vocabularyFilterAria')}
              className="labels-vocabulary-filter-input"
              data-testid="labels-vocabulary-filter-input"
              autoComplete="off"
              onChange={(event) => {
                setFilterQuery(event.target.value);
              }}
            />
          </div>
        </div>
      </div>
      {props.loading ? <p className="muted">{t('labels.loading')}</p> : null}
      {!props.loading && vocabularyTags.length === 0 ? (
        <p className="muted">{t('labels.emptyHint')}</p>
      ) : null}
      {showFilterLoading ? (
        <p className="muted" data-testid="labels-vocabulary-filter-loading">
          {t('labels.vocabularyFilterLoading')}
        </p>
      ) : null}
      {showFilterError ? (
        <p className="muted" role="alert" data-testid="labels-vocabulary-filter-error">
          {t('labels.vocabularyFilterError')}
        </p>
      ) : null}
      {showFilterEmpty ? (
        <p className="muted" data-testid="labels-vocabulary-filter-empty">
          {t('labels.vocabularyFilterEmpty', { query: debouncedFilterQuery.trim() })}
        </p>
      ) : null}
      {displayTags.length > 0 ? (
        <div
          className={`labels-vocabulary-scroll${stackedLayout ? ' labels-vocabulary-scroll--stacked' : ''}`}
          ref={scrollRef}
          data-testid={useVirtual ? 'labels-vocabulary-virtual-scroll' : 'labels-vocabulary-scroll'}
          role={stackedLayout ? 'list' : 'table'}
          aria-label={t('labels.vocabularyTitle')}
          aria-rowcount={stackedLayout ? undefined : displayTags.length + 1}
        >
          {!stackedLayout ? (
            <div
              className="labels-vocabulary-grid labels-vocabulary-grid--head"
              role="row"
            >
              <span role="columnheader">{t('labels.vocabularyColName')}</span>
              <span role="columnheader" className="labels-vocabulary-grid__count">
                {t('labels.vocabularyColDocuments')}
              </span>
              <span role="columnheader">{t('labels.matchingAlgorithm')}</span>
              <span role="columnheader" className="labels-vocabulary-grid__actions">
                {t('labels.vocabularyColActions')}
              </span>
            </div>
          ) : null}
          {useVirtual ? (
            <div
              className="labels-vocabulary-virtual-body"
              role={stackedLayout ? undefined : 'rowgroup'}
              style={{ height: `${String(virtualizer.getTotalSize())}px`, position: 'relative' }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const tag = displayTags[virtualRow.index];
                return renderRow(tag, {
                  style: {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${String(virtualRow.start)}px)`,
                  },
                  measureRef: virtualizer.measureElement,
                  dataIndex: virtualRow.index,
                });
              })}
            </div>
          ) : (
            displayTags.map((tag) => renderRow(tag, {}))
          )}
        </div>
      ) : null}
      <ContextMenu
        open={menuOpen && menuTagId != null}
        x={menuPos.x}
        y={menuPos.y}
        anchorRef={menuAnchorRef}
        onClose={() => {
          setMenuOpen(false);
        }}
        items={[
          {
            kind: 'item',
            id: 'delete-label',
            label: t('common.delete'),
            danger: true,
            onSelect: () => {
              const tag = displayTags.find((item) => item.id === menuTagId);
              if (tag) setConfirmTag(tag);
              setMenuOpen(false);
            },
          },
        ]}
      />
      <ConfirmDialog
        open={confirmTag != null}
        title={t('labels.deleteConfirmTitle', { name: confirmTag?.name ?? '' })}
        description={t('labels.deleteConfirmDesc', {
          count: confirmTag ? (props.documentCountByTagId[confirmTag.id] ?? 0) : 0,
        })}
        confirmLabel={t('common.delete')}
        tone="danger"
        busy={deleteBusy}
        onCancel={() => {
          setConfirmTag(null);
        }}
        onConfirm={() => void runDelete()}
      />
    </Card>
  );
}
