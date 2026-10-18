// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DocumentTile } from './DocumentTile';

describe('DocumentTile', () => {
  it('reserves exclusion hint space with opacity', () => {
    const { container } = render(
      <DocumentTile title="Bescheid 2026" meta="12.03.2026 · 94 %" excluded={false} />
    );
    const hint = container.querySelector('.document-tile-hint');
    expect(hint).toBeTruthy();
    expect(hint?.className).toContain('document-tile-hint-hidden');
  });
});
