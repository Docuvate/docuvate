// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  readLiveRecognizedFieldExtractorSha256,
  RECOGNIZED_FIELD_EXTRACTOR_LOGIC_SHA256,
  RECOGNIZED_FIELD_EXTRACTOR_VERSION,
  fingerprintToExtractorVersion,
} from './recognized-field-extractor-fingerprint.js';

describe('recognized field extractor fingerprint', () => {
  it('matches worker label_custom_fields.py (bump SHA when logic changes)', () => {
    expect(readLiveRecognizedFieldExtractorSha256()).toBe(RECOGNIZED_FIELD_EXTRACTOR_LOGIC_SHA256);
  });

  it('derives a stable positive extractor version from the fingerprint', () => {
    expect(RECOGNIZED_FIELD_EXTRACTOR_VERSION).toBe(
      fingerprintToExtractorVersion(RECOGNIZED_FIELD_EXTRACTOR_LOGIC_SHA256)
    );
    expect(RECOGNIZED_FIELD_EXTRACTOR_VERSION).toBeGreaterThan(1);
  });
});
