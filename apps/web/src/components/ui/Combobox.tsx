// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
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

import { Chip } from './Chip';
import { IconButton } from './IconButton';

export interface ComboboxOption {
  value: string;
  label: string;
  /** Higher = more likely in „Häufig“. */
  frequency?: number;
}

interface ComboboxBaseProps {
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
  emptyLabel?: string;
  /** When the query does not match an option, show a create action (e.g. new label name). */
  createOptionLabel?: (query: string) => string | null;
  onCreateOption?: (query: string) => void;
}

interface ComboboxSingleProps extends ComboboxBaseProps {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
}

interface ComboboxMultiProps extends ComboboxBaseProps {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultiProps;

const LIST_MAX_HEIGHT_REM = 20;
const ROW_HEIGHT_REM = 2.5;
const FREQUENT_LIMIT = 8;

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('de-DE');
}

export function Combobox(props: ComboboxProps) {
  const { t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const multiple = props.multiple === true;

  const selectedSet = useMemo(() => {
    if (multiple) {
      return new Set(props.value);
    }
    return new Set(props.value ? [props.value] : []);
  }, [multiple, props.value]);

  const optionByValue = useMemo(
    () => new Map(props.options.map((option) => [option.value, option])),
    [props.options]
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(query);
    const base = q
      ? props.options.filter((option) => normalizeSearch(option.label).includes(q))
      : props.options;
    return [...base].sort((a, b) => a.label.localeCompare(b.label, 'de-DE'));
  }, [props.options, query]);

  const selectedOptions = useMemo(
    () =>
      (multiple ? props.value : props.value ? [props.value] : [])
        .map((id) => optionByValue.get(id))
        .filter((option): option is ComboboxOption => option != null),
    [multiple, props.value, optionByValue]
  );

  const frequentOptions = useMemo(() => {
    const candidates = props.options.filter((option) => !selectedSet.has(option.value));
    return [...candidates]
      .sort((a, b) => (b.frequency ?? 0) - (a.frequency ?? 0) || a.label.localeCompare(b.label, 'de-DE'))
      .slice(0, FREQUENT_LIMIT);
  }, [props.options, selectedSet]);

  const frequentIds = useMemo(() => new Set(frequentOptions.map((o) => o.value)), [frequentOptions]);

  const remaining = useMemo(
    () => filtered.filter((option) => !selectedSet.has(option.value) && !frequentIds.has(option.value)),
    [filtered, selectedSet, frequentIds]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onDocPointerDown(e: MouseEvent) {
      const root = rootRef.current;
      if (root && e.target instanceof Node && !root.contains(e.target)) {
        close();
      }
    }
    document.addEventListener('mousedown', onDocPointerDown);
    return () => { document.removeEventListener('mousedown', onDocPointerDown); };
  }, [open, close]);

  function toggleOption(value: string) {
    if (multiple) {
      const next = selectedSet.has(value)
        ? props.value.filter((id) => id !== value)
        : [...props.value, value];
      props.onChange(next);
      return;
    }
    props.onChange(value);
    close();
  }

  function removeChip(value: string) {
    if (!multiple) {
      props.onChange('');
      return;
    }
    props.onChange(props.value.filter((id) => id !== value));
  }

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown' && !open) {
      setOpen(true);
    }
  }

  const displayValue =
    !multiple && !open && props.value
      ? (optionByValue.get(props.value)?.label ?? '')
      : '';

  return (
    <div
      ref={rootRef}
      className={`combobox${props.className ? ` ${props.className}` : ''}${open ? ' combobox--open' : ''}`}
    >
      {multiple && selectedOptions.length > 0 ? (
        <div className="combobox-chips">
          {selectedOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              variant="assigned"
              onRemove={() => { removeChip(option.value); }}
            />
          ))}
        </div>
      ) : null}
      <div className="combobox-control">
        <Search className="combobox-search-icon" size={16} strokeWidth={2} aria-hidden />
        <input
          ref={inputRef}
          type="search"
          className="combobox-input input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={props['aria-label']}
          disabled={props.disabled}
          placeholder={open ? (props.placeholder ?? t('combobox.searchPlaceholder')) : (props.placeholder ?? t('combobox.searchPlaceholder'))}
          value={open ? query : displayValue}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => { setOpen(true); }}
          onKeyDown={onInputKeyDown}
        />
        <IconButton
          icon={ChevronDown}
          label={open ? t('combobox.collapse') : t('combobox.expand')}
          className="combobox-toggle"
          expanded={open}
          disabled={props.disabled}
          onClick={() => { setOpen((v) => !v); inputRef.current?.focus(); }}
        />
      </div>
      {open ? (
        <ul
          id={listId}
          className="combobox-list custom-select-menu"
          role="listbox"
          aria-multiselectable={multiple || undefined}
          style={{ maxHeight: `${String(LIST_MAX_HEIGHT_REM)}rem` }}
        >
          {selectedOptions.length > 0 ? (
            <>
              <li className="combobox-section-label" aria-hidden>
                {t('combobox.sectionSelected')}
              </li>
              {selectedOptions.map((option) => (
                <ComboboxRow
                  key={`sel-${option.value}`}
                  option={option}
                  active={selectedSet.has(option.value)}
                  multiple={multiple}
                  onSelect={() => { toggleOption(option.value); }}
                />
              ))}
            </>
          ) : null}
          {!query && frequentOptions.length > 0 ? (
            <>
              <li className="combobox-section-label" aria-hidden>
                {t('combobox.sectionFrequent')}
              </li>
              {frequentOptions.map((option) => (
                <ComboboxRow
                  key={`freq-${option.value}`}
                  option={option}
                  active={selectedSet.has(option.value)}
                  multiple={multiple}
                  onSelect={() => { toggleOption(option.value); }}
                />
              ))}
            </>
          ) : null}
          <li className="combobox-section-label" aria-hidden>
            {t('combobox.sectionAll')}
          </li>
          {(query ? filtered : remaining).map((option) => (
            <ComboboxRow
              key={option.value}
              option={option}
              active={selectedSet.has(option.value)}
              multiple={multiple}
              onSelect={() => { toggleOption(option.value); }}
            />
          ))}
          {filtered.length === 0 ? (
            <li className="combobox-empty muted">{props.emptyLabel ?? t('combobox.empty')}</li>
          ) : null}
          {!multiple && props.onCreateOption && props.createOptionLabel
            ? (() => {
                const trimmed = query.trim();
                if (trimmed.length === 0) {
                  return null;
                }
                const exact = props.options.some(
                  (option) => normalizeSearch(option.label) === normalizeSearch(trimmed)
                );
                if (exact) {
                  return null;
                }
                const label = props.createOptionLabel(trimmed);
                if (!label) {
                  return null;
                }
                const onCreate = props.onCreateOption;
                return (
                  <li className="combobox-create-row">
                    <button
                      type="button"
                      className="combobox-option combobox-create-option"
                      onClick={() => {
                        onCreate(trimmed);
                        close();
                      }}
                    >
                      {label}
                    </button>
                  </li>
                );
              })()
            : null}
        </ul>
      ) : null}
    </div>
  );
}

function ComboboxRow({
  option,
  active,
  multiple,
  onSelect,
}: {
  option: ComboboxOption;
  active: boolean;
  multiple: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={active}
        className={`combobox-option custom-select-option${active ? ' is-active' : ''}`}
        style={{ minHeight: `${String(ROW_HEIGHT_REM)}rem` }}
        onClick={onSelect}
      >
        <span className="combobox-option-label">{option.label}</span>
        {multiple && active ? <Check size={16} strokeWidth={2.25} aria-hidden /> : null}
        {!multiple && active ? <Check size={16} strokeWidth={2.25} aria-hidden /> : null}
      </button>
    </li>
  );
}
