// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionCompareItem, ExtractionEngineInfo } from '@docuvate/contracts';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  compareDocumentExtraction,
  listExtractionEngines,
  submitExtractionArenaRating,
} from '../../lib/api';
import { formatUserFacingError } from '../../lib/apiErrors';
import { Button } from '../ui/Button';

interface ExtractionArenaPanelProps {
  documentId: string;
  embedded?: boolean;
  /** Called after winner text is persisted on the server. */
  onExtractionApplied?: () => void | Promise<void>;
}

export function ExtractionArenaPanel({
  documentId,
  embedded = false,
  onExtractionApplied,
}: ExtractionArenaPanelProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ExtractionCompareItem[]>([]);
  const [comparedEngines, setComparedEngines] = useState<string[]>([]);
  const [engineLabels, setEngineLabels] = useState<Record<string, string>>({});
  const [winner, setWinner] = useState<string | null>(null);
  const [rating, setRating] = useState(4);
  const [applyDefault, setApplyDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void listExtractionEngines()
      .then((engines: ExtractionEngineInfo[]) => {
        const map: Record<string, string> = {};
        for (const engine of engines) {
          map[engine.id] = engine.label;
        }
        setEngineLabels(map);
      })
      .catch(() => {
        /* labels optional */
      });
  }, []);

  function labelForEngine(id: string): string {
    return engineLabels[id] ?? id;
  }

  function formatMatchup(engineIds: string[]): string {
    return engineIds.map((id) => labelForEngine(id)).join(' · ');
  }

  async function runCompare() {
    setLoading(true);
    setError(null);
    setSaved(false);
    setWinner(null);
    try {
      const result = await compareDocumentExtraction(documentId, {
        maxPages: 3,
      });
      setItems(result.items);
      setComparedEngines(result.engines ?? result.items.map((i) => i.engine));
      setOpen(true);
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.compareFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function saveRating() {
    if (!winner) return;
    setLoading(true);
    setError(null);
    try {
      await submitExtractionArenaRating(documentId, {
        winnerEngine: winner,
        comparedEngines: comparedEngines.length ? comparedEngines : items.map((i) => i.engine),
        rating,
        applyAsDefault: applyDefault,
      });
      await onExtractionApplied?.();
      setSaved(true);
    } catch (err) {
      setError(formatUserFacingError(err, 'errors.ratingSaveFailed'));
    } finally {
      setLoading(false);
    }
  }

  const matchupLine =
    open && comparedEngines.length > 0 ? (
      <p className="muted extraction-arena-matchup">
        {t('documents.arenaMatchup', { engines: formatMatchup(comparedEngines) })}
      </p>
    ) : embedded ? null : (
      <p className="muted extraction-arena-matchup">{t('documents.arenaIntro')}</p>
    );

  return (
    <div className={`extraction-arena${embedded ? ' extraction-arena-embedded' : ''}`}>
      {!embedded ? (
        <div className="extraction-arena-head">
          <div>
            <h3>{t('documents.arenaTitle')}</h3>
            {matchupLine}
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => void runCompare()}
          >
            {loading && !open ? t('documents.arenaRunning') : t('documents.arenaCompare')}
          </Button>
        </div>
      ) : (
        <div className="extraction-arena-embedded-actions">
          <p className="muted extraction-arena-embedded-hint">{t('documents.arenaEmbeddedHint')}</p>
          {matchupLine}
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={() => void runCompare()}
          >
            {loading && !open ? t('documents.arenaRunning') : t('documents.arenaStart')}
          </Button>
        </div>
      )}
      {loading ? (
        <p className="muted extraction-arena-loading" role="status">
          {open ? t('documents.arenaLoadingResults') : t('documents.arenaWaitHint')}
        </p>
      ) : null}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? <p className="muted">{t('documents.arenaSaved')}</p> : null}
      {open && items.length > 0 ? (
        <div className="extraction-arena-grid">
          {items.map((item) => (
            <article
              key={item.engine}
              className={`extraction-arena-card${winner === item.engine ? ' extraction-arena-card-winner' : ''}`}
            >
              <header className="extraction-arena-card-head">
                <strong>{labelForEngine(item.engine)}</strong>
                <span className="muted">
                  {item.error
                    ? t('documents.arenaErrorLabel')
                    : t('documents.arenaStats', {
                        chars: item.charCount ?? 0,
                        blocks: item.blockCount ?? 0,
                        ms: item.elapsedMs,
                      })}
                </span>
              </header>
              {item.error ? (
                <p className="error">{item.error}</p>
              ) : (
                <pre className="extraction-arena-snippet">{item.text?.slice(0, 1200) ?? ''}</pre>
              )}
              {!item.error ? (
                <Button type="button" variant="ghost" onClick={() => { setWinner(item.engine); }}>
                  {t('documents.arenaPickWinner')}
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
      {winner ? (
        <div className="extraction-arena-rate">
          <label className="extraction-arena-rating">
            {t('documents.arenaQuality')}
            <input
              type="range"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => { setRating(Number(e.target.value)); }}
            />
            <span>{rating}</span>
          </label>
          <label className="extraction-arena-check">
            <input
              type="checkbox"
              checked={applyDefault}
              onChange={(e) => { setApplyDefault(e.target.checked); }}
            />
            {t('documents.arenaApplyDefault')}
          </label>
          <Button type="button" disabled={loading} onClick={() => void saveRating()}>
            {t('documents.arenaSaveRating')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
