// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, ChevronDown, Search } from 'lucide-react';
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import {
  buildLabelPickerRows,
  type LabelPickerRow,
  labelPickerRowHeight,
} from '../../lib/labels/buildLabelPickerRows';
import {
  flattenTagSearchPages,
  useTagSearchInfiniteQuery,
} from '../../lib/labels/useTagSearchInfiniteQuery';
import { Chip } from '../ui/Chip';
import { IconButton } from '../ui/IconButton';
import { Popover } from '../ui/overlay/Popover';

const SEARCH_DEBOUNCE_MS = 200;
const LIST_MAX_HEIGHT_PX = 320;

export type LabelPickerSelectionMode = 'single' | 'toggle';

interface LabelPickerBaseProps {
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  testId?: string;
  popoverTestId?: string;
  excludeTagIds?: ReadonlySet<string>;
  activeTagIds?: ReadonlySet<string>;
  allowCreate?: boolean;
  createOptionLabel?: (name: string) => string;
  onCreateOption?: (name: string) => void;
  onSearchChange?: (query: string) => void;
}

interface LabelPickerSingleProps extends LabelPickerBaseProps {
  selectionMode?: 'single';
  value: string;
  onChange: (tagId: string) => void;
}

interface LabelPickerToggleProps extends LabelPickerBaseProps {
  selectionMode: 'toggle';
  onToggleTag: (tagId: string) => void;
}

export type LabelPickerProps = LabelPickerSingleProps | LabelPickerToggleProps;

function isToggleProps(props: LabelPickerProps): props is LabelPickerToggleProps {
  return props.selectionMode === 'toggle';
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value);
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [value, delayMs]);
  return debounced;
}

export function LabelPicker(props: LabelPickerProps) {
  const { t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listParentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = useTagSearchInfiniteQuery(debouncedQuery, open);
  const flattened = useMemo(
    () => flattenTagSearchPages(search.data?.pages),
    [search.data?.pages]
  );

  const rows = useMemo(
    () =>
      buildLabelPickerRows(flattened.tags, {
        excludeIds: props.excludeTagIds,
        showTruncatedHint: flattened.hasMore,
        showEmpty: !search.isFetching && flattened.tags.length === 0,
        showLoading: search.isFetching && flattened.tags.length === 0,
      }),
    [flattened.hasMore, flattened.tags, props.excludeTagIds, search.isFetching]
  );

  const optionRowIndexes = useMemo(() => {
    const indexes: number[] = [];
    rows.forEach((row, index) => {
      if (row.kind === 'option') {
        indexes.push(index);
      }
    });
    return indexes;
  }, [rows]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveRowIndex(0);
  }, []);

  const selectTag = useCallback(
    (tag: TagDto) => {
      if (isToggleProps(props)) {
        props.onToggleTag(tag.id);
        return;
      }
      props.onChange(tag.id);
      close();
    },
    [close, props]
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => listParentRef.current,
    estimateSize: (index) => labelPickerRowHeight(rows[index]),
    overscan: 8,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const last = virtualizer.range?.endIndex ?? 0;
    if (last >= rows.length - 3 && flattened.hasMore && !search.isFetchingNextPage) {
      void search.fetchNextPage();
    }
  }, [
    flattened.hasMore,
    open,
    rows.length,
    search,
    virtualizer.range?.endIndex,
  ]);

  function trySelectActiveRow(): boolean {
    if (activeRowIndex < 0 || activeRowIndex >= rows.length) {
      return false;
    }
    const row = rows[activeRowIndex];
    if (row.kind !== 'option') {
      return false;
    }
    selectTag(row.tag);
    return true;
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const currentPos = optionRowIndexes.indexOf(activeRowIndex);
      const nextPos = currentPos < 0 ? 0 : Math.min(optionRowIndexes.length - 1, currentPos + 1);
      setActiveRowIndex(optionRowIndexes[nextPos] ?? 0);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const currentPos = optionRowIndexes.indexOf(activeRowIndex);
      const nextPos = currentPos <= 0 ? 0 : currentPos - 1;
      setActiveRowIndex(optionRowIndexes[nextPos] ?? 0);
      return;
    }
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (trySelectActiveRow()) {
        return;
      }
      const trimmed = query.trim();
      if (trimmed && props.allowCreate && props.onCreateOption) {
        props.onCreateOption(trimmed);
        close();
      }
    }
  }

  const showCreateRow =
    props.allowCreate &&
    props.onCreateOption &&
    props.createOptionLabel &&
    query.trim().length > 0 &&
    !flattened.tags.some(
      (tag) => tag.name.trim().toLocaleLowerCase('de-DE') === query.trim().toLocaleLowerCase('de-DE')
    );

  const showTruncatedTotal =
    flattened.total != null && flattened.total > flattened.tags.length;

  return (
    <div
      ref={rootRef}
      className={`label-picker-combobox${props.className ? ` ${props.className}` : ''}${open ? ' label-picker-combobox--open' : ''}`}
      data-testid={props.testId}
    >
      <div className="label-picker-combobox-control" ref={controlRef}>
        <Search className="label-picker-combobox-search-icon" size={16} strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          type="search"
          className="label-picker-combobox-input input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={props['aria-label']}
          disabled={props.disabled}
          placeholder={props.placeholder ?? t('labelPicker.searchPlaceholder')}
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            props.onSearchChange?.(next);
            setOpen(true);
            setActiveRowIndex(0);
          }}
          onFocus={() => { setOpen(true); }}
          onKeyDown={onInputKeyDown}
        />
        <IconButton
          icon={ChevronDown}
          label={open ? t('labelPicker.collapse') : t('labelPicker.expand')}
          className="label-picker-combobox-toggle"
          expanded={open}
          disabled={props.disabled}
          onClick={() => {
            setOpen((value) => !value);
            inputRef.current?.focus();
          }}
        />
      </div>
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            close();
          } else {
            setOpen(true);
          }
        }}
        referenceRef={controlRef}
        returnFocusRef={inputRef}
        matchReferenceWidth
        maxHeightPx={LIST_MAX_HEIGHT_PX}
        className="label-picker-combobox-popover popover-surface popover-surface-scroll"
        role="presentation"
        testId={props.popoverTestId}
        onEscape={close}
      >
        <div
          ref={listParentRef}
          className="label-picker-combobox-list-host"
          id={listId}
          role="listbox"
          aria-label={props['aria-label']}
        >
          <div
            className="label-picker-combobox-list-inner"
            style={{ height: `${String(virtualizer.getTotalSize())}px`, position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <div
                  key={row.id}
                  className="label-picker-combobox-row"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${String(virtualRow.start)}px)`,
                  }}
                >
                  <LabelPickerRowView
                    row={row}
                    active={virtualRow.index === activeRowIndex}
                    activeTagIds={props.activeTagIds}
                    selectionMode={isToggleProps(props) ? 'toggle' : 'single'}
                    onSelect={selectTag}
                  />
                </div>
              );
            })}
          </div>
          {showCreateRow ? (
            <div className="label-picker-combobox-create">
              <button
                type="button"
                className="label-picker-combobox-option label-picker-combobox-option--create"
                onClick={() => {
                  const trimmed = query.trim();
                  if (trimmed && props.onCreateOption) {
                    props.onCreateOption(trimmed);
                    close();
                  }
                }}
              >
                {props.createOptionLabel?.(query.trim())}
              </button>
            </div>
          ) : null}
          {showTruncatedTotal ? (
            <p className="label-picker-combobox-total muted" role="status">
              {t('labelPicker.resultsTruncated', {
                shown: flattened.tags.length,
                total: flattened.total,
              })}
            </p>
          ) : null}
        </div>
      </Popover>
    </div>
  );
}

function LabelPickerRowView({
  row,
  active,
  activeTagIds,
  selectionMode,
  onSelect,
}: {
  row: LabelPickerRow;
  active: boolean;
  activeTagIds?: ReadonlySet<string>;
  selectionMode: LabelPickerSelectionMode;
  onSelect: (tag: TagDto) => void;
}) {
  const { t } = useTranslation();
  if (row.kind === 'header') {
    return <div className="label-picker-combobox-section" aria-hidden>{row.label}</div>;
  }
  if (row.kind === 'loading') {
    return <p className="label-picker-combobox-status muted">{t('labelPicker.loading')}</p>;
  }
  if (row.kind === 'empty') {
    return <p className="label-picker-combobox-status muted">{t('labelPicker.empty')}</p>;
  }
  if (row.kind === 'hint') {
    return <p className="label-picker-combobox-status muted">{t('labelPicker.moreResultsHint')}</p>;
  }
  const isActive = activeTagIds?.has(row.tag.id) ?? false;
  return (
    <button
      type="button"
      role="option"
      aria-selected={selectionMode === 'toggle' ? isActive : active}
      className={`label-picker-combobox-option label-picker-item${active ? ' label-picker-combobox-option--active' : ''}${isActive ? ' label-picker-combobox-option--selected' : ''}`}
      onClick={() => { onSelect(row.tag); }}
    >
      <Chip label={row.tag.name} variant="assigned" color={row.tag.color} />
      {selectionMode === 'toggle' && isActive ? (
        <Check size={16} strokeWidth={2.25} aria-hidden />
      ) : null}
    </button>
  );
}
