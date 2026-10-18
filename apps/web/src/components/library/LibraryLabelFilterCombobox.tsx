// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { listRecognizedFieldFilterValues } from '../../lib/api';
import { Input } from '../ui/Input';

interface LibraryLabelFilterComboboxProps {
  fieldKey: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  testId?: string;
}

export function LibraryLabelFilterCombobox({
  fieldKey,
  label,
  value,
  onChange,
  testId,
}: LibraryLabelFilterComboboxProps) {
  const { t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listRecognizedFieldFilterValues(fieldKey)
      .then((items) => {
        if (!cancelled) setOptions(items);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fieldKey]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const root = rootRef.current;
      if (!root?.contains(event.target instanceof Node ? event.target : null)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => { document.removeEventListener('mousedown', onPointerDown); };
  }, [open]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options.slice(0, 40);
    return options.filter((item) => item.toLowerCase().includes(needle)).slice(0, 40);
  }, [options, query]);

  function commit(next: string) {
    const trimmed = next.trim();
    setQuery(trimmed);
    onChange(trimmed);
    setOpen(false);
  }

  return (
    <div
      className="library-field-filter-combobox"
      ref={rootRef}
      data-testid={testId}
    >
      <label className="filter-label" htmlFor={listId}>
        {label}
      </label>
      <Input
        id={listId}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${listId}-listbox`}
        aria-autocomplete="list"
        value={query}
        placeholder={t('library.filter.fieldValuePlaceholder')}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            return;
          }
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault();
            commit(query);
          }
        }}
      />
      {open ? (
        <ul
          id={`${listId}-listbox`}
          className="library-field-filter-combobox__list"
          role="listbox"
          aria-label={label}
        >
          {loading ? (
            <li className="library-field-filter-combobox__empty muted" role="presentation">
              {t('library.filter.fieldValuesLoading')}
            </li>
          ) : null}
          {!loading && filtered.length === 0 ? (
            <li className="library-field-filter-combobox__empty muted" role="presentation">
              {t('library.filter.fieldValuesEmpty')}
            </li>
          ) : null}
          {!loading
            ? filtered.map((option) => (
                <li key={option} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={option === value}
                    className={`library-field-filter-combobox__option${option === value ? ' library-field-filter-combobox__option--active' : ''}`}
                    onClick={() => { commit(option); }}
                  >
                    {option}
                  </button>
                </li>
              ))
            : null}
          {query.trim() && !filtered.includes(query.trim()) ? (
            <li role="presentation">
              <button
                type="button"
                className="library-field-filter-combobox__option library-field-filter-combobox__option--custom"
                onClick={() => { commit(query); }}
              >
                {t('library.filter.fieldValueUseTyped', { value: query.trim() })}
              </button>
            </li>
          ) : null}
          {value ? (
            <li role="presentation">
              <button
                type="button"
                className="library-field-filter-combobox__option library-field-filter-combobox__option--clear"
                onClick={() => { commit(''); }}
              >
                {t('library.filter.fieldValueClear')}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
