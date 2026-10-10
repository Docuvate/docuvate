// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import type { ExtractionEngineInfo } from '@docuvate/contracts';
import { describe, expect, it } from 'vitest';

import i18n from '../i18n';
import {
  buildExtractionEngineSelectOptions,
  shouldShowExtractionOfflineCallout,
} from './settingsExtractionEngines';

const tDe = i18n.getFixedT('de');

const pipelineAvailable: ExtractionEngineInfo = {
  id: 'pipeline',
  label: 'Pipeline',
  description: '',
  available: true,
};

const tesseractUnavailable: ExtractionEngineInfo = {
  id: 'tesseract',
  label: 'Tesseract',
  description: '',
  available: false,
};

describe('shouldShowExtractionOfflineCallout', () => {
  it('is false when all engines are available', () => {
    expect(
      shouldShowExtractionOfflineCallout(
        false,
        [pipelineAvailable, { ...tesseractUnavailable, available: true }],
        'pipeline'
      )
    ).toBe(false);
  });

  it('is false when an optional engine is unavailable but another is selected', () => {
    expect(
      shouldShowExtractionOfflineCallout(
        false,
        [pipelineAvailable, tesseractUnavailable],
        'pipeline'
      )
    ).toBe(false);
  });

  it('is true when the selected engine is unavailable', () => {
    expect(
      shouldShowExtractionOfflineCallout(
        false,
        [pipelineAvailable, tesseractUnavailable],
        'tesseract'
      )
    ).toBe(true);
  });

  it('is true when the engines request failed', () => {
    expect(shouldShowExtractionOfflineCallout(true, [pipelineAvailable], 'pipeline')).toBe(true);
  });

  it('is true when every engine is unavailable (worker unreachable catalog)', () => {
    expect(
      shouldShowExtractionOfflineCallout(
        false,
        [pipelineAvailable, tesseractUnavailable].map((e) => ({ ...e, available: false })),
        'pipeline'
      )
    ).toBe(true);
  });
});

describe('buildExtractionEngineSelectOptions', () => {
  it('marks unavailable engines disabled with a short reason', () => {
    const options = buildExtractionEngineSelectOptions(tDe, [
      pipelineAvailable,
      tesseractUnavailable,
    ]);
    expect(options.find((o) => o.value === 'pipeline')?.disabled).toBeFalsy();
    const tess = options.find((o) => o.value === 'tesseract');
    expect(tess?.disabled).toBe(true);
    expect(tess?.label).toMatch(/tesseract|Klassische/i);
    expect(tess?.label).not.toContain('nicht verfügbar');
    expect(tess?.suffix).toBe('nicht verfügbar');
  });
});
