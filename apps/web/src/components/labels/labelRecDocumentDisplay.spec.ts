// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';
import {
  docTitleAndFilenameEquivalent,
  recommendationDocumentTitle,
  shouldShowRecommendationFilename,
} from './labelRecDocumentDisplay';

describe('labelRecDocumentDisplay', () => {
  it('treats title and filename as equivalent when only separators differ', () => {
    expect(docTitleAndFilenameEquivalent('Posteingang Scan.pdf', 'Posteingang_Scan.pdf')).toBe(
      true
    );
  });

  it('shows title without .pdf and hides redundant filename', () => {
    const doc = {
      id: 'd1',
      title: 'Posteingang Scan.pdf',
      filename: 'Posteingang_Scan.pdf',
      status: 'ready' as const,
    };
    expect(recommendationDocumentTitle(doc)).toBe('Posteingang Scan');
    expect(shouldShowRecommendationFilename(doc)).toBe(false);
  });

  it('shows filename when it differs from title', () => {
    const doc = {
      id: 'd2',
      title: 'Scan Januar',
      filename: 'Posteingang_Scan.pdf',
      status: 'ready' as const,
    };
    expect(shouldShowRecommendationFilename(doc)).toBe(true);
  });
});
