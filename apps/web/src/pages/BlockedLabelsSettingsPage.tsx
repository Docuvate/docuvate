// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelRecommendationBlocklistEntryDto,
  LabelRecommendationBlocklistPatternDto,
} from '@docuvate/contracts';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '../components/save/ToastProvider';
import { SettingsSectionLayout } from '../components/settings/SettingsSectionLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAdvancedFeaturesEnabled } from '../lib/advancedFeatures';
import {
  addLabelRecommendationBlocklist,
  confirmLabelRecommendationBlocklistPattern,
  listLabelRecommendationBlocklist,
  proposeLabelRecommendationBlocklistPattern,
  removeLabelRecommendationBlocklist,
  removeLabelRecommendationBlocklistPattern,
} from '../lib/api';
import { formatUserFacingError } from '../lib/apiErrors';
import { clusterBlocklistPhrases } from '../lib/blocklistClusters';
import { formatCustomerDate } from '../lib/formatCustomerDate';

interface PatternProposal {
  pattern: string;
  explanation: string;
  phrases: string[];
}

interface UndoState {
  phrase: string;
  message: string;
}

const SEARCH_MIN_ITEMS = 6;
const UNDO_MS = 8000;

function phrasesEqual(a: string, b: string): boolean {
  return a.trim().localeCompare(b.trim(), undefined, { sensitivity: 'accent' }) === 0;
}

export function BlockedLabelsSettingsPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { advancedFeaturesEnabled } = useAdvancedFeaturesEnabled();
  const [items, setItems] = useState<LabelRecommendationBlocklistEntryDto[]>([]);
  const [patterns, setPatterns] = useState<LabelRecommendationBlocklistPatternDto[]>([]);
  const [phrase, setPhrase] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [proposal, setProposal] = useState<PatternProposal | null>(null);
  const [proposalHint, setProposalHint] = useState<string | null>(null);
  const [proposingFor, setProposingFor] = useState<string[] | null>(null);

  const dismissUndo = useCallback(() => {
    setUndo(null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLabelRecommendationBlocklist();
      setItems(data.items);
      setPatterns(data.patterns);
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.blocklistLoadFailed');
      setError(message);
      toast.error(message, () => void load());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!undo) {
      return undefined;
    }
    const timer = window.setTimeout(dismissUndo, UNDO_MS);
    return () => { window.clearTimeout(timer); };
  }, [undo, dismissUndo]);

  const clusters = useMemo(
    () => clusterBlocklistPhrases(items.map((entry) => entry.phrase)),
    [items]
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter((entry) => entry.phrase.toLowerCase().includes(query));
  }, [items, searchQuery]);

  const showSearch = items.length >= SEARCH_MIN_ITEMS;

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = phrase.trim();
    if (trimmed.length < 2) {
      return;
    }
    if (items.some((entry) => phrasesEqual(entry.phrase, trimmed))) {
      const message = t('settings.blockedLabels.duplicate');
      setError(message);
      toast.error(message);
      return;
    }
    setBusy(true);
    setError(null);
    setUndo(null);
    try {
      await addLabelRecommendationBlocklist(trimmed);
      setPhrase('');
      toast.success(t('settings.blockedLabels.addedSuccess', { phrase: trimmed }));
      await load();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.addFailed');
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onAllowAgain(entry: LabelRecommendationBlocklistEntryDto) {
    setBusy(true);
    setError(null);
    try {
      await removeLabelRecommendationBlocklist(entry.id);
      setItems((prev) => prev.filter((e) => e.id !== entry.id));
      setUndo({
        phrase: entry.phrase,
        message: t('settings.blockedLabels.allowAgainDone', { phrase: entry.phrase }),
      });
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.deleteFailed');
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function onUndoAllowAgain() {
    if (!undo) {
      return;
    }
    const { phrase: restorePhrase } = undo;
    setBusy(true);
    setError(null);
    try {
      await addLabelRecommendationBlocklist(restorePhrase);
      setUndo(null);
      await load();
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.addFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function onRemovePattern(id: string) {
    setBusy(true);
    setError(null);
    try {
      await removeLabelRecommendationBlocklistPattern(id);
      setPatterns((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.deleteFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function onProposePattern(phrases: string[]) {
    setBusy(true);
    setError(null);
    setProposal(null);
    setProposalHint(null);
    setProposingFor(phrases);
    try {
      const result = await proposeLabelRecommendationBlocklistPattern(phrases);
      if (result.proposal) {
        setProposal(result.proposal);
      } else {
        setProposalHint(result.setupHint ?? t('settings.blockedLabels.regexNoProposal'));
      }
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.actionFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmProposal() {
    if (!proposal) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await confirmLabelRecommendationBlocklistPattern(proposal.pattern);
      setPatterns((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      setProposal(null);
      setProposingFor(null);
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.saveFailed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsSectionLayout
      sectionTitle={t('settings.blockedLabels.title')}
      sectionLead={t('settings.blockedLabels.lead')}
    >
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="blocked-labels-undo-slot" aria-live="polite">
          {undo ? (
            <div className="blocked-labels-undo" role="status">
              <span>{undo.message}</span>
              <Button type="button" variant="ghost" onClick={() => void onUndoAllowAgain()}>
                {t('common.undo')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Card className="blocked-labels-panel">
        <form className="blocked-labels-add" onSubmit={onAdd}>
          <div className="blocked-labels-add-field">
            <label className="blocked-labels-add-label" htmlFor="blocked-label-phrase-input">
              {t('settings.blockedLabels.addLabel')}
            </label>
            <div className="blocked-labels-add-row">
              <Input
                id="blocked-label-phrase-input"
                value={phrase}
                onChange={(e) => { setPhrase(e.target.value); }}
                placeholder={t('labelBlocklist.phrasePlaceholder')}
                disabled={busy}
              />
              <Button type="submit" variant="secondary" disabled={busy}>
                {t('labelBlocklist.add')}
              </Button>
            </div>
          </div>
        </form>

        {showSearch ? (
          <div className="blocked-labels-search">
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              placeholder={t('settings.blockedLabels.searchPlaceholder')}
              aria-label={t('settings.blockedLabels.searchAria')}
            />
          </div>
        ) : null}

        {loading ? <p className="muted">{t('labelBlocklist.loading')}</p> : null}

        {!loading && items.length === 0 ? (
          <p className="muted blocked-labels-empty" role="status">
            {t('settings.blockedLabels.emptyTitle')}
          </p>
        ) : null}

        {!loading && items.length > 0 ? (
          <div className="blocked-labels-table-wrap">
            <table className="blocked-labels-table">
              <thead>
                <tr>
                  <th scope="col">{t('settings.blockedLabels.columnLabel')}</th>
                  <th scope="col">{t('settings.blockedLabels.columnBlockedAt')}</th>
                  <th scope="col" className="blocked-labels-table__actions-head">
                    <span className="sr-only">{t('settings.blockedLabels.columnActions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="muted blocked-labels-no-results">
                      {t('settings.blockedLabels.searchEmpty')}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((entry) => (
                    <tr key={entry.id}>
                      <td className="blocked-labels-table__label">
                        <span className="blocked-labels-table__phrase">{entry.phrase}</span>
                        {entry.source === 'dismiss' ? (
                          <span className="muted blocked-labels-table__source">
                            {t('labelBlocklist.fromRecommendation')}
                          </span>
                        ) : null}
                      </td>
                      <td className="blocked-labels-table__date">
                        {formatCustomerDate(entry.createdAt, i18n.language)}
                      </td>
                      <td className="blocked-labels-table__actions">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void onAllowAgain(entry)}
                        >
                          {t('settings.blockedLabels.allowAgain')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      {advancedFeaturesEnabled && !loading && patterns.length > 0 ? (
        <section
          className="blocked-labels-advanced card"
          aria-labelledby="blocked-labels-patterns-title"
        >
          <h2 id="blocked-labels-patterns-title" className="blocked-labels-advanced-title">
            {t('labelBlocklist.patternsTitle')}
          </h2>
          <ul className="blocked-labels-pattern-list">
            {patterns.map((entry) => (
              <li key={entry.id} className="blocked-labels-pattern-row">
                <code className="blocked-labels-pattern-code">{entry.pattern}</code>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void onRemovePattern(entry.id)}
                >
                  {t('labelBlocklist.remove')}
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {advancedFeaturesEnabled && !loading && clusters.length > 0 ? (
        <section className="blocked-labels-advanced card">
          <p className="muted">{t('labelBlocklist.regexSuggestLead')}</p>
          {clusters.map((cluster) => (
            <div key={cluster.join('|')} className="blocked-labels-cluster">
              <p className="blocked-labels-cluster-phrases">{cluster.join(' · ')}</p>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void onProposePattern(cluster)}
              >
                {t('labelBlocklist.regexSuggest')}
              </Button>
            </div>
          ))}
        </section>
      ) : null}

      {proposalHint ? (
        <p className="muted blocked-labels-meta" role="status">
          {proposalHint}
        </p>
      ) : null}

      {proposal ? (
        <div
          className="blocked-labels-proposal card"
          role="region"
          aria-label={t('labelBlocklist.regexSuggestAria')}
        >
          <p className="blocked-labels-proposal-lead">
            {t('settings.blockedLabels.regexProposalFor', {
              phrases: proposingFor?.join(', ') ?? proposal.phrases.join(', '),
            })}
          </p>
          <code className="blocked-labels-pattern-code">{proposal.pattern}</code>
          <p className="muted blocked-labels-meta">{proposal.explanation}</p>
          <div className="blocked-labels-proposal-actions">
            <Button type="button" disabled={busy} onClick={() => void onConfirmProposal()}>
              {t('labelBlocklist.applyPattern')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setProposal(null);
                setProposingFor(null);
              }}
            >
              {t('labelBlocklist.discard')}
            </Button>
          </div>
        </div>
      ) : null}
    </SettingsSectionLayout>
  );
}
