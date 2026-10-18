// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type {
  LabelRecommendationBlocklistEntryDto,
  LabelRecommendationBlocklistPatternDto,
} from '@docuvate/contracts';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  addLabelRecommendationBlocklist,
  confirmLabelRecommendationBlocklistPattern,
  listLabelRecommendationBlocklist,
  proposeLabelRecommendationBlocklistPattern,
  removeLabelRecommendationBlocklist,
  removeLabelRecommendationBlocklistPattern,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { clusterBlocklistPhrases } from '../../lib/blocklistClusters';
import { useToastNotify } from '../save/ToastProvider';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Props {
  onChanged?: () => void;
  /** Regex patterns and cluster suggestions (settings: advanced features only). */
  showAdvancedPatterns?: boolean;
}

interface PatternProposal {
  pattern: string;
  explanation: string;
  phrases: string[];
}

export function LabelRecommendationBlocklist(props: Props) {
  const { t } = useTranslation();
  const { pushSuccess, pushError } = useToastNotify();
  const showAdvancedPatterns = props.showAdvancedPatterns ?? false;
  const [items, setItems] = useState<LabelRecommendationBlocklistEntryDto[]>([]);
  const [patterns, setPatterns] = useState<LabelRecommendationBlocklistPatternDto[]>([]);
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<PatternProposal | null>(null);
  const [proposalHint, setProposalHint] = useState<string | null>(null);
  const [proposingFor, setProposingFor] = useState<string[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listLabelRecommendationBlocklist();
      setItems(data.items);
      setPatterns(data.patterns);
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.blocklistLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const clusters = useMemo(
    () => clusterBlocklistPhrases(items.map((entry) => entry.phrase)),
    [items]
  );

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    const trimmed = phrase.trim();
    if (trimmed.length < 2) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await addLabelRecommendationBlocklist(trimmed);
      setPhrase('');
      await load();
      props.onChanged?.();
      pushSuccess();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.addFailed');
      setError(message);
      pushError(message);
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(id: string) {
    setBusy(true);
    setError(null);
    try {
      await removeLabelRecommendationBlocklist(id);
      setItems((prev) => prev.filter((e) => e.id !== id));
      props.onChanged?.();
      pushSuccess();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.deleteFailed');
      setError(message);
      pushError(message);
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
      props.onChanged?.();
      pushSuccess();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.deleteFailed');
      setError(message);
      pushError(message);
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
        setProposalHint(
          result.setupHint ??
            (result.configured
              ? 'Kein Muster vorgeschlagen.'
              : 'Kein Chat-Provider: Literale Blockliste funktioniert weiterhin.')
        );
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
      props.onChanged?.();
      pushSuccess();
    } catch (err) {
      const message = formatUserFacingError(err, 'errors.saveFailed');
      setError(message);
      pushError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="label-rec-blocklist">
      <form className="label-rec-blocklist-add" onSubmit={(e) => void onAdd(e)}>
        <Input
          value={phrase}
          onChange={(e) => { setPhrase(e.target.value); }}
          placeholder={t('labelBlocklist.phrasePlaceholder')}
          aria-label={t('labelBlocklist.blockPhraseAria')}
          disabled={busy}
        />
        <Button type="submit" variant="secondary" disabled={busy}>
          {t('labelBlocklist.add')}
        </Button>
      </form>
      {error ? (
        <p className="error label-rec-blocklist-meta" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="muted label-rec-blocklist-meta">{t('labelBlocklist.loading')}</p>
      ) : null}
      {!loading && items.length === 0 && (!showAdvancedPatterns || patterns.length === 0) ? (
        <p className="muted label-rec-blocklist-meta">{t('labelBlocklist.empty')}</p>
      ) : null}
      {items.length > 0 ? (
        <ul className="label-rec-blocklist-entries">
          {items.map((entry) => (
            <li key={entry.id} className="label-rec-blocklist-row">
              <span className="label-rec-blocklist-phrase" title={entry.phrase}>
                {entry.phrase}
                {entry.source === 'dismiss' ? (
                  <span className="label-rec-blocklist-source muted">
                    {' '}
                    · {t('labelBlocklist.fromRecommendation')}
                  </span>
                ) : null}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="label-rec-btn"
                disabled={busy}
                onClick={() => void onRemove(entry.id)}
              >
                {t('labelBlocklist.remove')}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {showAdvancedPatterns && patterns.length > 0 ? (
        <div className="label-rec-blocklist-patterns">
          <h4 className="label-rec-blocklist-patterns-title">
            {t('labelBlocklist.patternsTitle')}
          </h4>
          <ul className="label-rec-blocklist-entries">
            {patterns.map((entry) => (
              <li key={entry.id} className="label-rec-blocklist-row">
                <code className="label-rec-blocklist-pattern" title={entry.pattern}>
                  {entry.pattern}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  className="label-rec-btn"
                  disabled={busy}
                  onClick={() => void onRemovePattern(entry.id)}
                >
                  {t('labelBlocklist.remove')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showAdvancedPatterns && !loading && clusters.length > 0 ? (
        <div className="label-rec-blocklist-clusters">
          <p className="muted label-rec-blocklist-meta">{t('labelBlocklist.regexSuggestLead')}</p>
          {clusters.map((cluster) => (
            <div key={cluster.join('|')} className="label-rec-blocklist-cluster">
              <p className="label-rec-blocklist-cluster-phrases">{cluster.join(' · ')}</p>
              <Button
                type="button"
                variant="secondary"
                className="label-rec-btn"
                disabled={busy}
                onClick={() => void onProposePattern(cluster)}
              >
                {t('labelBlocklist.regexSuggest')}
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      {proposalHint ? (
        <p className="muted label-rec-blocklist-meta" role="status">
          {proposalHint}
        </p>
      ) : null}

      {proposal ? (
        <div
          className="label-rec-blocklist-proposal"
          role="region"
          aria-label={t('labelBlocklist.regexSuggestAria')}
        >
          <p className="label-rec-blocklist-proposal-lead">
            Vorschlag für: {proposingFor?.join(', ') ?? proposal.phrases.join(', ')}
          </p>
          <code className="label-rec-blocklist-pattern">{proposal.pattern}</code>
          <p className="muted label-rec-blocklist-meta">{proposal.explanation}</p>
          <div className="label-rec-blocklist-proposal-actions">
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
    </div>
  );
}
