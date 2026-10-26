// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { MoreHorizontal } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation, type TFunction } from 'react-i18next';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { flattenTagSearchPages, useTagSearchInfiniteQuery } from '../../lib/labels/useTagSearchInfiniteQuery';
import { routes } from '../../lib/routes';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ContextMenu } from '../ui/ContextMenu';
import { IconButton } from '../ui/IconButton';
import { describeLabelAutoAssignment } from './labelMatchingSummary';
import { LabelPicker } from './LabelPicker';

interface Props {
  tags: TagDto[];
  documentCountByTagId: Record<string, number>;
  loading?: boolean;
  onEdit: (tag: TagDto) => void;
  onDelete: (tagId: string) => void | Promise<void>;
}

function filterLinkForTag(tag: TagDto): string {
  const needsQuotes = /\s/.test(tag.name);
  const token = needsQuotes ? `label:"${tag.name}"` : `label:${tag.name}`;
  return `${routes.documents}?filter=${encodeURIComponent(token)}`;
}

const ROW_HEIGHT = 48;

function VocabularyRow({
  tag,
  count,
  style,
  menuOpen,
  menuTagId,
  onEdit,
  onOpenMenu,
  t,
}: {
  tag: TagDto;
  count: number;
  style?: CSSProperties;
  menuOpen: boolean;
  menuTagId: string | null;
  onEdit: (tag: TagDto) => void;
  onOpenMenu: (tagId: string, anchor: HTMLButtonElement) => void;
  t: TFunction;
}) {
  return (
    <div
      className="labels-vocabulary-grid labels-vocabulary-grid--row"
      style={style}
      role="row"
    >
      <span role="cell">
        <Chip label={tag.name} variant="assigned" color={tag.color} />
      </span>
      <span role="cell" className="labels-vocabulary-grid__count">
        {count > 0 ? (
          <Link to={filterLinkForTag(tag)} className="labels-vocabulary-doc-link">
            {t('labels.vocabularyDocCount', { count })}
          </Link>
        ) : (
          <span className="muted">{t('labels.vocabularyDocCount', { count: 0 })}</span>
        )}
      </span>
      <span role="cell" className="labels-vocabulary-auto muted">
        {describeLabelAutoAssignment(tag, t)}
      </span>
      <span role="cell" className="labels-vocabulary-grid__actions">
        <Button type="button" variant="secondary" onClick={() => { onEdit(tag); }}>
          {t('labels.editAction')}
        </Button>
        <IconButton
          icon={MoreHorizontal}
          label={t('labels.deleteMenuAria', { name: tag.name })}
          hasPopup="menu"
          expanded={menuOpen && menuTagId === tag.id}
          className="labels-overflow-btn"
          onClick={(e) => { onOpenMenu(tag.id, e.currentTarget); }}
        />
      </span>
    </div>
  );
}

export function LabelsVocabularyTable(props: Props) {
  const { t } = useTranslation();
  const vocabularyTags = useMemo(
    () => props.tags.filter((tag) => !tag.isInbox),
    [props.tags]
  );
  const [filterQuery, setFilterQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const search = useTagSearchInfiniteQuery(filterQuery, filterOpen || filterQuery.trim().length > 0);
  const searched = useMemo(() => flattenTagSearchPages(search.data?.pages).tags, [search.data?.pages]);
  const displayTags = useMemo(() => {
    if (filterQuery.trim().length === 0) {
      return vocabularyTags;
    }
    const allowed = new Set(searched.map((tag) => tag.id));
    return vocabularyTags.filter((tag) => allowed.has(tag.id));
  }, [filterQuery, searched, vocabularyTags]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: displayTags.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 6,
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

  return (
    <Card className="labels-vocabulary-card">
      <h2 className="labels-vocabulary-title">{t('labels.vocabularyTitle')}</h2>
      <div className="labels-vocabulary-toolbar">
        <div className="labels-vocabulary-filter">
          <LabelPicker
            value=""
            placeholder={t('labels.vocabularyFilterPlaceholder')}
            aria-label={t('labels.vocabularyFilterAria')}
            onChange={() => undefined}
            onSearchChange={(query) => {
              setFilterQuery(query);
              setFilterOpen(true);
            }}
            className="labels-vocabulary-filter-picker"
            testId="labels-vocabulary-filter-picker"
          />
        </div>
      </div>
      {props.loading ? <p className="muted">{t('labels.loading')}</p> : null}
      {!props.loading && vocabularyTags.length === 0 ? (
        <p className="muted">{t('labels.emptyHint')}</p>
      ) : null}
      {displayTags.length > 0 ? (
        <div className="labels-vocabulary-scroll" ref={scrollRef}>
          <div
            className="labels-vocabulary-grid labels-vocabulary-grid--head"
            role="row"
            aria-hidden
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
          {displayTags.length > 120 ? (
            <div
              className="labels-vocabulary-virtual-body"
              style={{ height: `${String(virtualizer.getTotalSize())}px`, position: 'relative' }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const tag = displayTags[virtualRow.index];
                if (!tag) {
                  return null;
                }
                return (
                  <VocabularyRow
                    key={tag.id}
                    tag={tag}
                    count={props.documentCountByTagId[tag.id] ?? 0}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${String(virtualRow.start)}px)`,
                    }}
                    menuOpen={menuOpen}
                    menuTagId={menuTagId}
                    onEdit={props.onEdit}
                    onOpenMenu={openMenu}
                    t={t}
                  />
                );
              })}
            </div>
          ) : (
            displayTags.map((tag) => (
              <VocabularyRow
                key={tag.id}
                tag={tag}
                count={props.documentCountByTagId[tag.id] ?? 0}
                menuOpen={menuOpen}
                menuTagId={menuTagId}
                onEdit={props.onEdit}
                onOpenMenu={openMenu}
                t={t}
              />
            ))
          )}
        </div>
      ) : null}
      <ContextMenu
        open={menuOpen && menuTagId != null}
        x={menuPos.x}
        y={menuPos.y}
        anchorRef={menuAnchorRef}
        onClose={() => { setMenuOpen(false); }}
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
        onCancel={() => { setConfirmTag(null); }}
        onConfirm={() => void runDelete()}
      />
    </Card>
  );
}
