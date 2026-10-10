// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { DocumentDto, TagDto } from '@docuvate/contracts';
import { type FormEvent,useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { assignDocumentTag, createTag, listTags, removeDocumentTag } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Input } from '../ui/Input';

interface LabelPanelProps {
  document: DocumentDto;
  onUpdated: (doc: DocumentDto) => void;
}

function findTagByName(tags: TagDto[], name: string): TagDto | undefined {
  const normalized = name.trim().toLowerCase();
  return tags.find((tag) => tag.name.trim().toLowerCase() === normalized);
}

export function LabelPanel({ document, onUpdated }: LabelPanelProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [allTags, setAllTags] = useState<TagDto[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const assignedIds = useMemo(
    () => new Set(document.tags.map((tag) => tag.id)),
    [document.tags]
  );

  const trimmedQuery = query.trim();
  const exactMatch = trimmedQuery.length > 0 ? findTagByName(allTags, trimmedQuery) : undefined;
  const alreadyAssigned = exactMatch !== undefined && assignedIds.has(exactMatch.id);

  async function ensureTagsLoaded() {
    if (allTags.length > 0 || loadingTags) {
      return;
    }
    setLoadingTags(true);
    try {
      setAllTags(await listTags());
    } finally {
      setLoadingTags(false);
    }
  }

  const addCandidates = useMemo(() => {
    const q = trimmedQuery.toLowerCase();
    return allTags.filter(
      (tag) =>
        !assignedIds.has(tag.id) &&
        (q.length === 0 || tag.name.toLowerCase().includes(q)) &&
        tag.id !== exactMatch?.id
    );
  }, [allTags, assignedIds, trimmedQuery, exactMatch?.id]);

  async function run(action: () => Promise<DocumentDto>, key: string) {
    setBusy(key);
    setAddError(null);
    try {
      onUpdated(await action());
    } finally {
      setBusy(null);
    }
  }

  async function submitLabel(event: FormEvent) {
    event.preventDefault();
    if (!trimmedQuery || busy !== null || alreadyAssigned) {
      return;
    }
    setAddError(null);
    await ensureTagsLoaded();
    const tags = allTags.length > 0 ? allTags : await listTags();
    if (allTags.length === 0) {
      setAllTags(tags);
    }
    const existing = findTagByName(tags, trimmedQuery);
    setBusy('add-label');
    try {
      let doc: DocumentDto;
      if (existing) {
        doc = await assignDocumentTag(document.id, existing.id);
      } else {
        const created = await createTag({ name: trimmedQuery });
        setAllTags((prev) =>
          prev.some((tag) => tag.id === created.id) ? prev : [...prev, created]
        );
        doc = await assignDocumentTag(document.id, created.id);
      }
      onUpdated(doc);
      setQuery('');
    } catch (err) {
      setAddError(formatUserFacingError(err, 'errors.addFailed'));
    } finally {
      setBusy(null);
    }
  }

  const addButtonLabel =
    exactMatch && !alreadyAssigned
      ? t('documents.labelAddSubmitAssign')
      : t('documents.labelAddSubmitCreate');

  return (
    <section className="label-panel" aria-labelledby="label-panel-heading">
      <header className="label-panel-header detail-section-head">
        <h2 id="label-panel-heading" className="detail-section-title">
          {t('documents.tabLabels')}
        </h2>
        <p className="muted detail-section-lead">{t('documents.labelPanelLead')}</p>
      </header>

      <div className="chip-row">
        {document.tags.length === 0 ? (
          <p className="muted">{t('documents.labelPanelNoneAssigned')}</p>
        ) : (
          document.tags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              variant={tag.isInbox ? 'inbox' : 'assigned'}
              color={tag.isInbox ? undefined : tag.color}
              onRemove={() =>
                void run(() => removeDocumentTag(document.id, tag.id), `remove-${tag.id}`)
              }
            />
          ))
        )}
      </div>

      <div className="label-add">
        <form className="label-add-form" onSubmit={(e) => void submitLabel(e)}>
          <div className="label-add-row">
            <Input
              placeholder={t('documents.labelAddPlaceholder')}
              value={query}
              onFocus={() => void ensureTagsLoaded()}
              onChange={(e) => {
                setQuery(e.target.value);
                setAddError(null);
              }}
              aria-label={t('documents.labelAddInputAria')}
              aria-describedby="label-add-hint"
              autoComplete="off"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={busy !== null || trimmedQuery.length === 0 || alreadyAssigned}
            >
              {addButtonLabel}
            </Button>
          </div>
          <p id="label-add-hint" className="muted label-add-hint">
            {t('documents.labelAddHint')}
          </p>
          {alreadyAssigned ? (
            <p className="muted label-add-hint" role="status">
              {t('documents.labelAddAlreadyAssigned', { name: exactMatch.name })}
            </p>
          ) : null}
          {addError ? (
            <p className="error label-add-hint" role="alert">
              {addError}
            </p>
          ) : null}
        </form>
        {loadingTags ? <p className="muted">{t('documents.labelPanelLoadingTags')}</p> : null}
        {addCandidates.length > 0 ? (
          <ul className="label-picker" aria-label={t('documents.labelAddPickerAria')}>
            {addCandidates.slice(0, 8).map((tag) => (
              <li key={tag.id}>
                <button
                  type="button"
                  className="label-picker-item"
                  disabled={busy !== null}
                  onClick={() =>
                    void run(() => assignDocumentTag(document.id, tag.id), `add-${tag.id}`)
                  }
                >
                  <Chip
                    label={tag.name}
                    variant={tag.isInbox ? 'inbox' : 'outline'}
                    color={tag.color}
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
