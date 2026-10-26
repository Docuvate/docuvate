// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronDown, Search } from 'lucide-react';
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

import { useFieldFilterValueSearch } from '../../lib/labels/useFieldFilterValueSearch';
import { IconButton } from '../ui/IconButton';
import { Popover } from '../ui/overlay/Popover';

const SEARCH_DEBOUNCE_MS = 200;
const ROW_HEIGHT = 40;
const LIST_MAX_HEIGHT_PX = 320;

interface FieldFilterValuePickerProps {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
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

export function FieldFilterValuePicker({
  fieldKey,
  label,
  value,
  onChange,
  testId,
}: FieldFilterValuePickerProps) {
  const { t } = useTranslation();
  const listId = useId();
  const controlRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listParentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = useFieldFilterValueSearch(fieldKey, debouncedQuery, open);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const options = useMemo(() => {
    const merged: string[] = [];
    const seen = new Set<string>();
    for (const page of search.data?.pages ?? []) {
      for (const item of page.items) {
        if (!seen.has(item)) {
          seen.add(item);
          merged.push(item);
        }
      }
    }
    return merged;
  }, [search.data?.pages]);

  const pages = search.data?.pages;
  const lastPage = pages && pages.length > 0 ? pages[pages.length - 1] : undefined;
  const hasMore = lastPage?.hasMore ?? false;
  const total = pages && pages.length > 0 ? pages[0].total : null;

  const rowCount =
    options.length +
    (hasMore ? 1 : 0) +
    (search.isFetching && options.length === 0 ? 1 : 0) +
    (!search.isFetching && options.length === 0 ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => listParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

  useEffect(() => {
    if (!open) {
      return;
    }
    const last = virtualizer.range?.endIndex ?? 0;
    if (last >= rowCount - 3 && hasMore && !search.isFetchingNextPage) {
      void search.fetchNextPage();
    }
  }, [hasMore, open, rowCount, search, virtualizer.range?.endIndex]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(0);
  }, []);

  function commit(next: string) {
    const trimmed = next.trim();
    setQuery(trimmed);
    onChange(trimmed);
    close();
  }

  function renderVirtualRow(virtualRow: { index: number; start: number }) {
    const statusOffset = search.isFetching && options.length === 0 ? 1 : 0;
    const rowStyle = {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      transform: `translateY(${String(virtualRow.start)}px)`,
    };
    if (search.isFetching && options.length === 0 && virtualRow.index === 0) {
      return (
        <div key="loading" className="label-picker-combobox-row" style={rowStyle}>
          <p className="label-picker-combobox-status muted">{t('library.filter.fieldValuesLoading')}</p>
        </div>
      );
    }
    const optionIndex = virtualRow.index - statusOffset;
    if (!search.isFetching && options.length === 0 && virtualRow.index === 0) {
      return (
        <div key="empty" className="label-picker-combobox-row" style={rowStyle}>
          <p className="label-picker-combobox-status muted">{t('library.filter.fieldValuesEmpty')}</p>
        </div>
      );
    }
    if (optionIndex >= 0 && optionIndex < options.length) {
      const option = options[optionIndex];
      const active = optionIndex === activeIndex;
      return (
        <div key={option} className="label-picker-combobox-row" style={rowStyle}>
          <button
            type="button"
            role="option"
            aria-selected={option === value}
            className={`library-field-filter-combobox__option label-picker-combobox-option${active ? ' library-field-filter-combobox__option--active' : ''}`}
            onClick={() => { commit(option); }}
          >
            {option}
          </button>
        </div>
      );
    }
    if (hasMore && virtualRow.index === rowCount - 1) {
      return (
        <div key="hint" className="label-picker-combobox-row" style={rowStyle}>
          <p className="label-picker-combobox-status muted">{t('labelPicker.moreResultsHint')}</p>
        </div>
      );
    }
    return null;
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((index) => Math.min(options.length - 1, index + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
      return;
    }
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const option = options[activeIndex];
      if (option) {
        commit(option);
        return;
      }
      commit(query);
    }
  }

  return (
    <div className="library-field-filter-combobox" data-testid={testId}>
      <label className="filter-label" htmlFor={listId}>
        {label}
      </label>
      <div className="label-picker-combobox-control" ref={controlRef}>
        <Search className="label-picker-combobox-search-icon" size={16} strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          id={listId}
          type="search"
          className="label-picker-combobox-input input"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-listbox`}
          aria-autocomplete="list"
          value={query}
          placeholder={t('library.filter.fieldValuePlaceholder')}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => { setOpen(true); }}
          onKeyDown={onInputKeyDown}
        />
        <IconButton
          icon={ChevronDown}
          label={open ? t('labelPicker.collapse') : t('labelPicker.expand')}
          className="label-picker-combobox-toggle"
          expanded={open}
          onClick={() => {
            setOpen((next) => !next);
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
        onEscape={close}
      >
        <div
          ref={listParentRef}
          id={`${listId}-listbox`}
          className="label-picker-combobox-list-host"
          role="listbox"
          aria-label={label}
        >
          <div
            className="label-picker-combobox-list-inner"
            style={{ height: `${String(virtualizer.getTotalSize())}px`, position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => renderVirtualRow(virtualRow))}
          </div>
          {query.trim() && !options.includes(query.trim()) ? (
            <button
              type="button"
              className="library-field-filter-combobox__option library-field-filter-combobox__option--custom"
              onClick={() => { commit(query); }}
            >
              {t('library.filter.fieldValueUseTyped', { value: query.trim() })}
            </button>
          ) : null}
          {value ? (
            <button
              type="button"
              className="library-field-filter-combobox__option library-field-filter-combobox__option--clear"
              onClick={() => { commit(''); }}
            >
              {t('library.filter.fieldValueClear')}
            </button>
          ) : null}
          {total != null && total > options.length ? (
            <p className="label-picker-combobox-total muted" role="status">
              {t('labelPicker.resultsTruncated', { shown: options.length, total })}
            </p>
          ) : null}
        </div>
      </Popover>
    </div>
  );
}
