// SPDX-FileCopyrightText: 2026 Thomas Faust
// SPDX-License-Identifier: LicenseRef-Docuvate-SUL-1.0
import { describe, expect, it } from 'vitest';

import {
  documentMatchesTenantLabelsInQuery,
  libraryTenantLabelMatchBoost,
  tenantLabelsMentionedInQuery,
} from './library-tenant-label-match.js';

const TENANT_LABELS = ['Entgeltnachweis', 'Rechnung', 'Lohnsteuerbescheinigung'];

describe('libraryTenantLabelMatch', () => {
  it('detects tenant labels mentioned in a library question', () => {
    expect(
      tenantLabelsMentionedInQuery(
        'Wie hoch war der Rechnungsbetrag auf der Rechnung März 2026?',
        TENANT_LABELS
      )
    ).toEqual(['Rechnung']);
  });

  it('boosts documents tagged with a label named in the question', () => {
    const boost = libraryTenantLabelMatchBoost({
      query: 'Gesamtbrutto im Entgeltnachweis Oktober 2024',
      tenantLabelNames: TENANT_LABELS,
      filename: 'Entgeltnachweis 2024_10.pdf',
      title: 'Entgeltnachweis 10/2024',
      body: 'Gesamtbrutto 4.859,67',
      documentLabelNames: ['Entgeltnachweis'],
    });
    expect(boost).toBeGreaterThan(0.2);
  });

  it('requires a tenant label match when the question names a label', () => {
    expect(
      documentMatchesTenantLabelsInQuery({
        query: 'Betrag laut Rechnung',
        tenantLabelNames: TENANT_LABELS,
        filename: 'other.pdf',
        title: 'Other',
        body: 'noise',
        documentLabelNames: ['Rechnung'],
      })
    ).toBe(true);
    expect(
      documentMatchesTenantLabelsInQuery({
        query: 'Betrag laut Rechnung',
        tenantLabelNames: TENANT_LABELS,
        filename: 'other.pdf',
        title: 'Other',
        body: 'noise',
        documentLabelNames: [],
      })
    ).toBe(false);
  });
});
