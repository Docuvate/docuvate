// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto, MappeDto } from '@docuvate/contracts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { folderDepth } from '../../lib/folderDepth';
import { sortByNameDe } from '../../lib/ordnerTree';
import { useAutofocusOnMount } from '../../lib/useAutofocusOnMount';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface FolderPickTarget {
  folderId: string;
  label: string;
}

interface FolderTargetPickerDialogProps {
  open: boolean;
  mappen: MappeDto[];
  folders: FolderDto[];
  onCancel: () => void;
  onPick: (target: FolderPickTarget) => void;
}

function buildFolderOptions(mappen: MappeDto[], folders: FolderDto[]): FolderPickTarget[] {
  const options: FolderPickTarget[] = [];
  for (const mappe of sortByNameDe(mappen)) {
    const inMappe = sortByNameDe(folders.filter((f) => f.mappeId === mappe.id));
    for (const folder of inMappe) {
      const depth = folderDepth(folders, folder.id);
      const indent = '  '.repeat(Math.max(0, depth - 1));
      options.push({
        folderId: folder.id,
        label: `${indent}${mappe.name} / ${folder.name}`,
      });
    }
  }
  for (const folder of sortByNameDe(folders.filter((f) => !f.mappeId))) {
    options.push({ folderId: folder.id, label: folder.name });
  }
  return options;
}

export function FolderTargetPickerDialog({
  open,
  mappen,
  folders,
  onCancel,
  onPick,
}: FolderTargetPickerDialogProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const searchInputRef = useAutofocusOnMount<HTMLInputElement>();
  const options = useMemo(() => buildFolderOptions(mappen, folders), [mappen, folders]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  if (!open) return null;

  return (
    <dialog
      className="confirm-dialog folder-picker-dialog"
      open
      aria-labelledby="folder-picker-title"
    >
      <h2 id="folder-picker-title" className="confirm-dialog-title">
        {t('filesystem.pickUploadFolderTitle')}
      </h2>
      <p className="muted confirm-dialog-desc">{t('filesystem.pickUploadFolderHint')}</p>
      <Input
        ref={searchInputRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); }}
        placeholder={t('filesystem.treeSearchPlaceholder')}
        aria-label={t('filesystem.treeSearchAria')}
      />
      <ul className="folder-picker-list" aria-label={t('filesystem.pickUploadFolderTitle')}>
        {filtered.map((option) => (
          <li key={option.folderId}>
            <button
              type="button"
              className="folder-picker-option"
              onClick={() => { onPick(option); }}
            >
              {option.label}
            </button>
          </li>
        ))}
        {filtered.length === 0 ? (
          <li className="muted folder-picker-empty">{t('filesystem.pickUploadFolderEmpty')}</li>
        ) : null}
      </ul>
      <div className="confirm-dialog-actions">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </div>
    </dialog>
  );
}
