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

interface FolderOption {
  folderId: string;
  label: string;
}

function buildFolderOptions(folders: FolderDto[]): FolderOption[] {
  const options: FolderOption[] = [];

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

interface MoveDocumentsFolderDialogProps {
  open: boolean;
  documentCount: number;
  folders: FolderDto[];
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (folderId: string | null) => void;
  onRequestNewFolder?: () => void;
}

export function MoveDocumentsFolderDialog({
  open,
  documentCount,
  folders,
  busy = false,
  onCancel,
  onConfirm,
  onRequestNewFolder,
}: MoveDocumentsFolderDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [query, setQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const searchInputRef = useAutofocusOnMount<HTMLInputElement>();
  const options = useMemo(() => buildFolderOptions(folders), [folders]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const description =
    documentCount === 1
      ? t('filesystem.moveDocumentsHintOne')
      : t('filesystem.moveDocumentsHintMany', { count: documentCount });

  return (
    <Dialog open={open} busy={busy} onCancel={onCancel} aria-labelledby={titleId}>
      <DialogHeader title={t('filesystem.moveDocumentsTitle')} titleId={titleId} description={description} />
      <DialogBody>
        <Input
          ref={searchInputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          placeholder={t('filesystem.treeSearchPlaceholder')}
          aria-label={t('filesystem.treeSearchAria')}
        />
        <ul className="folder-picker-list" aria-label={t('filesystem.moveDocumentsTitle')}>
          <li>
            <button
              type="button"
              className={`folder-picker-option${selectedFolderId === null ? ' folder-picker-option-active' : ''}`}
              onClick={() => { setSelectedFolderId(null); }}
            >
              {t('filesystem.withoutFolder')}
            </button>
          </li>
          {filtered.map((option) => (
            <li key={option.folderId}>
              <button
                type="button"
                className={`folder-picker-option${selectedFolderId === option.folderId ? ' folder-picker-option-active' : ''}`}
                onClick={() => { setSelectedFolderId(option.folderId); }}
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
        {onRequestNewFolder ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={onRequestNewFolder}>
            {t('filesystem.newRootButton')}
          </Button>
        ) : null}
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={busy}
          onClick={() => { onConfirm(selectedFolderId); }}
        >
          {t('filesystem.moveDocumentsConfirm')}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
