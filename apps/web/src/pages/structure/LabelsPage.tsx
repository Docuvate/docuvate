// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { CreateTagRequest, TagDto } from '@docuvate/contracts';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { LabelColorField } from '../../components/labels/LabelColorField';
import { LabelCoverageHeader } from '../../components/labels/LabelCoverageHeader';
import { LabelsTodoQueue } from '../../components/labels/LabelsTodoQueue';
import { LabelsVocabularyTable } from '../../components/labels/LabelsVocabularyTable';
import { useToastNotify } from '../../components/save/ToastProvider';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { createTag, deleteTag, listTags, updateTag } from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { defaultLabelColor } from '../../lib/defaultLabelColor';
import { labelMatchHintKey, labelMatchPlaceholderKey } from '../../lib/labelAssignmentMatchCopy';
import {
  applyLabelAssignmentMode,
  isLabelMatchAssignmentMode,
  LABEL_ASSIGNMENT_MODES,
  labelAssignmentModeLabelKey,
  labelAssignmentModeNeedsMatchText,
  parseLabelAssignmentMode,
  readLabelAssignmentModeFromForm,
} from '../../lib/labelAssignmentMode';
import { routes } from '../../lib/routes';
import { useLabelsInsights } from './useLabelsInsights';

const emptyForm: CreateTagRequest = {
  name: '',
  color: defaultLabelColor,
  isInbox: false,
  matchingAlgorithm: 'none',
  match: '',
};

export function LabelsPage() {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const [tags, setTags] = useState<TagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTagRequest>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadTags = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      setTags(await listTags());
    } catch (err) {
      setPageError(formatUserFacingError(err, 'errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  const insights = useLabelsInsights(loadTags);

  useEffect(() => {
    void loadTags();
    void insights.load();
  }, [loadTags, insights]);

  function startCreate(name?: string) {
    setEditingId('new');
    setForm({ ...emptyForm, name: name ?? '' });
  }

  function startEdit(tag: TagDto) {
    setEditingId(tag.id);
    setForm({
      name: tag.name,
      color: tag.color ?? defaultLabelColor,
      isInbox: tag.isInbox,
      matchingAlgorithm: tag.matchingAlgorithm ?? 'none',
      match: tag.match ?? '',
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setPageError(null);
    try {
      if (editingId === 'new') {
        await createTag(form);
      } else if (editingId) {
        await updateTag(editingId, form);
      }
      setEditingId(null);
      setForm(emptyForm);
      await loadTags();
      await insights.load();
      pushSuccess();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setPageError(message);
      pushError(message);
    } finally {
      setSaving(false);
    }
  }

  const error = pageError ?? insights.error;
  const tagColorById = useMemo(() => {
    const out: Record<string, string> = {};
    for (const tag of tags) {
      out[tag.id] = tag.color ?? defaultLabelColor;
    }
    return out;
  }, [tags]);
  const showEmptyHint =
    !loading &&
    tags.filter((tag) => !tag.isInbox).length === 0 &&
    !insights.loading &&
    insights.queueItems.length === 0;
  const assignmentMode = readLabelAssignmentModeFromForm(form);
  const showMatchText = labelAssignmentModeNeedsMatchText(assignmentMode);
  const matchHintKey =
    showMatchText && isLabelMatchAssignmentMode(assignmentMode)
      ? labelMatchHintKey(assignmentMode)
      : null;

  return (
    <div className="page labels-page" data-ux="page">
      <header className="page-header">
        <div>
          <h1 data-ux="page-title">{t('labels.pageTitle')}</h1>
          <p className="muted">{t('labels.pageLead')}</p>
        </div>
        <Button
          type="button"
          className="labels-page-new-label-btn"
          data-ux="primary-action"
          onClick={() => { startCreate(); }}
        >
          {t('labels.newLabel')}
        </Button>
      </header>

      <LabelCoverageHeader
        loading={insights.loading}
        labeledCount={insights.labelInventory.labeled}
        totalCount={insights.labelInventory.total}
        unlabeledCount={insights.labelInventory.unlabeled}
        coverageSummary={insights.coverageSummary}
        emptyReason={insights.mapEmptyReason}
      />

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <LabelsTodoQueue
        items={insights.queueItems}
        documentCountByTagId={insights.documentCountByTagId}
        tagColorById={tagColorById}
        loading={insights.loading}
        busyId={insights.busyId}
        onAccept={(item) => void insights.accept(item)}
        onRename={(item) => {
          if (item.tagId) {
            startEdit({
              id: item.tagId,
              name: item.proposedName ?? item.currentName ?? '',
              color: defaultLabelColor,
              isInbox: false,
              matchingAlgorithm: 'none',
              match: '',
            });
          }
        }}
        onDismiss={(item, scope) => void insights.dismiss(item, scope)}
      />

      {editingId ? (
        <Card className="ordnung-form-card label-editor-card">
          <h2>{editingId === 'new' ? t('labels.createTitle') : t('labels.editTitle')}</h2>
          <form onSubmit={(e) => void onSubmit(e)} className="stack ordnung-form">
            <label className="label-editor-field">
              {t('labels.name')}
              <Input
                required
                value={form.name}
                onChange={(e) => { setForm({ ...form, name: e.target.value }); }}
                placeholder={t('labels.namePlaceholder')}
              />
            </label>
            <div className="label-editor-field">
              <span className="label-editor-field-label">{t('labels.color')}</span>
              <LabelColorField
                value={form.color ?? defaultLabelColor}
                onChange={(color) => { setForm({ ...form, color }); }}
              />
            </div>
            <label className="label-editor-field">
              {t('labels.matchingAlgorithm')}
              <Select
                value={assignmentMode}
                onChange={(value) => {
                  setForm(applyLabelAssignmentMode(parseLabelAssignmentMode(value), form));
                }}
                options={LABEL_ASSIGNMENT_MODES.map((mode) => ({
                  value: mode,
                  label: t(labelAssignmentModeLabelKey(mode)),
                }))}
                aria-label={t('labels.matchingAlgorithm')}
              />
            </label>
            <div className={`label-editor-match-slot${showMatchText ? ' is-visible' : ''}`}>
              <label className="label-editor-field label-editor-match-field">
                {t('labels.matchText')}
                <textarea
                  className="input textarea"
                  rows={4}
                  value={form.match ?? ''}
                  disabled={!showMatchText}
                  aria-hidden={!showMatchText}
                  tabIndex={showMatchText ? 0 : -1}
                  onChange={(e) => { setForm({ ...form, match: e.target.value }); }}
                  placeholder={
                    isLabelMatchAssignmentMode(assignmentMode)
                      ? t(labelMatchPlaceholderKey(assignmentMode))
                      : undefined
                  }
                />
                {matchHintKey ? (
                  <span className="muted label-editor-match-hint">{t(matchHintKey)}</span>
                ) : null}
              </label>
            </div>
            <div className="confirm-dialog-actions label-editor-actions">
              <Button type="button" variant="secondary" onClick={() => { setEditingId(null); }}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving
                  ? t('documents.saving')
                  : editingId === 'new'
                    ? t('labels.createSubmit')
                    : t('documents.save')}
              </Button>
            </div>
          </form>
          <p className="muted label-fields-pointer">
            {t('labels.fieldsPointer')}{' '}
            <Link to={routes.structureRecognizedFields}>{t('nav.recognizedFields')}</Link>.{' '}
            {t('labels.fieldsPointerGate')}
          </p>
        </Card>
      ) : null}

      {showEmptyHint ? (
        <p className="muted labels-empty-hint">{t('labels.emptyHintRecommend')}</p>
      ) : null}

      <LabelsVocabularyTable
        tags={tags}
        documentCountByTagId={insights.documentCountByTagId}
        loading={loading}
        onEdit={startEdit}
        onDelete={async (tagId) => {
          try {
            await deleteTag(tagId);
            await loadTags();
            await insights.load();
            pushSuccess();
          } catch (err) {
            const message = formatUserFacingError(err, 'errors.deleteFailed');
            setPageError(message);
            pushError(message);
          }
        }}
      />
    </div>
  );
}
