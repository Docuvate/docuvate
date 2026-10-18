// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { FolderDto } from '@docuvate/contracts';
import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { childFolders } from '../../lib/ordnerTree';
import { useAutofocusOnMount } from '../../lib/useAutofocusOnMount';
import { Button } from '../ui/Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../ui/Dialog';
import { Input } from '../ui/Input';

export interface FolderPickTarget {
  folderId: string;
  label: string;
}

interface FolderTargetPickerDialogProps {
  open: boolean;
  folders: FolderDto[];
  onCancel: () => void;
  onPick: (target: FolderPickTarget) => void;
}

function buildFolderOptions(folders: FolderDto[]): FolderPickTarget[] {
  const options: FolderPickTarget[] = [];

  function walk(parentId: string | null, depth: number) {
    for (const folder of childFolders(folders, parentId)) {
      const indent = '  '.repeat(depth);
      options.push({
        folderId: folder.id,
        label: `${indent}${folder.name}`,
      });
      walk(folder.id, depth + 1);
    }
  }

  walk(null, 0);
  return options;
}

export function FolderTargetPickerDialog({
  open,
  folders,
  onCancel,
  onPick,
}: FolderTargetPickerDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [query, setQuery] = useState('');
  const searchInputRef = useAutofocusOnMount<HTMLInputElement>();
  const options = useMemo(() => buildFolderOptions(folders), [folders]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <Dialog open={open} onCancel={onCancel} aria-labelledby={titleId}>
      <DialogHeader
        title={t('filesystem.pickUploadFolderTitle')}
        titleId={titleId}
        description={t('filesystem.pickUploadFolderHint')}
      />
      <DialogBody>
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
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
