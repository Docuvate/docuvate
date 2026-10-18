// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { TagDto } from '@docuvate/contracts';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '../ui/Input';

interface LibraryTagFilterComboboxProps {
  tags: TagDto[];
  activeTagIds: Set<string>;
  onToggleTag: (tagId: string) => void;
}

export function LibraryTagFilterCombobox({
  tags,
  activeTagIds,
  onToggleTag,
}: LibraryTagFilterComboboxProps) {
  const { t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const nonInbox = tags.filter((tag) => !tag.isInbox);
    if (!q) return nonInbox;
    return nonInbox.filter((tag) => tag.name.toLowerCase().includes(q));
  }, [query, tags]);

  useEffect(() => {
    const onDocPointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => { document.removeEventListener('pointerdown', onDocPointer); };
  }, []);

  return (
    <div
      className="library-tag-filter-combobox"
      ref={rootRef}
      data-testid="library-filter-tag-combobox"
    >
      <label className="filter-label" htmlFor={`${listId}-input`}>
        {t('nav.labels')}
      </label>
      <Input
        id={`${listId}-input`}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={t('library.filter.labelSearchPlaceholder')}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => { setOpen(true); }}
      />
      {open ? (
        <ul className="library-tag-filter-combobox__list" id={listId} role="listbox">
          {options.length === 0 ? (
            <li className="library-tag-filter-combobox__empty muted" role="option" aria-selected={false}>
              {t('library.filter.labelSearchEmpty')}
            </li>
          ) : (
            options.map((tag) => {
              const active = activeTagIds.has(tag.id);
              return (
                <li key={tag.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`library-tag-filter-combobox__option${active ? ' library-tag-filter-combobox__option-active' : ''}`}
                    onClick={() => { onToggleTag(tag.id); }}
                  >
                    {tag.name}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
