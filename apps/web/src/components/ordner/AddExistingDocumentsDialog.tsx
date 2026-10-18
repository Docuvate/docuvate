// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto } from '@docuvate/contracts';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { bulkDocuments, listDocuments } from '../../lib/api';
import { Button } from '../ui/Button';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '../ui/Dialog';
import { Input } from '../ui/Input';

interface AddExistingDocumentsDialogProps {
  open: boolean;
  folderId: string;
  folderLabel: string;
  onClose: () => void;
  onAssigned: () => void;
}

export function AddExistingDocumentsDialog({
  open,
  folderId,
  folderLabel,
  onClose,
  onAssigned,
}: AddExistingDocumentsDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<DocumentDto[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await listDocuments({
        q: query.trim() || undefined,
        sort: 'updatedAt',
        order: 'desc',
      });
      setItems(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelected(new Set());
      setError(null);
    }
  }, [open]);

  const visibleIds = useMemo(() => new Set(items.map((d) => d.id)), [items]);

  async function onConfirm() {
    const ids = [...selected].filter((id) => visibleIds.has(id));
    if (ids.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await bulkDocuments({ ids, bulk: { action: 'setFolder', folderId } });
      onAssigned();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} busy={busy} onCancel={onClose} aria-labelledby={titleId}>
      <DialogHeader
        title={t('filesystem.addExistingTitle')}
        titleId={titleId}
        description={t('filesystem.addExistingHint', { folder: folderLabel })}
      />
      <DialogBody>
        <form
          className="search-row"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder={t('library.searchPlaceholder')}
            aria-label={t('library.searchDocsAria')}
          />
          <Button type="submit" variant="secondary" disabled={loading}>
            {t('shell.search')}
          </Button>
        </form>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {loading ? <p className="muted">{t('library.loadingDocs')}</p> : null}
        <ul className="add-existing-docs-list">
          {items.map((doc) => {
            const checked = selected.has(doc.id);
            const inFolder = doc.folderId === folderId;
            return (
              <li key={doc.id}>
                <label className="add-existing-docs-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={inFolder || busy}
                    onChange={() => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(doc.id)) next.delete(doc.id);
                        else next.add(doc.id);
                        return next;
                      });
                    }}
                  />
                  <span className="add-existing-docs-title">{doc.title || doc.filename}</span>
                  {inFolder ? (
                    <span className="muted add-existing-docs-badge">
                      {t('filesystem.alreadyInFolder')}
                    </span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          disabled={busy || selected.size === 0}
          onClick={() => void onConfirm()}
        >
          {t('filesystem.addExistingConfirm', { count: selected.size })}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
